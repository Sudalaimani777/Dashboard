# TripFlow Full-Stack Architecture

This document describes the end-to-end system architecture, two-tier governance state machine, database schemas, security model, and component lifecycles for the **TripFlow** Corporate Travel & Expense Governance platform.

---

## 🏛️ System Overview & High-Level Topology

TripFlow is an enterprise-grade corporate travel authorization, manager audit, and expense governance platform. It couples a responsive client built with **React 19**, **Vite 8**, **Tailwind CSS v4**, and the **Stripe Design System** to a modular backend service powered by **Node.js**, **Express 5**, **TypeScript**, and **PostgreSQL**.

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 19 + Vite 8 @ Port 5173)"]
        UI["Stripe Design System UI\n(Plus Jakarta Sans + JetBrains Mono)"]
        Router["React Router 7 (Lazy-Loaded AppRoutes)"]
        State["Context Providers\n(AuthContext & TravelContext)"]
        HTTP["Axios Client\n(withCredentials: true)"]
    end

    subgraph Server ["Server Layer (Express 5 + TypeScript @ Port 5000)"]
        Pipeline["Middleware Pipeline\n(CORS, CookieParser, Multer, ErrorHandler)"]
        Guards["Access Control Guards\n(requireAuth, requireRole)"]
        Controllers["Feature Controllers\n(Auth, Travel, Users)"]
        Services["Business Domain Services\n(TravelService, AuthService, CloudinaryService)"]
        Repos["Repository Layer\n(Parameterized SQL Queries & Transactions)"]
    end

    subgraph Persistence ["Persistence, Storage & Notifications"]
        PG[("PostgreSQL Database\n(pg Connection Pool)")]
        Cloudinary["Cloudinary Storage\n(Multi-Proof Receipts & Quotations)"]
        SMTP["SMTP Mailer\n(Nodemailer / Gmail / Ethereal)"]
    end

    UI --> Router --> State --> HTTP
    HTTP -- "HTTP / REST (Cookies + JSON)" --> Pipeline
    Pipeline --> Guards --> Controllers
    Controllers --> Services --> Repos --> PG
    Services --> Cloudinary
    Services --> SMTP
```

---

## 🧭 Two-Tier Governance State Machine & Core Invariants

TripFlow implements an auditable two-tier state machine to enforce corporate spending policy, manager operational oversight, and executive financial clearance.

### Dual Operational Lifecycles
The system accommodates two distinct travel cases with differentiated terminal states:
1. **Case 1: Upcoming Travel (Pre-Trip Clearance)**:
   - Employees submit proposed itineraries, business justifications, and itemized estimated expenses accompanied by quotation proofs.
   - Approval by Tier 1 (Line Manager) and Tier 2 (Admin) grants travel clearance, resulting in the terminal state `APPROVED`.
2. **Case 2: Already Travelled (Post-Trip Reimbursement)**:
   - Employees submit completed trip details, actual expenses incurred, and proof receipts.
   - Verification through both tiers authorizes financial payout, resulting in the terminal state `SETTLED`.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Initialize Request
    DRAFT --> PENDING_MANAGER_REVIEW : Employee Submits

    state "Tier 1: Line Manager Audit" as Tier1 {
        PENDING_MANAGER_REVIEW --> REVISION_REQUESTED_BY_MANAGER : Manager Requests Changes
        REVISION_REQUESTED_BY_MANAGER --> PENDING_MANAGER_REVIEW : Employee Resubmits Alterations
        PENDING_MANAGER_REVIEW --> REJECTED : Manager Denies
    }

    PENDING_MANAGER_REVIEW --> PENDING_ADMIN_APPROVAL : Manager Approves & Escalates

    state "Tier 2: Admin & Finance Governance" as Tier2 {
        PENDING_ADMIN_APPROVAL --> REVISION_REQUESTED_BY_ADMIN_TO_MANAGER : Admin Route A (via Manager)
        REVISION_REQUESTED_BY_ADMIN_TO_MANAGER --> REVISION_REQUESTED_BY_MANAGER : Manager Forwards to Employee
        REVISION_REQUESTED_BY_ADMIN_TO_MANAGER --> PENDING_ADMIN_APPROVAL : Manager Clarifies Directly

        PENDING_ADMIN_APPROVAL --> REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE : Admin Route B (Direct to Employee)
        PENDING_ADMIN_APPROVAL --> REJECTED : Admin Denies
        PENDING_ADMIN_APPROVAL --> APPROVED : Upcoming Travel Cleared
        PENDING_ADMIN_APPROVAL --> SETTLED : Past Reimbursement Disbursed
    }

    %% Core Architectural Invariant
    REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE --> PENDING_MANAGER_REVIEW : Employee Resubmits (Strict Re-routing)

    DRAFT --> CANCELLED : Employee Cancels
    REVISION_REQUESTED_BY_MANAGER --> CANCELLED : Employee Cancels
    REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE --> CANCELLED : Employee Cancels

    APPROVED --> [*]
    SETTLED --> [*]
    REJECTED --> [*]
    CANCELLED --> [*]
```

