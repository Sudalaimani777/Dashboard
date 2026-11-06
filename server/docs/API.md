# Readventure Authentication API Documentation

Comprehensive API documentation for the **Readventure** User Authentication and Reading Journal backend service.

---

## 📌 Overview & Base URL

* **Base URL**: `http://localhost:5000/api`
* **Protocol**: HTTP / JSON
* **Authentication**: **HttpOnly Cookies** (`Cookie: token=...`) with Bearer Token fallback (`Authorization: Bearer <token>`)
* **Default Port**: `5000` (Configurable via `PORT` in `.env`)
* **Security Model**: 
  - Passwords hashed with `bcryptjs` (salt rounds: 10)
  - JWT access tokens signed with HMAC-SHA256 (expiration: 7 days)
  - Password recovery tokens generated via `crypto.randomBytes(32)` (64-char hex string)
  - Reset tokens stored in PostgreSQL as **SHA-256 digests** (expiration: 1 hour)
  - Single-use replay protection (tokens immediately wiped upon consumption)
  - Anti-enumeration protection on recovery endpoints

---

## 🔐 Standard Response Format

All API responses follow a consistent envelope structure.

### Success Response Envelope
```json
{
  "success": true,
  "message": "Human-readable description of the action",
  "data": {}
}
```

### Error Response Envelope
```json
{
  "success": false,
  "message": "Human-readable error explanation",
  "errors": {} 
}
```

### HTTP Status Code Reference
| Status Code | Meaning | When It Occurs |
| :--- | :--- | :--- |
| `200 OK` | Success | The request succeeded (sign in, forgot password, reset password, profile fetch). |
| `201 Created` | Created | User account successfully registered. |
| `400 Bad Request` | Validation Error | Missing fields, invalid email format, short password (<6 chars), or expired/invalid reset token. |
| `401 Unauthorized` | Authentication Failed | Invalid credentials, missing authentication cookie/token, or expired JWT. |
| `404 Not Found` | Not Found | Route does not exist. |
| `409 Conflict` | Conflict | Attempted registration with an already existing email address. |
| `500 Internal Server Error` | Server Error | Database failure or unexpected runtime exception. |

---

## 📑 Endpoints Summary

| Method | Endpoint | Access | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Service & PostgreSQL connectivity check | Production Ready ✅ |
| `POST` | `/auth/signup` | Public | Register new user account & set HttpOnly cookie | Production Ready ✅ |
| `POST` | `/auth/signin` | Public | Authenticate with credentials & set HttpOnly cookie | Production Ready ✅ |
| `POST` | `/auth/signout` | Public | Invalidate & clear authentication cookie | Production Ready ✅ |
| `GET` | `/auth/me` | Protected | Fetch authenticated user profile | Production Ready ✅ |
| `POST` | `/auth/forgot-password` | Public | Request password recovery email (anti-enumeration) | Production Ready ✅ |
| `POST` | `/auth/reset-password` | Public | Update password using single-use cryptographically verified token | Production Ready ✅ |

---

## 📡 Detailed Endpoint Specifications

### 1. Health & Database Check

Verifies server responsiveness and active PostgreSQL database connection.

* **URL**: `/health`
* **Method**: `GET`
* **Access**: Public
* **Headers**: None

