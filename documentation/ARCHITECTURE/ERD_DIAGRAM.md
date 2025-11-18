# Entity Relationship Diagram (ERD) - Chonky Web Project

**Last Updated:** November 19, 2025

---

## 📊 Complete Database Schema Overview

This document provides a comprehensive Entity Relationship Diagram for the entire Chonky Web project, including all models and their relationships across all backend apps (Accounts, Pets, Services, Inventory, Orders, Appointments, Sales).

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
│      NOTIFICATION                        │
│  (In-app Notifications for Users)        │
│                                          │
│ • id (PK)                                │
│ • user_id (FK)                           │
│ • order_id (FK)                          │
│ • message (Text)                         │
│ • is_read (Boolean)                      │
│ • created_at                             │
└──────────────────────────────────────────┘


┌──────────────────────────────────────────┐
│      PURCHASE_FEEDBACK                   │
│  (Order Level Feedback - Admin Only)     │
│                                          │
│ • id (PK)                                │
│ • order_id (FK, UNIQUE - OneToOne)       │
│ • user_id (FK)                           │
│ • rating (1-5 Stars)                     │
│ • comment (Text)                         │
│ • created_at                             │
└──────────────────────────────────────────┘


┌──────────────────────────────────────────┐
│      PRODUCT_FEEDBACK                    │
│  (Product Reviews - Public Display)      │
│                                          │
│ • id (PK)                                │
│ • order_id (FK)                          │
│ • product_id (FK)                        │
│ • user_id (FK)                           │
│ • rating (1-5 Stars)                     │
│ • comment (Text)                         │
│ • created_at                             │
│                                          │
│ CONSTRAINTS:                             │
│ • Unique: (order, product)               │
│   One feedback per product per order     │
└──────────────────────────────────────────┘


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
        ├─ M:N (Appointment can have add-ons)
        │    └─→ Service (add_ons M2M field)
        │
        └─ 1:1 (Appointment has feedback)
             ▼
┌──────────────────────────────────────────┐
│   APPOINTMENT_FEEDBACK                   │
│  (Service Reviews - Public Display)      │
│                                          │
│ • id (PK)                                │
│ • appointment_id (FK, UNIQUE - OneToOne) │
│ • user_id (FK)                           │
│ • rating (1-5 Stars)                     │
│ • comment (Text)                         │
│ • created_at                             │
│ • updated_at                             │
└──────────────────────────────────────────┘
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
│      (Point of Sale / Walk-in Transactions)      │
│                                                  │
│ • id (PK)                                        │
│ • sale_number (UNIQUE - Auto-generated UUID)     │
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
│ • item_name (Saved for record keeping)   │
│ • quantity                               │
│ • unit_price (Snapshot at sale time)     │
│ • subtotal                               │
│ • service_size (If applicable)           │
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
    ├─── 1:N ──→ Sale (As Cashier - POS Transactions)
    ├─── 1:N ──→ LoginActivity (Login Tracking)
    ├─── 1:N ──→ ProductHistory (Inventory Changes by User)
    ├─── 1:N ──→ Notification (In-app Notifications)
    ├─── 1:N ──→ PurchaseFeedback (Order Reviews)
    ├─── 1:N ──→ ProductFeedback (Product Reviews)
    └─── 1:N ──→ AppointmentFeedback (Service Reviews)
```

### Product-Centric View
```
┌────────────────────────────────────────────────────────────────────┐
│                    PRODUCT (Inventory Item)                        │
└────────────────────────────────────────────────────────────────────┘
    ├─── 1:N ──→ ProductHistory (Audit Trail)
    ├─── 1:N ──→ OrderItem (E-commerce Purchases)
    ├─── 1:N ──→ SaleItem (Point of Sale Transactions)
    ├─── 1:N ──→ ProductFeedback (Customer Reviews)
    └─── N:1 ──→ Supplier (Source - Referenced by name)
```

### Service-Centric View
```
┌────────────────────────────────────────────────────────────────────┐
│                SERVICE (Grooming/Services)                         │
└────────────────────────────────────────────────────────────────────┘
    ├─── 1:N ──→ Appointment (Service Bookings)
    ├─── 1:N ──→ OrderItem (Service Orders - E-commerce)
    ├─── 1:N ──→ SaleItem (POS Service Transactions)
    └─── M:N ──→ Appointment (Add-ons via appointment_addons)
