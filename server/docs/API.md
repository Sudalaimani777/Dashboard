# TripFlow API Documentation

Comprehensive REST API documentation for the **TripFlow** Corporate Travel & Expense Governance platform, including User Authentication, Two-Tier Travel Authorization, and Expense Reimbursement services.

---

## 📌 Overview & Base Configuration

* **Base URL**: `http://localhost:5000/api`
* **Protocol**: HTTP / JSON
* **Authentication**: **HttpOnly Cookies** (`Cookie: token=...`) with optional Bearer Token fallback (`Authorization: Bearer <token>`)
* **Default Port**: `5000` (Configurable via `PORT` in `.env`)
* **Currency Standard**: All monetary calculations and representations are stored in **Indian Rupees (`INR`)** and formatted as `₹` with tabular numbers.
* **Role Hierarchy**:
  - `EMPLOYEE`: Can create, draft, submit, and resubmit travel requests & expenses.
  - `MANAGER`: Tier 1 direct line authority. Audits itineraries and proofs, requests modifications, or approves & forwards to Admin.
  - `ADMIN`: Tier 2 executive and finance authority. Audits budget impact, grants final clearance (`APPROVED`), settles payouts (`SETTLED`), or requests revisions.

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

### Authentication & User Endpoints
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Service & PostgreSQL health check |
| `POST` | `/auth/signup` | Public | Register new user account (`EMPLOYEE`, `MANAGER`, `ADMIN`) |
| `POST` | `/auth/signin` | Public | Authenticate credentials & issue HttpOnly session cookie |
| `POST` | `/auth/signout` | Public | Invalidate & clear session cookie |
| `GET` | `/auth/me` | Protected | Fetch authenticated user profile & permissions |
| `POST` | `/auth/forgot-password` | Public | Request password recovery email (anti-enumeration protected) |
| `POST` | `/auth/reset-password` | Public | Reset password using single-use SHA-256 token |

### Travel Governance & Expense Endpoints
| Method | Endpoint | Role Guard | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/travel/requests` | `EMPLOYEE` | Create new travel request with upfront itemized expenses & proof URLs |
| `GET` | `/travel/requests` | All Roles | Fetch role-scoped requests (Employee: own; Manager: team; Admin: all) |
| `GET` | `/travel/requests/:id` | All Roles | Fetch full request details, itemized expenses, and timeline audit ledger |
| `PUT` | `/travel/requests/:id/submit` | `EMPLOYEE` | Submit a draft request for Tier 1 Manager review |
| `POST` | `/travel/requests/:id/manager-review` | `MANAGER` | Tier 1 review: `APPROVE_AND_FORWARD` or `REQUEST_REVISION` |
| `POST` | `/travel/requests/:id/manager-forward-revision` | `MANAGER` | Forward Admin revision instructions to Employee with enriched guidance |
| `POST` | `/travel/requests/:id/admin-review` | `ADMIN` | Tier 2 review: `APPROVE`, `SETTLE`, `REJECT`, or `REQUEST_REVISION` (Route A or B) |
| `POST` | `/travel/requests/:id/resubmit` | `EMPLOYEE` | Resubmit altered request (always returns to Manager for re-verification) |
| `GET` | `/travel/budgets` | `MANAGER`, `ADMIN` | Fetch department budget headroom and utilization in INR (`₹`) |

---

## 📡 Detailed Endpoint Specifications

### 1. Create Travel Request with Upfront Expenses

Creates a travel request. Both `UPCOMING` (pre-trip authorization) and `ALREADY_TRAVELLED` (post-trip reimbursement) require upfront itemized expenses with attachment image URLs (quotations or receipts).

* **URL**: `/travel/requests`
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
  "supporting_doc_url": "https://storage.tripflow.internal/itineraries/sin-workshop-v1.pdf",
  "expenses": [
    {
      "category": "FLIGHT",
      "merchant": "Singapore Airlines",
      "amount": 58000.00,
      "expense_date": "2026-11-20",
      "receipt_image_url": "https://storage.tripflow.internal/quotes/sq-flight-quote.jpg",
      "notes": "Economy direct fare quote"
    },
    {
      "category": "HOTEL",
      "merchant": "Marina Bay Sands Business Suites",
      "amount": 34500.00,
      "expense_date": "2026-11-21",
      "receipt_image_url": "https://storage.tripflow.internal/quotes/hotel-quote.jpg",
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
    "created_at": "2026-11-09T09:30:00.000Z"
  }
}
```

---

### 2. Fetch Role-Scoped Travel Requests

Retrieves travel requests filtered by the caller's role:
- **Employee**: Only requests submitted by the logged-in user.
- **Manager**: Requests submitted by direct reports assigned to this manager.
- **Admin**: All enterprise requests across all departments.