#### Success Response (`200 OK`)
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-11-06T08:40:00.000Z"
}
```

#### Error Response (`500 Internal Server Error`)
```json
{
  "status": "error",
  "database": "disconnected",
  "message": "Database connection refused"
}
```

---

### 2. User Signup

Registers a new user account, hashes their password with bcrypt (10 rounds), generates an authentication JWT, and sets an HttpOnly cookie.

* **URL**: `/auth/signup`
* **Method**: `POST`
* **Access**: Public
* **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Payload
| Field | Type | Required | Validation Constraints |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Yes** | Min length: 2 characters |
| `email` | `string` | **Yes** | Valid email format (stored lowercase & trimmed) |
| `password` | `string` | **Yes** | Min length: 6 characters |

```json
{
  "name": "Jane Eyre",
  "email": "jane@readventure.com",
  "password": "SecurePassword123!"
}
```

#### Success Response (`201 Created`)
* **Response Headers**:
  ```http
  Set-Cookie: token=eyJhbGci...; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800
  ```
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "e81d4f2e-b1a8-4c90-9ef2-1b1234567890",
      "name": "Jane Eyre",
      "email": "jane@readventure.com",
      "created_at": "2026-11-06T08:41:00.000Z",
      "updated_at": "2026-11-06T08:41:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Responses
* **`400 Bad Request`**: Validation error (e.g., password < 6 chars, invalid email).
* **`409 Conflict`**: Email already registered.

---

### 3. User Signin

Authenticates an existing user and returns user info along with a new JWT in both the response body and an HttpOnly cookie.

* **URL**: `/auth/signin`
* **Method**: `POST`
* **Access**: Public
* **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Payload
```json
{
  "email": "jane@readventure.com",
  "password": "SecurePassword123!"
}
```

#### Success Response (`200 OK`)
* **Response Headers**:
  ```http
  Set-Cookie: token=eyJhbGci...; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800
  ```
```json
{
  "success": true,
  "message": "Signed in successfully",
  "data": {
    "user": {
      "id": "e81d4f2e-b1a8-4c90-9ef2-1b1234567890",
      "name": "Jane Eyre",
      "email": "jane@readventure.com",
      "created_at": "2026-11-06T08:41:00.000Z",
      "updated_at": "2026-11-06T08:41:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Response (`401 Unauthorized`)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 4. User Signout

Clears the `token` HttpOnly cookie by setting its expiration to the Unix epoch.

* **URL**: `/auth/signout`
* **Method**: `POST`
* **Access**: Public
* **Response Headers**:
  ```http
  Set-Cookie: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax
  ```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Signed out successfully",
  "data": null
}
```

---

### 5. Get Current User Profile

Retrieves the currently authenticated user's profile. Accepts credentials via HttpOnly cookie or Bearer Authorization header.

* **URL**: `/auth/me`
* **Method**: `GET`
* **Access**: **Protected** (Requires active session)
* **Headers**:
  ```http
  Cookie: token=<jwt>
  # OR
  Authorization: Bearer <jwt>
  ```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "e81d4f2e-b1a8-4c90-9ef2-1b1234567890",
      "name": "Jane Eyre",
      "email": "jane@readventure.com",
      "created_at": "2026-11-06T08:41:00.000Z",
      "updated_at": "2026-11-06T08:41:00.000Z"
    }
  }
}
```

#### Error Response (`401 Unauthorized`)
```json
{
  "success": false,
  "message": "Access denied. No authorization token provided."
}
```

---

### 6. Forgot Password (Request Recovery Link)

Initiates the password recovery flow. Generates a 32-byte secure random hex token, stores the **SHA-256 hash** in PostgreSQL with a 1-hour expiration timestamp, and sends a reset link to the user via Nodemailer (Gmail SMTP in production, Ethereal in development).

> **🛡️ Security Guarantee: Anti-Enumeration**  
> Regardless of whether the provided email address exists in the database, the server returns an identical `200 OK` response. This prevents malicious actors from probing and scraping valid user accounts.

* **URL**: `/auth/forgot-password`
* **Method**: `POST`
* **Access**: Public
* **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Payload
| Field | Type | Required | Validation Constraints |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | Valid RFC-compliant email address |

```json
{
  "email": "jane@readventure.com"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent.",
  "data": {
    "message": "If an account with that email exists, a password reset link has been sent.",
    "previewUrl": false
  }
}
```
*(Note: In local development with Ethereal fallback, `previewUrl` contains the Ethereal web preview link).*

#### Error Response (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Please provide a valid email address"
}
```

---

### 7. Reset Password (Update Credentials)

Validates the recovery token against PostgreSQL. Upon verification, hashes the new password with bcrypt, updates the user's password, and **immediately clears the reset token and expiration date** from the database to prevent replay attacks.

* **URL**: `/auth/reset-password`
* **Method**: `POST`
* **Access**: Public
* **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Payload
| Field | Type | Required | Validation Constraints |
| :--- | :--- | :--- | :--- |
| `token` | `string` | **Yes** | 64-character hex token from recovery email |
| `newPassword` | `string` | **Yes** | Min length: 6 characters (UI enforces 8) |

```json
{
  "token": "4f8a7c29e1b3d580fa23e4567890abcd4f8a7c29e1b3d580fa23e4567890abcd",
  "newPassword": "BrandNewSecurePassword123!"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Password has been successfully reset. Please sign in with your new password.",
  "data": {
    "message": "Password has been successfully reset. Please sign in with your new password."
  }
}
```

#### Error Responses

* **`400 Bad Request`** (Invalid or Expired Token):
  ```json
  {
    "success": false,
    "message": "Invalid or expired password reset token"
  }
  ```

* **`400 Bad Request`** (Password Too Short):
  ```json
  {
    "success": false,
    "message": "Password must be at least 6 characters long"
  }
  ```

* **`400 Bad Request`** (Missing Parameters):
  ```json
  {
    "success": false,
    "message": "Token and new password are required"
  }
  ```

---

## 🧪 Testing & Execution

### Running the Test Suites

```bash
# Day 1 Auth & DB Verification
npm test

# Day 2 Password Reset Backend Test (9/9 Passed)
npm run test:day2

# Complete End-to-End Lifecycle Suite (12/12 Passed)
npm run test:e2e
```

### Postman Collection
Import the verified collection into Postman:
* Path: [`server/docs/Readventure_Auth_Postman_Collection.json`](Readventure_Auth_Postman_Collection.json)
* Contains pre-configured requests, environment variables, and test scripts for automated cookie extraction.
