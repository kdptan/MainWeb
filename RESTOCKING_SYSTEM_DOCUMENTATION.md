# Professional Batch Restocking System

## Overview

The Batch Restocking System is a professional-grade inventory management feature designed for efficient, streamlined restocking operations. It focuses on the core responsibility of restocking: **adding quantity to existing products** without modifying product master data.

## Design Principles

### 1. **Separation of Concerns**
- **Restocking** = Quantity adjustment only
- **Product Management** = Master data (name, supplier, cost, category, branch)
- This separation ensures data integrity and prevents accidental modifications during routine restocking

### 2. **Read-Only Product Information**
When restocking, product information is displayed but **not editable**:
- **Supplier** (displayed, locked)
- **Unit Cost** (displayed, locked)
- **Current Stock** (displayed for reference)

If supplier or cost needs to change, the product must be updated through the Products Manager (separate operation).

### 3. **Focused User Interface**
The restocking modal guides users through a simple 3-step process:
1. **Select Products** - Filter by category/branch, checkbox selection
2. **Enter Quantities** - Simple quantity input with validation
3. **Submit** - Batch processing with detailed feedback

## System Workflow

### Step 1: Product Selection
```
┌─────────────────────────────────┐
│   Available Products            │
│ ┌───────────────────────────────┐
│ │ ☐ Product A  | Supplier X     │
│ │ ☐ Product B  | Supplier Y     │
│ │ ☐ Product C  | Supplier Z     │
│ └───────────────────────────────┘
│                                 │
│ Filters: Category, Branch       │
└─────────────────────────────────┘
        ↓ (checkbox)
```

### Step 2: Quantity Entry
```
┌─────────────────────────────────┐
│   Items to Restock              │
│ ┌─────────────────────────────┐ │
│ │ Product A                   │ │
│ │ Current: 50  | Supplier: X  │ │
│ │ Cost: ₱100                  │ │
│ │ [Enter Qty] → New: 75       │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Product B                   │ │
│ │ Current: 30  | Supplier: Y  │ │
│ │ Cost: ₱150                  │ │
│ │ [Enter Qty] → New: 60       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
        ↓ (submit)
```

### Step 3: Backend Processing
```
For each product:
1. Validate quantity (must be > 0)
2. Update product.quantity += submitted_quantity
3. Create ProductHistory entry
   - transaction_type: 'restock'
   - quantity_change: submitted_quantity
   - old_quantity: before value
   - new_quantity: after value
   - supplier: (captured from product)
   - unit_cost: (captured from product)
4. Return result (success/failure)
```

## Backend API

### Endpoint: `POST /api/inventory/restock/`

**Request Payload:**
```json
{
  "product_id": 5,
  "quantity": 50,
  "supplier": "Supplier Name",
  "unit_cost": 100.00,
  "reason": "Batch restocking"
}
```

**Key Points:**
- `product_id` - Required, must exist
- `quantity` - Required, must be > 0, integer
- `supplier` - Optional, uses product's current supplier if provided
- `unit_cost` - Optional, uses product's current unit_cost if provided
- `reason` - Optional, defaults to "Restock"

**Response (Success):**
```json
{
  "id": 5,
  "name": "Product A",
  "quantity": 75,
  "supplier": "Supplier X",
  "unit_cost": 100.00,
  "category": "Aquatic",
  "branch": "Manila",
  "formatted_id": "AQ-MNL-001",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T14:45:00Z"
}
```

**Response (Error):**
```json
{
  "detail": "Invalid product_id or quantity"
}
```

## Frontend Component

### RestockingModal.jsx

**Props:**
- `isOpen` (bool) - Control modal visibility
- `onClose` (func) - Callback to close modal
- `products` (array) - List of products
- `token` (string) - Authentication JWT token
- `onRestockSuccess` (func) - Callback after successful restock

**State Management:**
```javascript
const [restockItems, setRestockItems] = useState([]);        // Items to restock
const [selectedProductsForRestock, setSelectedProductsForRestock] = useState(new Set()); // Selected product IDs
const [filterCategory, setFilterCategory] = useState('all'); // Category filter
const [filterBranch, setFilterBranch] = useState('all');     // Branch filter
const [validationErrors, setValidationErrors] = useState({});// Per-product validation errors
const [loading, setLoading] = useState(false);               // Submission loading state
const [error, setError] = useState('');                      // General error message
const [success, setSuccess] = useState('');                  // Success message
```

**Key Functions:**

1. **toggleProductForRestock(product)**
   - Toggle product selection via checkbox
   - Add/remove from restock items list
   - Clear validation errors on change

2. **updateRestockItem(productId, quantity)**
   - Update quantity for selected product
   - Clear validation error when user modifies
   - Trigger real-time preview of new stock

3. **handleBatchRestock(e)**
   - Validate all quantities
   - Submit to backend sequentially
   - Handle partial failures gracefully
   - Show detailed error/success feedback

## Features

### ✅ Filtering
- **Category Filter** - Show only products from selected category
- **Branch Filter** - Show only products from selected branch
- **Combination Filtering** - Both filters apply together
- **Product Count** - Shows how many products match current filters

