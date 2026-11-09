# Design Specification: Frontend Warm Storycraft UI & Auth State

* **Project**: TripFlow (User Authentication System)
* **Milestone**: Day 2 — Sub-Project 2 (Frontend Foundation, Landing Page & Sign-in UI)
* **Date**: 2026-11-05
* **Status**: Validated Design
* **Design System**: **Warm Storycraft** (Anti-AI-Slop, High-End Editorial Minimalist)

---

## 1. Overview & Business Goals

This specification details the architecture, design tokens, component hierarchy, and verification plan for the **TripFlow** frontend. It completes the Day 2 frontend milestone (Landing Page UI, Sign-in Page UI, and `useAuth` state management) while adhering to strict **Anti-AI-Design** standards and the **Warm Storycraft** visual system.

### Goals
- Implement a responsive, editorial-grade **Landing Page** and **Sign-in Page** using **Poppins** typography and the **Warm Storycraft** palette.
- Implement reusable **Shadcn UI component primitives** (`Button`, `Input`, `Label`, `Card`, `Alert`) customized to Warm Storycraft tokens.
- Establish a robust client-side **Authentication State Architecture** via `AuthContext`, custom `useAuth` hook, and typed `auth.api.ts` client supporting HttpOnly cookies (`credentials: 'include'`).
- Build an authenticated, protected **Dashboard** (`/dashboard`) that automatically restores sessions on page reload via `/api/auth/me`.
- Eliminate all generic AI tropes (no purple-to-blue gradients, no pill badges, no emojis, no tech-jargon copy, no identical three-card icon grids).

### Non-Goals
- Forgot & Reset Password frontend forms (scheduled for Day 3).
- Full reading tracking/library management functionality (scheduled for post-authentication roadmap).

---

## 2. Design System: Warm Storycraft

### 2.1. Color Tokens
Extracted directly from the brand-approved Warm Storycraft design board:
* **Canvas / Page Background**: `#F7F4EE` (Warm paper tint)
* **Surface / Card Background**: `#FFFFFF` / `#FAF8F5`
* **Card & Input Borders**: `#E8DFD3`
* **Primary Interactive**: `#8A582B` (Rich chestnut saddle leather)
  * Hover / Active: `#754820`
* **Secondary**: `#996735` (Warm amber brown)
* **Tertiary / Bookmark Accent**: `#D4A373` (Sandy caramel tan)
* **Neutral / Muted Copy**: `#756F68` (Warm stone gray)
* **Headlines & Primary Ink**: `#2B231D` (Deep espresso ink)
* **Destructive**: `#9E2A2B` (Book-cloth deep red)

### 2.2. Typography
* **Font Family**: **Poppins** (`Poppins, -apple-system, sans-serif`)
* **Weights**: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
* **Character**: Warm geometric clarity, zero robotic default feeling.

### 2.3. Anti-AI Design Guardrails
1. **No generic badges or pill capsules** above headlines.
2. **No floating emojis** in navigation or feature cards.
3. **No gradient text fills** (`bg-clip-text text-transparent`).
4. **No cliché 3-column identical icon boxes**.
5. **No developer tech-jargon in UI copy** (no "Bcrypt", "PostgreSQL", "HttpOnly tokens").
6. **No Unicode arrows** welded to button text (`→`).

---

## 3. Architecture & File Structure

Adheres strictly to the **Feature-Based Architecture** defined in `README.md`:

