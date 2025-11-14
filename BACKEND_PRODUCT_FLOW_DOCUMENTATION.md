# Product Manager Backend Data Flow Documentation

## Overview
This document explains how the Products Manager page sends product data to the backend and how it's saved.

---

## Frontend Flow (Products.jsx)

### 1. **User Input Collection**
When users add products in the form, data is collected in the `form` state:
```javascript
const initialForm = {
  name: '',
  category: '',
  description: '',
  supplier: '',
  unitCost: '',
  quantity: '',
  reorderLevel: '',
  reorderQuantity: '',
  branch: 'Matina'
};
```

### 2. **Validation** 
The `validate()` function checks:
- Product name is required
- Category is required
- Unit cost must be a number
- Quantity must be a number
- Reorder level must be a number
- Reorder quantity must be a number
- Branch is required

### 3. **Temporary List Creation**
When "Add to list" is clicked, the `handleAddToList()` function:
- Validates the form
- Creates a temp item with numeric values
- Adds to `tempList` state
- Resets the form

```javascript
const item = {
  tempId: Date.now() + Math.random(),
  name: form.name.trim(),
  category: form.category.trim(),
  description: form.description.trim(),
  supplier: form.supplier.trim(),
  unitCost: Number(form.unitCost),      // Note: camelCase
  quantity: Number(form.quantity),
  reorderLevel: Number(form.reorderLevel),
  reorderQuantity: Number(form.reorderQuantity),
  branch: form.branch
};
```

### 4. **Confirmation Dialog**
User reviews all items in `tempList` and clicks "Confirm"

### 5. **Submit to Backend**
The `confirmNow()` async function:
- Converts camelCase to snake_case for backend
- Sends POST request to `http://127.0.0.1:8000/api/inventory/products/`
- Includes Authorization header with bearer token

```javascript
async function confirmNow(){
  const payload = tempList.map(it => ({
    name: it.name,
    category: it.category,
    description: it.description,
    supplier: it.supplier,
    unit_cost: it.unitCost,           // ← camelCase converted to snake_case
    quantity: it.quantity,
    reorder_level: it.reorderLevel,
    reorder_quantity: it.reorderQuantity,
    branch: it.branch,
  }));

  const res = await fetch('http://127.0.0.1:8000/api/inventory/products/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload),  // Can be array or single object
  });
}
```

---

## Backend Flow

### 1. **API Endpoint Receives Request**
- **Endpoint**: `POST /api/inventory/products/`
- **File**: `backend/inventory/views.py` → `ProductListCreateAPIView.post()`
- **Accepts**: Array of products or single product

### 2. **Permissions Check**
```python
def get_permissions(self):
    if self.request.method == 'GET':
        return [permissions.AllowAny()]
    return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
```
- Must be authenticated
- Must be admin user (is_staff=True)

### 3. **Data Serialization**
```python
def post(self, request):
    data = request.data
    many = isinstance(data, list)  # Check if array or single
    serializer = ProductSerializer(data=data, many=many)
    if serializer.is_valid():
        instances = serializer.save()
```

**ProductSerializer** (`backend/inventory/serializers.py`):
- Validates all fields match Product model
- Maps snake_case JSON to model fields
- Calls Product model's `save()` method

### 4. **Product Model Save Logic** 
(`backend/inventory/models.py` → `Product.save()`)

When a product is saved, the following happens automatically:

#### A. **Item Number Generation** (if not provided)
```python
if not self.item_number:
    qs = Product.objects.filter(branch=self.branch, category=self.category)
    qs = qs.order_by('-item_number')
    last = qs.first()
    if last and last.item_number:
        self.item_number = last.item_number + 1
    else:
        self.item_number = 1
```
- Queries products with same branch AND category
- Gets the highest item_number
- Increments by 1, or starts at 1 if none exist
- **Unique per branch + category combination**

#### B. **Remarks Generation** (if not provided)
```python
if not self.remarks:
    if self.quantity == 0:
        self.remarks = 'Out of Stock'
    elif self.quantity <= self.reorder_level:
        self.remarks = 'Reorder soon'
    else:
        self.remarks = 'In Stock'
```

#### C. **Formatted ID Generation** (read-only property)
```python
@property
def formatted_id(self):
    branch_code = 'M' if self.branch == 'Matina' else 'T'
    cat_map = {
        'Pet Food & Treats': 'A',
        'Grooming & Hygiene': 'B',
        'Health & Wellness': 'C',
        'Accessories & Toys': 'D',
        'Cages & Bedding': 'E',
        'Feeding Supplies': 'F',
        'Cleaning Supplies': 'G',
    }
    cat_code = cat_map.get(self.category, 'X')
    num = self.item_number or self.id or 0
    return f"{branch_code}-{cat_code}-{str(num).zfill(3)}"
```
- Format: `{branch_code}-{category_code}-{item_number}`
- Example: `M-A-001` (Matina, Pet Food, item 1)

