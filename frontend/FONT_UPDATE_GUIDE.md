# FONT SYSTEM BATCH UPDATE - All Frontend Files

## Summary of Changes Made

✅ **Completed:**
- CSS Font System Configuration (index.css)
- Tailwind Font Family Configuration
- Google Fonts Integration
- ServicesPage.jsx - All fonts applied
- Font Documentation (FONT_SYSTEM.md)

## Remaining Files - Common Patterns to Replace

### Pattern Dictionary

| Find | Replace | Context |
|------|---------|---------|
| `text-4xl font-bold` | `display-md` | Page main titles |
| `text-3xl font-bold` | `display-lg` or `heading-main` | Large section titles |
| `text-2xl font-bold` | `heading-section` | Section headings |
| `text-xl font-bold` | `heading-card` | Card titles |
| `text-lg font-bold` | `heading-card` or `text-body-lg` | Smaller headings |
| `text-sm font-bold` | `text-small` | Small bold text |
| `text-xs font-semibold` | `text-tiny` | Tiny text |
| `className="text-` followed by size and color but no font family specified | Add appropriate class from above |  Body text |

---

## Critical Pages - Priority Update Order

### 1. **LandingPage.jsx**
**Key areas:**
- Main hero title → `display-xl` or `display-lg`
- Section headings → `heading-section`
- Body descriptions → `text-body` or `text-body-lg`
- CTA buttons → Already auto-styled with `.btn`
- Prices → `price price-large`

**Search patterns:**
```
text-5xl font-bold → display-xl
text-4xl font-bold → display-lg
text-3xl font-bold → heading-main
text-2xl font-bold → heading-section
```

### 2. **AppointmentPage.jsx**
**Key areas:**
- "Select a Service" title → `heading-main`
- Service cards → Service names use `heading-card`
- Duration labels → `text-small`
- Prices → `price price-medium`
- Button text → Auto-styled
- Step indicators → Apply `text-small` to labels

### 3. **ProductsPage.jsx**
**Key areas:**
- "Our Products" title → `display-md`
- Product names → `heading-card`
- Prices → `price price-medium` or `price price-large`
- Product descriptions → `text-body` or `text-body-sm`
- Filter labels → `heading-sub`
- Button text → Auto-styled

### 4. **CartPage.jsx**
**Key areas:**
- "Shopping Cart" title → `display-md`
- Product names → `heading-card`
- Prices → `price price-large` (for totals)
- Item prices → `price price-medium`
- Labels → `text-small`

### 5. **MyAppointmentsPage.jsx**
**Key areas:**
- "My Appointments" → `display-md`
- Appointment date/time → `text-body` with appropriate size
- Service names → `heading-card`
- Status labels → `badge` or `text-small`
- Duration → `text-small`

### 6. **MyOrdersPage.jsx**
**Key areas:**
- "My Orders" → `display-md`
- Order IDs → `text-small` or `heading-sub`
- Product names → `heading-card`
- Prices → `price price-medium`
- Order status → `badge` or `status`

---

## Admin & Management Pages

### 7. **AdminAppointmentsPage.jsx**
- Headers → `display-md` or `heading-main`
- Table headers → `heading-sub`
- Customer info → `text-body`
- Dates/Times → `text-small`

### 8. **AdminOrdersPage.jsx**
- "Admin Orders" → `display-md`
- Order details → Mix of sizes
- Prices → `price` classes
- Buttons → Auto-styled

### 9. **AdminServicesPage.jsx**
- "Manage Services" → `display-md`
- Service names → `heading-card`
- Section headers in forms → `heading-sub`
- Labels → `text-small`

### 10. **Management Pages (src/pages/management/)**
- **Services.jsx** → Already has advanced modal styling
  - Update form labels → `text-small`
  - Update section headers → `heading-sub`
  - Prices in forms → `price` classes
  
- **Products.jsx** → Similar to Services
  - Product names → `heading-card`
  - Prices → `price` classes
  - Form labels → `text-small`

---

## Component Files

### Component Updates (src/components/)

All components should follow the pattern system:

**Header/Navigation:**
- Logo → Could use `display-md` but keep readable
- Nav items → `text-body` or `text-body-sm`
- Buttons → Auto-styled

**Cards:**
- Card title → `heading-card`
- Card body → `text-body` or `text-body-sm`
- Card meta → `text-small`
- Card price → `price` classes

