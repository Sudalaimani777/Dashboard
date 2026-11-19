# TripFlow Web Client

The enterprise frontend application for **TripFlow**, a multi-tier corporate travel authorization, manager audit, and expense governance platform. Built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Vite 8**, and styled with the bespoke **Stripe Design System**.

---

## 🎨 Visual Philosophy: Stripe Design System

TripFlow delivers an information-dense, distraction-free corporate workstation designed for financial compliance, rapid auditing, and high-legibility data tables:

- **Typography**:
  - **Interface & Prose**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (weights 400, 500, 600, 700) for clean UI hierarchy.
  - **Monetary & Tabular Data**: [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) for Indian Rupee (`INR` / `₹`) financial amounts, dates, flight/project codes, and tabular metrics.
- **Palette & Tokens** (configured in [src/index.css](src/index.css)):
  - **Canvas & Surfaces**: Cool neutral canvas (`#F2F7FE`), crisp card surface (`#FFFFFF`), subtle background (`#F8FAFC`).
  - **Primary & Interactive**: Stripe blurple primary (`#533AFD`), hover (`#4834DB`), secondary button tint (`#E5EDF5`), tertiary accent (`#635BFF`).
  - **Text & Inks**: Deep midnight ink (`#061B31`), main text (`#1A2C44`), muted slate (`#334155`), faint guidance (`#50617A`).
  - **Status & Semantics**: Success emerald (`#00D66F`), warning amber (`#FF6118`), destructive crimson (`#DC2626`).
  - **Borders & Dividers**: High-contrast hairline borders (`#CBD5E1`) and strong dividers (`#94A3B8`).
- **Design Tokens**:
  - **5 Elevation Tiers**: `--shadow-xs` through `--shadow-xl` with dark navy tinted drop-shadows.
  - **5 Border Radii**: `--radius-xs` (1px) through `--radius-full` (100px).
  - **Motion**: `--ease-stripe: cubic-bezier(0.16, 1, 0.3, 1)` with durations from 100ms to 800ms.
- **Form UX**: Permanent helper guidance text, validation borders, and accessible password strength feedback.

---

## 🚀 Core Workspaces & Portals

### 1. Dynamic Role Dashboard (`/dashboard`)
Orchestrated by `DashboardPage.tsx`, the dashboard automatically presents role-specific workspaces based on the authenticated user's session:
- **Employee Workspace**:
  - **Trips Queue**: Active submissions, draft requests, approval states, and action triggers.
  - **Quick Metrics**: Total submitted, approved, and pending reimbursement totals.
  - **Clone Action**: Instant pre-filling of repeat journeys using previous trip data.
  - **Spend Analytics Tab (`/dashboard?tab=analytics`)**: Interactive spend velocity graphs, month-over-month comparisons, and expense category distributions.
- **Manager Audit Workspace**:
  - **Pending Review Queue**: Direct subordinates' upcoming travel submissions and reimbursement claims.
  - **Audit Actions**: One-click approvals, structured change requests, and revision dispatch.
  - **Team Analytics Tab (`/dashboard?tab=analytics`)**: Departmental travel burn rates, approval velocities, and team expense distribution.
- **Admin & Finance Governance Workspace**:
  - **Clearance Ledger**: Final authorization queue for pre-trip bookings and post-trip financial disbursements.
  - **Department Budgets View**: Quarterly allocation tracking, headroom calculations, and category breakdowns.
  - **User Governance Directory**: Corporate roster management, department allocations, and access status.

### 2. Travel Workstations
- **New Travel Request (`/travel/new`)**:
  - **Dual Mode Toggle**: Distinguishes between **Upcoming Travel** (pre-trip authorization) and **Already Travelled** (post-trip expense reimbursement).
  - **Logistics & Details**: Project code, travel purpose, origin/destination, dates with boundary validation, and emergency contact with international dial codes (`PhoneInputWithCountry`).
  - **Dynamic Expense Line Items**: Real-time category allocation (`FLIGHT`, `HOTEL`, `MEALS_PER_DIEM`, `TRANSIT`, `MISC`), merchant validation, and instant subtotal calculation.
  - **Multi-Proof Attachment Hub**: Upload receipts, quotations, or ticket proofs via Cloudinary or document URL links.
