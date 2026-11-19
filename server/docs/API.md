# TripFlow API Documentation

Comprehensive REST API documentation for the **TripFlow** Corporate Travel & Expense Governance platform, including User Authentication, Two-Tier Travel Authorization, Cloudinary Proof Storage, Department Budget Governance, and User Administration services.

---

## 📌 Overview & Base Configuration

* **Base URL**: `http://localhost:5000/api`
* **Protocol**: HTTP / JSON (Multipart for uploads)
* **Authentication**: **HttpOnly Cookies** (`Cookie: token=...`) with optional Bearer Token fallback (`Authorization: Bearer <token>`)
* **Default Port**: `5000` (Configurable via `PORT` in `.env`)
* **Currency Standard**: All monetary calculations and representations are stored in **Indian Rupees (`INR`)** and formatted as `₹` with tabular numbers.
* **Role Hierarchy**:
  - `EMPLOYEE`: Can create, draft, submit, and resubmit travel requests & itemized expenses.
  - `MANAGER`: Tier 1 direct line authority. Audits itineraries and proofs, requests modifications, or approves & forwards to Admin.
  - `ADMIN`: Tier 2 executive and finance authority. Audits budget impact, grants final clearance (`APPROVED`), settles payouts (`SETTLED`), requests revisions, manages department budgets, and oversees user accounts.

---

## 🔐 Standard Response Envelopes

### Success Response
```json
{
  "success": true,
  "message": "Human-readable description of the result",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human-readable explanation of why the request failed",
  "errors": {}
}
```

---

## 📑 Complete Endpoints Summary

### 1. Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Public | Register new user account (`EMPLOYEE`, `MANAGER`, `ADMIN`) |
| `POST` | `/api/auth/signin` | Public | Authenticate credentials & issue HttpOnly session cookie |
| `POST` | `/api/auth/signout` | Public | Invalidate & clear session cookie |
| `GET` | `/api/auth/me` | Protected | Fetch authenticated user profile & permissions |
| `POST` | `/api/auth/forgot-password` | Public | Request password recovery email (anti-enumeration protected) |
| `POST` | `/api/auth/reset-password` | Public | Reset password using single-use SHA-256 token |

### 2. Travel Governance & Expense Endpoints (`/api/travel`)
| Method | Endpoint | Role Guard | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/travel/upload` | Authenticated | Uploads receipt or quotation proof file to Cloudinary |
| `POST` | `/api/travel/requests` | Authenticated | Create new travel request with itemized expenses & proof documents |
| `GET` | `/api/travel/requests` | All Roles | Fetch role-scoped requests (Employee: own; Manager: team; Admin: all) |
| `GET` | `/api/travel/requests/:id` | All Roles | Fetch full request details, itemized expenses, and timeline audit ledger |
| `GET` | `/api/travel/manager-queue` | `MANAGER`, `ADMIN` | Fetch requests pending Tier 1 Manager audit |
| `GET` | `/api/travel/admin-queue` | `ADMIN` | Fetch requests pending Tier 2 Admin clearance or reimbursement settlement |
| `POST` | `/api/travel/requests/:id/manager-review` | `MANAGER`, `ADMIN` | Tier 1 review: `APPROVE_AND_FORWARD`, `REQUEST_REVISION`, or `REJECT` |
| `POST` | `/api/travel/requests/:id/admin-review` | `ADMIN` | Tier 2 review: `APPROVE` / `SETTLE`, `REQUEST_REVISION` (Route A or B), or `REJECT` |
| `POST` | `/api/travel/requests/:id/resubmit` | Authenticated | Resubmit altered request (strictly returns to Manager for re-verification) |
| `POST` | `/api/travel/requests/:id/cancel` | Authenticated | Cancel a draft or pending travel request |
| `GET` | `/api/travel/budgets` | Authenticated | Fetch department budget headroom and utilization in INR (`₹`) for a quarter |
| `GET` | `/api/travel/budgets/overview` | `ADMIN` | Fetch comprehensive multi-quarter organizational budget ledger |
| `PUT` | `/api/travel/budgets` | `ADMIN` | Create or update department quarterly budget allocation |

### 3. User Administration Endpoints (`/api/users`)
| Method | Endpoint | Role Guard | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | `ADMIN` | List all corporate users, roles, departments, and status |
| `POST` | `/api/users` | `ADMIN` | Provision a new user account with role and department assignment |
| `PATCH` | `/api/users/:id/status` | `ADMIN` | Activate or deactivate user access (`is_active: boolean`) |
| `PATCH` | `/api/users/:id` | `ADMIN` | Update user details, department, or reporting manager |
| `DELETE` | `/api/users/:id` | `ADMIN` | Delete user account with relational cascade safeguards |

### 4. Health Check Endpoint
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Service & PostgreSQL health check |

---

## 📡 Detailed Endpoint Specifications

### 1. Upload Supporting Proof File (Cloudinary)

Uploads an image (JPG, PNG) or PDF document to Cloudinary for receipt or quotation proof verification.

* **URL**: `/api/travel/upload`
* **Method**: `POST`
* **Access**: Protected (All authenticated roles)
* **Headers**: `Content-Type: multipart/form-data`
* **Form Field**: `file` (Binary file, max 10MB)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "f8a927c3-3e11-482a-9669-e054f15d9092",
    "name": "air-india-quote.pdf",
    "type": "FILE",
    "url": "https://res.cloudinary.com/tripflow/image/upload/v1731924000/proofs/air-india-quote.pdf",
    "uploadedAt": "2026-11-18T10:00:00.000Z"
  }
}
```

