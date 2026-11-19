# Transactional Notifications, SSE & SwipeToast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an end-to-end event-driven transactional notification system featuring real-time Server-Sent Events (SSE), Web Audio API chimes, React Bits `<SwipeToast />` with 8s fuse and click-to-redirect, persistent PostgreSQL storage, dynamic sidebar badge integration, a dedicated Notifications Hub workstation, and transactional HTML emails.

**Architecture:** A domain event triggered in `TravelService` dispatches through `NotificationService`, writing a row to PostgreSQL `notifications` and simultaneously broadcasting via SSE (`notificationStream`) to active user clients while sending an HTML email via `EmailService`. On the client, `useNotifications` listens to the SSE stream, triggers the Web Audio glass chime, spawns `<SwipeToast />` (which redirects on click to `/dashboard?tab=notifications`), and dynamically updates the sidebar unread pill badge.

**Tech Stack:** Node.js, Express 5, PostgreSQL 14+, Server-Sent Events (SSE), Nodemailer, React 19, Vite 8, Tailwind CSS v4, motion, `@hugeicons/react`, Web Audio API, Stripe Design System tokens.

**Spec:** `docs/superpowers/specs/2026-11-19-transactional-notifications-design.md`

## Global Constraints

- Database table names: snake_case (`notifications`).
- Code style: TypeScript with strict ESM (`.js` imports on server).
- Design system: Stripe tokens (`#533AFD`, `#061B31`, `#CBD5E1`, `#F8FAFC`).
- Monospace tabular figures (`font-mono tabular-nums`) for currency values and time metadata.
- Audio: Native Web Audio API synthesis only — zero external `.mp3` or `.wav` dependencies.
- Toast duration: Exactly 8,000ms (`duration={8000}`).
- Sidebar: Bell icon placed strictly in `DynamicRoleSidebar.tsx` — do not add a bell to the top header.
- Security: Parameterized SQL queries only, authenticated SSE stream handshake, strict tenant isolation (`WHERE user_id = req.user.id`).

## Review Focus

- Client disconnects while SSE connection is open: Server must cleanly remove stream from memory (`req.on('close')`) without memory leaks.
- Autoplay policy blocks Web Audio API before user gesture: `audioChime.ts` must catch errors gracefully without breaking toast rendering.
- Multiple browser tabs open for same user: SSE broadcast must deliver notifications to all active tabs of that user.
- High-frequency notifications: Toast container must stack multiple toasts cleanly without overlapping.
- Rapid click on "Mark all as read": Backend must execute atomic query and update all rows without race conditions.

---

### Task 1: Database Migration `006_create_notifications_table.sql`

**Files:**
- Create: `server/src/shared/db/migrations/006_create_notifications_table.sql`
- Create: `server/tests/migration-006.test.ts`

- [ ] **Step 1: Write the failing migration test**
  Create `server/tests/migration-006.test.ts` verifying that applying migration 006 creates the `notifications` table with columns `id`, `user_id`, `actor_id`, `request_id`, `type`, `title`, `message`, `link_url`, `is_read`, `created_at` and indexes.

- [ ] **Step 2: Run test to confirm it fails**
  Run `npx tsx server/tests/migration-006.test.ts` and verify it fails (table does not exist yet).

- [ ] **Step 3: Write migration SQL**
  Create `server/src/shared/db/migrations/006_create_notifications_table.sql`:
  ```sql
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

  CREATE INDEX IF NOT EXISTS idx_notifications_user_lookup 
    ON notifications(user_id, is_read, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_notifications_request 
    ON notifications(request_id);
  ```

- [ ] **Step 4: Run migration and verify test passes**
  Run `cd server; npm run migrate` then `npx tsx tests/migration-006.test.ts`. Verify green test.

- [ ] **Step 5: Commit**
  `git add server/src/shared/db/migrations/006_create_notifications_table.sql server/tests/migration-006.test.ts; git commit -m "feat(db): add migration 006 for notifications table"`

---

### Task 2: Notification Repository & Data Access Layer

**Files:**
- Create: `server/src/features/notifications/notification.types.ts`
- Create: `server/src/features/notifications/notification.repository.ts`
- Create: `server/tests/notification-repo.test.ts`

- [ ] **Step 1: Write notification types**
  Define `Notification`, `NotificationType`, `CreateNotificationInput` in `server/src/features/notifications/notification.types.ts`.

