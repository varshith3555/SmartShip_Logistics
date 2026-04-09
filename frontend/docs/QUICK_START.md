# SmartShip Frontend - Quick Start Guide

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v17 or higher)

### Installation & Running

1. **Navigate to frontend directory**
   ```bash
   cd frontend/smartship-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   or
   ```bash
   ng serve
   ```

4. **Open in browser**
   ```
   http://localhost:4200
   ```

## New User Journey

### For New Users (Not Logged In)

1. **Landing Page** (`/`)
   - View hero section with company information
   - See features and benefits
   - Click "Get Started" to sign up
   - Click "Sign In" to login

2. **About Us** (`/about`)
   - Learn about SmartShip
   - View company values and mission

3. **Contact** (`/contact`)
   - Fill out contact form
   - View contact information
   - See business hours

4. **Sign Up** (`/auth/signup`)
   - Enter name, email, phone, password
   - Click "Send OTP"
   - Redirected to OTP verification

5. **Verify OTP** (`/auth/verify-otp`)
   - Enter 6-digit OTP code
   - Click "Verify OTP"
   - Redirected to login

6. **Login** (`/auth/login`)
   - Enter email and password
   - Click "Login"
   - Redirected to dashboard

### For Logged In Users

1. **Navbar Access**
   - Home, About Us, Contact links available
   - Profile dropdown in top-right
   - Access to Dashboard, Profile, Logout

2. **Profile Page** (`/profile`)
   - View and edit profile information
   - Change password
   - Update contact details

3. **Dashboard** (`/dashboard`)
   - Access all shipment features
   - View tracking information
   - Manage documents

## Color Scheme Reference

```css
Primary Orange: #ffb74d
Primary Dark: #ff9800
Primary Light: #ffe0b2
Accent: #ff8a65
Background: #ffffff
Secondary Background: #fff8f0
Text: #2c2c2c
Text Muted: #757575
```

## Key Features

✅ Professional landing page with hero section
✅ About Us page with company information
✅ Contact page with form and information
✅ User profile management
✅ Responsive design (mobile, tablet, desktop)
✅ Light orange and white color scheme
✅ No gradients (solid colors only)
✅ Modern, clean UI components
✅ Consistent branding throughout
✅ All API endpoints maintained

## Backend Connection

Ensure the backend services are running:

1. **Gateway** - Port 5279
2. **Identity Service** - Port 5028
3. **Shipment Service** - Port 5137
4. **Tracking Service** - Port 5266
5. **Document Service** - Port 5261
6. **Admin Service** - Port 5010

The frontend proxy configuration (`proxy.conf.json`) handles API routing.

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 4200
npx kill-port 4200
# Then restart
npm start
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Connection Issues
- Verify backend services are running
- Check `proxy.conf.json` configuration
- Ensure gateway is accessible at `http://localhost:5279`

## Development Tips

### Hot Reload
The development server supports hot reload. Changes to TypeScript, HTML, or SCSS files will automatically refresh the browser.

### Build for Production
```bash
npm run build
```
Output will be in `dist/smartship-ui/`

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

## Project Structure

```
src/
├── app/
│   ├── core/              # Services, guards, interceptors
│   ├── features/
│   │   ├── landing/       # NEW: Landing pages
│   │   │   ├── pages/
│   │   │   │   ├── home/
│   │   │   │   ├── about/
│   │   │   │   ├── contact/
│   │   │   │   └── profile/
│   │   │   └── components/
│   │   │       └── navbar/
│   │   ├── auth/          # UPDATED: Auth pages
│   │   ├── customer/      # Customer features
│   │   ├── admin/         # Admin features
│   │   ├── shipments/     # Shipment management
│   │   ├── tracking/      # Tracking features
│   │   └── documents/     # Document management
│   ├── shared/            # Shared components
│   └── app.routes.ts      # UPDATED: Routing
├── assets/                # Static assets
└── styles.scss            # UPDATED: Global styles
```

## Support

For issues or questions:
- Check the documentation in `FRONTEND_UPDATES.md`
- Review the backend API documentation
- Contact the development team

---

**Happy Coding! 🚀**