```

### Order-Centric View
```
┌────────────────────────────────────────────────────────────────────┐
│                     ORDER (E-commerce Orders)                      │
└────────────────────────────────────────────────────────────────────┘
    ├─── 1:N ──→ OrderItem (Line Items)
    ├─── 1:1 ──→ PurchaseFeedback (Overall Order Review)
    ├─── 1:N ──→ ProductFeedback (Individual Product Reviews)
    └─── 1:N ──→ Notification (Order Status Updates)
```

### Appointment-Centric View
```
┌────────────────────────────────────────────────────────────────────┐
│                  APPOINTMENT (Service Bookings)                    │
└────────────────────────────────────────────────────────────────────┘
    ├─── N:1 ──→ User (Customer)
    ├─── N:1 ──→ Service (Main Service)
    ├─── N:1 ──→ PetProfile (Optional - Pet being serviced)
    ├─── M:N ──→ Service (Add-on Services)
    └─── 1:1 ──→ AppointmentFeedback (Service Review)
```

---

## 📊 Data Flow Summary

### Order Processing Flow (E-commerce)
```
User → Order → OrderItem ─┬─→ Product (via ProductHistory on sale)
                          └─→ Service
                          
Order → Notification (Created when order placed)
Order → PurchaseFeedback (Optional - Admin view only)
Order + Product → ProductFeedback (Per product in order - Public)
```

### Service Booking Flow
```
User → PetProfile → Appointment → Service (Main + Add-ons M2M)
Appointment → AppointmentFeedback (Optional - Public display)
```

### Point of Sale Flow (Walk-in)
```
Cashier (User) → Sale → SaleItem ─┬─→ Product
                                   └─→ Service
```

### Inventory Tracking Flow
```
Product → ProductHistory ← (via User/Admin Actions)
            ├─ Addition (Initial Stock)
            ├─ Restock (Replenishment)
            ├─ Sale (Stock Reduction)
            ├─ Adjustment (Manual Fix)
            ├─ Damaged/Loss (Stock Loss)
            └─ Return (Stock Increase)
```

### Notification Flow
```
Order Created → Notification Created → User Notified
Order Status Changed to Completed → Notification Marked as Read
```

### Feedback Flow
```
Order Completed → User can submit:
    ├─ PurchaseFeedback (Overall order - Admin only)
    └─ ProductFeedback (Per product - Public display)
    
Appointment Completed → User can submit:
    └─ AppointmentFeedback (Service review - Public display)