---

### 2. Create Travel Request with Itemized Expenses & Proofs

Creates a corporate travel request. Both `UPCOMING` (pre-trip authorization) and `ALREADY_TRAVELLED` (post-trip reimbursement) require upfront itemized expenses and supporting proofs.

* **URL**: `/api/travel/requests`
* **Method**: `POST`
* **Access**: Authenticated (`EMPLOYEE`)
* **Headers**: `Content-Type: application/json`

#### Request Payload
```json
{
  "travel_type": "UPCOMING",
  "title": "Client Architecture Workshop - Singapore",
  "purpose": "Lead quarterly technical discovery and API integration workshop for APAC expansion.",
  "project_code": "PROJ-APAC-2026",
  "origin": "Bangalore (BLR)",
  "destination": "Singapore (SIN)",
  "departure_date": "2026-11-20",
  "return_date": "2026-11-24",
  "emergency_contact_name": "Meera Kannan",
  "emergency_contact_phone": "+91 98400 12345",
  "supporting_docs": [
    {
      "id": "f8a927c3-3e11-482a-9669-e054f15d9092",
      "type": "FILE",
      "name": "flight-itinerary-quote.pdf",
      "url": "https://res.cloudinary.com/tripflow/image/upload/v1731924000/proofs/flight-itinerary-quote.pdf",
      "uploadedAt": "2026-11-18T10:00:00.000Z"
    }
  ],
  "expenses": [
    {
      "category": "FLIGHT",
      "merchant": "Singapore Airlines",
      "amount": 58000.00,
      "expense_date": "2026-11-20",
      "receipt_image_url": "https://res.cloudinary.com/tripflow/image/upload/v1731924000/proofs/sq-flight-quote.jpg",
      "notes": "Economy direct fare quote"
    },
    {
      "category": "HOTEL",
      "merchant": "Marina Bay Sands Business Suites",
      "amount": 34500.00,
      "expense_date": "2026-11-21",
      "receipt_image_url": "https://res.cloudinary.com/tripflow/image/upload/v1731924000/proofs/hotel-quote.jpg",
      "notes": "3 nights corporate rate"
    },
    {
      "category": "MEALS_PER_DIEM",
      "merchant": "Daily Per Diem Allowance",
      "amount": 10000.00,
      "expense_date": "2026-11-20",
      "notes": "4 days daily standard per diem"
    }
  ],
  "submit_now": true
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Travel request submitted for Manager review",
  "data": {
    "id": "c1f7b82e-9d2a-4335-b35f-900eeae24b56",
    "travel_type": "UPCOMING",
    "title": "Client Architecture Workshop - Singapore",
    "status": "PENDING_MANAGER_REVIEW",
    "total_expenses": 102500.00,
    "currency": "INR",
    "supporting_docs": [
      {
        "id": "f8a927c3-3e11-482a-9669-e054f15d9092",
        "name": "flight-itinerary-quote.pdf",
        "type": "FILE",
        "url": "https://res.cloudinary.com/tripflow/image/upload/v1731924000/proofs/flight-itinerary-quote.pdf"
      }
    ],
    "created_at": "2026-11-18T09:30:00.000Z"
  }
}
```

