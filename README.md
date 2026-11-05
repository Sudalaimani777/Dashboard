# User Authentication Application (Readventure)

> A full-stack, production-grade User Authentication system built with **React**, **TypeScript**, **Node.js**, **Express**, and **PostgreSQL**, structured using **Feature-Based Architecture**.

---

## 📅 3-Day Implementation Timeline & Task Breakdown

Based on the project estimation and planning schedule (November 4, 2026 – November 6, 2026), the tasks are divided into three daily milestones totaling 21 hours:

| Date | Day | Category | Task Description | Estimated Hours | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **04/11/2026** | **Day 1** | UI Design & Planning | Wireframing for Landing, Sign-in, and Password Reset pages | 1.5 Hours | 🟡 In Progress |
| | | Setup | Setup (React.js, Node.js) and PostgreSQL initialization | 1.5 Hours | ✅ Completed |
| | | Backend | Database schema design and initial user table migrations | 2.0 Hours | ✅ Completed |
| | | Backend | Signup and Signin endpoints with JWT and password hashing | 3.0 Hours | ✅ Completed |
| **05/11/2026** | **Day 2** | Backend | Forgot & Reset password endpoints with email integration | 3.0 Hours | ✅ Completed |
| | | Frontend | Developing the responsive Landing/Home page UI | 2.5 Hours | ✅ Completed |
| | | Frontend | Developing the responsive Sign-in page UI & state management | 2.5 Hours | ✅ Completed |
| **06/11/2026** | **Day 3** | Frontend | Developing Forgot & Reset Password UI and API error handling | 2.5 Hours | ⏳ Scheduled |
| | | Integration | End-to-end integration of React frontend with Node.js backend | 2.0 Hours | ⏳ Scheduled |
| | | Integration | Cross-device responsive testing, bug fixing, and final review | 2.0 Hours | ⏳ Scheduled |
| **Total** | | | | **21 Hours** | |

---

## 🏗️ Architecture Design: Feature-Based Architecture

Both the **client** and **server** follow a strict **Feature-Based Architecture**. Instead of grouping files by generic technical types (e.g. putting all controllers or all components in one massive folder), code is organized around business features (e.g., `auth`, `user`). This guarantees high cohesion, isolated concerns, and effortless scalability.

### 1. Server Architecture (`/server`)

```text
server/
├── src/
│   ├── config/
│   │   └── env.ts                    # Centralized typed environment configuration
│   ├── features/
│   │   └── auth/                     # Auth Feature Module
│   │       ├── auth.controller.ts    # HTTP request & response handlers
│   │       ├── auth.repository.ts    # Database access layer (Repository Pattern)
│   │       ├── auth.routes.ts        # Express route definitions
│   │       ├── auth.service.ts       # Business logic, hashing, & token generation
│   │       └── auth.types.ts         # Domain models, DTOs, & payload interfaces
│   ├── shared/
│   │   ├── db/
│   │   │   ├── migrations/           # Versioned SQL migration files
│   │   │   │   └── 001_create_users_table.sql
│   │   │   ├── migrate.ts            # Migration runner with rollback safety
│   │   │   └── pool.ts               # PostgreSQL connection pool instance
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT verification guard middleware
│   │   │   └── error.middleware.ts   # Centralized error handler
│   │   └── utils/
│   │       └── response.ts           # Standardized API response formatters
│   ├── app.ts                        # Express application setup & middleware stack
│   └── index.ts                      # Server bootstrap & database health verification
├── .env                              # Environment configuration (ignored in git)
├── .env.example                      # Template environment variables
├── package.json
└── tsconfig.json
```

### 2. Client Architecture (`/client`) — *Planned for Days 2 & 3*