- **Travel Detail & Audit Workstation (`/travel/requests/:id`)**:
  - Polymorphic detail workstation displaying full itinerary, expense line items, and Cloudinary proof preview modal.
  - **Immutable Audit Timeline**: Chronological log of status transitions, remarks, and actor identities.
  - **Role-Gated Actions**: Line manager approvals, Admin clearance/settlement, or multi-route revision dispatch:
    - **Route A**: Admin requests revisions through Line Manager.
    - **Route B**: Admin requests revisions directly from Employee (with the invariant that resubmission returns to the Manager).
- **Request Resubmission (`/travel/requests/:id/edit`)**:
  - Full-page workstation allowing employees to revise itinerary, modify expenses, replace invalid receipts, and review prior audit remarks.

### 3. User Administration (`/admin/users/new`, Modal, Directory)
- Dedicated administrative workstation to provision new employees, managers, and administrators.
- Status toggles (`ACTIVE` / `INACTIVE`), department assignments, and data erasure warning safeguards.

### 4. Authentication & Account Security
- **Sign In (`/signin`)**: Secure login with Zod pre-flight validation and HttpOnly cookie persistence.
- **Password Recovery (`/forgot-password`, `/reset-password`)**:
  - Anti-enumeration feedback (identical neutral response whether account exists or not).
  - URL Guard enforcing valid token query parameters (`?token=...`).
  - Real-time password strength meter and 1-hour expiration protection.
- **Role Guarding**: Protected routes redirect unauthenticated users to `/signin`, while `/signup` redirects to `/signin` (accounts are provisioned by administrators).

---

## 🛠️ Tech Stack & Dependencies

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React 19.3.1 | Core UI library with modern Concurrent Features |
| **Build Tool** | Vite 8.3.5 | Ultra-fast HMR and production asset bundler |
| **Styling** | Tailwind CSS v4.3.4 | Modern CSS engine via `@tailwindcss/vite` |
| **Routing** | React Router 7.18.5 | Client-side routing with lazy-loaded code-splitting |
| **Visualization** | Recharts 3.10.1 | Interactive spend analytics and budget charts |
| **Validation** | Zod 4.6.7 | Type-safe schema validation for forms & API payloads |
| **Forms** | React Hook Form 7.91.0 | High-performance uncontrolled form state management |
| **Icons** | Lucide React & Tabler Icons | Vector icons for enterprise actions and indicators |
| **Animation** | Motion 14.11.1 | Smooth dialog, drawer, and transition animations |
| **HTTP Client** | Axios 1.21.0 | Configured with `withCredentials: true` for session cookies |
| **Language** | TypeScript 5.8 / 7.0 | Strict type safety and autocompletion |

---

## 📁 Directory Structure

