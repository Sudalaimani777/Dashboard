# Readventure Authentication API Documentation

Comprehensive API documentation for the Readventure User Authentication backend service.

---

## 📌 Overview & Base URL

* **Base URL**: `http://localhost:5000/api`
* **Protocol**: HTTP / JSON
* **Authentication**: **HttpOnly Cookies** (`Cookie: token=...`) with Bearer Token header fallback (`Authorization: Bearer <token>`)
* **Default Port**: `5000` (Configurable via `PORT` in `.env`)

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

### Common HTTP Status Codes
| Status Code | Meaning | Description |
| :--- | :--- | :--- |
| `200 OK` | Success | The request succeeded. |
| `201 Created` | Created | Resource successfully created (e.g., user registration). |
| `400 Bad Request` | Validation Error | Missing fields, invalid email format, or weak password. |
| `401 Unauthorized` | Authentication Failed | Missing/invalid token or wrong email/password. |
| `404 Not Found` | Not Found | Requested route or user resource does not exist. |
| `409 Conflict` | Conflict | Email already registered. |
| `500 Internal Server Error` | Server Error | Unhandled server or database exception. |

---

## 📑 Endpoints Summary

| Method | Endpoint | Access | Description | Milestone |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Service & PostgreSQL health check | Day 1 ✅ |
| `POST` | `/auth/signup` | Public | Register new user account & set HttpOnly cookie | Day 1 ✅ |
| `POST` | `/auth/signin` | Public | Login with credentials & set HttpOnly cookie | Day 1 ✅ |
| `POST` | `/auth/signout` | Public | Clear authentication cookie | Day 1 ✅ |
| `GET` | `/auth/me` | Protected | Fetch current user profile (via Cookie or Bearer) | Day 1 ✅ |
| `POST` | `/auth/forgot-password` | Public | Request password reset token via email | Day 2 ⏳ |
| `POST` | `/auth/reset-password` | Public | Reset password using reset token | Day 2 ⏳ |

---

## 📡 Detailed Endpoint Specifications

### 1. Health & Database Check

Checks server status and live connectivity to PostgreSQL.

* **URL**: `/health`
* **Method**: `GET`
* **Access**: Public
* **Headers**: None

