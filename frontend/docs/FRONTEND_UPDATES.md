# SmartShip Frontend Updates

## Overview
The frontend has been completely redesigned with a professional light orange and white color scheme, featuring a modern landing page and improved user experience.

## New Features

### 1. Landing Page (Home)
- **Route**: `/`
- Professional hero section with call-to-action buttons
- Feature showcase with 6 key benefits
- Statistics display (shipments, customers, countries)
- Call-to-action section
- Professional footer with links and contact info

### 2. About Us Page
- **Route**: `/about`
- Company story and mission
- Core values showcase
- Mission and vision statements
- Statistics section

### 3. Contact Page
- **Route**: `/contact`
- Contact form with validation
- Contact information cards (email, phone, address)
- Business hours display
- Form submission with success notifications

### 4. Profile Page
- **Route**: `/profile` (Protected - requires authentication)
- User profile information display
- Profile editing form
- Password change functionality
- Professional card-based layout

### 5. Landing Navbar
- Sticky navigation bar
- Links to Home, About Us, Contact
- Login/Signup buttons for guests
- Profile dropdown menu for authenticated users
- Responsive design

## Color Scheme

### Primary Colors
- **Primary Orange**: `#ffb74d` (Light Orange)
- **Primary Dark**: `#ff9800` (Orange)
- **Primary Light**: `#ffe0b2` (Very Light Orange)
- **Accent**: `#ff8a65` (Coral Orange)

### Background Colors
- **Surface**: `#ffffff` (White)
- **Surface Secondary**: `#fff8f0` (Off-white with orange tint)

### Text Colors
- **Text**: `#2c2c2c` (Dark Gray)
- **Text Muted**: `#757575` (Medium Gray)

## Updated Components

### Authentication Pages
All authentication pages (Login, Signup, Verify OTP) have been redesigned with:
- Consistent branding with SmartShip logo
- Light orange gradient backgrounds
- Professional card-based forms
- Icon prefixes for form fields
- Improved validation messages
- Links back to home page

## Routing Updates

```typescript
Routes:
- `/` → Home (Landing Page)
- `/about` → About Us
- `/contact` → Contact
- `/profile` → Profile (Protected)
- `/auth/login` → Login
- `/auth/signup` → Signup
- `/auth/verify-otp` → Verify OTP
- `/dashboard` → Dashboard (Protected)
- ... (other protected routes)
```

## API Endpoints
All existing API endpoints remain unchanged. The frontend continues to use:
- Gateway URL: `http://localhost:5279`
- Auth endpoints: `/gateway/auth/*`
- Identity endpoints: `/gateway/identity/*`
- Shipments endpoints: `/gateway/shipments/*`
- Tracking endpoints: `/gateway/tracking/*`
- Documents endpoints: `/gateway/documents/*`
- Admin endpoints: `/gateway/admin/*`

## Key Files Modified

### New Files
- `src/app/features/landing/pages/home/*`
- `src/app/features/landing/pages/about/*`
- `src/app/features/landing/pages/contact/*`
- `src/app/features/landing/pages/profile/*`
- `src/app/features/landing/components/navbar/*`
- `src/app/features/auth/pages/login/*.html` and `*.scss`
- `src/app/features/auth/pages/signup/*.html` and `*.scss`
- `src/app/features/auth/pages/verify-otp/*.html` and `*.scss`

### Modified Files
- `src/styles.scss` - Updated with new color scheme
- `src/app/app.routes.ts` - Added landing page routes
- `src/app/core/services/auth.service.ts` - Added `isAuthenticated$` and `getCurrentUser()` methods

## Responsive Design
All pages are fully responsive with breakpoints at:
- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

## Running the Application

1. Navigate to the frontend directory:
   ```bash
   cd frontend/smartship-ui
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open browser at `http://localhost:4200`

## Features Maintained
- All existing functionality preserved
- API connections unchanged
- Authentication flow intact
- Role-based access control working
- All protected routes functional

## Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes
- No gradients used (as requested)
- Professional light orange and white color combination
- Clean, modern design
- All endpoints remain connected
- Improved user experience with landing page