```text
client/
├── src/
│   ├── features/
│   │   └── auth/                     # Auth Feature Module
│   │       ├── components/           # UI forms & auth widgets (Sign-in, Sign-up, Reset)
│   │       ├── hooks/
│   │       │   └── useAuth.ts        # Custom React hook for auth state & persistence
│   │       ├── services/
│   │       │   └── auth.api.ts       # Typed HTTP client for authentication endpoints
│   │       └── types/
│   │           └── auth.types.ts     # Frontend domain interfaces & form schemas
│   ├── shared/
│   │   ├── components/               # Reusable UI primitives (Buttons, Inputs, Cards)
│   │   └── utils/                    # Shared client utilities
│   ├── App.tsx                       # Main application shell
│   ├── main.tsx                      # Vite React entry point
│   ├── index.css                     # Global styles
│   └── vite.config.ts
├── package.json
└── tsconfig.json
```

---

## 🗄️ Database Schema & Migrations

The database is built on **PostgreSQL** with automated, tracked schema migrations.

### Schema Migration: `001_create_users_table.sql`
```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
```

To run pending migrations:
```bash
cd server
npm run migrate
```

---

## 📡 API Endpoints (Day 1 Implemented)

> 📖 **Full API Reference**: For comprehensive schemas, validation rules, error handling, and code examples, see [`server/docs/API.md`](server/docs/API.md).

### Base URL: `http://localhost:5000/api`

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Server & PostgreSQL connectivity status |
| `POST` | `/auth/signup` | Public | Register a new user account & set HttpOnly cookie |
| `POST` | `/auth/signin` | Public | Authenticate existing user & set HttpOnly cookie |
| `POST` | `/auth/signout` | Public | Clear authentication HttpOnly cookie |
| `GET` | `/auth/me` | Protected | Fetch authenticated profile via Cookie or Bearer Token |

#### 1. Signup (`POST /api/auth/signup`)
* **Request Body**:
```json
{
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "password": "SecurePassword123!"
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "55d8e5bf-dcdf-475d-88c1-a2495ac85574",
      "name": "Alex Johnson",
      "email": "alex@example.com",
      "created_at": "2026-11-04T11:21:53.707Z",
      "updated_at": "2026-11-04T11:21:53.707Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Signin (`POST /api/auth/signin`)
* **Request Body**:
```json
{
  "email": "alex@example.com",
  "password": "SecurePassword123!"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Signed in successfully",
  "data": {
    "user": {
      "id": "55d8e5bf-dcdf-475d-88c1-a2495ac85574",
      "name": "Alex Johnson",
      "email": "alex@example.com",
      "created_at": "2026-11-04T11:21:53.707Z",
      "updated_at": "2026-11-04T11:21:53.707Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Current User (`GET /api/auth/me`)
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "55d8e5bf-dcdf-475d-88c1-a2495ac85574",
      "name": "Alex Johnson",
      "email": "alex@example.com",
      "created_at": "2026-11-04T11:21:53.707Z",
      "updated_at": "2026-11-04T11:21:53.707Z"
    }
  }
}
```

---

## 🚀 Setup & Execution Guide

### 1. Prerequisites
- **Node.js** (v18+ or v20+)
- **PostgreSQL** (v14+ running locally on port 5432)

### 2. Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Copy environment file and configure if needed:
   ```bash
   cp .env.example .env
   ```
3. Run database migrations:
   ```bash
   npm run migrate
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
   *The server starts on `http://localhost:5000` with automatic DB connection check.*

### 3. Running Day 1 Tests
We have included an automated test suite verifying all 8 Day 1 requirements (DB connection, migrations, Signup, Signin, JWT verification, duplicate prevention, validation, and protected routes):
```bash
cd server
npm test
```

### 4. Frontend Setup
1. Open a new terminal and navigate to client:
   ```bash
   cd client
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client runs on `http://localhost:5173`.*

---

## 🎯 Next Steps (Day 2 Roadmap)
- Implement backend `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` endpoints with secure token generation and email delivery.
- Build responsive React Landing page UI.
- Build responsive Sign-in page UI connected to `useAuth` hook and PostgreSQL backend.