### ✅ Validation
- **Real-time Feedback** - Highlight validation errors as they occur
- **Per-Item Validation** - Each product validated independently
- **Clear Error Messages** - Specific guidance on what's wrong
- **Visual Indicators** - Red borders/backgrounds for invalid items

### ✅ User Feedback
- **Success Messages** - Show count of successfully restocked items
- **Error Details** - List failed items with specific error messages
- **Processing State** - Disabled button and "Processing..." text during submission
- **New Stock Preview** - Show calculated new stock level after entry

### ✅ Professional UX
- **Info Cards** - Current stock, supplier, unit cost displayed clearly
- **Status Badge** - "Ready to submit" badge when items selected
- **Remove Option** - Delete items from restock list
- **Batch Summary** - Show item count in button and header

## Validation Rules

| Field | Rules | Error Message |
|-------|-------|---------------|
| Quantity | Required, > 0, integer | "Please enter a valid quantity (greater than 0)" |
| Product | Must exist in database | API returns "Product not found" |
| Selection | At least 1 product | Disabled submit button |

## Error Handling

### Frontend Validation Errors
```javascript
{
  [productId]: "Please enter a valid quantity (greater than 0)"
}
```

### Backend API Errors
- **400 Bad Request** - Invalid data (quantity <= 0, missing product_id)
- **404 Not Found** - Product doesn't exist
- **401 Unauthorized** - Invalid/missing authentication token
- **403 Forbidden** - User is not admin

### User-Facing Error Display
All errors shown in red error box with icon and clear messaging:
```
❌ Error
12 product(s) failed: 
Product A: Product not found; 
Product B: Invalid quantity
```

## Audit Trail

Every restock operation is automatically recorded in `ProductHistory`:

```python
ProductHistory.objects.create(
    product=product,
    user=request.user,
    transaction_type='restock',      # Identifies this as restock operation
    quantity_change=quantity,         # How much was added
    old_quantity=old_quantity,        # Stock before
    new_quantity=product.quantity,    # Stock after
    supplier=supplier,                # Supplier used during restock
    unit_cost=unit_cost,              # Cost per unit at time of restock
    reason='Batch restocking'         # Operation reason
)
```

**Benefits:**
- Complete inventory history for audits
- Tracking who restocked what and when
- Historical cost data for accounting
- Ability to trace issues to specific restock operations

## Usage Scenarios

### Scenario 1: Weekly Restocking
```
Admin receives weekly supplier shipments:
1. Filter by supplier/branch
2. Select all products from that shipment
3. Enter quantities per product
4. Submit - all quantities updated, history recorded
5. Supplier quantities/costs remain unchanged (use Products Manager if needed)
```

### Scenario 2: Emergency Restocking
```
Product running low, quick restock needed:
1. Filter by category (e.g., "Food")
2. Search and select specific product
3. Enter emergency restock quantity
4. Submit - history shows emergency restock
5. No interruption to other product data
```

### Scenario 3: Partial Batch Failure
```
Restocking 10 products, 2 fail (network issues):
1. Modal shows: "Successfully restocked 8 products"
2. Error box shows: "2 product(s) failed with specific reasons"
3. User can dismiss, investigate failed products
4. Retry failed items without re-entering successful ones
```

## Best Practices

1. **Filter Before Selecting** - Use category/branch filters to reduce overwhelming list
2. **Verify Current Stock** - Check displayed current stock before entering quantity
3. **Batch By Source** - Restock items from same supplier/shipment together
4. **Save Receipts** - Keep records of shipment receipts with quantities entered
5. **Regular Updates** - Do restocking soon after receiving shipment
6. **Use Products Manager** - Update supplier/cost there, not during restocking

## Technical Stack

- **Frontend**: React with Hooks (useState, useEffect, useCallback)
- **UI Library**: Tailwind CSS
- **Icons**: React Icons (FaTimes, FaBox, FaCheck, FaTrash, FaInfoCircle)
- **API**: Fetch API with Bearer token authentication
- **Backend**: Django REST Framework

## Security

- **Authentication**: JWT token required (Bearer)
- **Authorization**: Admin user only (`IsAdminUser` permission)
- **Input Validation**: Server-side validation of all inputs
- **Audit Trail**: All operations logged with user/timestamp
- **No Direct SQL**: Uses ORM with proper escaping

## Future Enhancements

1. **Undo Functionality** - Revert recent restocking operations
2. **Batch Templates** - Save/reuse common restock batches
3. **Import from CSV** - Upload restock quantities from supplier manifest
4. **Approval Workflow** - Require approval before restocking
5. **Cost Updates** - Option to update unit cost during restocking
6. **Mobile Interface** - Responsive design for tablets/mobile
7. **Barcode Scanning** - Scan products instead of manual selection
8. **Receipt Export** - Generate restock receipts/reports

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Products not loading | API error or auth | Check network, verify token |
| Can't submit | Validation errors | Check all quantities are valid |
| Partial failure | Some products updated | Check error list, retry failed items |
| Lost filters on refresh | Modal closed | Reopen modal, select products again |

---

**Last Updated**: November 2024
**Version**: 1.0 - Initial Professional Implementation