#### Success Response (`200 OK`)
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-11-04T11:21:16.711Z"
}
```

#### Error Response (`500 Internal Server Error`)
```json
{
  "status": "error",
  "database": "disconnected",
  "message": "password authentication failed for user \"postgres\""
}
```

---

### 2. User Signup

Creates a new user account with a hashed password (bcrypt) and generates a JWT.

* **URL**: `/auth/signup`
* **Method**: `POST`
* **Access**: Public
* **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Payload
| Field | Type | Required | Validation Rules |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Yes** | Min length: 2 characters |
| `email` | `string` | **Yes** | Valid RFC-compliant email address (stored lowercase) |
| `password` | `string` | **Yes** | Min length: 6 characters |

```json
{
  "name": "Alex Johnson",
  "email": "alex@readventure.com",
  "password": "SecurePassword123!"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "55d8e5bf-dcdf-475d-88c1-a2495ac85574",
      "name": "Alex Johnson",
      "email": "alex@readventure.com",
      "created_at": "2026-11-04T11:21:53.707Z",
      "updated_at": "2026-11-04T11:21:53.707Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NWQ4ZTViZi1kY2RmLTQ3NWQtODhjMS1hMjQ5NWFjODU1NzQiLCJlbWFpbCI6ImFsZXhAcmVhZHZlbnR1cmUuY29tIiwiaWF0IjoxNzkzNzkxMzM3LCJleHAiOjE3OTQzOTYxMzd9.eQfjIDyuVzsP1VM0cnb6gjTpOPW9tzu2DpqjKJ6xuL4"
  }
}
```

#### Error Responses

* **`400 Bad Request`** (Invalid validation input):
  ```json
  {
    "success": false,
    "message": "Password must be at least 6 characters long"
  }
  ```

* **`409 Conflict`** (Duplicate email):
  ```json
  {
    "success": false,
    "message": "User with this email already exists"
  }
  ```

---

### 3. User Signin

Authenticates a user with email and password, returning user details and a signed JWT.

* **URL**: `/auth/signin`
* **Method**: `POST`
* **Access**: Public
* **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Payload
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | Registered account email |
| `password` | `string` | **Yes** | Account password |

```json
{
  "email": "alex@readventure.com",
  "password": "SecurePassword123!"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Signed in successfully",
  "data": {
    "user": {
      "id": "55d8e5bf-dcdf-475d-88c1-a2495ac85574",
      "name": "Alex Johnson",
      "email": "alex@readventure.com",
      "created_at": "2026-11-04T11:21:53.707Z",
      "updated_at": "2026-11-04T11:21:53.707Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NWQ4ZTViZi1kY2RmLTQ3NWQtODhjMS1hMjQ5NWFjODU1NzQiLCJlbWFpbCI6ImFsZXhAcmVhZHZlbnR1cmUuY29tIiwiaWF0IjoxNzkzNzkxMzM3LCJleHAiOjE3OTQzOTYxMzd9.eQfjIDyuVzsP1VM0cnb6gjTpOPW9tzu2DpqjKJ6xuL4"
  }
}
```

#### Error Response (`401 Unauthorized`)
*Returned if the email doesn't exist or password mismatch:*
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 4. User Signout

Clears the `token` HttpOnly cookie.

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

Retrieves the authenticated user's profile details. Accepts authentication via **HttpOnly Cookie** (`token`) automatically attached by browsers, or via `Authorization: Bearer <token>` header.

* **URL**: `/auth/me`
* **Method**: `GET`
* **Access**: **Protected** (Requires HttpOnly Cookie or Bearer Token)
* **Headers**:
  ```http
  Cookie: token=<token>
  # OR
  Authorization: Bearer <token>
  ```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "55d8e5bf-dcdf-475d-88c1-a2495ac85574",
      "name": "Alex Johnson",
      "email": "alex@readventure.com",
      "created_at": "2026-11-04T11:21:53.707Z",
      "updated_at": "2026-11-04T11:21:53.707Z"
    }
  }
}
```

#### Error Responses

* **`401 Unauthorized`** (Token missing):
  ```json
  {
    "success": false,
    "message": "Access denied. No authorization token provided."
  }
  ```

* **`401 Unauthorized`** (Token expired or invalid signature):
  ```json
  {
    "success": false,
    "message": "Invalid or expired authorization token."
  }
  ```

---

### 5. Upcoming Endpoints (Day 2 Milestone)

#### A. Forgot Password (`POST /auth/forgot-password`)
* **Request Payload**:
  ```json
  {
    "email": "alex@readventure.com"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "If an account with that email exists, a password reset link has been sent."
  }
  ```

#### B. Reset Password (`POST /auth/reset-password`)
* **Request Payload**:
  ```json
  {
    "token": "reset_token_from_email",
    "newPassword": "NewSecurePassword456!"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Password has been successfully reset. Please sign in with your new password."
  }
  ```

---

## 🛠️ Testing & Integration Examples

### cURL

```bash
# 1. Health check
curl -X GET http://localhost:5000/api/health

# 2. Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex","email":"alex@test.com","password":"Password123!"}'

# 3. Signin
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@test.com","password":"Password123!"}'

# 4. Protected Profile
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

### JavaScript / TypeScript Fetch Example

```typescript
// User Sign-in
async function signin(email: string, password: string) {
  const response = await fetch('http://localhost:5000/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }

  // Save token
  localStorage.setItem('token', result.data.token);
  return result.data.user;
}

// Fetch authenticated profile
async function getProfile() {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return await response.json();
}
```

---

## 📦 Postman Collection

A pre-configured Postman Collection is available in the docs directory:
* File: [`server/docs/Readventure_Day1_Postman_Collection.json`](Readventure_Day1_Postman_Collection.json)
* Import directly into Postman to test all endpoints with automatic token extraction.
