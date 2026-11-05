# Design Specification: Backend Password Reset & Email Integration

* **Project**: Readventure (User Authentication System)
* **Milestone**: Day 2 — Sub-Project 1 (Backend Services)
* **Date**: 2026-11-05
* **Status**: Validated Design

---

## 1. Overview & Business Goals

This specification details the architecture, design, and verification plan for the **Forgot Password** and **Reset Password** backend endpoints and email delivery system. It completes the Day 2 backend requirements while preserving Readventure's **Feature-Based Architecture**.

### Goals
- Enable users to securely request a password reset link sent to their registered email address.
- Deliver an automated, zero-configuration email preview experience in development using **Ethereal Email**, with seamless fallback to production SMTP.
- Securely store reset tokens using cryptographically strong pseudo-random generation (32 bytes) and one-way SHA-256 hashing in PostgreSQL.
- Enforce strict token expiration (1 hour), single-use invalidation, and protection against account enumeration and replay attacks.
- Deliver a comprehensive, automated test suite (`server/test-day2-backend.ts`) verifying all scenarios against live PostgreSQL.

### Non-Goals
- Frontend UI development for Landing and Sign-in pages (scoped separately as Sub-Project 2 of Day 2).
- Multi-factor authentication (MFA) or magic link login (out of current project scope).

---

## 2. Architecture & File Structure

All backend code continues to adhere strictly to the established **Feature-Based Architecture**:

```text
server/
├── src/
│   ├── config/
│   │   └── env.ts                      # SMTP configuration & frontend CLIENT_URL bindings
│   ├── features/
│   │   └── auth/
│   │       ├── auth.controller.ts      # HTTP handlers: forgotPassword & resetPassword
│   │       ├── auth.repository.ts      # PostgreSQL queries: setResetToken, findByResetToken, updatePasswordAndClearReset
│   │       ├── auth.routes.ts          # Express route definitions: POST /forgot-password, POST /reset-password
│   │       ├── auth.service.ts         # Business logic: token crypto, hashing, expiry, email dispatch
│   │       └── auth.types.ts           # DTOs: ForgotPasswordDto, ResetPasswordDto
│   └── shared/
│       └── services/
│           └── email.service.ts        # Nodemailer abstraction with Ethereal development mode & SMTP fallback
├── test-day2-backend.ts                # Standalone automated verification suite
└── package.json                        # Add nodemailer and @types/nodemailer dependencies
```

---

## 3. Detailed Component Specifications

### 3.1. Environment Configuration (`src/config/env.ts`)
Add optional SMTP settings and client URL with sensible development defaults:
- `CLIENT_URL`: `process.env.CLIENT_URL || 'http://localhost:5173'`
- `SMTP_HOST`: `process.env.SMTP_HOST || ''`
- `SMTP_PORT`: `Number(process.env.SMTP_PORT) || 587`
- `SMTP_USER`: `process.env.SMTP_USER || ''`
- `SMTP_PASS`: `process.env.SMTP_PASS || ''`
- `EMAIL_FROM`: `process.env.EMAIL_FROM || 'Readventure <noreply@readventure.com>'`

### 3.2. Email Service (`src/shared/services/email.service.ts`)
Encapsulates `nodemailer` mail transmission:
- **Development Mode**: When SMTP credentials are not provided or in development mode, it creates and memoizes an **Ethereal** test account (`nodemailer.createTestAccount()`).
- **Production Mode**: Uses SMTP credentials defined in `.env`.
- **Method `sendPasswordResetEmail(toEmail, recipientName, resetUrl)`**:
  - Sends a responsive HTML email containing the reset link button and plain-text fallback.
  - Logs the clickable preview URL to console: `nodemailer.getTestMessageUrl(info)`.
  - Returns `{ messageId: string, previewUrl?: string }`.

### 3.3. Database Repository (`src/features/auth/auth.repository.ts`)
The `users` table already contains `reset_token VARCHAR(255)` and `reset_token_expires_at TIMESTAMPTZ` with index `idx_users_reset_token`.

Methods added to `IAuthRepository`:
1. **`setResetToken(userId: string, hashedToken: string, expiresAt: Date): Promise<void>`**:
   ```sql
   UPDATE users
   SET reset_token = $1, reset_token_expires_at = $2, updated_at = NOW()
   WHERE id = $3
   ```
