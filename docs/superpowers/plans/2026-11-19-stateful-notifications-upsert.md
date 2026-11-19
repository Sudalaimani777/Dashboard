# Stateful Notifications Upsert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **CRITICAL USER CONSTRAINT:** **DO NOT GIT COMMIT.** All code changes must remain unstaged and uncommitted in the working tree for user audit and verification.

**Goal:** Transform the TripFlow notification subsystem from an append-only event log into a stateful, per-trip task tracking model so that each user has exactly one live notification card per travel request that updates across its governance lifecycle (e.g. `Pending Review` $\to$ `In Executive Review` $\to$ `Approved`).

**Architecture:** 
1. Enhance `NotificationRepository.upsertByRequest` to check for an existing `(user_id, request_id)` record. If found, update `type`, `title`, `message`, `actor_id`, and `created_at` in-place, prune any legacy duplicate rows, and set `is_read = false` (or `true` if self-actioned). If not found, insert a new record.
2. Update `TravelService` governance actions so when a manager approves a trip, their notification transitions to `FORWARDED_TO_ADMIN` (`is_read = true`), and when Admin grants final clearance, both requester and manager cards update to `TRAVEL_APPROVED` (`is_read = false` with live audio chime).
3. Update `NotificationsHubPage.tsx` to handle `FORWARDED_TO_ADMIN` with a designated badge and styling.

**Tech Stack:** Node.js, Express, PostgreSQL (`pg`), TypeScript, React 19, Tailwind CSS, Lucide icons.

**Spec:** In-chat bounded design approved in conversation session `c0daaae7-2180-4307-9ad0-30a07705b453`.

---

## Global Constraints

- **STRICT NO GIT COMMIT RULE:** Do not stage or commit any git changes.
- PostgreSQL database on port 5432 with pool connection from `server/src/shared/db/pool.ts`.
- Real-time SSE dispatch and transactional email behavior must remain active on updates.
- Backward compatibility for notifications with `request_id IS NULL` (system broadcasts remain standalone inserts).

## Review Focus

1. **Legacy Duplicates Pruning:** Existing multiple rows for the same `(user_id, request_id)` must be deduplicated so only one clean card remains.
2. **Real-time SSE Notification Broadcast:** Upserted notifications must still broadcast via `notificationStream` with their updated payload.
3. **Unread Count Accuracy:** `unreadCount` must decrement when an action is completed and increment when a new external milestone arrives.
4. **Self-Action Read State:** When a manager approves a request, their updated card must be marked `is_read = true` (since they performed the action), but when Admin clears it, it must reset to `is_read = false` (alerting the manager).
5. **No Regressions on Build:** `npm --prefix client run build` and `npm --prefix server run build` must pass with 0 errors.

---

### Task 1: Repository Upsert Logic with Duplicate Pruning

**Files:**
- Modify: `server/src/features/notifications/notification.repository.ts`
- Modify: `server/src/features/notifications/notification.service.ts`
- Test: `server/tests/notification-repo.test.ts`

**Interfaces:**
- `notificationRepo.upsertByRequest(input: CreateNotificationInput): Promise<Notification>`
- `notificationService.notify(input: CreateNotificationInput & { recipientEmail?: string, recipientName?: string, emailType?: string, emailData?: any }): Promise<Notification>`

- [ ] **Step 1: Write failing unit test in `server/tests/notification-repo.test.ts`**

Add tests asserting:
1. `upsertByRequest` creates a record if none exists.
2. Calling `upsertByRequest` with the same `(userId, requestId)` updates the existing record's `type`, `title`, and `message`, without incrementing the row count.
3. Legacy duplicate rows are pruned to exactly 1 row.

- [ ] **Step 2: Run test to verify failure**

Run: `.\server\node_modules\.bin\tsx.cmd server/tests/notification-repo.test.ts`
Expected: FAIL (`upsertByRequest is not a function` or duplicate row count assertion failure).

- [ ] **Step 3: Implement `upsertByRequest` in `notification.repository.ts` and wire into `notification.service.ts`**

In `notification.repository.ts`:
```typescript
async upsertByRequest(input: CreateNotificationInput): Promise<Notification> {
  const linkUrl = input.linkUrl || '/dashboard?tab=notifications';
  if (!input.requestId) {
    return this.create(input);
  }

  // Check for existing notification for this user & request
  const existing = await pool.query(
    'SELECT id FROM notifications WHERE user_id = $1 AND request_id = $2 ORDER BY created_at DESC',
    [input.userId, input.requestId]
  );

  if (existing.rows.length > 0) {
    const primaryId = existing.rows[0].id;
    // Prune legacy duplicates if any exist
    if (existing.rows.length > 1) {
      await pool.query(
        'DELETE FROM notifications WHERE user_id = $1 AND request_id = $2 AND id != $3',
        [input.userId, input.requestId, primaryId]
      );
    }

    const updateQuery = `
      UPDATE notifications
      SET type = $1,
          title = $2,
          message = $3,
          actor_id = $4,
          link_url = $5,
          is_read = FALSE,
          created_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *;
    `;
    const res = await pool.query(updateQuery, [
      input.type,
      input.title,
      input.message,
      input.actorId ?? null,
      linkUrl,
      primaryId
    ]);
    return this.mapRowToNotification(res.rows[0]);
  }

  return this.create(input);
}
```