---

### 3. Fetch Role-Scoped Travel Requests

Retrieves travel requests filtered by the caller's role:
- **Employee**: Only requests submitted by the logged-in user.
- **Manager**: Requests submitted by direct reports assigned to this manager.
- **Admin**: All enterprise requests across all departments.

* **URL**: `/api/travel/requests`
* **Method**: `GET`
* **Access**: Protected (All authenticated roles)
* **Query Parameters**:
  - `status` (optional): Filter by state (e.g. `PENDING_MANAGER_REVIEW`, `PENDING_ADMIN_APPROVAL`)
  - `travel_type` (optional): `UPCOMING` or `ALREADY_TRAVELLED`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Travel requests retrieved successfully",
  "data": {
    "requests": [
      {
        "id": "c1f7b82e-9d2a-4335-b35f-900eeae24b56",
        "user_id": "e81d4f2e-b1a8-4c90-9ef2-1b1234567890",
        "requester_name": "Arun Kumar",
        "requester_department": "Engineering",
        "travel_type": "UPCOMING",
        "title": "Client Architecture Workshop - Singapore",
        "destination": "Singapore (SIN)",
        "departure_date": "2026-11-20",
        "return_date": "2026-11-24",
        "total_expenses": 102500.00,
        "currency": "INR",
        "status": "PENDING_MANAGER_REVIEW",
        "created_at": "2026-11-18T09:30:00.000Z"
      }
    ]
  }
}
```

---

### 4. Fetch Full Request Details & Audit Trail

Fetches detailed request information including all itemized expenses and the immutable timeline audit ledger.

* **URL**: `/api/travel/requests/:id`
* **Method**: `GET`
* **Access**: Protected (Requester, Line Manager, or Admin)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Travel request details fetched",
  "data": {
    "id": "c1f7b82e-9d2a-4335-b35f-900eeae24b56",
    "title": "Client Architecture Workshop - Singapore",
    "travel_type": "UPCOMING",
    "status": "PENDING_ADMIN_APPROVAL",
    "total_expenses": 102500.00,
    "currency": "INR",
    "supporting_docs": [
      {
        "id": "f8a927c3-3e11-482a-9669-e054f15d9092",
        "name": "flight-itinerary-quote.pdf",
        "url": "https://res.cloudinary.com/tripflow/image/upload/v1731924000/proofs/flight-itinerary-quote.pdf"
      }
    ],
    "expenses": [
      {
        "id": "d2a84920-1b5e-4c3d-8e4f-5a1290348712",
        "category": "FLIGHT",
        "merchant": "Singapore Airlines",
        "amount": 58000.00,
        "expense_date": "2026-11-20"
      }
    ],
    "timeline": [
      {
        "id": "a90b4321-7f8e-4a1b-9c2d-3e4f5a6b7c8d",
        "actor_role": "EMPLOYEE",
        "event_type": "SUBMITTED",
        "from_status": "DRAFT",
        "to_status": "PENDING_MANAGER_REVIEW",
        "created_at": "2026-11-18T09:30:00.000Z"
      },
      {
        "id": "b81c5432-8e9f-4b2c-0d3e-4f5a6b7c8d9e",
        "actor_role": "MANAGER",
        "event_type": "MANAGER_APPROVED",
        "from_status": "PENDING_MANAGER_REVIEW",
        "to_status": "PENDING_ADMIN_APPROVAL",
        "remarks": "Validated client itinerary. Approved within allowance.",
        "created_at": "2026-11-18T10:15:00.000Z"
      }
    ]
  }
}
```

