# User Authentication & Reading Journal Application (Readventure)

> A full-stack, production-grade User Authentication and Reading Journal platform built with **React 19**, **TypeScript**, **Node.js**, **Express 5**, and **PostgreSQL**, designed with a **Feature-Based Architecture** and the bespoke **Warm Storycraft** visual system.

---

## 📅 3-Day Implementation Timeline & Status

Based on the 3-day project schedule (November 4 – November 6, 2026), **all 3 daily milestones have been 100% completed, tested, and verified**:

| Date | Day | Category | Task Description | Estimated | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **04/11/2026** | **Day 1** | Planning & Setup | Wireframing, React 19 + Node.js setup, PostgreSQL initialization | 3.0 Hours | ✅ Completed |
| | | Backend | Database schema design, migrations, Signup & Signin APIs with JWT | 5.0 Hours | ✅ Completed |
| **05/11/2026** | **Day 2** | Backend | Forgot & Reset password APIs with Nodemailer (Gmail SMTP + Ethereal) | 3.0 Hours | ✅ Completed |
| | | Frontend | Responsive Warm Storycraft Landing page & Editorial Showcase | 2.5 Hours | ✅ Completed |
| | | Frontend | Responsive Sign-in & Sign-up pages with AuthContext & HttpOnly session | 2.5 Hours | ✅ Completed |
| **06/11/2026** | **Day 3** | Frontend | Responsive Forgot Password UI (`/forgot-password`) with in-place inbox card | 1.5 Hours | ✅ Completed |
| | | Frontend | Responsive Reset Password UI (`/reset-password`) with URL guard & toggles | 1.5 Hours | ✅ Completed |
| | | Dashboard | Active Reading Hub Dashboard (Now Reading, Cadence Stats, Shelf, Modal) | 2.0 Hours | ✅ Completed |
| | | Integration | Full-stack E2E testing, de-slop audit, and comprehensive documentation | 2.0 Hours | ✅ Completed |
| **Total** | | | | **21 Hours** | **100% Complete** |

---

## 🏛️ System Architecture & Documentation

Comprehensive architectural documentation is organized across the repository:

- 🏗️ [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md): Complete end-to-end full-stack architecture, request sequence diagrams, and security model.
- 📡 [**server/docs/API.md**](server/docs/API.md): Complete REST API specification for all 7 endpoints, schemas, and error envelopes.
- 🗄️ [**server/docs/DATABASE.md**](server/docs/DATABASE.md): PostgreSQL schema, tables (`users`), indexes, and cryptographic design.
- 🎨 [**client/docs/DESIGN_SYSTEM.md**](client/docs/DESIGN_SYSTEM.md): Warm Storycraft design tokens, typography, and anti-AI-slop guidelines.
- 📦 [**server/README.md**](server/README.md): Backend installation, environment configuration, and test suites.
- 💻 [**client/README.md**](client/README.md): Frontend installation, routing map, and component hierarchy.

---

## 🔐 Security & Cryptographic Highlights

1. **HttpOnly Cookie Authentication**:
   - Access JWTs are delivered via **HttpOnly, SameSite=Lax** cookies (`withCredentials: true`), completely shielding credentials from browser XSS attacks.
2. **Cryptographic Password Recovery**:
   - 32-byte cryptographically secure tokens generated via `crypto.randomBytes(32)` (64-char hex string).
   - Stored in PostgreSQL strictly as **SHA-256 digests**. Database dumps do not reveal usable tokens.
   - Strict 1-hour expiration.
   - Single-use replay protection: tokens are atomically cleared upon successful password update.
3. **Anti-Enumeration Protection**:
   - `/api/auth/forgot-password` returns an identical `200 OK` response regardless of whether the email exists in the database, preventing user scraping.
4. **URL Guards**:
   - Accessing `/reset-password` without a valid `?token=` parameter renders an intentional recovery guard card with a link to `/forgot-password`, preventing broken input states.
5. **Anti-AI-Slop Visual Design**:
   - Zero floating icon chips in pastel boxes, zero rainbow password meters, zero conversational filler, and zero welded arrow characters.

---

## 📡 Live Endpoints Summary

| Method | Endpoint | Access | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Service & PostgreSQL health check | Verified ✅ |
| `POST` | `/api/auth/signup` | Public | Register new user account & set HttpOnly cookie | Verified ✅ |
| `POST` | `/api/auth/signin` | Public | Login with credentials & set HttpOnly cookie | Verified ✅ |
| `POST` | `/api/auth/signout` | Public | Clear authentication cookie | Verified ✅ |
| `GET` | `/api/auth/me` | Protected | Fetch current user profile (via Cookie or Bearer) | Verified ✅ |
| `POST` | `/api/auth/forgot-password` | Public | Request password recovery email (anti-enumeration) | Verified ✅ |
| `POST` | `/api/auth/reset-password` | Public | Reset password using single-use SHA-256 token | Verified ✅ |

---

## 🗺️ Client Route Map

| Route | Access | Component | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | Public | `LandingPage` | Editorial marketing homepage |
| `/signin` | Public | `SignInCard` | User sign-in with credentials |
| `/signup` | Public | `SignUpCard` | Account registration |
| `/forgot-password` | Public | `ForgotPasswordCard` | Request password reset email |
| `/reset-password` | Public | `ResetPasswordCard` | Update password via recovery token URL |
| `/dashboard` | **Protected** | `DashboardPage` | Active reading hub & library metrics |

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- **Node.js** v20+
- **PostgreSQL** running locally on port 5432 with database `readventure`

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
npm run migrate
npm run dev
```
*Backend runs on `http://localhost:5000`.*

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Automated Testing Suites

```bash
cd server

# Day 1 Auth & DB Verification
npm test

# Day 2 Password Reset Backend Test (9/9 Passed)
npm run test:day2

# Complete End-to-End Lifecycle Suite (12/12 Passed)
npm run test:e2e
```
