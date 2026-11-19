# Architectural Design Specification: Transactional Notifications, SSE & SwipeToast

**Document ID**: `SPEC-2026-11-19-NOTIFICATIONS-SSE-TOAST`  
**Status**: `PROPOSED / APPROVED BY USER`  
**Target Branch**: `feature/transactional-notifications`  
**Author**: Antigravity Assistant & Sudalaimani Kannan  
**Audited Against**: OWASP API Security Top 10, RFC 8895 (Server-Sent Events), W3C Web Audio API, Stripe Design System Tokens  

---

## 1. Executive Summary & Core Requirements

TripFlow manages high-stakes corporate travel authorization and expense governance workflows. Up to now, state transitions (submitting travel, requesting revisions, approving itineraries, and disbursing reimbursements) relied entirely on passive discovery: reviewers and employees had to log in and manually check specific filtered queues.

The **Transactional Notifications & In-App Alerts** system introduces an event-driven dual-channel communication engine:
1. **Real-time Server-Sent Events (SSE)** delivering live alerts within milliseconds to active sessions.
2. **Audio Chime** using the browser's native Web Audio API (zero external `.mp3` dependencies).
3. **Interactive `<SwipeToast />`** based on React Bits with an 8-second auto-dismiss fuse, pause-on-hover, swipe-to-dismiss, and explicit "✕" close button.
4. **Click-to-Redirect**: Clicking any toast immediately redirects the user to the dedicated **Notifications Hub Page** (`/dashboard?tab=notifications`).
5. **Dynamic Role Sidebar Integration**: A permanent **Notifications** tab with a Bell icon (`Bell` from `lucide-react`) and dynamic unread counter badge placed in `DynamicRoleSidebar.tsx` (no top-header bell).
6. **Transactional HTML Email Notifications**: Dispatched via `EmailService` using Gmail SMTP for all mission-critical governance milestones.

---

## 2. Technical Invariants & Security Architecture (`fullstack-security-auditor`)

### 2.1 Threat Modeling & Defenses (OWASP Alignment)

| Threat & OWASP Category | Attack Vector | Security Defense in TripFlow |
| :--- | :--- | :--- |
| **BOLA / IDOR on Notifications**<br>*(OWASP API1:2023 - Broken Object Level Authorization)* | A user manipulates `notificationId` in `PATCH /api/notifications/:id/read` to mark or read another user's notifications. | **Strict Ownership Enforcement**: Database queries enforce `WHERE id = $1 AND user_id = $2`. Users can only view, read, or clear notifications explicitly belonging to their `auth.userId`. |
| **SSE Connection Hijacking & Leaks**<br>*(OWASP API2:2023 - Broken Authentication)* | Unauthenticated or cross-tenant client subscribes to SSE stream to intercept sensitive financial notifications. | **Authenticated SSE Handshake**: `GET /api/notifications/stream` is protected by `requireAuth` checking the HttpOnly signed session cookie. The connection is mapped strictly to `req.user.id`. |
| **Denial of Service via SSE Leak**<br>*(Resource Exhaustion)* | Dropped browser connections accumulate indefinitely in Node.js memory. | **Client Heartbeat & Cleanup**: Express registers `req.on('close', ...)` to purge dropped streams immediately. Periodic ping comments (`: ping\n\n`) verify network vitality every 25 seconds. |
| **Spam / Email Flooding**<br>*(Rate Limiting & Redundancy)* | Rapid state changes trigger hundreds of redundant emails. | **State Machine Deduplication**: Emails and notifications are only dispatched on valid, audited transitions verified by `validateStatusTransition()`. |
| **Cross-Site Scripting (XSS)**<br>*(OWASP A03:2021 - Injection)* | Malicious input in traveler remarks or trip title executed in toast or notification hub. | **React Escaping & HTML Sanitization**: All notifications render via React JSX safely escaping text nodes. HTML email templates escape dynamic variables. |

---

## 3. Database Architecture & Schema Changes

### 3.1 Migration `006_create_notifications_table.sql`