---

### 5. Fetch Manager Audit Queue

Retrieves all requests waiting for Tier 1 Line Manager audit (`PENDING_MANAGER_REVIEW`).
- **Managers**: Automatically scoped to their direct reports (`users.manager_id = manager.id`) plus any unassigned employee requests.
- **Admins**: Have organization-wide visibility into all pending manager reviews.

* **URL**: `/api/travel/manager-queue`
* **Method**: `GET`
* **Access**: Authenticated (`MANAGER`, `ADMIN`)

---

### 6. Fetch Admin Governance Queue

Retrieves all travel requests that have passed Tier 1 Manager audit and are pending Tier 2 Admin executive clearance (`APPROVED`) or disbursement settlement (`SETTLED`).

* **URL**: `/api/travel/admin-queue`
* **Method**: `GET`
* **Access**: Authenticated (`ADMIN`)

---

### 7. Tier 1 Line Manager Review

Manager evaluates travel necessity and expense proofs. They can approve & forward to Admin, request revisions from the employee, or reject.

* **URL**: `/api/travel/requests/:id/manager-review`
* **Method**: `POST`
* **Access**: Authenticated (`MANAGER`, `ADMIN`)
* **Headers**: `Content-Type: application/json`

#### Request Payload: Approve & Forward
```json
{
  "action": "APPROVE_AND_FORWARD",
  "remarks": "Validated client need and project code. Approved within APAC engineering travel allowance."
}
```

#### Request Payload: Request Revision from Employee
```json
{
  "action": "REQUEST_REVISION",
  "remarks": "Please select the corporate standard hotel rate at Holiday Inn Express instead of Marina Bay Suites."
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Manager review action recorded",
  "data": {
    "id": "c1f7b82e-9d2a-4335-b35f-900eeae24b56",
    "status": "PENDING_ADMIN_APPROVAL",
    "manager_reviewed_at": "2026-11-18T10:15:00.000Z"
  }
}
```

---

### 8. Tier 2 Admin Governance Review (Dual-Route Revisions)

Admin audits departmental budget allocations and policy compliance. They can grant final clearance (`APPROVED`), authorize reimbursement payout (`SETTLED`), reject (`REJECTED`), or dispatch revision requests:
- **Route A (`revision_target: 'MANAGER'`):** Routes back to the Manager for renegotiation. Status: `REVISION_REQUESTED_BY_ADMIN_TO_MANAGER`.
- **Route B (`revision_target: 'EMPLOYEE'`):** Directs back to the Employee for receipts/proofs. Status: `REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE`.

* **URL**: `/api/travel/requests/:id/admin-review`
* **Method**: `POST`
* **Access**: Authenticated (`ADMIN`)
* **Headers**: `Content-Type: application/json`

#### Request Payload: Clear Upcoming Travel
```json
{
  "action": "APPROVE",
  "remarks": "Cleared for booking. Headroom validated against Engineering Q4 budget."
}
```
*Resulting Status*: `APPROVED`

#### Request Payload: Request Revision via Route B (Direct to Employee)
```json
{
  "action": "REQUEST_REVISION",
  "revision_target": "EMPLOYEE",
  "remarks": "Missing hotel GST tax breakdown on invoice #INV-492. Please attach itemized tax copy."
}
```
*Resulting Status*: `REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE`

---

### 9. Resubmit Revised Travel Request

When an employee modifies their request after receiving instructions (from either Manager or Admin), they resubmit using this endpoint.