- [ ] **Step 2: Write failing repository unit test**
  Create `server/tests/notification-repo.test.ts` testing:
  - `create(input)` persists notification row.
  - `getByUserId(userId, limit, offset)` returns notifications and unread count.
  - `markAsRead(id, userId)` marks single notification as read.
  - `markAllAsRead(userId)` marks all unread as read.
  - Tenant isolation check (cannot mark other user's notification).

- [ ] **Step 3: Run repository test to confirm it fails**
  Run `cd server; npx tsx tests/notification-repo.test.ts`.

- [ ] **Step 4: Implement NotificationRepository**
  Implement parameterized queries in `server/src/features/notifications/notification.repository.ts` matching interface.

- [ ] **Step 5: Run repository test and verify it passes**
  Run `cd server; npx tsx tests/notification-repo.test.ts`.

- [ ] **Step 6: Commit**
  `git add server/src/features/notifications/ server/tests/notification-repo.test.ts; git commit -m "feat(notifications): implement NotificationRepository with tenant isolation"`

---

### Task 3: Real-Time SSE Stream Registry & Broadcast Hub

**Files:**
- Create: `server/src/features/notifications/notificationStream.ts`
- Create: `server/tests/notification-stream.test.ts`

- [ ] **Step 1: Write failing SSE registry unit test**
  Create `server/tests/notification-stream.test.ts` testing client registration, heartbeats, and user-scoped broadcasts.

- [ ] **Step 2: Run test to confirm it fails**
  Run `cd server; npx tsx tests/notification-stream.test.ts`.

- [ ] **Step 3: Implement NotificationStreamRegistry**
  Create `server/src/features/notifications/notificationStream.ts` with:
  - `addClient(userId, res)`
  - `removeClient(userId, res)`
  - `broadcastToUser(userId, data)`
  - Keep-alive heartbeat interval (`: ping\n\n` every 25s)

- [ ] **Step 4: Run test to verify it passes**
  Run `cd server; npx tsx tests/notification-stream.test.ts`.

- [ ] **Step 5: Commit**
  `git add server/src/features/notifications/notificationStream.ts server/tests/notification-stream.test.ts; git commit -m "feat(notifications): implement SSE stream registry and broadcast hub"`

---

### Task 4: Transactional Email Templates in `EmailService`

**Files:**
- Modify: `server/src/shared/services/email.service.ts`
- Create: `server/tests/email-notifications.test.ts`

- [ ] **Step 1: Write failing email service test**
  Create `server/tests/email-notifications.test.ts` testing HTML email dispatch for:
  - Travel submission (to manager)
  - Revision requested (to employee)
  - Travel approved (to employee)
  - Travel settled (to employee)
  - Travel rejected (to employee)

- [ ] **Step 2: Run test to confirm failure**
  Run `cd server; npx tsx tests/email-notifications.test.ts`.

- [ ] **Step 3: Implement transactional email methods in `EmailService`**
  Add styled HTML email dispatch methods to `server/src/shared/services/email.service.ts`.

- [ ] **Step 4: Run test to verify it passes**
  Run `cd server; npx tsx tests/email-notifications.test.ts`.

- [ ] **Step 5: Commit**
  `git add server/src/shared/services/email.service.ts server/tests/email-notifications.test.ts; git commit -m "feat(email): add transactional travel lifecycle email templates"`

---

### Task 5: Notification Service & Workflow Event Hooks

**Files:**
- Create: `server/src/features/notifications/notification.service.ts`
- Modify: `server/src/features/travel/travel.service.ts`
- Create: `server/tests/workflow-notifications.test.ts`

- [ ] **Step 1: Write failing workflow notification integration test**
  Create `server/tests/workflow-notifications.test.ts` testing that:
  - Submitting request creates notification for line manager and triggers email.
  - Manager requesting revision creates notification for employee.
  - Admin approving request creates notification for employee and manager.
  - Manager personal travel triggers oversight notification for admin.

- [ ] **Step 2: Run test to confirm failure**
  Run `cd server; npx tsx tests/workflow-notifications.test.ts`.

- [ ] **Step 3: Implement `NotificationService`**
  Create `server/src/features/notifications/notification.service.ts`:
  - Orchestrates `notificationRepo.create()`, `sseRegistry.broadcastToUser()`, and `emailService.send...()`
  - Fetches recipient contact info (email, name) safely without exposing passwords.

- [ ] **Step 4: Hook into `TravelService` state transitions**
  In `server/src/features/travel/travel.service.ts`:
  - `createRequest`: notify line manager (or admins if manager personal travel)
  - `managerReview`: notify employee on revision/reject; notify admins on approve
  - `adminReview`: notify employee and manager on approve/settle/revise/reject
  - `resubmitRequest`: notify reviewing manager

- [ ] **Step 5: Run test to verify it passes**
  Run `cd server; npx tsx tests/workflow-notifications.test.ts`.

- [ ] **Step 6: Commit**
  `git add server/src/features/notifications/notification.service.ts server/src/features/travel/travel.service.ts server/tests/workflow-notifications.test.ts; git commit -m "feat(travel): wire travel lifecycle events to notification service"`

---

### Task 6: Notification Controller, Routes & Express Mounting

**Files:**
- Create: `server/src/features/notifications/notification.controller.ts`
- Create: `server/src/features/notifications/notification.routes.ts`
- Modify: `server/src/app.ts`
- Create: `server/tests/notifications-api.test.ts`

- [ ] **Step 1: Write failing API route test**
  Create `server/tests/notifications-api.test.ts`:
  - `GET /api/notifications` requires auth (401 without cookie)
  - `GET /api/notifications` returns list + unread count
  - `GET /api/notifications/stream` sets text/event-stream headers
  - `PATCH /api/notifications/:id/read` marks as read
  - `PATCH /api/notifications/read-all` marks all read

- [ ] **Step 2: Run test to confirm failure**
  Run `cd server; npx tsx tests/notifications-api.test.ts`.

- [ ] **Step 3: Implement Controller & Routes**
  - Create `server/src/features/notifications/notification.controller.ts`
  - Create `server/src/features/notifications/notification.routes.ts`
  - Mount route in `server/src/app.ts`: `app.use('/api/notifications', notificationRoutes)`

- [ ] **Step 4: Run test to verify it passes**
  Run `cd server; npx tsx tests/notifications-api.test.ts`.

- [ ] **Step 5: Commit**
  `git add server/src/features/notifications/ server/src/app.ts server/tests/notifications-api.test.ts; git commit -m "feat(api): expose notifications REST endpoints and SSE stream"`

---

### Task 7: Frontend Dependencies & Web Audio API Chime

**Files:**
- Modify: `client/package.json`
- Create: `client/src/shared/utils/audioChime.ts`
- Create: `client/tests/audio-chime.test.ts`

- [ ] **Step 1: Install required hugeicons packages in client**
  Run `npm --prefix client install @hugeicons/react @hugeicons/core-free-icons`.

- [ ] **Step 2: Write failing unit test for audio chime**
  Create `client/tests/audio-chime.test.ts` testing `playNotificationChime()` mock AudioContext invocation.

- [ ] **Step 3: Implement `client/src/shared/utils/audioChime.ts`**
  Synthesize the dual-tone glass chime (D5: 587.33 Hz $\to$ A5: 880.00 Hz) using native Web Audio API with graceful error handling.

- [ ] **Step 4: Run test to verify it passes**
  Run `cd client; npx tsx tests/audio-chime.test.ts`.

- [ ] **Step 5: Commit**
  `git add client/package.json client/package-lock.json client/src/shared/utils/audioChime.ts client/tests/audio-chime.test.ts; git commit -m "feat(audio): add native Web Audio API chime synthesizer"`

---

### Task 8: React Bits `<SwipeToast />` & `ToastContext`

**Files:**
- Create: `client/src/shared/components/toast/SwipeToast.tsx`
- Create: `client/src/shared/components/toast/SwipeToast.css`
- Create: `client/src/shared/context/ToastContext.tsx`
- Create: `client/tests/swipe-toast.test.ts`

- [ ] **Step 1: Copy component source & CSS from spec**
  - Create `client/src/shared/components/toast/SwipeToast.tsx` (using motion/react or motion).
  - Create `client/src/shared/components/toast/SwipeToast.css`.
  - Ensure compatibility with `motion` library already present in `client/package.json`.

- [ ] **Step 2: Create ToastContext & Provider**
  Create `client/src/shared/context/ToastContext.tsx`:
  - `showToast({ id, title, description, type, linkUrl, duration = 8000 })`
  - Uses dynamic fuse colors: `#533AFD` (default), `#F59E0B` (revision), `#10B981` (approval).
  - Clicking card body triggers `navigate('/dashboard?tab=notifications')`.
  - Close button ("✕") dismisses without navigating.

- [ ] **Step 3: Write and run verification test**
  Create `client/tests/swipe-toast.test.ts` and verify test passes.

- [ ] **Step 4: Commit**
  `git add client/src/shared/components/toast/ client/src/shared/context/ToastContext.tsx client/tests/swipe-toast.test.ts; git commit -m "feat(toast): integrate SwipeToast with 8s fuse and click-to-redirect"`

---

### Task 9: Client SSE Hook & Notifications API Service

**Files:**
- Create: `client/src/features/notifications/types/notification.types.ts`
- Create: `client/src/features/notifications/services/notifications.api.ts`
- Create: `client/src/features/notifications/hooks/useNotifications.ts`
- Create: `client/tests/notifications-hook.test.ts`

- [ ] **Step 1: Write notification types and API service**
  - Create `client/src/features/notifications/types/notification.types.ts`
  - Create `client/src/features/notifications/services/notifications.api.ts` (`fetchNotifications`, `markAsRead`, `markAllAsRead`)

- [ ] **Step 2: Implement `useNotifications` hook**
  Create `client/src/features/notifications/hooks/useNotifications.ts`:
  - Connects to `/api/notifications/stream` via native `EventSource`.
  - On incoming message:
    1. Plays audio chime via `playNotificationChime()`.
    2. Spawns `<SwipeToast />` via `showToast()`.
    3. Increments unread count and appends notification to list.
  - Automatically reconnects on error.
  - Initial load fetches `/api/notifications` for unread count and history.

- [ ] **Step 3: Write and run hook verification test**
  Create and run `client/tests/notifications-hook.test.ts`.

- [ ] **Step 4: Commit**
  `git add client/src/features/notifications/ client/tests/notifications-hook.test.ts; git commit -m "feat(client): implement notifications API client and SSE listener hook"`

---

### Task 10: Dynamic Sidebar Bell Navigation & Unread Badge

**Files:**
- Modify: `client/src/features/travel/layout/DynamicRoleSidebar.tsx`
- Create: `client/tests/notifications-sidebar.test.ts`

- [ ] **Step 1: Write failing sidebar test**
  Create `client/tests/notifications-sidebar.test.ts` asserting that `DynamicRoleSidebar` contains a `"Notifications"` navigation item with `Bell` icon and displays badge count.

- [ ] **Step 2: Run test to confirm failure**
  Run `cd client; npx tsx tests/notifications-sidebar.test.ts`.

- [ ] **Step 3: Update `DynamicRoleSidebar.tsx`**
  - Import `Bell` from `lucide-react`.
  - Add permanent `"Notifications"` item to `getRoleNavItems()` or directly in navigation list for all roles:
    `{ id: 'notifications', label: 'Notifications', icon: Bell, count: unreadCount, countType: hasActionRequired ? 'danger' : 'warning' }`
  - Wire `unreadCount` from `badgeCounts.notifications`.

- [ ] **Step 4: Run test to verify it passes**
  Run `cd client; npx tsx tests/notifications-sidebar.test.ts`.

- [ ] **Step 5: Commit**
  `git add client/src/features/travel/layout/DynamicRoleSidebar.tsx client/tests/notifications-sidebar.test.ts; git commit -m "feat(sidebar): add Notifications item with Bell icon and live unread badge"`

---

### Task 11: Notifications Hub Page (`/dashboard?tab=notifications`)

**Files:**
- Create: `client/src/features/notifications/pages/NotificationsHubPage.tsx`
- Modify: `client/src/features/travel/layout/DashboardLayout.tsx`
- Create: `client/tests/notifications-hub.test.ts`

- [ ] **Step 1: Write failing Notifications Hub test**
  Create `client/tests/notifications-hub.test.ts` verifying view renders, lists notifications, and supports marking read.

- [ ] **Step 2: Implement `NotificationsHubPage.tsx`**
  Create `client/src/features/notifications/pages/NotificationsHubPage.tsx`:
  - Header: "Notifications Hub" with "Mark all as read" button.
  - Filter tabs: `All` | `Unread` | `Action Required`.
  - Card elements:
    - Status pill / icon.
    - Title & message.
    - Relative time formatted (`just now`, `5 mins ago`).
    - "Open Travel Request →" CTA button.

- [ ] **Step 3: Wire into `DashboardLayout.tsx`**
  - Wrap layout in `<ToastProvider>`.
  - Hook `useNotifications` to supply unread badge to `badgeCounts.notifications`.
  - When `activeTab === 'notifications'`, render `<NotificationsHubPage />`.

- [ ] **Step 4: Run test to verify it passes**
  Run `cd client; npx tsx tests/notifications-hub.test.ts`.

- [ ] **Step 5: Commit**
  `git add client/src/features/notifications/pages/NotificationsHubPage.tsx client/src/features/travel/layout/DashboardLayout.tsx client/tests/notifications-hub.test.ts; git commit -m "feat(hub): implement Notifications Hub page and mount in DashboardLayout"`

---

### Task 12: End-to-End Verification & Production Build Validation

**Files:**
- Create: `server/tests/e2e-notifications-flow.test.ts`

- [ ] **Step 1: Write and run end-to-end integration test**
  Create `server/tests/e2e-notifications-flow.test.ts`:
  - Emulate full cycle: Employee submits trip $\to$ Manager gets notification & email $\to$ Manager requests revision $\to$ Employee gets notification & email $\to$ Employee marks read.
  - Run `cd server; npx tsx tests/e2e-notifications-flow.test.ts`.

- [ ] **Step 2: Run Client Production Build**
  Run `npm --prefix client run build` to verify 0 TypeScript/Vite bundle errors.

- [ ] **Step 3: Run Server Production Build**
  Run `npm --prefix server run build` to verify 0 TypeScript errors.

- [ ] **Step 4: Run All Test Suites**
  Run all backend and client test suites to confirm green status across the repository.

- [ ] **Step 5: Final Clean Commit**
  `git add .; git commit -m "test(notifications): verify end-to-end notification lifecycle and green builds"`
