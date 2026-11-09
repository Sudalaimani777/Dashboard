# TripFlow Day 3: Password Reset UI & Flow Specification

**Date:** 2026-11-06  
**Status:** Approved  
**Author:** Pair Programming (User + Antigravity)  
**Branch:** `feature/day-3-password-reset-ui`

---

## 1. Overview & Business Intent

The purpose of Day 3 is to complete the full-stack authentication cycle of the **TripFlow** application by designing, building, and verifying the **Forgot Password** and **Reset Password** user interfaces.

### 1.1 Key Goals
1. Provide an effortless, reassuring recovery journey for users who lose access to their accounts.
2. Maintain strict security boundaries:
   - Anti-enumeration (identical feedback whether an account exists or not).
   - Cryptographic reset token validation (SHA-256 digest on backend, 1-hour expiration).
   - Single-use token enforcement (consumed tokens cannot be replayed).
3. Uphold the **Warm Storycraft** visual design system:
   - Canvas: `#F7F4EE`
   - Surface/Card: `#FFFFFF` / `#FAF8F5`, Border: `#E8DFD3`
   - Primary Accent: `#8A582B` (hover `#754820`)
   - Primary Ink: `#2B231D`, Stone Gray Subtext: `#756F68`
   - Destructive / Warning: `#9E2A2B`
   - Font: **Poppins** (400, 500, 600, 700)
4. Eliminate all generic AI-slop design patterns (no floating icon chips, no rainbow strength meters, no conversational filler or welded arrows, no confetti badges).

---

## 2. Anti-AI-Slop Design Guidelines

| Category | AI Slop Tell (Banned ❌) | High-End Storycraft Pattern (Enforced ✅) |
| :--- | :--- | :--- |
| **Icons & Header** | Floating `KeyRound` / `Mail` inside `bg-amber-100 p-3 rounded-2xl` chip | **Clean editorial header**. Direct brand presence (`TripFlow` wordmark + book glyph), bold Poppins typography (`#2B231D`), zero floating badge chips. |
| **Form Widgets** | 4-bar rainbow strength meter (red $\rightarrow$ yellow $\rightarrow$ green) with checkmark lists | **Subtle contextual validation**. Simple, calm helper text: *"Minimum 8 characters"* that respects the actual backend requirement. |
| **Microcopy** | Filler: *"Don't worry! It happens to the best of us"* & welded arrows (`Send Reset Link →`) | **Calm, respectful copy**. Clean labels: *"Reset your password"*, *"Enter the email address associated with your account"*, and button text: *"Send recovery link"*. No arrow glyphs. |
| **Feedback States** | Sparkles, confetti, or celebratory animated envelopes (`✨ Check your email`) | **Quiet, grounded confirmation card**. Calmly states next steps, notes the 1-hour expiration window, and preserves **anti-enumeration** (same message whether account exists or not). |
| **Surfaces & Layout** | Generic `w-full max-w-md bg-white rounded-2xl shadow-md` floating in a void | **Intentional utility sheet**. Proportioned to match TripFlow's design tokens (Warm canvas `#F7F4EE`, warm border `#E8DFD3`, `#FAF8F5` surface tint, `#756F68` stone gray text). |

---

## 3. Architecture & Routing

### 3.1 Route Registrations
- `/forgot-password`: Public route displaying `ForgotPasswordCard` centered within the Warm Storycraft canvas layout.
- `/reset-password`: Public route displaying `ResetPasswordCard`. Extracts `?token=...` query parameter via React Router's `useSearchParams`.
- `/signin`: Existing Sign In page updated to link the *"Forgot password?"* button directly to `/forgot-password`.

### 3.2 API Client Methods (`client/src/features/auth/services/auth.api.ts`)
```typescript
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Endpoints
forgotPassword: (data: ForgotPasswordRequest) => Promise<ApiResponse<null>>
// POST /api/auth/forgot-password { email }

resetPassword: (data: ResetPasswordRequest) => Promise<ApiResponse<null>>
// POST /api/auth/reset-password { token, newPassword }
```

---

## 4. Component Specifications

### 4.1 `ForgotPasswordCard.tsx` (`/forgot-password`)
- **Default State**:
  - Header: TripFlow brand link/logo + title **"Reset your password"**.
  - Subtitle: *"Enter the email address associated with your account, and we will send you a recovery link."*
  - Form:
    - Label: `Email address`
    - Input: `type="email"`, required, autocomplete `email`.
    - Button: *"Send recovery link"* (`bg-[#8A582B] text-white hover:bg-[#754820]`).
  - Navigation: *"Return to sign in"* linking back to `/signin`.