In `notification.service.ts`:
Call `await this.repo.upsertByRequest(input)` inside `notify()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `.\server\node_modules\.bin\tsx.cmd server/tests/notification-repo.test.ts`
Expected: PASS.

---

### Task 2: Update Governance Notification Lifecycle Transitions in `travel.service.ts`

**Files:**
- Modify: `server/src/features/travel/travel.service.ts`
- Test: `server/tests/workflow-notifications.test.ts`

**Interfaces:**
- Consumes: `notificationService.notify`
- Updates:
  - Manager approval flow: transitions Manager's card to `FORWARDED_TO_ADMIN` (`is_read: true`) and creates/updates Admin's card to `TRAVEL_SUBMITTED` (`is_read: false`).
  - Admin approval flow: updates Employee card to `TRAVEL_APPROVED` (`is_read: false`), updates Manager card to `TRAVEL_APPROVED` (`is_read: false`), and marks Admin's card as `TRAVEL_APPROVED` (`is_read: true`).

- [ ] **Step 1: Write test assertions in `server/tests/workflow-notifications.test.ts`**

Add assertions verifying:
1. When Manager approves, Manager's notification row for `requestId` transitions to `FORWARDED_TO_ADMIN` with `is_read = true`.
2. When Admin clears, Manager's notification row updates to `TRAVEL_APPROVED` with `is_read = false`.
3. Total notifications count for Manager for that trip remains strictly 1.

- [ ] **Step 2: Run test to verify failure**

Run: `.\server\node_modules\.bin\tsx.cmd server/tests/workflow-notifications.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `travel.service.ts`**

1. In manager review handler (`approveTravelRequest` / `reviewTravelRequest`):
   When action is `APPROVE`:
   - Notify / update Manager:
     ```typescript
     await notificationService.notify({
       userId: managerId,
       actorId: managerId,
       requestId,
       type: 'FORWARDED_TO_ADMIN',
       title: 'Travel Request Forwarded to Executive Review',
       message: `You approved travel request "${request.title}" and forwarded it for executive clearance.`,
       linkUrl: '/dashboard?tab=notifications',
     });
     // Mark manager's own action card as read
     await pool.query(
       'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND request_id = $2',
       [managerId, requestId]
     );
     ```
2. In admin review handler (`adminReviewTravelRequest`):
   When action is `APPROVE`:
   - Admin's own card for this request is updated and marked read:
     ```typescript
     await pool.query(
       "UPDATE notifications SET type = 'TRAVEL_APPROVED', title = 'Travel Request Cleared', is_read = TRUE WHERE user_id = $1 AND request_id = $2",
       [adminId, requestId]
     );
     ```
   - Line manager notification is dispatched through `notificationService.notify()` which seamlessly upserts the Manager's existing card to `TRAVEL_APPROVED` and sets `is_read = false`.

- [ ] **Step 4: Run test to verify it passes**

Run: `.\server\node_modules\.bin\tsx.cmd server/tests/workflow-notifications.test.ts`
Expected: PASS.

---

### Task 3: Frontend Badge & State Styling in `NotificationsHubPage.tsx`

**Files:**
- Modify: `client/src/features/notifications/pages/NotificationsHubPage.tsx`
- Test: `client/tests/notifications-hub.test.ts`

- [ ] **Step 1: Update `client/tests/notifications-hub.test.ts`**

Add assertion verifying that `FORWARDED_TO_ADMIN` renders with appropriate badge label ("In Executive Review") and icon.

- [ ] **Step 2: Run test to verify failure**

Run: `.\server\node_modules\.bin\tsx.cmd client/tests/notifications-hub.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `NotificationsHubPage.tsx`**

In `getNotificationBadge(type)`:
```typescript
case 'FORWARDED_TO_ADMIN':
  return { label: 'In Executive Review', className: 'bg-sky-50 text-sky-700 border-sky-200' };
```

In `getNotificationIcon(type)`:
```typescript
case 'FORWARDED_TO_ADMIN':
  return (
    <div className="size-9 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shrink-0">
      <Clock className="size-5" />
    </div>
  );
```

- [ ] **Step 4: Run test to verify it passes**

Run: `.\server\node_modules\.bin\tsx.cmd client/tests/notifications-hub.test.ts`
Expected: PASS.

---

### Task 4: End-to-End Notification Lifecycle Test & Build Verification

**Files:**
- Modify: `server/tests/e2e-notifications-flow.test.ts`

- [ ] **Step 1: Update `server/tests/e2e-notifications-flow.test.ts`**

Verify the complete multi-tier flow:
1. Employee submits trip $\to$ Manager has 1 notification (`TRAVEL_SUBMITTED`, "Pending Review").
2. Manager requests revisions $\to$ Employee notification updates to `REVISION_REQUESTED` (Employee count = 1).
3. Employee resubmits $\to$ Manager notification updates to `RESUBMITTED` (Manager count = 1).
4. Manager approves $\to$ Manager notification updates to `FORWARDED_TO_ADMIN` (Manager count = 1, read = true). Admin receives `TRAVEL_SUBMITTED` (Admin count = 1).
5. Admin approves $\to$ Employee notification updates to `TRAVEL_APPROVED` (count = 1). Manager notification updates to `TRAVEL_APPROVED` (count = 1). Admin notification updates to `TRAVEL_APPROVED` (count = 1).
6. Total notifications for each user for this request is strictly 1 at all times.

- [ ] **Step 2: Run E2E test suite**

Run: `.\server\node_modules\.bin\tsx.cmd server/tests/e2e-notifications-flow.test.ts`
Expected: PASS (all lifecycle assertions green).

- [ ] **Step 3: Run Full Client & Server Builds**

Run:
1. `npm --prefix client run build`
2. `npm --prefix server run build`
Expected: 0 TypeScript and build errors across both client and server.

- [ ] **Step 4: Verify working tree status**

Run: `git status`
Expected: All modified files present in working copy, 0 commits made.
