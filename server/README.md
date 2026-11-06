# Readventure Backend Service

The core authentication and reading companion backend service for **Readventure**, built with Node.js, Express, TypeScript, and PostgreSQL.

---

## 🚀 Features

- **Robust User Authentication**: Registration, sign-in, and sign-out with JWT tokens.
- **Secure Session Management**: JWTs delivered via **HttpOnly, SameSite=Lax** cookies with optional Bearer token header support.
- **Cryptographic Password Recovery**:
  - Secure 32-byte hex tokens (`crypto.randomBytes`).
  - Stored exclusively as **SHA-256 digests** in PostgreSQL.
  - Strict 1-hour token expiration.
  - Single-use replay protection.
  - Anti-enumeration protection (identical calm response whether the account exists or not).
- **Flexible Email Service**: Nodemailer integration with Gmail SMTP in production and automatic Ethereal email fallback in development.
- **PostgreSQL Database**: Schema migrations with connection pooling and parameterized SQL queries.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express 5
- **Language**: TypeScript 5.8
- **Database**: PostgreSQL
- **Security**: `bcryptjs` (password hashing), `jsonwebtoken` (JWT), `crypto` (SHA-256 tokens)
- **Email**: `nodemailer`
- **Runner**: `tsx` (TypeScript execution and hot reload)

---

## 📁 Directory Structure

```
server/
├── docs/
│   ├── API.md                                   # Comprehensive REST API reference
│   ├── DATABASE.md                              # PostgreSQL schema and indexes
│   └── Readventure_Auth_Postman_Collection.json # Importable Postman collection
├── src/
│   ├── config/                                  # Environment and service configurations
│   ├── features/
│   │   └── auth/                                # Modular Auth Feature
│   │       ├── auth.controller.ts               # HTTP request handlers
│   │       ├── auth.repository.ts               # Database queries (pg pool)
│   │       ├── auth.routes.ts                   # Express route registrations
│   │       ├── auth.service.ts                  # Business logic, token hashing, email dispatch
│   │       └── auth.types.ts                    # TypeScript DTOs and interfaces
│   ├── shared/
│   │   ├── db/                                  # PostgreSQL connection pool & migration runner
│   │   ├── middleware/                          # Auth guard, error handler, CORS
│   │   └── services/                            # Shared email service (Nodemailer)
│   └── index.ts                                 # Server entry point & middleware pipeline
├── test-day1.ts                                 # Day 1 Auth & DB test suite
├── test-day2-backend.ts                         # Day 2 Password reset test suite (9/9 passed)
├── test-e2e-full-flow.ts                        # Complete lifecycle E2E test suite (12/12 passed)
└── package.json
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js** v20 or higher
- **PostgreSQL** running locally on port 5432 with a database named `readventure`

### 2. Installation
```bash
cd server
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Update `.env` with your PostgreSQL credentials, a secure `JWT_SECRET`, and optional Gmail SMTP credentials:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/readventure
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional: Gmail SMTP configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="Readventure <no-reply@readventure.com>"
```

### 4. Run Database Migrations
```bash
npm run migrate
```

### 5. Start Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5000` with hot reloading enabled.

---

## 🧪 Testing

The backend includes comprehensive automated verification suites:

```bash
# Day 1 verification suite (signup, signin, protected routes)
npm test

# Day 2 verification suite (forgot password, reset password, SHA-256 tokens, replay protection)
npm run test:day2

# Complete end-to-end full authentication lifecycle (12/12 tests)
npm run test:e2e
```

---

## 📖 API Documentation

Detailed endpoint specifications, headers, request/response examples, and error codes are documented in:
👉 [**server/docs/API.md**](docs/API.md)