```sql
-- server/src/shared/db/migrations/006_create_notifications_table.sql

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  request_id UUID REFERENCES travel_requests(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, 
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link_url VARCHAR(255) NOT NULL DEFAULT '/dashboard?tab=notifications',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for high-performance retrieval and badge counting
CREATE INDEX IF NOT EXISTS idx_notifications_user_lookup 
  ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_request 
  ON notifications(request_id);
```

### 3.2 Notification Types Matrix

| Notification `type` | Target Recipient | Trigger Event | Link Destination |
| :--- | :--- | :--- | :--- |
| `TRAVEL_SUBMITTED` | Assigned Line Manager (`MANAGER`) | Employee submits new travel request | `/dashboard?tab=notifications` |
| `REVISION_REQUESTED` | Requester (`EMPLOYEE`) | Manager or Admin requests changes | `/dashboard?tab=notifications` |
| `RESUBMITTED` | Reviewing Manager (`MANAGER`) | Employee resubmits altered itinerary | `/dashboard?tab=notifications` |
| `TRAVEL_APPROVED` | Requester (`EMPLOYEE`) + Manager | Admin clears upcoming trip | `/dashboard?tab=notifications` |
| `TRAVEL_SETTLED` | Requester (`EMPLOYEE`) | Admin clears past reimbursement | `/dashboard?tab=notifications` |
| `TRAVEL_REJECTED` | Requester (`EMPLOYEE`) | Manager or Admin denies request | `/dashboard?tab=notifications` |
| `MANAGER_OVERSIGHT` | All Admins (`ADMIN`) | Manager submits personal travel | `/dashboard?tab=notifications` |

---

## 4. Backend Implementation Specification

### 4.1 Server-Sent Events (SSE) Stream Registry (`notificationStream.ts`)

```ts
// server/src/features/notifications/notificationStream.ts
import type { Response } from 'express';

class NotificationStreamRegistry {
  private clients = new Map<string, Set<Response>>();

  addClient(userId: string, res: Response) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(res);
  }

  removeClient(userId: string, res: Response) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) this.clients.delete(userId);
    }
  }

  broadcastToUser(userId: string, data: any) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) return;
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of userClients) {
      client.write(payload);
    }
  }
}

export const sseRegistry = new NotificationStreamRegistry();
```

### 4.2 REST API Routes (`server/src/features/notifications/`)

1. `GET /api/notifications/stream`:
   - Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.
   - Sends initial ping and registers client in `sseRegistry`.
   - Registers 25-second interval heartbeat.
2. `GET /api/notifications`:
   - Returns `{ notifications: Notification[], unreadCount: number }`.
3. `PATCH /api/notifications/:id/read`:
   - Marks specific item read where `user_id = req.user.id`.
4. `PATCH /api/notifications/read-all`:
   - Updates all unread notifications for `req.user.id` to `is_read = true`.

### 4.3 Transactional Email Templates (`email.service.ts`)

Adds responsive HTML emails matching Stripe Design system colors (`#533AFD` primary, `#061B31` ink, `#F8FAFC` background):
- `sendTravelSubmittedEmail(managerEmail, managerName, requesterName, trip)`
- `sendRevisionRequestedEmail(employeeEmail, employeeName, actorName, remarks, trip)`
- `sendTravelApprovedEmail(employeeEmail, employeeName, trip)`
- `sendTravelSettledEmail(employeeEmail, employeeName, trip)`
- `sendTravelRejectedEmail(employeeEmail, employeeName, reason, trip)`

---

## 5. Frontend Implementation Specification

### 5.1 Native Web Audio Chime (`client/src/shared/utils/audioChime.ts`)

Uses W3C Web Audio API to create a gentle, high-end double glass chime:
```ts
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    
    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Tone 2: 880.00 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.08);
    gain2.gain.setValueAtTime(0.12, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch (err) {
    console.debug('Web Audio not allowed before user interaction:', err);
  }
}
```

### 5.2 React Bits `<SwipeToast />` Integration