**Forms:**
- Form labels → `label` (auto-styled to Quicksand 600)
- Input placeholder → Auto-styled
- Form section headers → `heading-sub`
- Helper text → `text-small`

**Modals:**
- Modal title → `heading-main`
- Modal body → `text-body`
- Modal labels → `heading-sub`
- Button text → Auto-styled

---

## Batch Update Commands (Manual)

### Using Find & Replace in VS Code

**Step 1: Replace large headings**
```
Find: text-4xl font-bold
Replace: display-md
```

**Step 2: Replace section headings**
```
Find: text-3xl font-bold
Replace: heading-main
```

**Step 3: Replace card titles**
```
Find: text-2xl font-bold
Replace: heading-section
```

**Step 4: Replace small bold text**
```
Find: text-xl font-bold
Replace: heading-card
```

**Step 5: Replace labels**
```
Find: text-sm font-semibold
Replace: text-small
```

**Step 6: Replace prices**
```
Find: font-bold text-.*\{.*price.*\}
Replace: price price-medium
```
(Use regex for this)

---

## Files to Update (Complete List)

- [ ] src/pages/LandingPage.jsx
- [ ] src/pages/AppointmentPage.jsx
- [ ] src/pages/ProductsPage.jsx
- [ ] src/pages/CartPage.jsx
- [ ] src/pages/MyAppointmentsPage.jsx
- [ ] src/pages/MyOrdersPage.jsx
- [ ] src/pages/FeedbackPage.jsx
- [ ] src/pages/AdminAppointmentsPage.jsx
- [ ] src/pages/AdminOrdersPage.jsx
- [ ] src/pages/AdminServicesPage.jsx
- [ ] src/pages/AdminFeedbackPage.jsx
- [ ] src/pages/management/Services.jsx
- [ ] src/pages/management/Products.jsx
- [ ] src/pages/management/StaffManagement.jsx
- [ ] src/pages/management/Orders.jsx
- [ ] src/pages/LoginPage.jsx
- [ ] src/pages/RegisterPage.jsx
- [ ] src/pages/ForgotPasswordPage.jsx
- [ ] src/pages/ResetPasswordPage.jsx
- [ ] src/pages/VerifyEmailPage.jsx
- [ ] src/pages/ManagementPage.jsx
- [ ] src/pages/EndOfDayReportsPage.jsx
- [ ] src/components/Header.jsx
- [ ] src/components/Footer.jsx
- [ ] src/components/ProductCard.jsx
- [ ] src/components/ServiceCard.jsx
- [ ] src/components/AppointmentCard.jsx
- [ ] src/components/OrderCard.jsx
- [ ] src/components/Modal.jsx
- [ ] src/components/Toast.jsx
- [ ] And all other component files...

---

## Testing Checklist After Updates

- [ ] Font hierarchy is visually clear (headings > body > labels)
- [ ] Prices stand out with Poppins bold
- [ ] Body text is comfortable to read
- [ ] Small text is still readable (not too tiny)
- [ ] Buttons are clearly interactive
- [ ] No mix of old `font-bold text-xl` and new classes on same page
- [ ] Colors still match with new fonts
- [ ] Responsive design still works (no text overflow)
- [ ] Mobile view is clean and readable

---

## Font System Benefits

✅ **Consistency** - Same font rules across entire app
✅ **Readability** - Optimized sizes and weights for each element
✅ **Hierarchy** - Clear visual distinction between content levels
✅ **Cute & Professional** - Friendly fonts that still look polished
✅ **Easy to Maintain** - Change one class, affects entire site
✅ **Scalability** - Add new components with same font classes

---

## Quick Reference During Updates

| Element | Class | Font | Size | Weight |
|---------|-------|------|------|--------|
| Page Title | display-md | Poppins | 2.25rem | 700 |
| Section Title | heading-section | Quicksand | 1.75rem | 700 |
| Card Title | heading-card | Quicksand | 1.25rem | 600 |
| Body Text | text-body | Comfortaa | 1rem | 400 |
| Price Large | price price-large | Poppins | 2rem | 700 |
| Small Label | text-small | Quicksand | 0.875rem | 500 |
| Button | btn | Poppins | Variable | 600 |
| Badge | badge | Quicksand | 0.75rem | 600 |

---

## Notes

- **All HTML heading tags (h1-h6) are automatically styled** - No extra classes needed for these!
- **All buttons are automatically Poppins** - No extra classes needed!
- **All inputs are automatically Comfortaa** - No extra classes needed!
- **Add classes only for emphasis or special styling**

