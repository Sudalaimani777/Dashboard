# TripFlow Backend Service

The core REST API and governance backend service for **TripFlow**, an enterprise corporate travel authorization, manager audit, and expense reimbursement platform. Built with **Node.js**, **Express 5**, **TypeScript**, and **PostgreSQL**.

---

## 🚀 Core Architecture & Governance Engine

TripFlow enforces an auditable, multi-tier approval state machine for corporate travel compliance:

```mermaid
flowchart TD
    subgraph Upcoming["Case 1: Upcoming Travel (Pre-Trip Clearance)"]
        U_E["Employee (Submission)"] -->|"Submit Plan & Estimates"| U_M["Line Manager (Tier 1)"]
        U_M -->|"Request Revision"| U_E
        U_M -->|"Approve & Forward"| U_A["Admin / Finance (Tier 2)"]
        U_A -->|"Route A: Revise via Manager"| U_M
        U_A -->|"Route B: Revise to Employee"| U_E
        U_E -->|"Resubmit (Strict Re-routing)"| U_M
        U_A -->|"Grant Clearance"| U_APP["APPROVED (Cleared for Booking)"]
    end

    subgraph Past["Case 2: Already Travelled (Post-Trip Reimbursement)"]
        P_E["Employee (Submission)"] -->|"Submit Actuals & Receipts"| P_M["Line Manager (Tier 1)"]
        P_M -->|"Request Revision"| P_E
        P_M -->|"Approve & Forward"| P_A["Admin / Finance (Tier 2)"]
        P_A -->|"Route A: Revise via Manager"| P_M
        P_A -->|"Route B: Revise to Employee"| P_E
        P_E -->|"Resubmit (Strict Re-routing)"| P_M
        P_A -->|"Authorize Payout"| P_SET["SETTLED (Reimbursement Disbursed)"]
    end
```

### Key Governance Invariants
1. **Strict Manager Re-routing Invariant**: When an Admin requests revisions directly from an employee (Route B: `REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE`), the employee's resubmission **MUST re-route to the Line Manager** (`PENDING_MANAGER_REVIEW`). Employees cannot bypass Line Managers directly to Admin approval.
2. **Dual Terminal States**:
   - `APPROVED`: Pre-trip upcoming travel is authorized and cleared for tickets/hotel booking.
   - `SETTLED`: Post-trip reimbursement has been audited, validated against receipts, and disbursed.
3. **Immutable Audit Ledger**: Every action, status transition, remark, and rejection is recorded with timestamp and actor details in `request_timeline_events`.
4. **Real-Time Department Budget Headroom**: Travel requests are audited against departmental quarterly budgets (`department_budgets`), ensuring financial allocations are not exceeded.

---

## 🛠️ Tech Stack & Services

| Component | Technology | Version / Details |
| :--- | :--- | :--- |
| **Runtime** | Node.js | v20+ (ES Modules) |
| **Framework** | Express | v5.3.0 |
| **Language** | TypeScript | v5.8.2 |
| **Database** | PostgreSQL | `pg` v8.13.3 connection pooling |
| **File Storage** | Cloudinary & Multer | Multi-proof receipt uploads with local `/uploads` static fallback |
| **Authentication** | JWT (`jsonwebtoken`) | `HttpOnly, SameSite=Lax` cookies with optional Bearer header fallback |
| **Cryptography** | `bcryptjs` & `crypto` | Password hashing (salt rounds: 10) & SHA-256 password recovery tokens |
| **Email Service** | Nodemailer | Transactional email dispatch with Ethereal fallback in development |
| **Runtime Tooling** | `tsx` | TypeScript execution and hot-reload development server |

---

## 📁 Directory Structure