```
client/
├── public/                                      # Static assets and favicon
├── src/
│   ├── context/                                 # Backward-compatible context re-exports
│   ├── features/
│   │   ├── auth/                                # Authentication & Account Recovery
│   │   │   ├── components/                      # SignInCard, ForgotPasswordCard, ResetPasswordCard, PasswordStrengthMeter
│   │   │   ├── context/                         # AuthContext & Session Provider
│   │   │   ├── hooks/                           # useAuth hook
│   │   │   ├── schemas/                         # Zod authentication schemas
│   │   │   ├── services/                        # Axios auth API client
│   │   │   └── types/                           # Auth & User interfaces
│   │   ├── dashboard/                           # Dynamic Role Dashboard
│   │   │   ├── utils/                           # Avatar generation helpers
│   │   │   └── DashboardPage.tsx                # Role-based workspace switcher (Employee, Manager, Admin)
│   │   ├── travel/                              # Corporate Travel & Expense Governance
│   │   │   ├── components/                      # Portals, modal dialogs, and UI cards
│   │   │   │   ├── forms/                       # DynamicExpenseTable, ExpenseRowItem, ProofAttachmentField, PhoneInputWithCountry, CloneTripDropdown
│   │   │   │   ├── shared/                      # TravelMetricsGrid, RouteLabel, TravelDetailSkeleton, InlineConfirmBar
│   │   │   │   ├── AdminGovernancePortal.tsx    # Admin clearance queue, budgets & audit portal
│   │   │   │   ├── DepartmentBudgetCard.tsx     # Department budget allocation summary card
│   │   │   │   ├── DepartmentCategoryBreakdownCard.tsx # Recharts pie/donut category breakdown
│   │   │   │   ├── DepartmentSpendersVelocityCard.tsx  # Recharts velocity spenders bar chart
│   │   │   │   ├── EmployeeTravelPortal.tsx     # Employee trips queue, draft controls & quick metrics
│   │   │   │   ├── ManagerQueuePortal.tsx       # Manager review queue & revision dispatch
│   │   │   │   └── TravelStatusBadge.tsx        # Status pill indicator with high contrast
│   │   │   ├── context/                         # TravelContext & state management
│   │   │   ├── hooks/                           # useTravel custom hook
│   │   │   ├── layout/                          # DashboardLayout, DynamicRoleSidebar, SidebarNavItem, SidebarUserProfile
│   │   │   ├── pages/                           # Full-page workstations
│   │   │   │   ├── DepartmentBudgetsPage.tsx    # Multi-quarter department budget workstation
│   │   │   │   ├── EmployeeSpendAnalyticsPage.tsx # Employee spend analytics graphs
│   │   │   │   ├── ManagerTeamAnalyticsPage.tsx # Manager team analytics workstation
│   │   │   │   ├── NewTravelRequestPage.tsx     # Travel request creation workstation
│   │   │   │   ├── ResubmitTravelRequestPage.tsx # Travel request revision workstation
│   │   │   │   └── TravelDetailPage.tsx         # Detailed inspection & audit workstation
│   │   │   ├── services/                        # travel.api.ts (Axios travel API client)
│   │   │   ├── types/                           # TravelRequest, ExpenseItem, Budget interfaces
│   │   │   └── utils/                           # Currency, budget calculations, dial codes, analytics helpers
│   │   └── users/                               # User Administration
│   │       ├── components/                      # UserFormModal (create/edit user modal)
│   │       ├── pages/                           # AdminUsersPage, NewUserPage
│   │       ├── schemas/                         # Zod user validation schemas
│   │       ├── services/                        # users.api.ts
│   │       └── utils/                           # User helper formatting functions
│   ├── lib/                                     # Utility functions (cn class merger)
│   ├── routes/
│   │   ├── AppRoutes.tsx                        # Route registration with lazy code splitting
│   │   └── ProtectedRoute.tsx                   # Role & authentication route gates
│   ├── services/                                # Service re-exports
│   ├── shared/
│   │   ├── components/ui/                       # Primitives (button, input, card, alert, chart, label, password-input)
│   │   └── utils/                               # Class variance and styling helpers
│   ├── types/                                   # Global TypeScript declarations
│   ├── utils/                                   # Currency formatting utilities
│   ├── App.css                                  # Global application resets
│   ├── App.tsx                                  # Root component with AuthProvider & TravelProvider
│   ├── index.css                                # Tailwind v4 config, font variables & Stripe tokens
│   └── main.tsx                                 # Application bootstrapping
├── tests/                                       # Standalone verification suites (40+ test files)
├── index.html                                   # HTML template with Google Fonts preloads
├── package.json                                 # Scripts and dependencies
├── tsconfig.app.json                            # Application TypeScript configuration
└── vite.config.ts                               # Vite 8 configuration with Tailwind plugin
```

---

## 🗺️ Route Map