* **URL**: `/travel/requests`
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
        "created_at": "2026-11-09T09:30:00.000Z"
      }
    ]
  }
}
```

---

### 3. Tier 1 Line Manager Review

Manager evaluates travel necessity and expense proofs. They can either approve & forward to Admin, or send modification instructions to the Employee.

* **URL**: `/travel/requests/:id/manager-review`
* **Method**: `POST`
* **Access**: Authenticated (`MANAGER`)
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
  "message": "Request approved and escalated to Admin",
  "data": {
    "id": "c1f7b82e-9d2a-4335-b35f-900eeae24b56",
    "status": "PENDING_ADMIN_APPROVAL",
    "manager_reviewed_at": "2026-11-09T10:00:00.000Z"
  }
}
```

---

### 4. Tier 2 Admin Governance Review

Admin audits budget allocations and compliance. They can grant final clearance, authorize reimbursement payout, reject, or request revisions.

* **URL**: `/travel/requests/:id/admin-review`
* **Method**: `POST`
* **Access**: Authenticated (`ADMIN`)
* **Headers**: `Content-Type: application/json`

#### Action A: Final Clearance (Upcoming Travel)
```json
{
  "action": "APPROVE",
  "remarks": "Cleared for booking. Headroom validated against Engineering Q4 budget."
}
```
*Resulting Status*: `APPROVED`

#### Action B: Reimbursement Settlement (Already Travelled)
```json
{
  "action": "SETTLE",
  "remarks": "Tax invoices audited and approved. Payment scheduled for next payroll disbursement."
}
```
*Resulting Status*: `SETTLED`

#### Action C: Request Revision via Route A (Via Manager)
```json
{
  "action": "REQUEST_REVISION",
  "revision_target": "MANAGER",
  "remarks": "Flight fare exceeds corporate ceiling. Manager please review alternate departure timings."
}
```
*Resulting Status*: `REVISION_REQUESTED_BY_ADMIN_TO_MANAGER`

#### Action D: Request Revision via Route B (Direct to Employee)
```json
{
  "action": "REQUEST_REVISION",
  "revision_target": "EMPLOYEE",
  "remarks": "Missing hotel GST tax breakdown on invoice #INV-492. Please attach itemized tax copy."
}
```
*Resulting Status*: `REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE`

---

### 5. Resubmit Revised Travel Request

When an employee modifies their request after receiving instructions (from either Manager or Admin), they resubmit using this endpoint.

> **CRITICAL INVARIANT**: Resubmission **ALWAYS transitions the status to `PENDING_MANAGER_REVIEW`**. It is mathematically impossible for an employee to bypass the manager directly to Admin.

* **URL**: `/travel/requests/:id/resubmit`
* **Method**: `POST`
* **Access**: Authenticated (`EMPLOYEE`)
* **Headers**: `Content-Type: application/json`

#### Request Payload
```json
{
  "departure_date": "2026-11-20",
  "return_date": "2026-11-24",
  "updated_expenses": [
    {
      "category": "HOTEL",
      "merchant": "Holiday Inn Express Clarke Quay",
      "amount": 22000.00,
      "expense_date": "2026-11-21",
      "receipt_image_url": "https://storage.tripflow.internal/quotes/holiday-inn-quote.jpg",
      "notes": "Revised hotel booking to corporate approved rate"
    }
  ],
  "employee_response_notes": "Updated hotel selection as requested, saving ₹12,500.00."
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Revised request resubmitted to Manager for re-verification",
  "data": {
    "id": "c1f7b82e-9d2a-4335-b35f-900eeae24b56",
    "status": "PENDING_MANAGER_REVIEW",
    "total_expenses": 90000.00,
    "currency": "INR"
  }
}
```

---

### 6. Department Budget Headroom

Retrieves real-time departmental budget utilization vs fiscal allocations in Indian Rupees (`₹`).

* **URL**: `/travel/budgets`
* **Method**: `GET`
* **Access**: Authenticated (`MANAGER`, `ADMIN`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "department": "Engineering",
    "fiscal_year": 2026,
    "fiscal_quarter": "Q4",
    "total_allocation": 3500000.00,
    "utilized_amount": 1420000.00,
    "available_headroom": 2080000.00,
    "currency": "INR",
    "utilization_percentage": 40.57
  }
}
```

---

## 🔒 Security & Role Guard Middleware

All protected endpoints enforce:
1. **JWT Verification**: Resolves user UUID and role via HttpOnly cookie or Bearer authorization header.
2. **Role Authorization (`requireRole`)**:
   - `requireRole(['MANAGER'])` blocks unauthorized Employee attempts with `403 Forbidden`.
   - `requireRole(['ADMIN'])` blocks Manager attempts to approve budgets or settle disbursements.
3. **Data Access Scoping**: Users can never access or modify travel requests belonging to other departments or reporting trees.
