# Stock Adjustment Endpoint Documentation

## Overview
The `/api/inventory/adjust-stock/` endpoint handles one-by-one stock quantity adjustments with automatic product history tracking. This endpoint supports both adding and deducting inventory for various transaction types.

## Endpoint Details

**URL:** `/api/inventory/adjust-stock/`  
**Method:** `POST`  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only  
**Response Format:** JSON

## Request Body

```json
{
  "product_id": 1,
  "operation": "ADD",
  "transaction_type": "addition",
  "quantity": 20,
  "reason": "Stock adjustment reason"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `product_id` | Integer | Yes | The ID of the product to adjust |
| `operation` | String | Yes | Either `"ADD"` or `"DEDUCT"` |
| `transaction_type` | String | Yes | Type of transaction: `addition`, `restock`, `sale`, `adjustment`, `damaged`, `return` |
| `quantity` | Integer | Yes | Amount to add or subtract (must be > 0) |
| `reason` | String | No | Optional reason for the adjustment |

## Response

### Success (200 OK)

```json
{
  "success": true,
  "message": "Successfully ADDED 20 unit(s) for Test Product",
  "product": {
    "id": 1,
    "name": "Test Product",
    "category": "Pet Food & Treats",
    "quantity": 120,
    "branch": "Matina",
    "formatted_id": "M-A-001",
    ...
  }
}
```

### Errors

#### 400 Bad Request - Invalid Operation
```json
{
  "detail": "operation must be 'ADD' or 'DEDUCT'"
}
```

#### 400 Bad Request - Invalid Quantity
```json
{
  "detail": "quantity must be greater than 0"
}
```

#### 400 Bad Request - Insufficient Stock
```json
{
  "detail": "Cannot deduct 150. Current stock is 120"
}
```

#### 404 Not Found - Product Not Found
```json
{
  "detail": "Product not found"
}
```

## What Happens When You Call This Endpoint

1. **Validation**
   - Verifies all required fields are provided
   - Validates operation is either "ADD" or "DEDUCT"
   - Validates quantity is greater than 0
   - Validates transaction_type is in the allowed list
   - Checks that product exists

2. **Stock Update**
   - For ADD: New quantity = Current quantity + quantity
   - For DEDUCT: New quantity = Current quantity - quantity
   - Prevents negative stock (returns error if deduction would go below 0)

3. **History Recording**
   - Creates ProductHistory entry with:
     - Transaction type (addition, restock, sale, etc.)
     - Quantity change (positive for ADD, negative for DEDUCT)
     - Old and new quantities
     - Timestamp and user who made the adjustment
     - Optional reason

4. **Product History Tab**
   - All adjustments automatically appear in the Product History tab
   - Admins can filter by transaction type, branch, or product
   - Timestamp and user information is recorded

## Frontend Integration

### Example Usage in React

```javascript
// When admin clicks "Next" or "Finish" button
const handleApplyAdjustment = async () => {
  const response = await fetch('http://127.0.0.1:8000/api/inventory/adjust-stock/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_id: currentProduct.id,
      operation: isAddMode ? 'ADD' : 'DEDUCT',
      transaction_type: transactionType,  // 'addition', 'restock', 'sale', etc.
      quantity: parseInt(quantity),
      reason: `Manual adjustment - ${transactionType}`
    })
  });
  
  if (response.ok) {
    const result = await response.json();
    // Move to next product or finish
    if (isLastProduct) {
      onAdjustmentSuccess('All adjustments completed');
    } else {
      moveToNextProduct();
    }
  } else {
    const error = await response.json();
    showErrorMessage(error.detail);
  }
};
```

## Workflow: One-by-One Stock Adjustment

1. Admin navigates to Inventory → Stock Flow tab
2. Admin clicks "Manage Stock" button
3. SelectProductsModal opens - admin selects 1 or more products
4. Admin clicks "Proceed to Adjust"
5. StockAdjustmentModal opens showing "Product 1 of N"
6. For each product:
   - Admin selects ADD or DEDUCT
   - Admin selects transaction reason
   - Admin enters quantity
   - Admin clicks "Next" (or "Finish" for last product)
   - `POST /api/inventory/adjust-stock/` is called
   - Product history entry is created
   - Modal shows next product
7. After last product, modal closes
8. Admin can view all adjustments in Product History tab

## Database Changes

### ProductHistory Table
New entries created for each adjustment with:
- `product_id`: The product being adjusted
- `transaction_type`: Type of transaction (addition, restock, sale, etc.)
- `quantity_change`: Positive (ADD) or negative (DEDUCT)
- `old_quantity`: Stock before adjustment
- `new_quantity`: Stock after adjustment
- `reason`: Optional reason provided by admin
- `timestamp`: When adjustment was made
- `user_id`: Who made the adjustment

## Testing

Run the test script to verify the endpoint:

```bash
cd backend
python manage.py migrate
python test_adjust_stock_endpoint.py
```

The test script will:
1. Create a test admin user
2. Create a test product
3. Test ADD operation
4. Test DEDUCT operation
5. Test error handling (overdraft prevention)
6. Display product history entries

## Transaction Types

| Type | Description | Use Case |
|------|-------------|----------|
| `addition` | Product added to inventory | New product stock added |
| `restock` | Restocking from supplier | Bulk purchasing/supplier delivery |
| `sale` | Product sold to customer | Transaction at checkout |
| `adjustment` | Manual inventory adjustment | Correction/count discrepancy |
| `damaged` | Damaged or damaged goods | Loss/damage incident |
| `return` | Customer return | Return processing |

## Error Handling

The endpoint includes comprehensive error handling:

- **Missing fields**: Returns 400 with field name
- **Invalid operation**: Returns 400 with valid options
- **Invalid quantity**: Returns 400 if <= 0
- **Invalid transaction_type**: Returns 400 with list of valid types
- **Insufficient stock**: Returns 400 with current stock level
- **Product not found**: Returns 404
- **Database errors**: Returns 400 with error message
- **Permission denied**: Returns 403 (handled by permission_classes)

## Notes

- Admins only can access this endpoint (permission_classes enforced)
- Stock cannot go negative (deduction prevented if insufficient)
- All changes are audited (user and timestamp recorded)
- Product history is automatically created - no manual entry needed
- Quantity must be a positive integer
- Reason field is optional but recommended for audit trail
