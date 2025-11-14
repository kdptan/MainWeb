# Font System Documentation - Comprehensive Guide

## Font Family Overview

**Three Main Fonts Applied Globally:**
- **Poppins** - Bold, modern, clean (Headings, Buttons, Emphasis)
- **Quicksand** - Soft, rounded, friendly (Section Headings, Labels, Small Text)
- **Comfortaa** - Rounded, comfortable, readable (Body Text, Inputs)

---

## Font Class Reference

### 1. DISPLAY HEADINGS (Hero, Main Titles)
Use these for the biggest, most important headlines.

```html
<!-- Extra Large Display (3.5rem, 800 weight) -->
<h1 class="display-xl">Welcome to Chonky Pets</h1>

<!-- Large Display (3rem, 800 weight) -->
<h2 class="display-lg">Our Premium Services</h2>

<!-- Medium Display (2.25rem, 700 weight) -->
<h3 class="display-md">Grooming Excellence</h3>
```

**Font:** Poppins Bold
**Use Case:** Page titles, hero sections, major headings

---

### 2. STANDARD HTML HEADINGS (H1-H6)

```html
<!-- H1 (2.25rem, 700 weight) -->
<h1>Main Page Title</h1>

<!-- H2 (1.875rem, 700 weight) -->
<h2>Section Heading</h2>

<!-- H3 (1.5rem, 700 weight) - Quicksand -->
<h3>Subsection</h3>

<!-- H4 (1.25rem, 600 weight) - Quicksand -->
<h4>Smaller Section</h4>

<!-- H5 (1.125rem, 600 weight) - Quicksand -->
<h5>Mini Section</h5>

<!-- H6 (1rem, 600 weight) - Quicksand -->
<h6>Tiny Section</h6>
```

---

### 3. SECTION HEADINGS

```html
<!-- Main Section Heading (2.25rem) - Poppins -->
<div class="heading-main">Our Services</div>

<!-- Section Heading (1.75rem) - Quicksand -->
<div class="heading-section">Browse Products</div>

<!-- Card Heading (1.25rem) - Quicksand -->
<div class="heading-card">Service Name</div>

<!-- Sub Heading (1rem) - Quicksand -->
<div class="heading-sub">Additional Info</div>
```

**Font Usage:**
- `.heading-main` → Poppins Bold
- `.heading-section` → Quicksand Bold
- `.heading-card` → Quicksand Semi-Bold
- `.heading-sub` → Quicksand Semi-Bold

---

### 4. BODY TEXT (Content)

```html
<!-- Large Body Text (1.125rem, Regular) -->
<p class="text-body-lg">Longer description or introduction text goes here.</p>

<!-- Normal Body Text (1rem, Regular) - Default -->
<p class="text-body">Standard paragraph text for content display.</p>

<!-- Small Body Text (0.9375rem, Regular) -->
<p class="text-body-sm">Smaller content or secondary information.</p>
```

**Font:** Comfortaa Regular
**Use Case:** All body content, descriptions, paragraphs

---

### 5. SMALL TEXT (Labels, Helpers)

```html
<!-- Small Text (0.875rem, 500 weight) -->
<span class="text-small">Helper text or label</span>

<!-- Tiny Text (0.75rem, 500 weight) -->
<span class="text-tiny">Very small helper</span>
```

**Font:** Quicksand Medium
**Use Case:** Form labels, hints, captions, small information

---

### 6. BUTTON TEXT

```html
<!-- Large Button -->
<button class="btn btn-lg">Action Button</button>

<!-- Medium Button (Default) -->
<button class="btn btn-md">Select Service</button>

<!-- Small Button -->
<button class="btn btn-sm">Close</button>
```

**Font:** Poppins Semi-Bold
**Automatic:** All buttons get Poppins weight 600

---

### 7. BADGES & TAGS

```html
<!-- Badge/Tag -->
<span class="badge">New</span>
<span class="tag">Featured</span>
```

**Font:** Quicksand Semi-Bold (600), 0.75rem
**Use Case:** Status indicators, badges, tags

---

### 8. FORM LABELS

```html
<label class="label">Your Name</label>
<input type="text" placeholder="Enter name...">

<!-- Or use heading-sub for section labels -->
<h6>Personal Information</h6>
```

**Font:** Quicksand Semi-Bold (600)

---

### 9. LINKS

```html
<a href="/services" class="link">View All Services</a>
```

**Font:** Poppins Medium (500)

---

### 10. EMPHASIS TEXT

```html
<p>This is <strong>very important</strong> information.</p>
<p>Or use <b>bold text</b> for emphasis.</p>
```

**Font:** Poppins Bold (700)

---

### 11. PRICE/AMOUNT TEXT