### Core Architectural Invariants
1. **Strict Manager Re-routing Invariant**:
   - When an Admin requests revisions directly from an employee (**Route B**: `REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE`), upon resubmission, the request **MUST return to the Line Manager first** (`PENDING_MANAGER_REVIEW`).
   - An employee can **never bypass** their direct manager directly to Admin review. The state transition `REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE -> PENDING_ADMIN_APPROVAL` is strictly forbidden by the domain state validator.
2. **Immutable Audit Ledger**:
   - Every state transition, reviewer comment, and rejection reason is appended to `request_timeline_events`. Existing events cannot be altered or deleted.
3. **Budget Headroom Validation**:
   - When reviewing requests, admins evaluate real-time utilization against quarterly departmental budgets (`department_budgets`), ensuring allocation ceilings are maintained.
4. **Currency Standardization**:
   - All financial figures are denominated in Indian Rupees (`INR` / `₹`) and rendered using monospace tabular numbers (`font-mono tabular-nums`).

---

## 📂 Frontend Layer Architecture (`client/src/`)

The client is built using a **Feature-Sliced Architecture** with strict modular isolation:

```
client/src/
├── features/
│   ├── auth/                                    # Authentication & Recovery Module
│   │   ├── components/                          # SignInCard, ForgotPasswordCard, ResetPasswordCard, PasswordStrengthMeter
│   │   ├── context/                             # AuthContext & Session Provider
│   │   ├── hooks/                               # useAuth hook
│   │   ├── schemas/                             # Zod validation schemas
│   │   └── services/                            # Axios API client (authApi)
│   ├── dashboard/                               # Dynamic Role Dashboard
│   │   ├── utils/                               # Avatar & initial generators
│   │   └── DashboardPage.tsx                    # Role-based workspace switcher (Employee, Manager, Admin)
│   ├── travel/                                  # Corporate Travel & Governance Module
│   │   ├── components/
│   │   │   ├── forms/                           # DynamicExpenseTable, ExpenseRowItem, ProofAttachmentField, PhoneInputWithCountry, CloneTripDropdown
│   │   │   ├── shared/                          # TravelMetricsGrid, RouteLabel, TravelDetailSkeleton, InlineConfirmBar
│   │   │   ├── AdminGovernancePortal.tsx        # Clearance queue, budget metrics, and user management tabs
│   │   │   ├── EmployeeTravelPortal.tsx         # Active trips, draft controls, and spend analytics tabs
│   │   │   ├── ManagerQueuePortal.tsx           # Subordinate review queue and revision dispatch
│   │   │   ├── DepartmentBudgetCard.tsx         # Department quarterly allocation summary
│   │   │   ├── DepartmentCategoryBreakdownCard.tsx # Recharts pie/donut category breakdown
│   │   │   ├── DepartmentSpendersVelocityCard.tsx  # Recharts top spenders bar chart
│   │   │   └── TravelStatusBadge.tsx            # High-contrast status pill badges
│   │   ├── context/                             # TravelContext (active requests, optimistic caching)
│   │   ├── hooks/                               # useTravel custom hook
│   │   ├── layout/                              # DashboardLayout, DynamicRoleSidebar, SidebarNavItem, SidebarUserProfile
│   │   ├── pages/                               # Full-Page Workstations
│   │   │   ├── DepartmentBudgetsPage.tsx        # Multi-quarter department budget workstation
│   │   │   ├── EmployeeSpendAnalyticsPage.tsx   # Employee spend analytics charts
│   │   │   ├── ManagerTeamAnalyticsPage.tsx     # Manager team spend analytics workstation
│   │   │   ├── NewTravelRequestPage.tsx         # Request creation workstation
│   │   │   ├── ResubmitTravelRequestPage.tsx     # Request revision workstation
│   │   │   └── TravelDetailPage.tsx             # Detailed inspection & audit workstation
│   │   ├── services/                            # travel.api.ts
│   │   ├── types/                               # TypeScript domain contracts
│   │   └── utils/                               # Currency, dial codes, budget analytics
│   └── users/                                   # User Administration Module
│       ├── components/                          # UserFormModal (create/edit user)
│       ├── pages/                               # AdminUsersPage, NewUserPage
│       ├── schemas/                             # Zod user schemas
│       ├── services/                            # users.api.ts
│       └── utils/                               # User helper formatting functions
├── routes/
│   ├── AppRoutes.tsx                            # Route registration with lazy code splitting
│   └── ProtectedRoute.tsx                       # Session & role route protection gates
├── shared/
│   ├── components/ui/                           # Primitives (button, input, card, alert, chart, label, password-input)
│   └── utils/                                   # cn class merger
├── App.tsx                                      # Root component with AuthProvider & TravelProvider
├── index.css                                    # Tailwind v4 configuration, font imports & Stripe tokens
└── main.tsx                                     # Application bootstrapping
```

