# Day 3: Password Reset UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the responsive Forgot Password (`/forgot-password`) and Reset Password (`/reset-password`) user interfaces in React 19, adhering to the Warm Storycraft aesthetic, eliminating AI slop, and integrating seamlessly with the existing Express backend and email service.

**Architecture:** A modular feature-based architecture under `client/src/features/auth/` utilizing React Router for navigation and query param extraction, Zod for pre-flight validation, Axios with credentials for backend communication, and accessible UI primitives styled with Tailwind CSS v4.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, React Router 7, Zod, Lucide React, Axios, Express, PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-11-06-day3-password-reset-ui-design.md`

## Global Constraints
- Strictly adhere to Warm Storycraft tokens: Canvas `#F7F4EE`, Borders `#E8DFD3`, Accent `#8A582B` (hover `#754820`), Surface `#FFFFFF` / `#FAF8F5`, Text `#2B231D`, Subtext `#756F68`, Destructive `#9E2A2B`.
- Typography is strictly **Poppins** (`font-sans`).
- Zero AI-slop: No floating icon badge chips (`bg-amber-100 p-3 rounded-2xl`), no 4-bar rainbow password strength meters, no conversational filler or welded arrows (`->`), no celebratory confetti/sparkle cards.
- Strict anti-enumeration: Forgot password flow provides identical calm feedback regardless of whether the email exists.
- URL Guard: Reset password page without `?token=` parameter renders an intentional guard card with a link to `/forgot-password`, not broken inputs.
- Remember the user constraint: Do not execute git commits until the full implementation has been tested and verified.

## Review Focus
1. Accessing `/reset-password` without any `?token` parameter renders the "Reset link missing or invalid" guard state with a direct button to `/forgot-password`.
2. Accessing `/reset-password?token=invalid_or_expired` and submitting renders the "Reset link expired" error state with a direct button to `/forgot-password`.
3. Submitting mismatched passwords on `/reset-password` prevents network dispatch and displays an inline error note.
4. Submitting an unlisted email on `/forgot-password` displays the quiet confirmation card without leaking account existence.
5. In-place transitions occur smoothly without page reloads or layout jumps.

---

### Task 1: API Client Methods & Validation Schemas

**Files:**
- Modify: `client/src/features/auth/types/auth.types.ts`
- Modify: `client/src/features/auth/schemas/auth.schema.ts`
- Modify: `client/src/features/auth/services/auth.api.ts`

**Interfaces:**
- Consumes: `apiClient` instance in `client/src/features/auth/services/auth.api.ts`
- Produces:
  - `forgotPassword(email: string): Promise<string>`
  - `resetPassword(token: string, newPassword: string): Promise<string>`
  - `forgotPasswordSchema`, `resetPasswordSchema`

- [ ] **Step 1: Extend Auth Types**
In `client/src/features/auth/types/auth.types.ts`, export:
```typescript
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
```

