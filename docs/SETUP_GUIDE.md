# TripFlow Local Development & Administrator Setup Guide

> **Comprehensive Setup, Configuration, Database Migration, and Operational Guide**  
> *Target System:* TripFlow Corporate Travel & Expense Governance Platform  
> *Node.js Runtime:* v20.0+ | *Database:* PostgreSQL 14+ | *Frontend:* React 19 + Vite 8

---

## 🧭 1. Overview & System Topology

TripFlow is structured as a full-stack TypeScript workspace with clear separation of concerns between client and server layers:

```
TripFlow/
├── client/                               # Frontend Single Page App (React 19 + Vite 8 + Tailwind v4)
│   ├── src/                              # Feature-sliced UI components, hooks, contexts, routes
│   ├── tests/                            # Standalone UI assertion test suites
│   ├── package.json                      # Client dependencies & scripts
│   └── vite.config.ts                    # Vite build configuration & server proxy
├── server/                               # Backend Service (Node.js 20+ + Express 5 + PostgreSQL)
│   ├── src/                              # Features, controllers, services, repositories, middleware
│   │   ├── config/env.ts                 # Type-safe environment variable mapping
│   │   └── shared/db/                    # Connection pool, migrate runner, SQL migrations
│   ├── tests/                            # FSM, repository, service, and API test suites
│   ├── .env.example                      # Server environment template
│   └── package.json                      # Server dependencies & test scripts
└── docs/                                 # Architectural and governance specifications
```

---

## 💻 2. Prerequisites & System Requirements

Before setting up TripFlow, ensure your workstation meets the following minimum prerequisites:

| Requirement | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v20.0.0` | `v22.x LTS` | Requires native ESM and `node:crypto` support. |
| **npm** | `v10.0.0` | `v10.8+` | Default package manager bundled with Node.js. |
| **PostgreSQL** | `v14.0` | `v16.x` | Relational engine with `JSONB` and GIN index support. |
| **Git** | `v2.30+` | Latest | Version control. |
| **Cloudinary** *(Optional)* | Free Tier | Active Cloud | Optional: system falls back gracefully to local disk storage. |
| **SMTP Provider** *(Optional)*| Ethereal / Gmail | Gmail App Password | Optional: system automatically provisions an Ethereal test inbox in development. |

---

## 🗄️ 3. PostgreSQL Database Provisioning

TripFlow requires an active PostgreSQL database instance.

### 3.1 Verify PostgreSQL Service
Ensure PostgreSQL is running locally on port `5432`:

```bash
# macOS (Homebrew)
brew services list
# Linux (systemd)
sudo systemctl status postgresql
# Windows (PowerShell)
Get-Service -Name postgresql*
```

### 3.2 Create Database
Log into PostgreSQL via the `psql` interactive terminal or pgAdmin:

```bash
psql -U postgres -h localhost
```

Execute the database creation statement:

```sql
-- Create database
CREATE DATABASE readventure;

-- Alternatively, create tripflow:
-- CREATE DATABASE tripflow;

-- Connect and verify database
\c readventure
\l
\q
```

---

## ⚙️ 4. Backend Service Configuration (`server/`)

The backend service is powered by **Express 5**, **TypeScript**, and **pg**.

### 4.1 Install Server Dependencies
Navigate into the `server/` directory and install npm packages:

```bash
cd server
npm install
```

### 4.2 Configure Environment Variables
Copy the template `.env.example` to create your local `.env`:

```bash
cp .env.example .env
```

Open `.env` in your editor and configure the parameters:

```ini
# ==========================================
# TripFlow Server Environment Configuration
# ==========================================

# 1. Server Network
PORT=5000
NODE_ENV=development

# 2. Database Connection
# Option A: Connection URI
DATABASE_URL=postgresql://postgres:admin@localhost:5432/readventure

# Option B: Discrete Parameters (used if DATABASE_URL is not set)
PGHOST=localhost
PGPORT=5432
PGDATABASE=readventure
PGUSER=postgres
PGPASSWORD=admin