```html
<!-- Large Price (2rem) -->
<div class="price price-large">₱1,500.00</div>

<!-- Medium Price (1.5rem) -->
<div class="price price-medium">₱500.00</div>

<!-- Small Price (1.125rem) -->
<div class="price price-small">₱150.00</div>
```

**Font:** Poppins Bold (700)
**Use Case:** Prices, amounts, financial text (ALWAYS HIGHLIGHTED)

---

### 12. STATUS & ALERTS

```html
<div class="status">Order Completed</div>
<div class="alert">Please verify your email</div>
```

**Font:** Poppins Semi-Bold (600)
**Use Case:** Status messages, alerts, notifications

---

## IMPLEMENTATION GUIDE FOR ALL FILES

### Pattern 1: Page Main Title
```jsx
// BEFORE
<h1 className="text-4xl font-bold text-accent-cream mb-2">Our Services</h1>

// AFTER
<h1 className="display-md text-accent-cream mb-2">Our Services</h1>
```

### Pattern 2: Section Heading
```jsx
// BEFORE
<h2 className="text-2xl font-bold text-accent-cream">Browse Services</h2>

// AFTER
<h2 className="heading-section text-accent-cream">Browse Services</h2>
```

### Pattern 3: Card Title
```jsx
// BEFORE
<h3 className="text-xl font-bold text-accent-cream">{service.name}</h3>

// AFTER
<h3 className="heading-card text-accent-cream">{service.name}</h3>
```

### Pattern 4: Body Text
```jsx
// BEFORE
<p className="text-accent-cream">{description}</p>

// AFTER
<p className="text-body text-accent-cream">{description}</p>
```

### Pattern 5: Small Label
```jsx
// BEFORE
<span className="text-sm text-accent-peach">Duration:</span>

// AFTER
<span className="text-small text-accent-peach">Duration:</span>
```

### Pattern 6: Price
```jsx
// BEFORE
<p className="text-xl font-bold text-secondary-lighter">₱{price}</p>

// AFTER
<p className="price price-medium text-secondary-lighter">₱{price}</p>
```

### Pattern 7: Button
```jsx
// BEFORE
<button className="font-semibold">Book Now</button>

// AFTER
<button className="btn btn-md">Book Now</button>
```

---

## Quick Reference Table

| Purpose | Class | Font | Size | Weight |
|---------|-------|------|------|--------|
| Hero Title | display-xl | Poppins | 3.5rem | 800 |
| Page Title | display-md | Poppins | 2.25rem | 700 |
| H1 | h1 | Poppins | 2.25rem | 700 |
| H2 | h2 | Poppins | 1.875rem | 700 |
| H3 | h3 | Quicksand | 1.5rem | 700 |
| Section | heading-section | Quicksand | 1.75rem | 700 |
| Card Title | heading-card | Quicksand | 1.25rem | 600 |
| Body | text-body | Comfortaa | 1rem | 400 |
| Small | text-small | Quicksand | 0.875rem | 500 |
| Price | price | Poppins | Variable | 700 |
| Button | btn | Poppins | Variable | 600 |
| Badge | badge | Quicksand | 0.75rem | 600 |

---

## Global Rules Already Applied

✅ All `<body>` elements use Comfortaa
✅ All `<h1>` to `<h6>` tags auto-apply correct fonts
✅ All `<button>` elements use Poppins Semi-Bold
✅ All `<a>` links use Poppins Medium
✅ All `<input>` fields use Comfortaa
✅ All `<strong>` and `<b>` use Poppins Bold

**No extra classes needed for these - they work automatically!**

---

## Application Priority (For Updates)

1. **Critical Pages** (Update First):
   - LandingPage.jsx
   - ServicesPage.jsx
   - AppointmentPage.jsx
   - ProductsPage.jsx
   - CartPage.jsx

2. **User Pages** (Update Next):
   - MyAppointmentsPage.jsx
   - MyOrdersPage.jsx
   - FeedbackPage.jsx

3. **Admin Pages** (Update After):
   - AdminAppointmentsPage.jsx
   - AdminOrdersPage.jsx
   - AdminServicesPage.jsx
   - AdminFeedbackPage.jsx

4. **Components** (Update Last):
   - Header components
   - Card components
   - Form components
   - Modal components

---

## Testing Checklist

- [ ] Headings are bold and clear
- [ ] Body text is readable and comfortable
- [ ] Prices stand out with Poppins bold
- [ ] Buttons are clearly clickable
- [ ] Labels are small but visible
- [ ] All text sizes are proportional
- [ ] Font styling is consistent across pages
- [ ] No generic `font-bold` or `text-xl` without context

---

## Notes

- All fonts are pre-connected in index.html for fast loading
- Tailwind config has fontFamily configured for fallbacks
- CSS hierarchy ensures proper font application
- Use semantic HTML (h1-h6) when possible for automatic styling
- Classes can be combined: `<p class="text-body text-accent-cream">`

