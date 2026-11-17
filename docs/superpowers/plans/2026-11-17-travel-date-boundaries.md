# Travel Date Boundaries Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce strict temporal validation rules for "Plan Upcoming Trip" (`UPCOMING`) and "Claim Past Travel" (`ALREADY_TRAVELLED`) across backend validators, client Zod schemas, and UI date pickers to prevent business logic bypasses and premature reimbursement payouts.

**Architecture:** 
- **Backend Layer:** Enhance `travel.validation.ts` with temporal boundary checks matching request `travel_type` against current date (`today`), returning explicit error messages.
- **Client Schema Layer:** Enhance `useTravelForm.ts` Zod schema using `.superRefine()` to validate departure, return, and expense dates reactively against the selected `travel_type`.
- **UI Logistics Layer:** Update `TravelLogisticsFields.tsx` and `ExpenseRowItem.tsx` to bind HTML5 `min` and `max` constraints dynamically based on `travel_type` and counterpart date selections.
- **TDD Workflow:** Red tests created first in both server test suite and client test suite, followed by minimal implementation and verification.

**Tech Stack:** Node.js, Express, TypeScript, Zod, React Hook Form, HTML5 date input constraints, `node:assert/strict` test runner with TSX.

**Spec / Business Context:**
- `UPCOMING` = Pre-trip travel authorization: `departure_date >= today`, `return_date >= departure_date`.
- `ALREADY_TRAVELLED` = Post-trip reimbursement claim: `return_date <= today`, `departure_date <= return_date`, all expense item dates `<= today`.
- Admin approval of `ALREADY_TRAVELLED` automatically triggers immediate `SETTLED` status (payout); future dates on post-trip claims represent a financial vulnerability.

---

### Backend Feasibility & Risk Index (BFRI)

| Dimension | Rating (1-5) | Rationale |
| :--- | :---: | :--- |
| **Architectural Fit** | 5 | Clean integration directly within existing `travel.validation.ts` and request schemas. |
| **Business Logic Complexity** | 2 | Simple calendar boundary comparisons (`YYYY-MM-DD` string/Date checks). |
| **Data Risk** | 1 | No DB schema changes required; non-destructive validation layer enhancement. |
| **Operational Risk** | 2 | Prevents illegal records; ensures existing endpoints reject invalid historical or future claims. |
| **Testability** | 5 | Fully deterministic unit tests for every date boundary and permutation. |

**BFRI Score:** `(5 + 5) - (2 + 1 + 2) = +5 (Safe / Moderate)`

---

## File Structure & Responsibilities

| File Path | Action | Responsibility |
| :--- | :--- | :--- |
| `server/src/features/travel/travel.validation.ts` | Modify | Add temporal validation logic for `UPCOMING` and `ALREADY_TRAVELLED` in `validateCreateRequestPayload` and `validateResubmitPayload`. |
| `server/tests/travel-date-boundaries.test.ts` | Create | Server unit tests for temporal constraints (RED then GREEN). |
| `client/src/features/travel/hooks/useTravelForm.ts` | Modify | Add Zod `superRefine` temporal rules; adjust default dates based on `initialType` and type changes. |
| `client/src/features/travel/components/forms/TravelLogisticsFields.tsx` | Modify | Accept `travelType` and apply reactive `min` and `max` bounds to departure and return date inputs. |
| `client/src/features/travel/components/forms/ExpenseRowItem.tsx` | Modify | Accept `maxDate` constraint for expense date picker (capped at `today` for `ALREADY_TRAVELLED`). |
| `client/src/features/travel/components/forms/DynamicExpenseTable.tsx` | Modify | Propagate `travelType` / `maxDate` down to `ExpenseRowItem`. |
| `client/src/features/travel/pages/NewTravelRequestPage.tsx` | Modify | Reset or adjust dates when switching between Upcoming and Past travel types so the form remains valid. |
| `client/tests/travel-form-date-validation.test.ts` | Create | Client unit tests verifying Zod schema validation under both travel types (RED then GREEN). |

---

## Tasks

### Task 1: Server-Side Date Boundary Validation (TDD)

- [x] **Step 1.1: Write failing server test for travel date boundaries**
- [x] **Step 1.2: Run test to verify RED state**
- [x] **Step 1.3: Implement validation logic in `travel.validation.ts`**
- [x] **Step 1.4: Run test to verify GREEN state**
- [x] **Step 1.5: Run existing backend test suites to ensure no regressions**

---

### Task 2: Client-Side Zod Schema Validation & Default State (TDD)

- [x] **Step 2.1: Write failing client test for form schema date boundaries**
- [x] **Step 2.2: Run client test to verify RED state**
- [x] **Step 2.3: Update `travelFormSchema` and `useTravelForm` in `client/src/features/travel/hooks/useTravelForm.ts`**
- [x] **Step 2.4: Run client test to verify GREEN state**

---

### Task 3: UI Date Constraints & Type-Toggle Synchronization

- [x] **Step 3.1: Update `TravelLogisticsFields.tsx`**
- [x] **Step 3.2: Update `ExpenseRowItem.tsx` & `DynamicExpenseTable.tsx`**
- [x] **Step 3.3: Handle Type Toggle Switching in `NewTravelRequestPage.tsx`**
- [x] **Step 3.4: Verify frontend builds and linting passes**

---

### Task 4: End-to-End Verification & Documentation

- [x] **Step 4.1: Run full server and client test suites**
- [x] **Step 4.2: Audit verification checklist**