# 3. Security & JWT Session
JWT_SECRET=super-secret-jwt-key-replace-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# 4. Client Application URL (for CORS and Password Reset Links)
CLIENT_URL=http://localhost:5173

# 5. Email Service (Nodemailer / SMTP)
# Leave blank to automatically use an ephemeral Ethereal test account
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_company_email@gmail.com
SMTP_PASS=your_google_app_password
EMAIL_FROM="TripFlow Corporate <no-reply@tripflow.com>"

# 6. Cloudinary Media Storage (Optional)
# Leave blank to automatically use local disk storage fallback
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Environment Variable Reference Matrix

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | `5000` | HTTP port on which the Express application listens. |
| `NODE_ENV` | String | `development` | Environment mode (`development`, `production`, `test`). |
| `DATABASE_URL` | String | `""` | Complete PostgreSQL connection string. |
| `PGHOST` | String | `localhost` | Fallback database host. |
| `PGPORT` | Number | `5432` | Fallback database port. |
| `PGDATABASE` | String | `readventure` | Fallback database name. |
| `PGUSER` | String | `postgres` | Database username. |
| `PGPASSWORD` | String | `admin` | Database password. |
| `JWT_SECRET` | String | *Required* | High-entropy secret key for HMAC SHA-256 JWT signing. |
| `JWT_EXPIRES_IN` | String | `7d` | Token validity duration (`1d`, `7d`, `24h`). |
| `CLIENT_URL` | String | `http://localhost:5173` | Allowed CORS origin and base URL for reset emails. |
| `SMTP_HOST` | String | `""` | SMTP mail server hostname. |
| `SMTP_PORT` | Number | `587` | SMTP port (typically `587` for STARTTLS, `465` for SSL). |
| `SMTP_USER` | String | `""` | SMTP authentication username. |
| `SMTP_PASS` | String | `""` | SMTP authentication password / App-specific password. |
| `EMAIL_FROM` | String | `"TripFlow <...>` | Default sender header in outgoing notification emails. |
| `CLOUDINARY_CLOUD_NAME` | String | `""` | Cloudinary account cloud name. |
| `CLOUDINARY_API_KEY` | String | `""` | Cloudinary API access key. |
| `CLOUDINARY_API_SECRET` | String | `""` | Cloudinary API secret key. |

---

### 4.3 Execute Database Migrations
TripFlow includes an automated SQL migration runner that tracks executed files in a `schema_migrations` table:

```bash
npm run migrate
```

#### Migration Execution Sequence:
1. **`001_create_users_table.sql`**: Provisions the `users` table, password hashing fields, and SHA-256 password recovery tokens.
2. **`002_create_travel_governance_tables.sql`**: Provisions `department_budgets`, `travel_requests`, `travel_expenses`, and `request_timeline_events`.
3. **`003_add_supporting_docs.sql`**: Introduces the `supporting_docs` JSONB multi-proof attachment column and its GIN index (`idx_travel_requests_supporting_docs`).
4. **`004_add_user_lifecycle.sql`**: Adds the `is_active` governance flag and index for user lifecycle state management.

```
Output:
Running database migrations...
Applying migration: 001_create_users_table.sql...
Applied migration: 001_create_users_table.sql
Applying migration: 002_create_travel_governance_tables.sql...
Applied migration: 002_create_travel_governance_tables.sql
Applying migration: 003_add_supporting_docs.sql...
Applied migration: 003_add_supporting_docs.sql
Applying migration: 004_add_user_lifecycle.sql...
Applied migration: 004_add_user_lifecycle.sql
All migrations applied successfully!
```

---

### 4.4 Seed Initial Data & Reset Database
To clear previous test data and initialize a clean quarterly budget allocation for the **Engineering** department:

```bash
npm run db:reset
```

This script:
- Truncates all business entities (`request_timeline_events`, `travel_expenses`, `travel_requests`, `users`).
- Initializes `department_budgets` with an initial allocation of **₹35,00,000.00** for **Engineering (2026 Q4)** with ₹0 utilized.
- Prints verified table row counts.