### Key Frontend Architectural Patterns
1. **Dynamic Workspace Orchestration (`DashboardPage.tsx`)**:
   Instead of static disjointed pages, `/dashboard` reads the authenticated user's role and dynamically mounts the appropriate workspace (`EmployeeTravelPortal`, `ManagerQueuePortal`, or `AdminGovernancePortal`), supporting tab switches to spend analytics without full page reloads.
2. **Workstation Pattern**:
   Complex multi-step actions (e.g., creating a travel request, resubmitting a revised journey, or provisioning users) are separated into dedicated full-page workstations (`/travel/new`, `/travel/requests/:id/edit`, `/admin/users/new`) to ensure maximum focus and prevent form state loss.
3. **Stripe Design System Tokens**:
   - Palette: Cool canvas (`#F2F7FE`), card surfaces (`#FFFFFF`), primary blurple (`#533AFD`), text ink (`#061B31`), and strong hairline borders (`#CBD5E1`).
   - Typography: **Plus Jakarta Sans** for UI readability and **JetBrains Mono** for financial figures (`INR` / `₹`).
   - 5-tier elevation system (`--shadow-xs` to `--shadow-xl`) and 5 border radii (`--radius-xs` to `--radius-full`).

---

## 🗃️ Backend Layer Architecture (`server/src/`)

The backend follows an enterprise **Controller-Service-Repository** pattern with strict transactional integrity:

```
[Incoming HTTP Request]
         │
         ▼
[Express Router]               --> Verifies path & applies route-specific middleware
         │
         ▼
[Guards & Middleware]          --> requireAuth (JWT verify) & requireRole (RBAC)
         │
         ▼
[Feature Controller]           --> Validates payload with Zod & sends JSON responses
         │
         ▼
[Domain Service]               --> Enforces state machine transitions, business logic & budget checks
         │
         ▼
[Repository Layer]             --> Executes parameterized SQL & database transactions (pg pool)
         │
         ▼
[PostgreSQL Database]          --> Persists entities, constraints, and audit timeline
```

### Middleware Pipeline (`server/src/app.ts`)
- **CORS**: Configured with origin binding and `credentials: true`.
- **Cookie Parser**: Extracts signed `HttpOnly` session tokens.
- **Multer Middleware (`upload.middleware.ts`)**: Handles multipart file uploads in memory for direct streaming to Cloudinary.
- **Centralized Error Handler (`error.middleware.ts`)**: Intercepts unhandled exceptions and formats standard JSON error envelopes.

---

## 🗄️ Database Architecture & Data Schema

TripFlow relies on PostgreSQL 14+ for relational integrity, check constraints, foreign keys, and JSONB indexing:

