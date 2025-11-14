# Entity Relationship Diagram (ERD) - Chonky Web Project

**Last Updated:** November 14, 2025

---

## 📊 Complete Database Schema Overview

This document provides a comprehensive Entity Relationship Diagram for the entire Chonky Web project, including all models and their relationships.

---

## 🗂️ Database Entities & Relationships

### Core System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DJANGO AUTH USER MODEL                             │
│                    (Built-in Django User Model)                            │
│                                                                             │
│  • id (PK)          • username (UNIQUE)     • password                    │
│  • email            • first_name            • last_name                   │
│  • is_active        • is_staff              • is_superuser               │
│  • date_joined      • last_login                                          │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       │ 1:1
       ├─────────────────────┐
       │                     │
       ▼                     ▼
┌──────────────────┐  ┌──────────────────────────────┐
│    PROFILE       │  │     LOGIN_ACTIVITY           │
│                  │  │                              │
│ • id (PK)        │  │ • id (PK)                    │
│ • user_id (FK)   │  │ • user_id (FK)               │
│ • role           │  │ • login_time                 │
│ • location       │  │ • ip_address                 │
│ • profile_pic    │  │ • user_agent                 │
│ • email_verified │  └──────────────────────────────┘
│ • verification   │
│   _token         │
└──────────────────┘
```

---

## 🛍️ E-Commerce & Inventory Module

```
┌─────────────────────┐
│   SUPPLIER          │
│                     │
│ • id (PK)           │
│ • name (UNIQUE)     │
│ • contact_person    │
│ • email             │
│ • phone             │
│ • address           │
│ • city              │
│ • is_active         │
│ • created_at        │
│ • updated_at        │
└─────────────────────┘
        ▲
        │
        │ N (Referenced in Product)
        │
┌───────────────────────────────────────────────┐
│          PRODUCT (INVENTORY)                  │
│                                               │
│ • id (PK)                                    │
│ • name                                       │
│ • category                                   │
│ • description                                │
│ • supplier (CharField)                       │
│ • unit_cost (Decimal)                        │
│ • retail_price (Decimal - Auto Calculated)   │
│ • quantity (Current Stock)                   │
│ • reorder_level                              │
│ • reorder_quantity                           │
│ • branch (Matina/Toril)                      │
│ • item_number (Auto Assigned)                │
│ • remarks (Auto Generated)                   │
│ • created_at, updated_at                     │
└───────────────────────────────────────────────┘
        │
        │ 1:N (Product has many history records)
        │
        ▼
┌────────────────────────────────────────────┐
│      PRODUCT_HISTORY                       │
│   (Audit Trail for Inventory)              │
│                                            │
│ • id (PK)                                  │
│ • product_id (FK)                          │
│ • user_id (FK) [Optional - Admin/User]     │
│ • transaction_type:                        │
│   - Addition (New Product)                 │
│   - Restock                                │
│   - Sale                                   │
│   - Adjustment                             │
│   - Damaged/Loss                           │
│   - Return                                 │
│ • quantity_change (±value)                 │
│ • old_quantity                             │
│ • new_quantity                             │
│ • supplier (For Restock)                   │
│ • unit_cost                                │
│ • total_cost (qty_change × unit_cost)      │
│ • reason (Notes)                           │
│ • timestamp                                │
└────────────────────────────────────────────┘
```

---

## 📦 Order Management Module

```
┌────────────────────────────────────────────────┐
│           ORDER                                │
│   (Purchase/Transaction Record)                │
│                                                │
│ • id (PK)                                     │
│ • order_id (UNIQUE - 8 Digit Random)         │
│ • user_id (FK) → User                        │
│ • branch (Matina/Toril)                      │
│ • status:                                    │
│   - Pending                                  │
│   - Available for Pickup                     │
│   - Completed                                │
│   - Cancelled                                │
│ • total_price                                │
│ • amount_paid                                │
│ • change                                     │
│ • notes                                      │
│ • created_at                                 │
│ • completed_at                               │
└────────────────────────────────────────────────┘
        │
        │ 1:N
        ▼
┌────────────────────────────────────────────┐
│        ORDER_ITEM                          │
│  (Items in Order)                          │
│                                            │
│ • id (PK)                                  │
│ • order_id (FK)                            │
│ • item_type:                               │
│   - Product                                │
│   - Service                                │
│ • product_id (FK) [if type=product]        │
│ • service_id (FK) [if type=service]        │
│ • quantity                                 │
│ • price (Snapshot at order time)           │
└────────────────────────────────────────────┘
        │
        ├────────────┬─────────────┐
        │            │             │
        ▼            ▼             ▼
     Product    Service       [Pricing Snapshot]