---

### 4.5 Start Backend Development Server
Run the backend with live reload powered by `tsx`:

```bash
npm run dev
```

*The server will boot and display:*
```
🚀 Server listening on port 5000 (development)
Cloudinary credentials missing in environment; using local uploads fallback.
📧 [EmailService] Ethereal test mailbox provisioned: example@ethereal.email
```

---

## 🎨 5. Frontend Client Configuration (`client/`)

The frontend is built with **React 19**, **Vite 8**, **Tailwind CSS v4**, and the **Stripe Design System**.

### 5.1 Install Frontend Dependencies
Open a second terminal window, navigate into `client/`, and install dependencies:

```bash
cd client
npm install
```

### 5.2 Start Vite Development Server
Run the Vite development server:

```bash
npm run dev
```

*The development server will launch on:*
```
  VITE v8.3.5  ready in 240 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser and navigate to `http://localhost:5173`. You will be directed to the TripFlow corporate sign-in portal.

---

## 👤 6. Initial User Provisioning & Role Assignment

TripFlow operates under a closed corporate directory model: **self-registration is disabled** via public endpoints for security compliance. Users are provisioned by an Administrator.

### 6.1 Creating the First Administrator Account
Use the built-in `set-role.ts` helper script or provision directly via database:

```bash
# In the server/ directory:
npx tsx set-role.ts admin@tripflow.com ADMIN
```

If the user does not yet exist in the database, you can insert an initial administrator using a brief seed script or PostgreSQL directly:

```sql
-- Connect to database
\c readventure

-- Insert initial Admin user (password: Admin@12345)
-- Bcrypt hash for 'Admin@12345' with 10 salt rounds:
INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  role,
  department,
  is_active
) VALUES (
  'admin@tripflow.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Corporate',
  'Administrator',
  'ADMIN',
  'Executive',
  true
);
```

### 6.2 Provisioning Team Members via the Admin UI
Once logged in as an Administrator:
1. Click the **User Directory** tab on `/dashboard`.
2. Click **Provision New User** (`/admin/users/new`).
3. Fill in user details:
   - **First & Last Name**: e.g., Jane Doe
   - **Email Address**: `jane.doe@tripflow.com`
   - **Role**: Select `EMPLOYEE`, `MANAGER`, or `ADMIN`
   - **Department**: e.g., `Engineering`, `Sales`, `Marketing`
   - **Line Manager**: Select the designated supervisor from the manager dropdown
4. Click **Save User Account**.

---

## 🧪 7. Verification & Automated Testing Suite

TripFlow features a comprehensive test suite covering the two-tier finite state machine, database transactions, API RBAC, and client UI components.

### 7.1 Backend Test Suites (`server/`)
Run individual or comprehensive test suites from the `server/` directory:

```bash
cd server

# 1. State Machine Transition Invariants (47 exhaustive test cases)
npm run test:fsm

# 2. Database Migration & Schema Integrity
npm run test:migration

# 3. Travel Repository & Transaction Rollback Behavior
npm run test:repo

# 4. Travel Domain Service Calculations & Constraints
npm run test:service

# 5. Travel API Endpoints & Role Guard Enforcement
npm run test:api

# 6. Date Boundaries & Timezone Offset Handling
npm run test:dates

# 7. End-to-End Governance Lifecycle Test
npm run test:e2e
```

#### Expected Output for State Machine Verification:
```
🧪 Running TripFlow State Machine & Validation Test Suite...
  ✔ Validates transitions: DRAFT -> PENDING_MANAGER_REVIEW
  ✔ Validates transitions: PENDING_MANAGER_REVIEW -> PENDING_ADMIN_APPROVAL
  ✔ Blocks forbidden: REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE -> PENDING_ADMIN_APPROVAL (Invariant 1)
  ✔ Enforces dual terminal states: UPCOMING -> APPROVED, ALREADY_TRAVELLED -> SETTLED
  ✔ Blocks self-approval by line managers
...
Passed: 47 / 47 tests (100% success rate)
```