```text
client/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   └── SignInCard.tsx       # Warm Storycraft sign-in card with email/password validation
│   │   │   ├── context/
│   │   │   │   └── AuthContext.tsx      # AuthProvider managing user state & session bootstrap
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts           # useAuth hook exposing user, isAuthenticated, signin, signout
│   │   │   ├── services/
│   │   │   │   └── auth.api.ts          # Typed fetch service (credentials: 'include')
│   │   │   └── types/
│   │   │       └── auth.types.ts        # User, AuthState, Credentials, API response types
│   │   ├── landing/
│   │   │   ├── components/
│   │   │   │   ├── Navbar.tsx           # Brand wordmark, nav links, dynamic Sign In / Dashboard button
│   │   │   │   ├── HeroSection.tsx      # Human-centered value proposition & "Open Library" CTA
│   │   │   │   ├── EditorialPreview.tsx # Asymmetric reading journal card + calm reader principles
│   │   │   │   └── Footer.tsx           # Minimalist warm footer
│   │   │   └── LandingPage.tsx          # Full landing assembly
│   │   └── dashboard/
│   │       └── DashboardPage.tsx        # Protected user overview, greeting, and signout
│   ├── shared/
│   │   ├── components/
│   │   │   └── ui/                      # Customized Shadcn UI primitives
│   │   │       ├── button.tsx           # Primary (#8A582B), outline, ghost, link
│   │   │       ├── input.tsx            # Styled input with warm border & focus ring
│   │   │       ├── card.tsx             # Card, CardHeader, CardTitle, CardContent, CardFooter
│   │   │       ├── label.tsx            # Accessible form label
│   │   │       └── alert.tsx            # Alert, AlertDescription (warm red error box)
│   │   └── utils/
│   │       └── cn.ts                    # clsx + twMerge utility function
│   ├── routes/
│   │   ├── AppRoutes.tsx                # BrowserRouter with route tree
│   │   └── ProtectedRoute.tsx           # Redirects unauthenticated users to /signin
│   ├── App.tsx                          # Root container wrapping AuthProvider & AppRoutes
│   ├── main.tsx                         # React 19 entry point
│   └── index.css                        # Tailwind directives, Poppins font import & Warm Storycraft tokens
├── package.json                         # Add tailwindcss, lucide-react, react-router-dom, clsx, tailwind-merge
└── vite.config.ts                       # Tailwind Vite plugin integration
```

---

## 4. Screen Specifications

### 4.1. Landing Page (`/`)
* **Header**:
  * Wordmark **TripFlow** in bold Poppins (`#2B231D`).
  * Links: "Explore", "About".
  * Dynamic CTA: If authenticated, "Open Dashboard"; if guest, "Sign In" (warm outlined button).
* **Hero**:
  * Headline: *"A quiet home for your reading life."*
  * Subtext: *"Track what you read, collect your favorite passages, and keep your personal library in one calm place."*
  * Button: Solid `#8A582B` button: *"Open Your Library"* (navigates to `/signin`).
* **Editorial Preview**:
  * Left: A warm reading card showing active book progress (*"The Shadow of the Wind"*, Page 184 of 487, warm amber progress bar).
  * Right: Two calm, human reader notes on distraction-free reading and seamless cross-device access.
* **Footer**: Minimalist copyright and links in `#756F68`.

### 4.2. Sign-in Page (`/signin`)
* **Layout**: Centered warm card (`#FFFFFF`, border `#E8DFD3`, `rounded-2xl`, subtle shadow).
* **Header**:
  * Title: **"Sign In"** in deep espresso.
  * Subtitle: *"Enter your account details to access your books."*
* **Form Inputs**:
  * **Email**: Text input with email format validation.
  * **Password**: Password input with accessible text toggle (**Show** / **Hide**).
* **Actions**:
  * "Forgot password?" link (routes to `/forgot-password`).
  * Solid `#8A582B` full-width button: **"Sign In"** (with disabled & loading state).
  * Direct error banner (`#9E2A2B` border/text on `#FDF2F2` background) if credentials fail.
  * Bottom link: *"New to TripFlow? Create an account"* (`/signup`).

### 4.3. Protected Dashboard (`/dashboard`)
* Guarded by `ProtectedRoute`.
* Top navigation bar with user email and "Sign Out" button.
* Personalized greeting: **"Welcome back, [Name]"**.
* Account overview card with email, active status, and formatted member join date.
* Library status card: *"Your personal library is ready. Start adding your books."*

---

## 5. Verification Plan

1. **Build & Typecheck**:
   * Run `npm run build` in `client` to guarantee zero TypeScript or bundle errors.
2. **Session Persistence**:
   * Verify that signing in sets the HttpOnly cookie and immediately redirects to `/dashboard`.
   * Verify that refreshing `/dashboard` retains the authenticated user state via `/api/auth/me`.
3. **Sign Out**:
   * Verify clicking "Sign Out" clears the session and returns user to `/signin`.
4. **Responsive Verification**:
   * Verify mobile (375px), tablet (768px), and desktop (1280px) layouts.
5. **Anti-Slop Audit**:
   * Verify zero purple gradients, zero generic pill badges, zero emojis, and pure Poppins typography with the Warm Storycraft color scheme.
