# Responsive Design Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a 100% responsive user experience for the TripFlow web application across mobile phones (`< 640px`), portrait tablets (`640px – 1023px`), and desktop viewports, eliminating horizontal overflow, modal clipping, rigid table scrolling, and unclickable touch targets.

**Architecture:** Implement an adaptive responsive shell with a sticky mobile top header and slide-over navigation drawer with backdrop overlay for `<lg` viewports while preserving the desktop rail for `>=lg`. Supplement this with responsive dual-view card stacks for wide administrative and budget tables, fluid grid stacking for modals and form controls, and responsive wrapping for action alert banners and submission button clusters.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Motion (`motion/react`), Node test harness (`node ./server/node_modules/tsx/dist/cli.mjs`).

**Spec:** [`docs/superpowers/specs/2026-11-20-responsive-design-overhaul-design.md`](file:///c:/Users/SudalaimaniKannan/Documents/Codings/Readventure/docs/superpowers/specs/2026-11-20-responsive-design-overhaul-design.md)

## Global Constraints

- Never break existing desktop navigation, desktop table sorting/actions, or desktop form behaviors (`>= 1024px`).
- Minimum touch target size of 40px–44px for all mobile interactive elements (hamburger, drawer links, card buttons, form controls).
- Zero horizontal layout overflow or horizontal page scrollbars on viewports from 320px to 428px width.
- Follow Test-Driven Development (TDD): write the failing test in `client/tests/` first, verify RED, write minimal production code, verify GREEN, and verify full TypeScript compilation (`tsc -b`).
- Adhere to Vercel React Best Practices: consume memoized lists directly without redundant filter iterations (`js-combine-iterations`), use functional state updates (`rerender-functional-setstate`), and avoid layout shift during client hydration.
- User instruction constraint: Do not commit changes to git unless explicitly requested.

## Review Focus

1. Mobile virtual keyboard open in `ResubmitRequestModal.tsx`: ensure modal doesn't get clipped or trapped off-screen (`max-h-[85dvh]` with `overflow-y-auto`).
2. Country dial code dropdown in `PhoneInputWithCountry.tsx` on narrow 320px screens: ensure popover does not clip off the right viewport edge (`max-w-[calc(100vw-2rem)]` with `right-0 sm:right-auto`).
3. Mobile drawer navigation click: ensure selecting any navigation link or quick action cleanly navigates and auto-closes the drawer backdrop immediately.
4. Sign out on mobile viewports: ensure the Sign Out button remains fully visible and operable in the mobile drawer even when collapsed on desktop.
5. Search bar width on small mobile screens in `DepartmentBudgetsPage.tsx` and `ManagerQueuePortal.tsx`: verify no horizontal layout blowout occurs with long search terms.

---

### Task 1: Responsive Navigation Shell (Mobile Top Header & Slide-Over Drawer)

**Files:**
- Create: `client/tests/responsive-shell.test.ts`
- Modify: `client/src/features/travel/layout/DashboardLayout.tsx`
- Modify: `client/src/features/travel/layout/DynamicRoleSidebar.tsx`
- Modify: `client/src/features/travel/layout/SidebarUserProfile.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `useNotifications()`, `getRoleNavItems(role)`, `getRoleQuickAction(role)`.
- Produces: Responsive `DashboardLayout` that exposes `isMobileDrawerOpen`, renders sticky mobile top bar on `<lg`, renders slide-over drawer with backdrop overlay on `<lg`, renders Sign Out button in drawer footer, and applies dynamic `pt-16 lg:pt-0` and `lg:pl-[76px|256px]` main view padding.

- [x] **Step 1: Write the failing TDD test**

Create `client/tests/responsive-shell.test.ts`:

```typescript
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Responsive Navigation Shell (TDD RED)...');

  const dashboardLayoutPath = path.resolve('client/src/features/travel/layout/DashboardLayout.tsx');
  const sidebarPath = path.resolve('client/src/features/travel/layout/DynamicRoleSidebar.tsx');
  const userProfilePath = path.resolve('client/src/features/travel/layout/SidebarUserProfile.tsx');

  const layoutCode = fs.readFileSync(dashboardLayoutPath, 'utf8');
  const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');
  const userProfileCode = fs.readFileSync(userProfilePath, 'utf8');

  // 1. DashboardLayout must have a sticky mobile header for <lg
  assert.ok(
    layoutCode.includes('lg:hidden') && layoutCode.includes('aria-label="Open navigation menu"'),
    'DashboardLayout must render a mobile header with a hamburger button labeled "Open navigation menu"'
  );

  // 2. DashboardLayout must manage mobile drawer open/close state
  assert.ok(
    layoutCode.includes('isMobileDrawerOpen') && layoutCode.includes('setIsMobileDrawerOpen'),
    'DashboardLayout must manage isMobileDrawerOpen state'
  );

  // 3. DynamicRoleSidebar must accept isMobileDrawerOpen and onCloseMobileDrawer props
  assert.ok(
    sidebarCode.includes('isMobileDrawerOpen') && sidebarCode.includes('onCloseMobileDrawer'),
    'DynamicRoleSidebar must support mobile drawer open/close props'
  );

  // 4. DynamicRoleSidebar must render mobile backdrop and drawer panel on <lg
  assert.ok(
    sidebarCode.includes('aria-label="Close navigation menu"') && sidebarCode.includes('backdrop-blur'),
    'DynamicRoleSidebar must include an overlay backdrop and an accessible close button'
  );

  // 5. SidebarUserProfile must support showing Sign Out button in mobile drawer
  assert.ok(
    userProfileCode.includes('isDrawerMode') || userProfileCode.includes('showSignOutAlways') || sidebarCode.includes('isDrawer'),
    'SidebarUserProfile or DynamicRoleSidebar must ensure Sign Out is accessible in mobile drawer mode'
  );

  // 6. DashboardLayout main area padding must be fluid (0 left padding on mobile, dynamic on desktop)
  assert.ok(
    layoutCode.includes('pt-14') || layoutCode.includes('pt-16'),
    'DashboardLayout main area must offset the sticky mobile header with top padding on mobile'
  );

  console.log('✅ Responsive shell structural tests passed!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
```

- [x] **Step 2: Run test to verify it fails**

Run:
```bash
node .\server\node_modules\tsx\dist\cli.mjs client\tests\responsive-shell.test.ts
```
Expected: FAIL with assertion error showing missing mobile header / drawer props.

- [x] **Step 3: Implement minimal code in `SidebarUserProfile.tsx`**

Modify `client/src/features/travel/layout/SidebarUserProfile.tsx`:
Add `isDrawerMode?: boolean` to `SidebarUserProfileProps`. When `isDrawerMode` is true, render the Sign Out button even if `isCollapsed` is true.

```tsx
export interface SidebarUserProfileProps {
  user: User;
  isCollapsed: boolean;
  onSignOut: () => void;
  isDrawerMode?: boolean;
}

export const SidebarUserProfile: React.FC<SidebarUserProfileProps> = ({
  user,
  isCollapsed,
  onSignOut,
  isDrawerMode = false,
}) => {
  // ... existing initials and roleLabel ...
  return (
    <div className="mt-auto pt-3 border-t border-border-warm flex items-center justify-between shrink-0 select-none">
      <div
        className="flex items-center flex-1 min-w-0 mr-2"
        title={isCollapsed && !isDrawerMode ? `${user.name} (${roleLabel})` : undefined}
      >
        <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
          {initials}
        </div>
        {(!isCollapsed || isDrawerMode) && (
          <div className="flex flex-col min-w-0 ml-2.5 text-left leading-tight">
            <span className="text-[13px] font-semibold text-ink truncate">{user.name}</span>
            <span className="text-[11px] text-muted truncate mt-0.5">{roleLabel}</span>
          </div>
        )}
      </div>

      {(!isCollapsed || isDrawerMode) && (
        <button
          type="button"
          onClick={onSignOut}
          className="p-2 text-muted hover:text-destructive hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0 ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98]"
          title="Sign Out of TripFlow"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
```

- [x] **Step 4: Implement minimal code in `DynamicRoleSidebar.tsx`**

Modify `client/src/features/travel/layout/DynamicRoleSidebar.tsx`:
Add `isMobileDrawerOpen?: boolean` and `onCloseMobileDrawer?: () => void` to `DynamicRoleSidebarProps`.
Render:
1. Desktop rail (`hidden lg:flex`): exactly as existing.
2. Mobile slide-over drawer (`lg:hidden`):
   - Conditional backdrop with `onClick={onCloseMobileDrawer}` and blur.
   - Fixed slide-over container `w-[280px] max-w-[85vw]` with header containing title and close button (`aria-label="Close navigation menu"`).
   - Calling `onTabChange` automatically triggers `onCloseMobileDrawer`.

- [x] **Step 5: Implement minimal code in `DashboardLayout.tsx`**

Modify `client/src/features/travel/layout/DashboardLayout.tsx`:
1. Add `isMobileDrawerOpen` state.
2. Render sticky mobile header on `<lg`:
   ```tsx
   <header className="lg:hidden sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border-warm bg-surface/90 px-3.5 backdrop-blur-md">
     <div className="flex items-center gap-2.5">
       <button
         type="button"
         onClick={() => setIsMobileDrawerOpen(true)}
         aria-label="Open navigation menu"
         className="flex size-9 items-center justify-center rounded-lg border border-border-warm bg-surface text-ink hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
       >
         <Menu className="size-5" />
       </button>
       <div className="flex items-center gap-2">
         <div className="w-7 h-7 rounded-md bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
           TF
         </div>
         <span className="font-bold text-sm text-ink truncate max-w-[160px] sm:max-w-xs">
           {activeWorkspaceTitle}
         </span>
       </div>
     </div>
     <div className="flex items-center gap-2">
       <button
         type="button"
         onClick={() => handleTabChange('notifications')}
         aria-label="View notifications"
         className="relative p-2 rounded-lg border border-border-warm bg-surface text-muted hover:text-ink cursor-pointer"
       >
         <Bell className="size-4" />
         {unreadCount > 0 && (
           <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-surface" />
         )}
       </button>
       <div className="size-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
         {userInitials}
       </div>
     </div>
   </header>
   ```
3. Update `main` container padding:
   ```tsx
   className={`flex-1 overflow-y-auto min-w-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
     isPinned ? 'lg:pl-[256px]' : 'lg:pl-[76px]'
   }`}
   ```
   and wrapper padding:
   ```tsx
   <div className="px-3.5 py-4 sm:px-6 sm:py-5">
   ```

- [x] **Step 6: Run test to verify it passes**

Run:
```bash
node .\server\node_modules\tsx\dist\cli.mjs client\tests\responsive-shell.test.ts
```
Expected: PASS with "✅ Responsive shell structural tests passed!".

- [x] **Step 7: Verify TypeScript compilation**

Run:
```bash
npm --prefix client run build
```
Expected: Build succeeds with 0 errors.

---

### Task 2: Responsive Data Tables (Mobile Card Stacks for Directory & Budget Ledger)

**Files:**
- Create: `client/tests/responsive-tables.test.ts`
- Modify: `client/src/features/users/pages/AdminUsersPage.tsx`
- Modify: `client/src/features/travel/pages/DepartmentBudgetsPage.tsx`

**Interfaces:**
- Consumes: `DirectoryUser`, `DepartmentBudgetPool`, `filteredUsers`, `filteredPoolRows`.
- Produces: Dual-view layout in `AdminUsersPage.tsx` (`md:hidden` card stack + `hidden md:block` table) and in `DepartmentBudgetsPage.tsx` (`md:hidden` card stack + `hidden md:block` table), plus fluid search input sizing (`w-full sm:w-72 md:w-80`).

- [x] **Step 1: Write the failing TDD test**

Create `client/tests/responsive-tables.test.ts`:

```typescript
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Responsive Data Tables (TDD RED)...');

  const adminUsersPath = path.resolve('client/src/features/users/pages/AdminUsersPage.tsx');
  const deptBudgetsPath = path.resolve('client/src/features/travel/pages/DepartmentBudgetsPage.tsx');

  const adminUsersCode = fs.readFileSync(adminUsersPath, 'utf8');
  const deptBudgetsCode = fs.readFileSync(deptBudgetsPath, 'utf8');

  // 1. AdminUsersPage must have dual view (md:hidden card stack + hidden md:block table)
  assert.ok(
    adminUsersCode.includes('md:hidden') && adminUsersCode.includes('hidden md:block'),
    'AdminUsersPage must render an md:hidden mobile card view alongside hidden md:block table'
  );

  // 2. AdminUsersPage mobile card must display user info and accessible action buttons
  assert.ok(
    adminUsersCode.includes('member.department') && adminUsersCode.includes('Edit') && adminUsersCode.includes('aria-label'),
    'AdminUsersPage mobile card stack must render member details and accessible action buttons'
  );

  // 3. DepartmentBudgetsPage must not have the hardcoded w-87.5 fixed width search input
  assert.ok(
    !deptBudgetsCode.includes('w-87.5'),
    'DepartmentBudgetsPage must eliminate the hardcoded w-87.5 fixed width search class'
  );

  // 4. DepartmentBudgetsPage must render dual view for corporate pools ledger
  assert.ok(
    deptBudgetsCode.includes('md:hidden') && deptBudgetsCode.includes('hidden md:block'),
    'DepartmentBudgetsPage must render an md:hidden mobile card stack for corporate department pools'
  );

  console.log('✅ Responsive tables structural tests passed!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
```

- [x] **Step 2: Run test to verify it fails**

Run:
```bash
node .\server\node_modules\tsx\dist\cli.mjs client\tests\responsive-tables.test.ts
```
Expected: FAIL with missing `md:hidden` dual-view structure or presence of `w-87.5`.

- [x] **Step 3: Implement minimal code in `AdminUsersPage.tsx`**

Modify `client/src/features/users/pages/AdminUsersPage.tsx`:
1. In the Directory Table container (line 446), split into:
   - `<div className="md:hidden divide-y divide-border-warm">`: Renders each user as a touch card with member name, email, role badge, status badge, department, reporting supervisor line, added date, and large touch-target buttons (`Edit`, `Deactivate`/`Reactivate`).
   - `<div className="hidden md:block overflow-x-auto">`: Renders the desktop `<table>`.
2. Wrap role filter buttons in `<div className="overflow-x-auto pb-1 scrollbar-none max-w-full">`.
3. Set search input to `w-full sm:max-w-md`.

- [x] **Step 4: Implement minimal code in `DepartmentBudgetsPage.tsx`**

Modify `client/src/features/travel/pages/DepartmentBudgetsPage.tsx`:
1. Line 648: Replace `w-87.5` with `w-full sm:w-72 md:w-80`.
2. In the Department Pools Ledger container (line 657), split into:
   - `<div className="md:hidden divide-y divide-border-warm">`: Renders each department pool as a card showing department name, fiscal period badge, total pool, committed spend, available headroom with health color, progress bar, and "Adjust Allocation" button.
   - `<div className="hidden md:block overflow-x-auto">`: Renders the desktop `<table>`.

- [x] **Step 5: Run test to verify it passes**

Run:
```bash
node .\server\node_modules\tsx\dist\cli.mjs client\tests\responsive-tables.test.ts
```
Expected: PASS with "✅ Responsive tables structural tests passed!".

- [x] **Step 6: Verify TypeScript compilation**

Run:
```bash
npm --prefix client run build
```
Expected: Build succeeds with 0 errors.

---

### Task 3: Modal & Form Fluidity (Responsive Grid, Viewport Bounds & Toggle Stacking)

**Files:**
- Create: `client/tests/responsive-forms-modals.test.ts`
- Modify: `client/src/features/travel/components/ResubmitRequestModal.tsx`
- Modify: `client/src/features/travel/components/forms/TravelTypeToggle.tsx`
- Modify: `client/src/features/travel/components/forms/PhoneInputWithCountry.tsx`
- Modify: `client/src/features/travel/components/ManagerQueuePortal.tsx`

**Interfaces:**
- Consumes: `TravelTypeToggleProps`, `PhoneInputWithCountryProps`, `ResubmitRequestModalProps`.
- Produces: Responsive modal expense row (`grid-cols-1 sm:grid-cols-12`), stacked travel type radio toggle on mobile (`flex-col sm:flex-row`), bounded country dropdown popover (`max-w-[calc(100vw-2rem)]`), and fluid search input in manager portal (`w-full sm:w-72 md:w-80`).

- [x] **Step 1: Write the failing TDD test**

Create `client/tests/responsive-forms-modals.test.ts`:

```typescript
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Responsive Forms & Modals (TDD RED)...');

  const modalPath = path.resolve('client/src/features/travel/components/ResubmitRequestModal.tsx');
  const togglePath = path.resolve('client/src/features/travel/components/forms/TravelTypeToggle.tsx');
  const phonePath = path.resolve('client/src/features/travel/components/forms/PhoneInputWithCountry.tsx');
  const managerQueuePath = path.resolve('client/src/features/travel/components/ManagerQueuePortal.tsx');

  const modalCode = fs.readFileSync(modalPath, 'utf8');
  const toggleCode = fs.readFileSync(togglePath, 'utf8');
  const phoneCode = fs.readFileSync(phonePath, 'utf8');
  const managerQueueCode = fs.readFileSync(managerQueuePath, 'utf8');

  // 1. ResubmitRequestModal must use responsive grid for expense rows
  assert.ok(
    modalCode.includes('grid-cols-1 sm:grid-cols-12') || (modalCode.includes('sm:grid-cols-12') && modalCode.includes('grid-cols-1')),
    'ResubmitRequestModal must use responsive grid-cols-1 sm:grid-cols-12 for expense row items'
  );

  // 2. TravelTypeToggle must stack vertically on mobile
  assert.ok(
    toggleCode.includes('flex-col sm:flex-row'),
    'TravelTypeToggle must use flex-col sm:flex-row for mobile readability'
  );

  // 3. PhoneInputWithCountry must clamp popover width to viewport
  assert.ok(
    phoneCode.includes('max-w-[calc(100vw'),
    'PhoneInputWithCountry must clamp country selection dropdown popover to viewport bounds'
  );

  // 4. ManagerQueuePortal must use fluid responsive search input width
  assert.ok(
    !managerQueueCode.includes('w-64 sm:w-72'),
    'ManagerQueuePortal must replace rigid w-64 with fluid w-full sm:w-72'
  );

  console.log('✅ Responsive forms and modals structural tests passed!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
```

- [x] **Step 2: Run test to verify it fails**

Run:
```bash
node .\server\node_modules\tsx\dist\cli.mjs client\tests\responsive-forms-modals.test.ts
```
Expected: FAIL.

- [x] **Step 3: Implement minimal code in `ResubmitRequestModal.tsx`**

Modify `client/src/features/travel/components/ResubmitRequestModal.tsx`:
1. Modal container: add `w-[calc(100%-2rem)] max-w-xl mx-auto my-auto max-h-[85dvh] overflow-y-auto`.
2. Expense item row (line 224):
   ```tsx
   <div key={f.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-2 items-start sm:items-center bg-surface-subtle p-3 sm:p-2 rounded-lg border border-border-warm text-xs">
     <div className="sm:col-span-3 w-full">
       <label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Category</label>
       <select {...register(`expenses.${i}.category`)} className="w-full p-2 sm:p-1.5 bg-surface border border-border-warm rounded text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
         <option value="FLIGHT">Flight</option>
         <option value="HOTEL">Hotel</option>
         <option value="MEALS_PER_DIEM">Meals / Per Diem</option>
         <option value="TRANSIT">Transit</option>
         <option value="MISC">Misc</option>
       </select>
     </div>
     <div className="sm:col-span-4 w-full">
       <label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Merchant</label>
       <input {...register(`expenses.${i}.merchant`)} placeholder="Merchant" className="w-full p-2 sm:p-1.5 bg-surface border border-border-warm rounded text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20" />
     </div>
     <div className="sm:col-span-4 w-full">
       <label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Amount (₹)</label>
       <input
         {...register(`expenses.${i}.amount`, { setValueAs: parseExpenseAmount })}
         type="text"
         inputMode="decimal"
         placeholder="₹ 0.00"
         className="w-full p-2 sm:p-1.5 bg-surface border border-border-warm rounded font-mono tabular-nums text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
       />
     </div>
     <div className="sm:col-span-1 w-full flex justify-end sm:justify-center pt-1 sm:pt-0">
       <button type="button" onClick={() => remove(i)} disabled={fields.length === 1} aria-label="Remove item" className="p-1.5 text-destructive hover:opacity-80 disabled:opacity-30 cursor-pointer rounded-md">
         <Trash2 className="size-4" />
       </button>
     </div>
   </div>
   ```

- [x] **Step 4: Implement minimal code in `TravelTypeToggle.tsx`**

Modify `client/src/features/travel/components/forms/TravelTypeToggle.tsx`:
Change outer container to:
```tsx
className={`flex flex-col sm:flex-row w-full bg-surface-subtle p-1 rounded-lg border border-border-warm gap-1.5 ${className}`}
```

- [x] **Step 5: Implement minimal code in `PhoneInputWithCountry.tsx`**

Modify `client/src/features/travel/components/forms/PhoneInputWithCountry.tsx`:
Update dropdown popover container (line 174) to include:
```tsx
className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-2rem)] right-0 sm:right-auto bg-surface rounded-xl border border-border-warm shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
```

- [x] **Step 6: Implement minimal code in `ManagerQueuePortal.tsx`**

Modify `client/src/features/travel/components/ManagerQueuePortal.tsx`:
Update search input (line 275) to `w-full sm:w-72 md:w-80`.

- [x] **Step 7: Run test to verify it passes**

Run:
```bash
node .\server\node_modules\tsx\dist\cli.mjs client\tests\responsive-forms-modals.test.ts
```
Expected: PASS with "✅ Responsive forms and modals structural tests passed!".

- [x] **Step 8: Verify TypeScript compilation**

Run:
```bash
npm --prefix client run build
```
Expected: Build succeeds with 0 errors.

---

### Task 4: Action Banners, Document Attachments & Workstation Footers

**Files:**
- Create: `client/tests/responsive-action-bars.test.ts`
- Modify: `client/src/features/travel/pages/TravelDetailPage.tsx`
- Modify: `client/src/features/travel/pages/NewTravelRequestPage.tsx`
- Modify: `client/src/features/travel/pages/ResubmitTravelRequestPage.tsx`
- Modify: `client/src/features/travel/components/forms/ProofAttachmentField.tsx`

**Interfaces:**
- Consumes: Travel details state, form submission handlers, supporting documents list.
- Produces: Non-colliding action banners in `TravelDetailPage.tsx`, full-width mobile button clusters in new/resubmit request forms, and wrapping document attachment item rows.

- [x] **Step 1: Write the failing TDD test**

Create `client/tests/responsive-action-bars.test.ts`:

```typescript
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Responsive Action Banners & Footers (TDD RED)...');

  const detailPagePath = path.resolve('client/src/features/travel/pages/TravelDetailPage.tsx');
  const newPagePath = path.resolve('client/src/features/travel/pages/NewTravelRequestPage.tsx');
  const resubmitPagePath = path.resolve('client/src/features/travel/pages/ResubmitTravelRequestPage.tsx');
  const proofFieldPath = path.resolve('client/src/features/travel/components/forms/ProofAttachmentField.tsx');

  const detailCode = fs.readFileSync(detailPagePath, 'utf8');
  const newCode = fs.readFileSync(newPagePath, 'utf8');
  const resubmitCode = fs.readFileSync(resubmitPagePath, 'utf8');
  const proofCode = fs.readFileSync(proofFieldPath, 'utf8');

  // 1. TravelDetailPage alert banners must use responsive flex-col sm:flex-row
  assert.ok(
    detailCode.includes('flex flex-col sm:flex-row sm:items-center justify-between'),
    'TravelDetailPage action banners must use flex flex-col sm:flex-row sm:items-center'
  );

  // 2. NewTravelRequestPage and ResubmitTravelRequestPage footer must stack buttons on mobile
  assert.ok(
    newCode.includes('flex flex-col-reverse sm:flex-row sm:items-center justify-between') ||
    newCode.includes('flex-col-reverse sm:flex-row'),
    'NewTravelRequestPage form footer buttons must stack on mobile'
  );

  assert.ok(
    resubmitCode.includes('flex flex-col-reverse sm:flex-row sm:items-center justify-between') ||
    resubmitCode.includes('flex-col-reverse sm:flex-row'),
    'ResubmitTravelRequestPage form footer buttons must stack on mobile'
  );

  // 3. ProofAttachmentField document row must use responsive layout
  assert.ok(
    proofCode.includes('flex flex-col sm:flex-row sm:items-center justify-between') ||
    proofCode.includes('flex-col sm:flex-row'),
    'ProofAttachmentField document row must use responsive stacking for mobile buttons'
  );

  console.log('✅ Responsive action bars structural tests passed!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
```

- [x] **Step 2: Run test to verify it fails**

Run:
```bash
node .\server\node_modules\tsx\dist\cli.mjs client\tests\responsive-action-bars.test.ts
```
Expected: FAIL.

- [x] **Step 3: Implement minimal code in `TravelDetailPage.tsx`**

Modify `client/src/features/travel/pages/TravelDetailPage.tsx`:
1. Line 260 (Saved Travel Draft Banner):
   Update from `flex items-center justify-between` to:
   ```tsx
   <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
     <div className="flex items-center gap-3">
       <FileEdit className="size-5 text-amber-700 shrink-0" />
       <div className="text-xs text-ink">
         <strong>Saved Travel Draft:</strong> This request is currently saved as an unsubmitted draft.
       </div>
     </div>
     <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
   ```
2. Line 300 (Employee Revision Required Banner):
   Update from `flex items-center justify-between` to:
   ```tsx
   <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
     <div className="flex items-center gap-3">
       <AlertTriangle className="size-5 text-amber-700 shrink-0" />
       <div className="text-xs text-ink">
         <strong>Employee Revision Required:</strong> Your request requires corrections before it can proceed.
       </div>
     </div>
     <button
       type="button"
       onClick={() => navigate(`/travel/requests/${request.id}/edit`)}
       className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap w-full sm:w-auto"
     >
   ```

- [x] **Step 4: Implement minimal code in `NewTravelRequestPage.tsx` & `ResubmitTravelRequestPage.tsx`**

1. In `NewTravelRequestPage.tsx` line 422:
   ```tsx
   <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border-warm">
     <button
       type="button"
       onClick={() => navigate(backPath)}
       className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-border-warm text-xs font-semibold text-muted hover:bg-surface-subtle active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
     >
       Cancel
     </button>
     <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
       <button
         type="button"
         disabled={isSubmitting}
         onClick={onSaveDraft}
         className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-ink text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
       >
         <FileEdit className="size-4 text-primary" />
         Save as Draft
       </button>
       <button
         type="submit"
         disabled={isSubmitting}
         className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
       >
         {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
         {isSubmitting ? 'Submitting...' : 'Submit Travel Request'}
       </button>
     </div>
   </div>
   ```
2. In `ResubmitTravelRequestPage.tsx` line 578: apply identical responsive classes for the footer buttons.

- [x] **Step 5: Implement minimal code in `ProofAttachmentField.tsx`**

Modify `client/src/features/travel/components/forms/ProofAttachmentField.tsx`:
Line 305: Update document row to:
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
  <div className="flex items-center gap-2.5 min-w-0">
    {/* file icon, name, badge */}
  </div>
  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
    {/* Preview, Download, Remove buttons */}
  </div>
</div>
```

- [x] **Step 6: Run test to verify it passes**

Run:
```bash
node .\server\node_modules\tsx\dist\cli.mjs client\tests\responsive-action-bars.test.ts
```
Expected: PASS with "✅ Responsive action bars structural tests passed!".

- [x] **Step 7: Verify TypeScript compilation**

Run:
```bash
npm --prefix client run build
```
Expected: Build succeeds with 0 errors.

---

### Task 5: End-to-End Regression & Full Suite Verification

**Files:**
- Test execution across all client test files

- [x] **Step 1: Run all responsive tests in sequence**

Run:
```bash
node .\server\node_modules\tsx\dist\cli.mjs client\tests\responsive-shell.test.ts
node .\server\node_modules\tsx\dist\cli.mjs client\tests\responsive-tables.test.ts
node .\server\node_modules\tsx\dist\cli.mjs client\tests\responsive-forms-modals.test.ts
node .\server\node_modules\tsx\dist\cli.mjs client\tests\responsive-action-bars.test.ts
```
Expected: All 4 test files PASS cleanly.

- [x] **Step 2: Run critical regression tests**

Run:
```bash
node .\server\node_modules\tsx\dist\cli.mjs client\tests\sidebar-nav.test.ts
node .\server\node_modules\tsx\dist\cli.mjs client\tests\team-reporting-line.test.ts
node .\server\node_modules\tsx\dist\cli.mjs client\tests\users-schema-admin.test.ts
node .\server\node_modules\tsx\dist\cli.mjs client\tests\admin-queue-scoping.test.ts
```
Expected: All regression tests PASS.

- [x] **Step 3: Run full TypeScript compilation**

Run:
```bash
npm --prefix client run build
```
Expected: Built in ~28s with 0 errors.

- [x] **Step 4: Run linter**

Run:
```bash
npm --prefix client run lint
```
Expected: 0 errors.
