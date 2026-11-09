# TripFlow Web Client

The responsive frontend application for **TripFlow**, a personalized literary companion and reading journey tracker. Built with React 19, TypeScript, Tailwind CSS v4, and the bespoke **Warm Storycraft** design system.

---

## 🎨 Visual Philosophy: Warm Storycraft

TripFlow rejects generic AI-generated aesthetics (purple gradients, floating icon chips, neon glows, and pill badges) in favor of a tactile, editorial literary aesthetic:
- **Palette**: Warm linen canvas (`#F7F4EE`), crisp porcelain card surfaces (`#FFFFFF` / `#FAF8F5`), hairline sand borders (`#E8DFD3`), rich warm hazelnut accents (`#8A582B`), and deep espresso ink (`#2B231D`).
- **Typography**: Clean geometric typography (**Poppins**) paired with literary serif highlights.
- **Microcopy**: Calm, direct, respectful phrasing with zero conversational filler or welded arrow characters (`->`).

---

## 🚀 Key Features

1. **Editorial Landing Page (`/`)**:
   - Distinctive asymmetrical hero section celebrating the joy of reading.
   - Editorial book preview showcase.
   - Responsive Warm Storycraft navigation bar and footer.
2. **Authentication Flow (`/signin`, `/signup`)**:
   - Secure sign-in and registration with Zod pre-flight validation.
   - Accessible show/hide password visibility toggles (`Eye` / `EyeOff`).
   - Seamless HttpOnly cookie session persistence with Axios (`withCredentials: true`).
3. **Password Recovery Flow (`/forgot-password`, `/reset-password`)**:
   - **Anti-enumeration feedback**: Identical quiet confirmation whether the account exists or not.
   - **URL Guard**: Missing `?token=` parameter renders an intentional recovery guard card with a direct link to request a fresh token, preventing broken input states.
   - **Token Expiration & Replay Protection**: Informs the user when links expire (1-hour window) or have already been consumed.
4. **Active Reading Hub Dashboard (`/dashboard`)**:
   - **Now Reading**: Hero card tracking *The Shadow of the Wind* by Carlos Ruiz Zafón with progress bar and estimated completion date.
   - **Interactive Reading Log**: Modal to log pages read today that dynamically updates progress.
   - **Reader Cadence**: Annual goal completion arc, reading streak, and total pages explored.
   - **Curated Bookshelf**: "On Deck" book cards with clothbound spine feel and status tags.
   - **Marginalia Card**: Curated literary quotes.

---

## 🛠️ Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Routing**: React Router 7
- **Validation**: Zod
- **Icons**: Lucide React
- **HTTP Client**: Axios (`withCredentials: true`)
- **Language**: TypeScript 5.8

---

## 📁 Directory Structure

```
client/src/
├── features/
│   ├── auth/                                    # Authentication & Recovery
│   │   ├── components/                          # SignInCard, SignUpCard, ForgotPasswordCard, ResetPasswordCard
│   │   ├── context/                             # AuthContext & Session Provider
│   │   ├── hooks/                               # useAuth hook
│   │   ├── schemas/                             # Zod validation schemas
│   │   ├── services/                            # Axios API client (authApi)
│   │   └── types/                               # TypeScript auth types
│   ├── dashboard/                               # Active Reading Hub Dashboard
│   │   ├── components/                          # Topbar, NowReadingCard, Stats, Bookshelf, Quote, Modal
│   │   ├── types/                               # Dashboard interfaces (BookItem, ReadingProgress)
│   │   └── DashboardPage.tsx                    # Page orchestrator
│   └── landing/                                 # Marketing & Landing Experience
│       ├── components/                          # Navbar, HeroSection, EditorialPreview, Footer
│       └── LandingPage.tsx                      # Landing page orchestrator
├── routes/
│   ├── AppRoutes.tsx                            # Route registration
│   └── ProtectedRoute.tsx                       # Auth gate with redirect to /signin
├── shared/
│   ├── components/ui/                           # Shadcn-inspired accessible primitives (Button, Input, Card, Alert)
│   └── utils/                                   # Class merging utility (cn)
├── App.tsx                                      # Root application component
├── index.css                                    # Tailwind v4 configuration & Poppins font import
└── main.tsx                                     # Application entry point
```

---

## 🗺️ Route Map

| Route | Access | Component | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | Public | `LandingPage` | Editorial marketing homepage |
| `/signin` | Public | `SignInCard` | User sign-in with credentials |
| `/signup` | Public | `SignUpCard` | Account registration |
| `/forgot-password` | Public | `ForgotPasswordCard` | Request password reset email |
| `/reset-password` | Public | `ResetPasswordCard` | Update password via recovery token URL |
| `/dashboard` | **Protected** | `DashboardPage` | Active reading hub & library metrics |

---

## ⚙️ Getting Started

### 1. Installation
```bash
cd client
npm install
```

### 2. Development Server
```bash
npm run dev
```
Runs the Vite development server with hot module replacement at `http://localhost:5173`.

### 3. Production Build
```bash
npm run build
```
Compiles TypeScript and bundles production-optimized assets into the `dist/` directory.