- [ ] **Step 2: Add Zod Validation Schemas**
In `client/src/features/auth/schemas/auth.schema.ts`, export `forgotPasswordSchema` and `resetPasswordSchema`:
```typescript
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please provide a valid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

- [ ] **Step 3: Add API Service Methods**
In `client/src/features/auth/services/auth.api.ts`, add `forgotPassword` and `resetPassword` methods to `AuthApiService`:
```typescript
  async forgotPassword(email: string): Promise<string> {
    try {
      const res = await apiClient.post<ApiResponse<{ message: string; previewUrl?: string }>>(
        '/auth/forgot-password',
        { email }
      );
      return res.data.message;
    } catch (err) {
      this.handleError(err, 'Failed to request password reset link.');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<string> {
    try {
      const res = await apiClient.post<ApiResponse<{ message: string }>>(
        '/auth/reset-password',
        { token, newPassword }
      );
      return res.data.message;
    } catch (err) {
      this.handleError(err, 'Failed to reset password. The link may have expired.');
    }
  }
```

- [ ] **Step 4: Verify TypeScript compilation**
Run `npm run build` in `client/` to verify zero type errors.

---

### Task 2: Forgot Password Component (`ForgotPasswordCard.tsx`)

**Files:**
- Create: `client/src/features/auth/components/ForgotPasswordCard.tsx`

**Interfaces:**
- Consumes: `authApi.forgotPassword`, `forgotPasswordSchema`, `client/src/shared/components/ui/` primitives.
- Produces: `ForgotPasswordCard` React component.

- [ ] **Step 1: Implement `ForgotPasswordCard.tsx`**
Create `client/src/features/auth/components/ForgotPasswordCard.tsx` featuring:
1. Clean editorial card centered on `#F7F4EE` canvas.
2. Direct brand wordmark link (`Readventure`).
3. Title: "Reset your password".
4. Subtitle: "Enter the email address associated with your account, and we will send you a recovery link."
5. Email input with validation error display.
6. Primary button "Send recovery link" (`bg-[#8A582B]` hover `bg-[#754820]`).
7. In-place transition to Quiet Confirmation Card upon submission:
   - Title: "Check your inbox"
   - Body copy: "We have sent a password reset link to **{submittedEmail}**. If an account with that email exists, the link will arrive within a few moments and remain valid for 1 hour."
   - Button: "Return to sign in" linking to `/signin`.
   - Secondary button: "Try another email" which restores the form state.
8. Anti-AI-slop compliance: No floating icon chips, no celebratory badges, no filler copy.

- [ ] **Step 2: Verify component compiles**
Run `npm run build` in `client/` to verify zero syntax/build errors.

---

### Task 3: Reset Password Component with URL Guard (`ResetPasswordCard.tsx`)

**Files:**
- Create: `client/src/features/auth/components/ResetPasswordCard.tsx`

**Interfaces:**
- Consumes: `authApi.resetPassword`, `resetPasswordSchema`, `PasswordInput`, `useSearchParams` from `react-router-dom`.
- Produces: `ResetPasswordCard` React component.

- [ ] **Step 1: Implement `ResetPasswordCard.tsx`**
Create `client/src/features/auth/components/ResetPasswordCard.tsx` featuring:
1. `useSearchParams()` extraction of `token = searchParams.get('token')`.
2. **Missing Token Guard**:
   - If `!token`, render intentional utility sheet:
     - Title: "Reset link missing or invalid"
     - Subtitle: "This password reset link is invalid or incomplete. Please request a new recovery link."
     - Primary action: "Request a new link" button navigating to `/forgot-password`.
3. **Active Form State (when token is present)**:
   - Title: "Set new password".
   - Subtitle: "Enter your new password below. It must be at least 8 characters."
   - Fields:
     - New Password: using `<PasswordInput>` with `Eye`/`EyeOff` toggle and note "Minimum 8 characters."
     - Confirm Password: using `<PasswordInput>` with `Eye`/`EyeOff` toggle and inline matching error.
   - Primary action: "Update password" button.
4. **Expired / Invalid Token State (Backend 400)**:
   - When API rejects with expired/invalid token:
     - Title: "Reset link expired"
     - Subtitle: "This recovery link has expired or has already been used. Password reset links are valid for one hour."
     - Primary action: "Request a new link" button navigating to `/forgot-password`.
5. **Success State**:
   - Title: "Password updated"
   - Subtitle: "Your password has been reset successfully. You can now sign in with your new credentials."
   - Primary action: "Sign in to Readventure" button navigating to `/signin`.

- [ ] **Step 2: Verify component compiles**
Run `npm run build` in `client/` to verify zero syntax/build errors.

---

### Task 4: Link Integration & Route Registration

**Files:**
- Modify: `client/src/features/auth/components/SignInCard.tsx`
- Modify: `client/src/routes/AppRoutes.tsx`

**Interfaces:**
- Consumes: `ForgotPasswordCard`, `ResetPasswordCard`
- Produces: Active routes `/forgot-password` and `/reset-password`, active Link in `SignInCard`.

- [ ] **Step 1: Update "Forgot password?" Link in `SignInCard.tsx`**
Replace the temporary `onClick={() => alert(...)}` span with:
```tsx
<Link
  to="/forgot-password"
  className="text-xs text-[#8A582B] hover:text-[#754820] cursor-pointer transition-colors"
>
  Forgot password?
</Link>
```

- [ ] **Step 2: Register Routes in `AppRoutes.tsx`**
Import `ForgotPasswordCard` and `ResetPasswordCard` and add the public routes:
```tsx
<Route path="/forgot-password" element={<ForgotPasswordCard />} />
<Route path="/reset-password" element={<ResetPasswordCard />} />
```

- [ ] **Step 3: Verify Client Production Build**
Run `npm run build` in `client/` to ensure bundle passes cleanly.

---

### Task 5: End-to-End System Verification (Browser & API)

**Files:**
- Test execution across browser and running servers (`server` on 5000, `client` on 5173).

- [ ] **Step 1: Start/Verify both Backend & Frontend Services**
Ensure PostgreSQL is active, backend is running on `http://localhost:5000`, and Vite client is running on `http://localhost:5173`.

- [ ] **Step 2: Test URL Guard on `/reset-password`**
Navigate directly to `http://localhost:5173/reset-password` (no query params).
Verify the "Reset link missing or invalid" guard renders with the button to `/forgot-password`.

- [ ] **Step 3: Test Forgot Password Flow with Real Email Delivery**
Navigate to `http://localhost:5173/forgot-password`.
Enter test account email and submit.
Verify in-place transition to "Check your inbox".
Verify reset link is received in Gmail.

- [ ] **Step 4: Test Password Reset Submission & Success**
Open the Gmail reset link (`http://localhost:5173/reset-password?token=...`).
Test show/hide toggles on both password inputs.
Test mismatched passwords to ensure submit is blocked.
Enter new valid password, submit, and verify "Password updated" confirmation.

- [ ] **Step 5: Sign In with New Password & Replay Protection**
Navigate to `/signin` and log in with the new password; verify successful redirection to `/dashboard`.
Open the previously used reset link again; verify the "Reset link expired" state is rendered.

- [ ] **Step 6: User Browser Review Gate**
Present the test results and invite the user to test in their browser.
Once approved by user, proceed to git commit.