┌──────────────────────────────────────────┐
│      PURCHASE_FEEDBACK                   │
│  (Order Level Feedback - Admin Only)     │
│                                          │
│ • id (PK)                                │
│ • order_id (FK, UNIQUE)                  │
│ • user_id (FK)                           │
│ • rating (1-5 Stars)                     │
│ • comment (Text)                         │
│ • timestamp                              │
└──────────────────────────────────────────┘
```

---

## 🐾 Pet Management Module

```
┌────────────────────────────────────────────────┐
│          PET_PROFILE                           │
│      (Pet Information Management)              │
│                                                │
│ • id (PK)                                     │
│ • owner_id (FK) → User                       │
│ • pet_name                                    │
│ • breed                                       │
│ • branch (Matina/Toril)                      │
│ • pet_picture (Image)                        │
│ • age_value + age_unit (Months/Years)        │
│ • birthdate                                  │
│ • gender (Male/Female)                       │
│ • weight_lbs (Decimal)                       │
│ • additional_notes                           │
│ • created_at, updated_at                     │
└────────────────────────────────────────────────┘
        │
        │ 1:N (Pet can have many appointments)
        │
        ▼
┌────────────────────────────────────────────┐
│        APPOINTMENT                         │
│  (Grooming/Service Appointments)           │
│                                            │
│ • id (PK)                                  │
│ • user_id (FK)                             │
│ • service_id (FK)                          │
│ • pet_id (FK) [Optional]                   │
│ • branch (Matina/Toril)                    │
│ • appointment_date                         │
│ • start_time                               │
│ • end_time                                 │
│ • duration_minutes [from Service]          │
│ • status:                                  │
│   - Pending                                │
│   - Confirmed                              │
│   - Completed                              │
│   - Cancelled                              │
│ • amount_paid                              │
│ • change                                   │
│ • notes                                    │
│ • created_at, updated_at                   │
│                                            │
│ CONSTRAINTS:                               │
│ • Unique: (branch, date, time) for        │
│   active appointments                      │
└────────────────────────────────────────────┘
        │
        │ M:N (Appointment can have add-ons)
        │
        ▼
    [SERVICE - See Below]
```

---

## 🧴 Services Module

```
┌─────────────────────────────────────────────────────┐
│          SERVICE                                    │
│   (Grooming/Service Catalog)                       │
│                                                     │
│ • id (PK)                                          │
│ • service_name                                     │
│ • description                                      │
│ • inclusions (JSON - List of strings)              │
│ • duration_minutes                                 │
│ • may_overlap (Boolean)                            │
│ • is_solo (Boolean)                                │
│ • can_be_addon (Boolean)                           │
│ • can_be_standalone (Boolean)                      │
│                                                     │
│ PRICING OPTIONS:                                   │
│ • addon_price (When used as add-on)               │
│ • standalone_price (When purchased alone)         │
│ • has_sizes (Boolean - Enable size pricing)        │
│ • base_price (If no sizes)                        │
│ • small_price                                     │
│ • medium_price                                    │
│ • large_price                                     │
│ • extra_large_price                               │
│                                                     │
│ • created_at, updated_at                          │
└─────────────────────────────────────────────────────┘
        │
        ├─── 1:N ──→ ORDER_ITEM (items in orders)
        │
        ├─── 1:N ──→ APPOINTMENT (appointments)
        │
        └─── M:N ──→ APPOINTMENT (add-ons)
             (Through appointment_addons)
```

---

## 💰 Sales Module

```
┌──────────────────────────────────────────────────┐
│            SALE                                  │
│      (Point of Sale / EOD Records)               │
│                                                  │
│ • id (PK)                                        │
│ • sale_number (UNIQUE)                           │
│ • sale_date (Auto-generated)                     │
│ • branch (Matina/Toril)                          │
│                                                  │
│ CUSTOMER DETAILS:                                │
│ • customer_name                                  │
│ • customer_phone                                 │
│ • customer_email                                 │
│                                                  │
│ STAFF:                                           │
│ • cashier_id (FK) → User                         │
│                                                  │
│ PRICING:                                         │
│ • subtotal                                       │
│ • discount                                       │
│ • tax (12% VAT)                                  │
│ • total                                          │
│                                                  │
│ PAYMENT:                                         │
│ • payment_method:                                │
│   - Cash                                         │
│   - Debit/Credit Card                            │
│   - Online Payment                               │
│ • amount_paid                                    │
│ • change                                         │
│                                                  │
│ • status (Pending/Completed/Cancelled)           │
│ • notes                                          │
│ • created_at, updated_at                         │
│                                                  │
│ INDEXES:                                         │
│ • (branch, -sale_date)                           │
│ • (status)                                       │
└──────────────────────────────────────────────────┘
        │
        │ 1:N (Sale can have multiple items)
        │
        ▼
┌──────────────────────────────────────────┐
│        SALE_ITEM                         │
│   (Products/Services in Sale)            │
│                                          │
│ • id (PK)                                │
│ • sale_id (FK)                           │
│ • item_type (Product/Service)            │
│ • product_id (FK) [if type=product]      │
│ • service_id (FK) [if type=service]      │
│ • quantity                               │
│ • price (Snapshot at sale time)          │
│ • subtotal                               │
│ • tax (Item specific)                    │
│ • created_at                             │
└──────────────────────────────────────────┘
```

---

## 🔗 Complete Relationship Map

### User-Centric View
```
┌────────────────────────────────────────────────────────────────────┐
│                         USER (Core Entity)                         │
└────────────────────────────────────────────────────────────────────┘
    ├─── 1:1 ──→ Profile (Account Info)
    ├─── 1:N ──→ PetProfile (Owned Pets)
    ├─── 1:N ──→ Order (Purchases)
    ├─── 1:N ──→ Appointment (Service Bookings)
    ├─── 1:N ──→ LoginActivity (Login Tracking)
    └─── 1:N ──→ ProductHistory (Inventory Changes by User)