> **CRITICAL INVARIANT**: Resubmission **ALWAYS transitions the status to `PENDING_MANAGER_REVIEW`**. It is strictly impossible for an employee to bypass the manager directly to Admin.

* **URL**: `/api/travel/requests/:id/resubmit`
* **Method**: `POST`
* **Access**: Authenticated (`EMPLOYEE`)
* **Headers**: `Content-Type: application/json`

#### Request Payload
```json
{
  "updated_expenses": [
    {
      "category": "HOTEL",
      "merchant": "Holiday Inn Express Clarke Quay",
      "amount": 22000.00,
      "expense_date": "2026-11-21",
      "receipt_image_url": "https://res.cloudinary.com/tripflow/image/upload/v1731924000/proofs/holiday-inn-quote.jpg",
      "notes": "Revised hotel booking to corporate approved rate"
    }
  ],
  "employee_response_notes": "Updated hotel selection as requested, saving ₹12,500.00."
}
```

---

### 10. Cancel Travel Request

Allows the requester to cancel a request before final clearance or settlement.

* **URL**: `/api/travel/requests/:id/cancel`
* **Method**: `POST`
* **Access**: Authenticated (`EMPLOYEE`)
* **Headers**: `Content-Type: application/json`

---

### 11. Department Budget Management (`/api/travel/budgets`)

#### A. Fetch Department Budget Headroom
* **URL**: `/api/travel/budgets`
* **Method**: `GET`
* **Access**: Authenticated (`MANAGER`, `ADMIN`)
* **Query Parameters**: `department` (optional), `year` (optional), `quarter` (optional)

#### B. Fetch Multi-Quarter Budget Overview
* **URL**: `/api/travel/budgets/overview`
* **Method**: `GET`
* **Access**: Authenticated (`ADMIN`)

#### C. Upsert Department Quarterly Budget Allocation
* **URL**: `/api/travel/budgets`
* **Method**: `PUT`
* **Access**: Authenticated (`ADMIN`)
* **Headers**: `Content-Type: application/json`

```json
{
  "department": "Engineering",
  "fiscal_year": 2026,
  "fiscal_quarter": "Q4",
  "total_allocation": 4000000.00
}
```

---

### 12. User Administration Endpoints (`/api/users`)

#### A. List Users
* **URL**: `/api/users`
* **Method**: `GET`
* **Access**: Authenticated (`ADMIN`)

#### B. Create New User
* **URL**: `/api/users`
* **Method**: `POST`
* **Access**: Authenticated (`ADMIN`)
* **Payload**:
```json
{
  "name": "Priya Sharma",
  "email": "priya.sharma@corp.com",
  "password": "TemporaryPassword123!",
  "role": "EMPLOYEE",
  "department": "Engineering",
  "manager_id": "e81d4f2e-b1a8-4c90-9ef2-1b1234567890"
}
```

#### C. Toggle User Active Status
* **URL**: `/api/users/:id/status`
* **Method**: `PATCH`
* **Access**: Authenticated (`ADMIN`)
* **Payload**: `{ "is_active": false }`

#### D. Update User Details
* **URL**: `/api/users/:id`
* **Method**: `PATCH`
* **Access**: Authenticated (`ADMIN`)
* **Payload**: `{ "name": "Priya Sharma", "department": "Product", "manager_id": "..." }`

#### E. Delete User
* **URL**: `/api/users/:id`
* **Method**: `DELETE`
* **Access**: Authenticated (`ADMIN`)

---

## 🔒 Security & Role Guard Middleware

All protected endpoints enforce:
1. **JWT Verification**: Resolves user UUID and role via `HttpOnly` cookie or Bearer authorization header.
2. **Role Authorization (`requireRole`)**:
   - `requireRole(['MANAGER', 'ADMIN'])` blocks unauthorized Employee attempts with `403 Forbidden`.
   - `requireRole(['ADMIN'])` blocks Manager attempts to access user administration or modify corporate budgets.
3. **Data Access Scoping**: Users can never access or modify travel requests belonging to other reporting trees without administrative privileges.