### 5. **Product History Creation**
After the product is saved, a ProductHistory entry is created:

```python
ProductHistory.objects.create(
    product=instance,
    user=request.user if request.user.is_authenticated else None,
    transaction_type='addition',          # ← Always 'addition' for new products
    quantity_change=instance.quantity,
    old_quantity=0,
    new_quantity=instance.quantity,
    supplier=instance.supplier,
    unit_cost=instance.unit_cost,
    reason='Product added to inventory'
)
```

This creates an audit trail entry showing:
- What product was added
- Who added it (user)
- When it was added
- Initial quantity
- Supplier info

### 6. **Response Sent Back**
```python
out_ser = ProductSerializer(instances, many=many)
return Response(out_ser.data, status=status.HTTP_201_CREATED)
```
- Returns 201 Created status
- Returns serialized product data with all fields
- Includes auto-generated `formatted_id`

---

## Database Schema

### Product Table
| Field | Type | Auto-Generated | Notes |
|-------|------|---|---|
| id | AutoField | ✅ | Django PK |
| name | CharField | ❌ | From form |
| category | CharField | ❌ | From form |
| description | TextField | ❌ | From form |
| supplier | CharField | ❌ | From form |
| unit_cost | DecimalField | ❌ | From form |
| quantity | IntegerField | ❌ | From form |
| reorder_level | IntegerField | ❌ | From form |
| reorder_quantity | IntegerField | ❌ | From form |
| branch | CharField | ❌ | From form |
| item_number | IntegerField | ✅ | Auto-incremented per branch+category |
| remarks | CharField | ✅ | Based on quantity vs reorder_level |
| created_at | DateTimeField | ✅ | Current timestamp |
| updated_at | DateTimeField | ✅ | Current timestamp |

### ProductHistory Table
| Field | Type | Value |
|-------|------|-------|
| id | AutoField | Django PK |
| product | ForeignKey | Reference to Product |
| user | ForeignKey | Who added it |
| transaction_type | CharField | 'addition' for new products |
| quantity_change | IntegerField | Initial quantity |
| old_quantity | IntegerField | 0 (no previous stock) |
| new_quantity | IntegerField | Initial quantity |
| supplier | CharField | From product |
| unit_cost | DecimalField | From product |
| reason | TextField | 'Product added to inventory' |
| timestamp | DateTimeField | Auto timestamp |

---

## Data Flow Diagram

```
Frontend (Products.jsx)
    ↓
[Form Input]
    ↓
[Validation]
    ↓
[Temporary List]
    ↓
[User Reviews & Confirms]
    ↓
[Convert to API Format]
    ↓
POST /api/inventory/products/
    ↓
Backend (ProductListCreateAPIView.post())
    ↓
[Permission Check]
    ↓
[ProductSerializer.is_valid()]
    ↓
[Product.save()]
    ├─ item_number generation
    ├─ remarks generation
    └─ formatted_id generation
    ↓
[ProductHistory.objects.create()]
    ↓
[Response 201 Created]
    ↓
Frontend (Confirmation Toast)
    ↓
[Clear Temp List]
    ↓
[Navigate to Inventory Page]
```

---

## Key Points

1. **Batch Processing**: Can send multiple products at once (array)
2. **Auto ID Generation**: `item_number` is auto-incremented per branch+category
3. **Audit Trail**: Every product addition is logged in ProductHistory
4. **Admin Only**: Only admins can create products
5. **Field Mapping**: Frontend uses camelCase, backend uses snake_case
6. **Automatic Remarks**: Stock status is calculated based on quantity vs reorder_level

---

## Example Request/Response

### Request Payload (Single Product)
```json
{
  "name": "Dog Food Premium",
  "category": "Pet Food & Treats",
  "description": "High-quality dog food",
  "supplier": "Pet Supplies Co",
  "unit_cost": 599.00,
  "quantity": 50,
  "reorder_level": 20,
  "reorder_quantity": 100,
  "branch": "Matina"
}
```

### Response (201 Created)
```json
{
  "id": 1,
  "name": "Dog Food Premium",
  "category": "Pet Food & Treats",
  "description": "High-quality dog food",
  "supplier": "Pet Supplies Co",
  "unit_cost": "599.00",
  "quantity": 50,
  "reorder_level": 20,
  "reorder_quantity": 100,
  "branch": "Matina",
  "item_number": 1,
  "formatted_id": "M-A-001",
  "remarks": "In Stock",
  "created_at": "2025-11-09T10:30:00Z"
}
```

### ProductHistory Entry Created
```
Product: Dog Food Premium
User: admin_user
Transaction Type: addition
Quantity Change: 50
Old Quantity: 0
New Quantity: 50
Supplier: Pet Supplies Co
Unit Cost: 599.00
Reason: Product added to inventory
Timestamp: 2025-11-09T10:30:00Z
```

---

## Ready for Changes?

This is the complete flow. Are you ready to make major changes? Please specify what modifications you need.