```mermaid
erDiagram
    users ||--o{ travel_requests : "submits"
    users ||--o{ travel_requests : "audits (as manager)"
    users ||--o{ travel_requests : "clears (as admin)"
    travel_requests ||--|{ travel_expenses : "contains"
    travel_requests ||--|{ request_timeline_events : "logs"
    department_budgets ||--o{ travel_requests : "allocates"

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar first_name
        varchar last_name
        varchar role "EMPLOYEE | MANAGER | ADMIN"
        varchar department
        uuid manager_id FK
        boolean is_active "Default true"
        varchar reset_token_hash
        timestamptz reset_token_expires_at
        timestamptz created_at
        timestamptz updated_at
    }

    department_budgets {
        uuid id PK
        varchar department
        int fiscal_year
        varchar fiscal_quarter
        numeric total_allocation "Default ₹35,00,000.00"
        numeric utilized_amount "Default ₹0.00"
        timestamptz created_at
        timestamptz updated_at
    }

    travel_requests {
        uuid id PK
        uuid user_id FK
        uuid manager_id FK
        uuid admin_id FK
        varchar travel_type "UPCOMING | ALREADY_TRAVELLED"
        varchar title
        text purpose
        varchar project_code
        varchar origin
        varchar destination
        date departure_date
        date return_date
        varchar emergency_contact_name
        varchar emergency_contact_phone
        jsonb supporting_docs "Multi-proof receipts & quotations"
        numeric total_expenses "₹ INR"
        varchar status "10-state lifecycle enum"
        varchar revision_target "MANAGER | EMPLOYEE"
        text manager_remarks
        timestamptz manager_reviewed_at
        text admin_remarks
        timestamptz admin_reviewed_at
        varchar currency "INR"
        timestamptz created_at
        timestamptz updated_at
    }

    travel_expenses {
        uuid id PK
        uuid travel_request_id FK
        varchar category "FLIGHT | HOTEL | MEALS_PER_DIEM | TRANSIT | MISC"
        varchar merchant
        numeric amount "₹ INR"
        date expense_date
        varchar receipt_image_url
        text notes
        timestamptz created_at
    }

    request_timeline_events {
        uuid id PK
        uuid travel_request_id FK
        uuid actor_id FK
        varchar actor_role
        varchar event_type
        varchar from_status
        varchar to_status
        text remarks
        timestamptz created_at
    }
```

### Multi-Proof Attachment Hub (`supporting_docs` JSONB)
Rather than limiting requests to a single URL string, migration `003` introduced a `supporting_docs` `JSONB` column indexed via a PostgreSQL **GIN index** (`idx_travel_requests_supporting_docs`). The stored structure follows this contract:

```json
[
  {
    "id": "a5e927c3-3e11-482a-9669-e054f15d9092",
    "type": "FILE",
    "name": "indigo-flight-tax-invoice.pdf",
    "url": "https://res.cloudinary.com/tripflow/image/upload/v12345/proof.pdf",
    "uploadedAt": "2026-11-18T10:00:00.000Z"
  }
]
```

---

## 🔄 End-to-End Sequence Diagrams

### Sequence 1: Travel Request Creation & Multi-Proof Upload

```mermaid
sequenceDiagram
    autonumber
    actor Employee as Employee (Browser)
    participant Client as React Client (/travel/new)
    participant Server as Express Server
    participant Cloudinary as Cloudinary API
    participant DB as PostgreSQL

    Employee->>Client: Attaches quotation/receipt PDF/image
    Client->>Server: POST /api/travel/upload (multipart/form-data)
    Server->>Cloudinary: Streams file buffer to Cloudinary
    Cloudinary-->>Server: Returns secure HTTPS asset URL
    Server-->>Client: 200 OK { url, name, id }
    Client->>Client: Updates supporting_docs state & recalculates totals
    Employee->>Client: Completes logistics & clicks "Submit Request"
    Client->>Server: POST /api/travel/requests { itinerary, expenses, supportingDocs }
    Server->>Server: Validate payload (dates, categories, amounts in INR)
    Server->>DB: BEGIN TRANSACTION
    Server->>DB: INSERT INTO travel_requests (status = 'PENDING_MANAGER_REVIEW')
    Server->>DB: INSERT INTO travel_expenses (bulk line items)
    Server->>DB: INSERT INTO request_timeline_events (event = 'SUBMITTED')
    Server->>DB: COMMIT TRANSACTION
    Server-->>Client: 201 Created { request }
    Client->>Client: Navigates to /dashboard with confirmation banner
```

### Sequence 2: Two-Tier Review, Admin Route B Revision, & Strict Re-routing