Files:
- `client/src/shared/components/toast/SwipeToast.tsx`
- `client/src/shared/components/toast/SwipeToast.css`
- `client/src/shared/context/ToastContext.tsx`

Toast configuration:
- `duration={8000}` (8 seconds auto-dismiss)
- `closeButton={true}` (explicit close button)
- `fuse="bottom"` with dynamic fuse colors:
  - Default: `#533AFD` (TripFlow Brand Indigo)
  - Revision Required: `#F59E0B` (Governance Amber)
  - Approval / Settled: `#10B981` (Emerald Success)
  - Rejected: `#EF4444` (Destructive Red)
- `pauseOnHover={true}`
- `swipeDistance={40}`
- **Card Click Handler**:
  - Clicking anywhere on the toast card navigates directly to `/dashboard?tab=notifications`.

### 5.3 Dynamic Sidebar Item (`DynamicRoleSidebar.tsx`)

In `DynamicRoleSidebar.tsx`, add a permanent notification item with live badge count:
- Label: `"Notifications"`
- Icon: `Bell` from `lucide-react`
- Count: `unreadCount`
- CountType: `countType: hasRevisions ? 'danger' : 'warning'`
- Navigates on click to: `/dashboard?tab=notifications`

### 5.4 Notification Hub View (`NotificationsHubPage.tsx`)

A dedicated workstation view rendered at `/dashboard?tab=notifications`:
- Filter buttons: `All` | `Unread` | `Action Required`
- Action header: **"Mark all as read"** (triggers `PATCH /api/notifications/read-all`)
- Card layout:
  - Left indicator: Colored pill / icon
  - Title: Bold font-semibold
  - Description: Summary of message & remarks
  - Timestamp: Relative formatting (`just now`, `5 mins ago`, `Yesterday`)
  - CTA Button: "Open Trip Details →" (navigates to `/travel/requests/:id`)

---

## 6. Testing & Verification Plan

### 6.1 Backend Tests (`server/tests/`)
1. **`notifications-api.test.ts`**:
   - Verify unauthenticated requests to `/api/notifications/stream` and `/api/notifications` receive 401 Unauthorized.
   - Verify creating notifications stores rows correctly in PostgreSQL.
   - Verify `PATCH /api/notifications/:id/read` marks notification read.
   - Verify `PATCH /api/notifications/read-all` updates all items for the user.
   - Verify tenant isolation (User A cannot mark User B's notification read).

### 6.2 Frontend Tests (`client/tests/`)
1. **`audio-chime.test.ts`**: Verifies AudioContext initializes safely without throwing.
2. **`toast-integration.test.ts`**: Verifies SwipeToast mounts, renders with 8s fuse, and triggers navigation on click.
3. **`notifications-sidebar.test.ts`**: Verifies dynamic sidebar displays unread notification badge.

---

## 7. Implementation Phasing

1. **Phase 1: DB Migration**: Create `006_create_notifications_table.sql` and run migration.
2. **Phase 2: Backend Notification Service & SSE Stream**:
   - Create `NotificationService` and `sseRegistry`.
   - Implement `GET /api/notifications/stream` and REST CRUD routes.
3. **Phase 3: Hooking Workflow Events**:
   - Connect `TravelService` transitions (create, approve, revise, settle, reject) to `NotificationService.notify()`.
   - Add transactional email triggers in `EmailService`.
4. **Phase 4: Client Audio & `<SwipeToast />` Integration**:
   - Install `@hugeicons/react` and `@hugeicons/core-free-icons`.
   - Implement `audioChime.ts` and `ToastContext`.
   - Connect client-side SSE listener `useNotifications.ts`.
5. **Phase 5: Dynamic Sidebar & Notifications Hub Page**:
   - Add Notifications item with unread badge to `DynamicRoleSidebar.tsx`.
   - Build `NotificationsHubPage.tsx` at `/dashboard?tab=notifications`.
6. **Phase 6: Automated Verification**:
   - Run backend and client verification tests and build checks.