2. **`findByResetToken(hashedToken: string): Promise<User | null>`**:
   ```sql
   SELECT id, name, email, password_hash, reset_token, reset_token_expires_at, created_at, updated_at
   FROM users
   WHERE reset_token = $1 AND reset_token_expires_at > NOW()
   LIMIT 1
   ```
3. **`updatePasswordAndClearReset(userId: string, newPasswordHash: string): Promise<void>`**:
   ```sql
   UPDATE users
   SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL, updated_at = NOW()
   WHERE id = $2
   ```

### 3.4. Business Logic & Security (`src/features/auth/auth.service.ts`)

#### 1. `forgotPassword(dto: ForgotPasswordDto)`:
1. Normalizes and validates `dto.email` (valid regex format).
2. Looks up user via `repo.findByEmail(email)`.
3. **Anti-Enumeration Protection**: If user is not found, immediately returns standard success message without revealing whether the email exists.
4. Generates a 32-byte cryptographically secure random token: `rawToken = crypto.randomBytes(32).toString('hex')`.
5. Hashes the token using SHA-256: `hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')`.
6. Sets expiration: `expiresAt = new Date(Date.now() + 60 * 60 * 1000)` (1 hour).
7. Persists `hashedToken` and `expiresAt` via `repo.setResetToken(...)`.
8. Constructs reset link: `${config.clientUrl}/reset-password?token=${rawToken}`.
9. Dispatches email via `emailService.sendPasswordResetEmail(user.email, user.name, resetUrl)`.
10. Returns `{ message: "If an account with that email exists, a password reset link has been sent.", previewUrl }`.

#### 2. `resetPassword(dto: ResetPasswordDto)`:
1. Validates that `token` is non-empty and `newPassword` is at least 6 characters.
2. Hashes incoming token: `hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex')`.
3. Looks up user via `repo.findByResetToken(hashedToken)`.
4. If no valid, non-expired record is found, throws error: `"Invalid or expired password reset token"`.
5. Hashes `dto.newPassword` using bcrypt with 10 salt rounds.
6. Updates password and clears reset token via `repo.updatePasswordAndClearReset(...)`.
7. Returns `{ message: "Password has been successfully reset. Please sign in with your new password." }`.

---

## 4. API Endpoints Contract

### 4.1. Request Password Reset Link
* **Method**: `POST`
* **Route**: `/api/auth/forgot-password`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "alex@readventure.com"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "If an account with that email exists, a password reset link has been sent.",
    "data": {
      "previewUrl": "https://ethereal.email/message/..." // only present in dev
    }
  }
  ```
* **Validation Error (`400 Bad Request`)**:
  ```json
  {
    "success": false,
    "message": "Please provide a valid email address"
  }
  ```

### 4.2. Complete Password Reset
* **Method**: `POST`
* **Route**: `/api/auth/reset-password`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "token": "4a7f98b1e2c3d4e5...",
    "newPassword": "NewSecurePassword456!"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Password has been successfully reset. Please sign in with your new password.",
    "data": null
  }
  ```
* **Invalid or Expired Token (`400 Bad Request`)**:
  ```json
  {
    "success": false,
    "message": "Invalid or expired password reset token"
  }
  ```

---

## 5. Automated Verification Plan

Create `server/test-day2-backend.ts` to test against the live PostgreSQL database:
1. **Registered User Forgot Password**: Verifies `POST /api/auth/forgot-password` returns `200 OK` and generates an Ethereal preview link.
2. **Unregistered User Forgot Password**: Verifies `POST /api/auth/forgot-password` returns `200 OK` without leaking that user is absent.
3. **Invalid Email Syntax**: Rejects with `400 Bad Request`.
4. **Token Security in DB**: Directly queries PostgreSQL to ensure `users.reset_token` is 64 characters long (SHA-256 hash) and differs from the raw token in the reset URL.
5. **Invalid Reset Token**: Rejects bogus tokens with `400 Bad Request`.
6. **Short Password**: Rejects new passwords with length < 6 (`400 Bad Request`).
7. **Successful Password Reset**: Updates password hash and clears DB token fields (`200 OK`).
8. **Single-Use Enforcement**: Verifies replaying the same token fails with `400 Bad Request`.
9. **Full Authentication Cycle**: Validates old password no longer works (`401 Unauthorized`), and new password successfully logs in (`200 OK` with auth cookie).
