# Stock Adjustment Feature - Quick Reference

## 🎯 What Was Built

A complete one-by-one stock adjustment system where admins:
1. Select multiple products to adjust
2. Adjust each product sequentially (one at a time)
3. All adjustments automatically recorded in Product History
4. Full audit trail with user and timestamp

## 🔗 API Endpoint

**Endpoint:** `POST /api/inventory/adjust-stock/`

**Required Fields:**
```json
{
  "product_id": 1,
  "operation": "ADD" | "DEDUCT",
  "transaction_type": "addition|restock|sale|adjustment|damaged|return",
  "quantity": 50
}
```

**Optional Fields:**
```json
{
  "reason": "Why this adjustment"
}
```

## 📱 Frontend Workflow

```
1. Admin clicks "Manage Stock" button
   ↓
2. SelectProductsModal - Choose products (1 or more)
   ↓
3. Click "Proceed to Adjust"
   ↓
4. StockAdjustmentModal opens - Shows "Product 1 of 3"
   ↓
5. For each product:
   - Select ADD or DEDUCT
   - Select reason (restock, sale, etc.)
   - Enter quantity
   - Click "Next" → POST to /adjust-stock/
   - API creates ProductHistory entry
   - UI shows next product
   ↓
6. After last product, click "Finish"
   ↓
7. Success! All adjustments in Product History tab
```

## 🔧 Backend Implementation

**File:** `backend/inventory/views.py`

```python
class AdjustStockQuantityAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def post(self, request):
        # Validates input
        # Updates product quantity
        # Creates ProductHistory entry
        # Returns updated product
```

**File:** `backend/inventory/urls.py`

```python
path('adjust-stock/', AdjustStockQuantityAPIView.as_view(), name='inventory-adjust-stock'),
```

## 🎨 Frontend Implementation

**File:** `frontend/src/components/RestockingModal.jsx`

```javascript
const handleApplyAdjustment = async () => {
  // Call: POST /api/inventory/adjust-stock/
  // With: product_id, operation, transaction_type, quantity
  // Then: Move to next product or finish
};
```

## ✅ Validation & Error Handling

| Scenario | Response |
|----------|----------|
| Invalid operation | 400 - "operation must be 'ADD' or 'DEDUCT'" |
| Invalid quantity | 400 - "quantity must be greater than 0" |
| Insufficient stock | 400 - "Cannot deduct X. Current stock is Y" |
| Invalid tx type | 400 - "transaction_type must be one of [...]" |
| Product not found | 404 - "Product not found" |
| Successful ADD | 200 - Product returned with new quantity |
| Successful DEDUCT | 200 - Product returned with new quantity |

## 🗄️ What Gets Recorded

Each adjustment creates a ProductHistory entry:
- **Product:** Which product was adjusted
- **Transaction Type:** Why (addition, restock, sale, adjustment, damaged, return)
- **Old Quantity:** Stock before adjustment
- **New Quantity:** Stock after adjustment
- **Quantity Change:** +X (ADD) or -X (DEDUCT)
- **User:** Who made the adjustment
- **Timestamp:** When it happened
- **Reason:** Optional reason provided by admin

## 📊 Product History Tab

After adjustments, admins can:
1. Go to Product History tab
2. See all recent adjustments
3. Filter by:
   - Transaction type (Addition, Restock, Sale, etc.)
   - Branch (Matina, Toril)
4. View complete audit trail

## 🧪 How to Test

### Option 1: Run Test Script
```bash
cd backend
python test_adjust_stock_endpoint.py
```

### Option 2: Manual Testing via UI
1. Start backend: `python manage.py runserver`
2. Start frontend: `npm start`
3. Login as admin
4. Go to Inventory → Stock Flow
5. Click "Manage Stock"
6. Select products and click "Proceed to Adjust"
7. Adjust each product one-by-one
8. Check Product History tab for entries

### Option 3: cURL Testing
```bash
curl -X POST http://127.0.0.1:8000/api/inventory/adjust-stock/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "operation": "ADD",
    "transaction_type": "restock",
    "quantity": 50,
    "reason": "Test adjustment"
  }'
```

## 🔐 Security

- ✅ Admin-only access
- ✅ Bearer token required
- ✅ User attribution
- ✅ Input validation
- ✅ Error prevention (no negative stock)

## 📚 Documentation Files

- **`STOCK_ADJUSTMENT_ENDPOINT.md`** - Complete API reference
- **`STOCK_ADJUSTMENT_SETUP.md`** - Full implementation details
- **`STOCK_ADJUSTMENT_QUICK_REFERENCE.md`** - This file

## 🚀 Ready to Use!

All files are in place. The system is:
- ✅ Backend endpoint created and tested
- ✅ Frontend integrated and working
- ✅ Error handling comprehensive
- ✅ Database automatically updated
- ✅ Product History tracking active

## 🎯 Key Benefits

1. **One-by-One Processing** - Methodical, less error-prone
2. **Automatic History** - No manual entry needed
3. **Audit Trail** - Full tracking of who, what, when, why
4. **Error Prevention** - Can't create negative stock
5. **User-Friendly** - Clear UI with progress indicator
6. **Flexible** - Supports 6 different transaction types

---

**Status:** ✅ COMPLETE AND READY TO USE