```

---

## 🔑 Key Relationships Summary

| Relationship | Type | Description |
|-------------|------|-------------|
| User → Profile | 1:1 | One user has one profile |
| User → PetProfile | 1:N | One user can own multiple pets |
| User → Order | 1:N | One user can make multiple orders |
| User → Appointment | 1:N | One user can book multiple appointments |
| User → Sale (as Cashier) | 1:N | One cashier can process multiple sales |
| User → LoginActivity | 1:N | Multiple login records per user |
| User → ProductHistory | 1:N | Track who made inventory changes |
| User → Notification | 1:N | User receives multiple notifications |
| User → PurchaseFeedback | 1:N | User can review multiple orders |
| User → ProductFeedback | 1:N | User can review multiple products |
| User → AppointmentFeedback | 1:N | User can review multiple appointments |
| Product → ProductHistory | 1:N | Audit trail for each product |
| Product → OrderItem | 1:N | Product can be in multiple orders |
| Product → SaleItem | 1:N | Product can be in multiple POS sales |
| Product → ProductFeedback | 1:N | Product can have multiple reviews |
| Service → Appointment | 1:N | Service can have multiple bookings |
| Service → OrderItem | 1:N | Service can be ordered online |
| Service → SaleItem | 1:N | Service can be sold at POS |
| Appointment → Service (Add-ons) | M:N | Appointment can have multiple add-ons |
| Appointment → AppointmentFeedback | 1:1 | One feedback per appointment |
| Order → OrderItem | 1:N | One order has multiple items |
| Order → Notification | 1:N | Order generates notifications |
| Order → PurchaseFeedback | 1:1 | Optional overall order feedback |
| Order → ProductFeedback | 1:N | Multiple product reviews per order |
| Sale → SaleItem | 1:N | One sale has multiple line items |
| PetProfile → Appointment | 1:N | One pet can have multiple appointments |

---

## 🎯 Database Characteristics

### Transactions & Normalization
- ✅ **Normalized to 3NF** - All tables properly normalized
- ✅ **Referential Integrity** - Foreign keys maintain data consistency
- ✅ **Cascading Deletes** - Most relationships use ON DELETE CASCADE or SET_NULL
- ✅ **Unique Constraints** - Order ID (8-digit), Sale Number (UUID-based), Product per branch+category

### Indexing Strategy
- ✅ **Primary Keys** - All tables indexed on PK
- ✅ **Foreign Keys** - Automatic indexing on FK relationships
- ✅ **Search Queries** - Indexed fields: (branch, -sale_date), (status), (order_id), (product_id), (appointment_date, start_time)
- ✅ **Audit Trail** - timestamp indexed for ProductHistory queries
- ✅ **Unique Constraints** - Appointment slots (branch, date, time for active bookings)

### Data Integrity
- ✅ **Date/Time Tracking** - created_at, updated_at on all entities
- ✅ **Audit Trail** - ProductHistory captures all inventory changes with reason and user
- ✅ **Price History** - OrderItem and SaleItem store prices at transaction time (snapshot)
- ✅ **Status Tracking** - All transactional entities track status (Order, Sale, Appointment)
- ✅ **Auto-Generation** - Order ID (8-digit unique), Sale Number (UUID), Product Item Number
- ✅ **Notifications** - In-app notification system for order updates with read status
- ✅ **Feedback System** - Three types: Purchase (admin), Product (public), Appointment (public)

---

## 📝 Notes for Presentation

### Model Count by App
1. **Accounts App:** 2 models
   - Profile (user profile with role, location, verification)
   - LoginActivity (login tracking with IP, user agent)

2. **Inventory App:** 3 models
   - Supplier (supplier management)
   - Product (inventory with auto-pricing, formatted IDs)
   - ProductHistory (complete audit trail)

3. **Orders App:** 5 models
   - Order (e-commerce orders with 8-digit ID)
   - OrderItem (line items for products/services)
   - Notification (in-app notifications for users)
   - PurchaseFeedback (overall order review - admin only)
   - ProductFeedback (per-product reviews - public)

4. **Pets App:** 1 model
   - PetProfile (pet information management)

5. **Services App:** 1 model
   - Service (grooming services with flexible pricing)

6. **Appointments App:** 2 models
   - Appointment (service bookings with constraints)
   - AppointmentFeedback (service reviews - public)

7. **Sales App:** 2 models
   - Sale (POS/walk-in transactions)
   - SaleItem (line items for POS sales)

**Total Models: 16** (across 7 Django apps)

### Key Design Decisions
- ✅ **Dual Transaction System:** Separate Order (e-commerce) and Sale (POS) models for different use cases
- ✅ **Polymorphic Items:** OrderItem/SaleItem can reference Product OR Service
- ✅ **Triple Feedback System:** 
  - PurchaseFeedback (Order-level, admin only)
  - ProductFeedback (Product-level, public display)
  - AppointmentFeedback (Service-level, public display)
- ✅ **Audit Trail:** ProductHistory tracks all inventory changes with user attribution
- ✅ **M:N Add-ons:** Appointment add-ons via ManyToMany for flexible service bundling
- ✅ **Size-Based Pricing:** Service model supports both flat and size-based pricing
- ✅ **Auto-Generated IDs:** Order ID (8-digit unique), Sale Number (UUID), Product Item Number (per branch+category)
- ✅ **Branch Segregation:** Most models support Matina/Toril branch separation
- ✅ **Notification System:** Real-time in-app notifications for order status updates
- ✅ **Constraint Enforcement:** Unique appointment slots prevent double-booking
- ✅ **Soft References:** Sale items store item_name for historical records even if product/service deleted

### Business Logic Highlights
- **Automatic Retail Pricing:** Products calculate retail price from unit cost + category markup
- **Smart Inventory Remarks:** Auto-generate "Out of Stock", "Reorder soon", "In Stock" based on quantity
- **Order ID Format:** Displayed as ORD-XXXXX-XXXXX (formatted from 8-digit number)
- **Product ID Format:** M/T-A/B/C/D/E/F/G-XXX (branch-category-number)
- **Appointment Constraints:** No overlapping appointments unless service allows overlap
- **Notification Filtering:** Only show notifications for pending/available orders, auto-mark read on completion

---

**Generated:** November 19, 2025  
**Version:** 2.0  
**Status:** Complete - All Backend Models Included