- **Loading State**:
  - Button disabled with subtle spinner and text *"Sending link..."*.
- **Quiet Confirmation State (In-place swap)**:
  - Header: **"Check your inbox"**
  - Body: *"We have sent a password reset link to **{email}**. If an account with that email exists, the link will arrive within a few moments and remain valid for 1 hour."*
  - Secondary Action: *"Didn't receive the email? Try another address"* (resets form).
  - Primary Action: *"Return to sign in"* button.
- **Error State**:
  - Warm alert banner above the submit button if network failure occurs.

### 4.2 `ResetPasswordCard.tsx` (`/reset-password`)
- **URL Guard / Missing Token State**:
  - If `token` is missing, blank, or undefined in URL search params:
  - Form inputs are **not rendered**.
  - Renders an intentional utility card:
    - Title: **"Reset link missing or invalid"**
    - Subtitle: *"This password reset link is invalid or incomplete. Please request a new recovery link."*
    - Action: Primary button *"Request a new link"* navigating to `/forgot-password`.
- **Active Form State (Token Present)**:
  - Title: **"Set new password"**
  - Subtitle: *"Enter your new password below. It must be at least 8 characters."*
  - Fields:
    1. **New Password**:
       - Type togglable (`password` / `text`) with accessible `Eye` / `EyeOff` button.
       - Contextual note: *"Minimum 8 characters."*
    2. **Confirm New Password**:
       - Type togglable (`password` / `text`) with accessible `Eye` / `EyeOff` button.
       - Real-time pre-flight validation: verifies matching before network dispatch.
  - Action: Button *"Update password"*.
- **Expired / Consumed Token State**:
  - If backend responds with `400 Bad Request` (`"Invalid or expired reset token"`):
  - Form is replaced with:
    - Title: **"Reset link expired"**
    - Subtitle: *"This recovery link has expired or has already been used. Password reset links are valid for one hour."*
    - Action: Button *"Request a new link"* navigating to `/forgot-password`.
- **Success State**:
  - Title: **"Password updated"**
  - Subtitle: *"Your password has been reset successfully. You can now sign in with your new credentials."*
  - Action: Button *"Sign in to TripFlow"* navigating to `/signin`.

---

## 5. Error & Edge Case Matrix

| Scenario | Condition | Handled By | UI Experience |
| :--- | :--- | :--- | :--- |
| Missing Token | No `?token` parameter in URL | Client URL Guard | Intentional warning card with button to `/forgot-password`. |
| Password Mismatch | `newPassword !== confirmPassword` | Client Pre-flight | Red contextual text under Confirm field; submit prevented. |
| Password Too Short | `newPassword.length < 8` | Client Pre-flight | Inline notice: *"Password must be at least 8 characters."* |
| Expired / Used Token | Backend returns 400 | Backend SHA-256 Check | Card informs user link expired, offers one-click new request. |
| Unregistered Email | Email not found in DB | Backend Anti-Enumeration | Returns 200 with standard inbox confirmation card. |
| Network Outage | Server unreachable | Axios interceptor / try-catch | Calm inline error banner without breaking the view. |

---

## 6. Verification & Test Plan

1. **Client Build Test**:
   - `npm run build` in `client/` must pass cleanly with 0 TypeScript and 0 Vite warnings.
2. **Forgot Password Browser Test**:
   - Navigate to `http://localhost:5173/signin`.
   - Click *"Forgot password?"*.
   - Enter test email and click *"Send recovery link"*.
   - Verify in-place transition to *"Check your inbox"* confirmation card.
   - Verify actual email received in Gmail inbox with reset URL.
3. **Reset Password Browser Test**:
   - Click the reset link from Gmail.
   - Verify page opens at `http://localhost:5173/reset-password?token=...`.
   - Verify `Eye` / `EyeOff` toggles work on both password fields.
   - Enter mismatched passwords $\rightarrow$ verify validation blocks submission.
   - Enter valid matching password ($\ge 8$ chars) $\rightarrow$ submit.
   - Verify transition to *"Password updated"* success state.
   - Click *"Sign in to TripFlow"* and log in with the new password.
   - Verify successful authentication and redirection to `/dashboard`.
4. **Edge Case Tests**:
   - Visit `http://localhost:5173/reset-password` without `?token` $\rightarrow$ verify missing token guard card.
   - Click the previously used Gmail reset link again $\rightarrow$ verify expired token card.
5. **Responsive Visual Audit**:
   - Inspect layout at Mobile (375px), Tablet (768px), and Desktop (1440px).