| Path | Access Tier | Component | Description |
| :--- | :--- | :--- | :--- |
| `/signin` | Public | `SignInCard` | User sign-in with credentials and HttpOnly cookie session |
| `/signup` | Public | *Redirect to `/signin`* | User creation is restricted to Admin governance |
| `/forgot-password` | Public | `ForgotPasswordCard` | Request password reset token with anti-enumeration |
| `/reset-password` | Public | `ResetPasswordCard` | Reset password using recovery token from URL |
| `/dashboard` | **Protected** | `DashboardPage` | Dynamic role dashboard (`EMPLOYEE`, `MANAGER`, `ADMIN`) |
| `/travel/new` | **Protected** | `NewTravelRequestPage` | Create travel request (Upcoming travel or reimbursement) |
| `/travel/requests/:id` | **Protected** | `TravelDetailPage` | Detailed inspection, receipts viewer & audit actions |
| `/travel/requests/:id/edit` | **Protected** | `ResubmitTravelRequestPage` | Revise and resubmit request based on audit remarks |
| `/travel/audit/:id` | **Protected** | *Legacy Redirect* | Redirects to `/travel/requests/:id` |
| `/travel/clearance/:id` | **Protected** | *Legacy Redirect* | Redirects to `/travel/requests/:id` |
| `/admin/users/new` | **Protected (Admin)** | `NewUserPage` | Provision new employee, manager, or admin user |
| `/` | Public | *Redirect to `/dashboard`* | Default entry point routing to authenticated dashboard |
| `*` | Public | *Redirect to `/dashboard`* | Catch-all route fallback |

---

## ⚙️ Getting Started

### 1. Installation
Ensure you have **Node.js v20+** installed:
```bash
cd client
npm install
```

### 2. Development Server
Start the local Vite development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### 3. Production Build
Verify TypeScript types and compile optimized production assets:
```bash
npm run build
```
Production assets will be output to the `dist/` directory.

### 4. Code Linting
Run the fast Oxlint linter:
```bash
npm run lint
```

---

## 🧪 Testing Suite

The client repository includes over 45 assertion-based test suites in `tests/` covering UI contrast, date boundaries, state transitions, phone formats, and role permissions.

To execute individual test suites:
```bash
# Example: Verify Stripe theme tokens and color contrast
npx tsx tests/stripe-theme-tokens.test.ts
npx tsx tests/stripe-contrast-readability.test.ts

# Example: Verify Travel state machine & date boundaries
npx tsx tests/travel-form-date-validation.test.ts
npx tsx tests/expense-date-boundaries.test.ts

# Example: Verify Department budget analytics & charts
npx tsx tests/department-budget-redesign.test.ts
npx tsx tests/department-category-pie-chart.test.ts
```

---

## 📚 Client Architecture & Engineering Documentation

Deep-dive architecture guides and domain specifications are documented in [`client/docs/`](docs/):

* [**MIGRATIONS_AND_TESTING.md**](docs/MIGRATIONS_AND_TESTING.md): Verification suites, testing execution workflows, static AST contracts, and major framework migrations (React 19, Tailwind v4, Vite 8, Route consolidation).
* [**INTEGRATIONS.md**](docs/INTEGRATIONS.md): REST API contracts (`/api/auth`, `/api/travel`, `/api/users`), Axios client configuration, Cloudinary multi-proof receipts pipeline, and localization formatters.
* [**AUTH_AND_SECURITY.md**](docs/AUTH_AND_SECURITY.md): HttpOnly cookie session model, Zero-PII session hint strategy (`tripflow_has_session`), anti-enumeration password recovery, XSS/CSRF mitigations, and Zod form schemas.
* [**STATE_MACHINE.md**](docs/STATE_MACHINE.md): Two-tier governance finite state machine, complete 10-state catalog, visual badge semantics, the Strict Manager Re-routing Invariant, and polymorphic workstation orchestration.
* [**ROUTING_AND_RBAC.md**](docs/ROUTING_AND_RBAC.md): React Router 7 setup, code-splitting with `React.lazy`, `<ProtectedRoute />` gates, and legacy route redirects.
* [**STATE_MANAGEMENT.md**](docs/STATE_MANAGEMENT.md): React Context architecture (`AuthContext`, `TravelContext`), cache management, and data-fetching patterns.
* [**DESIGN_SYSTEM.md**](docs/DESIGN_SYSTEM.md): Stripe Design System token specifications, typography scales, contrast rules, and semantic colors.
* [**COMPONENTS_GUIDE.md**](docs/COMPONENTS_GUIDE.md): UI component standards, layout shells, form controllers, and modal dialogs.