```mermaid
sequenceDiagram
    autonumber
    actor Manager as Line Manager
    actor Admin as Admin / Finance
    actor Employee as Employee
    participant Server as Express Server
    participant DB as PostgreSQL

    Note over Manager, DB: Tier 1: Line Manager Audit
    Manager->>Server: POST /api/travel/requests/:id/manager-review { action: "APPROVE_AND_FORWARD" }
    Server->>DB: UPDATE travel_requests SET status = 'PENDING_ADMIN_APPROVAL'
    Server->>DB: INSERT INTO request_timeline_events (to_status = 'PENDING_ADMIN_APPROVAL')
    Server-->>Manager: 200 OK

    Note over Admin, DB: Tier 2: Admin Direct Revision Request (Route B)
    Admin->>Server: POST /api/travel/requests/:id/admin-review { action: "REQUEST_REVISION", target: "EMPLOYEE", remarks: "Please upload hotel invoice" }
    Server->>DB: UPDATE travel_requests SET status = 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE', revision_target = 'EMPLOYEE'
    Server->>DB: INSERT INTO request_timeline_events (remarks = "Please upload hotel invoice")
    Server-->>Admin: 200 OK

    Note over Employee, DB: Core Invariant: Employee Resubmission Strictly Re-Routes to Manager
    Employee->>Server: POST /api/travel/requests/:id/resubmit { updatedExpenses, remarks: "Uploaded invoice" }
    Server->>Server: Validate state transition: REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE -> PENDING_MANAGER_REVIEW
    Server->>DB: BEGIN TRANSACTION
    Server->>DB: UPDATE travel_requests SET status = 'PENDING_MANAGER_REVIEW', revision_target = NULL
    Server->>DB: INSERT INTO request_timeline_events (event = 'RESUBMITTED', to_status = 'PENDING_MANAGER_REVIEW')
    Server->>DB: COMMIT TRANSACTION
    Server-->>Employee: 200 OK (Re-routed to Manager queue)
```

---

## 🔐 Security, Session & Authorization Model

1. **HttpOnly Cookie Architecture**:
   - Authentication tokens are delivered via `HttpOnly`, `SameSite=Lax` cookies, preventing XSS-based token theft.
   - Cross-Origin Resource Sharing (CORS) is bound to `CLIENT_URL` with credentials explicitly enabled.
2. **Role-Based Access Control (RBAC)**:
   - Routes are gated using `requireAuth` and `requireRole(['MANAGER', 'ADMIN'])` middleware.
   - Users can only view requests they own, requests of subordinates they manage, or all company requests if assigned the `ADMIN` role.
3. **Cryptographic Password Recovery**:
   - Raw tokens are 32-byte cryptographically secure random values (`crypto.randomBytes`).
   - Stored in PostgreSQL strictly as **SHA-256 digests**. A database leak does not expose valid reset tokens.
   - Enforces a 1-hour expiration window and single-use invalidation.
   - Implements anti-enumeration (identical calm response whether the email exists or not).
4. **Governance Lifecycle & Erasure Safeguards**:
   - Accounts carry an `is_active` flag. Deactivated users are blocked by authentication middleware.
   - Admin user deletion requires explicit confirmation and handles database cascading cleanly.

---

## 📊 Complete Technology Matrix

| Concern | Client Layer | Server Layer | Infrastructure / Persistence |
| :--- | :--- | :--- | :--- |
| **Language** | TypeScript 5.8 / 7.0 | TypeScript 5.8.2 | SQL (PostgreSQL 14+) |
| **Framework / Runtime** | React 19.3.1 / Vite 8.3.5 | Express 5.3.0 / Node.js 20+ | Node.js runtime (`tsx`) |
| **Design System & Styling** | Tailwind CSS v4 (Stripe System) | N/A | N/A |
| **Typography** | Plus Jakarta Sans & JetBrains Mono | N/A | Google Fonts Preconnect |
| **Routing** | React Router 7.18.5 | Express Router 5.3.0 | N/A |
| **Data Visualization** | Recharts 3.10.1 | N/A | N/A |
| **Form Validation** | Zod 4.6.7 & React Hook Form | Zod / Type validators | SQL Constraints (`CHECK`, `FK`) |
| **File Storage** | Axios Multipart Upload | Multer 2.5.0 (Memory Stream) | Cloudinary API & Local Disk |
| **Database Access** | Axios REST Client | `pg` 8.13.3 Connection Pool | PostgreSQL 14+ |
| **Authentication** | HttpOnly Cookies & AuthContext | JWT (`jsonwebtoken` 9.0.3) | SHA-256 digested reset tokens |
| **Password Security** | PasswordStrengthMeter component | `bcryptjs` (10 rounds) | Bcrypt hashes in database |
| **Email Service** | N/A | Nodemailer 10.3.1 | SMTP / Gmail / Ethereal |
| **Testing Engine** | Standalone assertion suites | TSX assertion test suites | 47 FSM & validation tests |