```

### Product-Centric View
```
┌────────────────────────────────────────────────────────────────────┐
│                    PRODUCT (Inventory Item)                        │
└────────────────────────────────────────────────────────────────────┘
    ├─── 1:N ──→ ProductHistory (Audit Trail)
    ├─── 1:N ──→ OrderItem (Purchases)
    ├─── 1:N ──→ SaleItem (Point of Sale)
    └─── N:1 ──→ Supplier (Source)
```

### Service-Centric View
```
┌────────────────────────────────────────────────────────────────────┐
│                SERVICE (Grooming/Services)                         │
└────────────────────────────────────────────────────────────────────┘
    ├─── 1:N ──→ Appointment (Service Bookings)
    ├─── 1:N ──→ OrderItem (Service Orders)
    ├─── 1:N ──→ SaleItem (POS Transactions)
    └─── M:N ──→ Appointment (Add-ons)
```

---

## 📊 Data Flow Summary

### Order Processing Flow
```
User → Order → OrderItem ─┬─→ Product (via ProductHistory)
                          └─→ Service
```

### Service Booking Flow
```
User → PetProfile → Appointment → Service (+ Add-ons)
```

### Inventory Tracking Flow
```
Product → ProductHistory ← (via User/Admin Actions)
            ├─ Addition
            ├─ Restock
            ├─ Sale
            ├─ Adjustment
            ├─ Damaged/Loss
            └─ Return
```

### Sales Reporting Flow
```
Sale ← OrderItem/SaleItem ← Product/Service
Sale ← User (Cashier)
Sale ← Feedback (Optional)
```

---

## 🔑 Key Relationships Summary

| Relationship | Type | Description |
|-------------|------|-------------|
| User → Profile | 1:1 | One user has one profile |
| User → PetProfile | 1:N | One user can own multiple pets |
| User → Order | 1:N | One user can make multiple orders |
| User → Appointment | 1:N | One user can book multiple appointments |
| User → LoginActivity | 1:N | Multiple login records per user |
| User → ProductHistory | 1:N | Track who made inventory changes |
| Product → ProductHistory | 1:N | Audit trail for each product |
| Product → OrderItem | 1:N | Product can be in multiple orders |
| Service → Appointment | 1:N | Service can have multiple bookings |
| Appointment → Service (Add-ons) | M:N | Appointment can have multiple add-ons |
| Order → OrderItem | 1:N | One order has multiple items |
| Sale → SaleItem | 1:N | One sale has multiple line items |
| Order → Feedback | 1:1 | Optional feedback per order |
| PetProfile → Appointment | 1:N | One pet can have multiple appointments |

---

## 🎯 Database Characteristics

### Transactions & Normalization
- ✅ **Normalized to 3NF** - All tables properly normalized
- ✅ **Referential Integrity** - Foreign keys maintain data consistency
- ✅ **Cascading Deletes** - Most relationships use ON DELETE CASCADE or SET_NULL
- ✅ **Unique Constraints** - Order ID, Sale Number, Product Name+Branch combinations

### Indexing Strategy
- ✅ **Primary Keys** - All tables indexed on PK
- ✅ **Foreign Keys** - Automatic indexing on FK relationships
- ✅ **Search Queries** - (branch, -sale_date), (status), (order_id), (product_id)
- ✅ **Audit Trail** - timestamp indexed for ProductHistory queries

### Data Integrity
- ✅ **Date/Time Tracking** - created_at, updated_at on all entities
- ✅ **Audit Trail** - ProductHistory captures all inventory changes
- ✅ **Price History** - OrderItem and SaleItem store prices at transaction time
- ✅ **Status Tracking** - All transactional entities track status

---

## 📝 Notes for Presentation

1. **Total Entities:** 15 main models
2. **User-Related:** 2 (Profile, LoginActivity)
3. **Inventory-Related:** 3 (Product, ProductHistory, Supplier)
4. **Transaction-Related:** 6 (Order, OrderItem, Sale, SaleItem, Purchase Feedback, ProductHistory)
5. **Service-Related:** 2 (Service, Appointment)
6. **Pet-Related:** 1 (PetProfile)

**Key Design Decisions:**
- Polymorphic OrderItem/SaleItem (can reference Product OR Service)
- Audit trail through ProductHistory for compliance
- M:N relationship for Appointment add-ons (flexible service bundling)
- Size-based pricing for Services (supports variable pricing models)
- Separate Sale/Order models (allows for both retail POS and online ordering)

---

**Generated:** November 14, 2025
**Version:** 1.0
**Status:** Final