```
server/
├── docs/
│   ├── API.md                                   # Comprehensive REST API endpoint reference
│   ├── DATABASE.md                              # PostgreSQL schema, tables, and relationships
│   └── *.json                                   # Importable Postman collections
├── src/
│   ├── config/
│   │   └── env.ts                               # Type-safe environment configuration
│   ├── features/
│   │   ├── auth/                                # Authentication & Account Recovery
│   │   │   ├── auth.controller.ts               # Signin, signup, signout, reset password handlers
│   │   │   ├── auth.repository.ts               # User queries, password digest updates
│   │   │   ├── auth.routes.ts                   # /api/auth route definitions
│   │   │   ├── auth.service.ts                  # Password hashing, token generation, email alerts
│   │   │   └── auth.types.ts                    # DTOs, interfaces, and user sessions
│   │   ├── travel/                              # Corporate Travel & Expense Governance
│   │   │   ├── travel.controller.ts             # Travel request, audit review, and budget handlers
│   │   │   ├── travel.repository.ts             # Complex transactional SQL queries, budget updates
│   │   │   ├── travel.routes.ts                 # /api/travel route definitions & role guards
│   │   │   ├── travel.service.ts                # State machine execution, timeline logging, calculations
│   │   │   ├── travel.types.ts                  # Status enums, state machine transitions, types
│   │   │   └── travel.validation.ts             # Comprehensive validation schemas (dates, phones, amounts)
│   │   └── users/                               # User & Governance Administration
│   │       ├── users.controller.ts              # User CRUD, status toggling, deletion
│   │       ├── users.repository.ts              # User administration SQL queries
│   │       ├── users.routes.ts                  # /api/users routes (Admin-restricted)
│   │       ├── users.service.ts                 # User creation, lifecycle updates, safeguards
│   │       ├── users.types.ts                   # User management interfaces
│   │       └── users.validation.ts              # User input validation
│   ├── shared/
│   │   ├── db/
│   │   │   ├── migrations/                      # Ordered SQL migration files
│   │   │   ├── migrate.ts                       # Automated migration runner script
│   │   │   └── pool.ts                          # PostgreSQL connection pool singleton
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts               # JWT cookie/header session extractor & guard
│   │   │   ├── error.middleware.ts              # Centralized JSON error response handler
│   │   │   ├── role.middleware.ts               # Role-based access control (RBAC) guard
│   │   │   └── upload.middleware.ts             # Multer memory/file buffer upload handler
│   │   ├── services/
│   │   │   ├── cloudinary.service.ts            # Cloudinary asset uploader & document manager
│   │   │   └── email.service.ts                 # Nodemailer email dispatcher with template formatting
│   │   └── utils/
│   │       └── response.ts                      # Standardized API response envelopes
│   ├── app.ts                                   # Express application setup, middleware pipeline, routes
│   └── index.ts                                 # HTTP server listener bootstrap
├── tests/                                       # Comprehensive backend test suites
├── reset-db.ts                                  # Database truncation and seed utility
├── set-role.ts                                  # Administrative role assignment CLI script
├── test-day1.ts                                 # Day 1 auth verification suite
├── test-day2-backend.ts                         # Day 2 password recovery test suite
├── test-e2e-full-flow.ts                        # End-to-end full lifecycle verification suite
└── package.json                                 # Scripts and dependencies
```

---

## 🗄️ Database Architecture & Migrations

TripFlow manages its database schema using idempotent SQL migration scripts located in [src/shared/db/migrations/](src/shared/db/migrations/):

1. **`001_create_users_table.sql`**:
   - `users`: Core account identity, email, password hash, SHA-256 password recovery tokens, and timestamps.
2. **`002_create_travel_governance_tables.sql`**:
   - Alters `users` with `role` (`EMPLOYEE`, `MANAGER`, `ADMIN`), `department`, and `manager_id` foreign key.
   - `department_budgets`: Quarterly financial allocations (`total_allocation`, `utilized_amount`) by department, fiscal year, and quarter.
   - `travel_requests`: Central travel entity with travel type (`UPCOMING` or `ALREADY_TRAVELLED`), itinerary logistics, emergency contact, total expenses, status, and audit remarks.
   - `travel_expenses`: Itemized line items categorized into `FLIGHT`, `HOTEL`, `MEALS_PER_DIEM`, `TRANSIT`, or `MISC` with merchant and amount.
   - `request_timeline_events`: Immutable audit trail recording each state change, actor role, and reviewer notes.
3. **`003_add_supporting_docs.sql`**:
   - Adds `supporting_docs` JSONB column with GIN index to `travel_requests` for multi-proof attachment management (receipts, tickets, quotes).
4. **`004_add_user_lifecycle.sql`**:
   - Adds `is_active` boolean column and index to `users` for account deactivation and governance lifecycle.

For complete schema details and ER relationships, see 👉 [**server/docs/DATABASE.md**](docs/DATABASE.md).

---

## 📡 API Endpoints Overview