### 7.2 Frontend Verification Suites (`client/`)
Verify design system tokens, color contrast, and form boundary logic:

```bash
cd client

# Verify Stripe design tokens & CSS custom properties
npx tsx tests/stripe-theme-tokens.test.ts

# Verify WCAG AA contrast ratios on canvas (#F2F7FE) and surfaces
npx tsx tests/stripe-contrast-readability.test.ts

# Verify date range restrictions and future/past validation
npx tsx tests/travel-form-date-validation.test.ts
npx tsx tests/expense-date-boundaries.test.ts

# Verify department budget Recharts analytics calculations
npx tsx tests/department-budget-redesign.test.ts
```

---

## 🩺 8. System Health Verification

Once both client and server are running, verify system connectivity:

### 8.1 API Health Check
Execute a GET request against the health endpoint:

```bash
curl -i http://localhost:5000/api/health
```

Expected Response:
```json
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-11-18T10:15:30.123Z",
  "version": "1.0.0"
}
```

### 8.2 Client Route Health Checklist
Log into `http://localhost:5173` and verify the primary workstations:

| Route | Role Access | Expected Workstation |
| :--- | :--- | :--- |
| `/dashboard` | `EMPLOYEE` | Employee Travel Portal (Active Trips, Drafts, Spend Velocity) |
| `/dashboard` | `MANAGER` | Manager Queue Portal (Subordinate Review Queue, Approvals) |
| `/dashboard` | `ADMIN` | Admin Governance Portal (Clearance Queue, Budget Ledger, Users) |
| `/travel/new` | All Roles | New Travel Request Workstation (Logistics, Proof Hub, Line Items) |
| `/travel/requests/:id` | Scoped Roles | Detailed Inspection, Receipt Carousel & Audit Timeline |
| `/admin/users/new` | `ADMIN` | User Provisioning Form Workstation |

---

## 🔧 9. Common Troubleshooting & FAQs

### Q1: `Error: connect ECONNREFUSED 127.0.0.1:5432`
- **Cause**: PostgreSQL is not running or is configured on a non-standard port.
- **Fix**: Check `pg_isready -h localhost -p 5432`. Verify your PostgreSQL service is active in system services.

### Q2: Dates are shifting by one day (Timezone Off-by-One)
- **Cause**: Standard JavaScript `Date` parsing converts UTC timestamps to local midnight, causing a 1-day backward shift in timezones ahead of UTC.
- **Solution**: TripFlow configures PostgreSQL's type parser for DATE types (OID 1082) in `server/src/shared/db/pool.ts` to return raw `YYYY-MM-DD` strings:
  ```typescript
  pg.types.setTypeParser(1082, (val: string) => val);
  ```
  Ensure all client date displays use `getLocalDateString()` rather than `.toISOString()`.

### Q3: `CORS policy: No 'Access-Control-Allow-Origin' header`
- **Cause**: The client URL origin does not match the server's `CLIENT_URL` environment setting.
- **Fix**: Check `server/.env`. Ensure `CLIENT_URL=http://localhost:5173` matches the exact port Vite is listening on (do not omit the protocol or add a trailing slash).

### Q4: Cookies are not being set on the browser during sign-in
- **Cause**: In `production` mode, the cookie option `secure: true` requires an HTTPS connection.
- **Fix**: For local development, ensure `NODE_ENV=development` in `server/.env`. This ensures `secure: false` is set on the `token` cookie so `localhost` accepts it over HTTP.

### Q5: Cloudinary credentials warning
- **Notice**: `Cloudinary credentials missing in environment; using local uploads fallback.`
- **Explanation**: This is normal behavior during local development. If `CLOUDINARY_*` variables are left blank, TripFlow automatically stores uploaded receipts in the local disk directory (`server/uploads/`) and serves them as static URLs. No features are broken.