All endpoints return standardized JSON envelopes (`{ success: true, message: "...", data: {} }`).

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Public | Account registration (pre-flight checks) |
| `POST` | `/api/auth/signin` | Public | Authenticates credentials and issues HttpOnly JWT cookie |
| `POST` | `/api/auth/signout` | Public | Clears authentication session cookie |
| `POST` | `/api/auth/forgot-password` | Public | Dispatches 1-hour password recovery token via email |
| `POST` | `/api/auth/reset-password` | Public | Updates password using validated SHA-256 token |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current authenticated user profile & role |

### 2. Travel & Governance (`/api/travel`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/travel/upload` | Authenticated | Uploads receipt/quotation proof to Cloudinary |
| `POST` | `/api/travel/requests` | Authenticated | Submits new travel request (Upcoming or Already Travelled) |
| `GET` | `/api/travel/requests` | Authenticated | Returns user travel requests (scoped by role and user ID) |
| `GET` | `/api/travel/requests/:id` | Authenticated | Retrieves comprehensive request details, expenses & timeline |
| `POST` | `/api/travel/requests/:id/manager-review` | Manager / Admin | Line manager review (Approve & Forward, Request Changes, Reject) |
| `POST` | `/api/travel/requests/:id/admin-review` | Admin | Admin clearance (Approve, Settle, Reject, or Route A/B Revise) |
| `POST` | `/api/travel/requests/:id/resubmit` | Authenticated | Employee resubmits altered request (re-routes to Manager) |
| `POST` | `/api/travel/requests/:id/cancel` | Authenticated | Cancels a draft or pending travel request |
| `GET` | `/api/travel/manager-queue` | Manager / Admin | Retrieves pending review queue for subordinates |
| `GET` | `/api/travel/admin-queue` | Admin | Retrieves corporate clearance and settlement queue |
| `GET` | `/api/travel/budgets` | Authenticated | Retrieves department budget allocation for a given quarter |
| `GET` | `/api/travel/budgets/overview` | Admin | Comprehensive multi-quarter department budget ledger |
| `PUT` | `/api/travel/budgets` | Admin | Creates or updates quarterly department budget allocation |

### 3. User Administration (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Admin | Lists all corporate users, roles, and status |
| `POST` | `/api/users` | Admin | Provisions a new user account with role and department |
| `PATCH` | `/api/users/:id/status` | Admin | Activates or deactivates user access (`is_active`) |
| `PATCH` | `/api/users/:id` | Admin | Updates user name, department, or manager assignment |
| `DELETE` | `/api/users/:id` | Admin | Deletes user account with cascade and safety checks |

### 4. Health Check
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Returns database connection status and server timestamp |

For request/response payloads and error schemas, see 👉 [**server/docs/API.md**](docs/API.md).

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the `server/` root directory:

```env
# Application Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# PostgreSQL Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/tripflow
# Or separate credentials:
# PGHOST=localhost
# PGPORT=5432
# PGDATABASE=tripflow
# PGUSER=postgres
# PGPASSWORD=password

# JWT Session Security
JWT_SECRET=super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Email & Notifications (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="TripFlow <noreply@tripflow.com>"

# Cloudinary Multi-Proof Document Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🏁 Getting Started

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Run Database Migrations
Execute all schema migrations in sequence:
```bash
npm run migrate
```

### 3. Start Development Server
```bash
npm run dev
```
The API server will listen on `http://localhost:5000`.

### 4. Administrative Utilities
- **Reset Database**: Clears all tables and applies migrations from scratch:
  ```bash
  npm run db:reset
  ```
- **Set User Role**: Promotes or updates a user's role:
  ```bash
  npm run set-role <email> <EMPLOYEE|MANAGER|ADMIN>
  ```

---

## 🧪 Verification & Test Suites

The backend service is backed by automated test suites validating business rules, database transactions, and the state machine:

```bash
# 1. State machine & transition invariants (100% pass)
npm run test:fsm

# 2. Database migration integrity
npm run test:migration

# 3. Travel repository & transaction rollbacks
npm run test:repo

# 4. Travel service logic & budget calculations
npm run test:service

# 5. Travel API endpoints & RBAC enforcement
npm run test:api

# 6. Date validation & timezone handling
npm run test:dates

# 7. Authentication & full lifecycle suites
npm test              # Day 1 Auth & DB
npm run test:day2     # Day 2 Password recovery & SHA-256 tokens
npm run test:e2e      # Full end-to-end lifecycle verification
```
