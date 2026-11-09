# Frontend Warm Storycraft UI & Auth State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade, responsive frontend for TripFlow featuring the Warm Storycraft design system, Poppins typography, customized Shadcn UI primitives, full authentication state management (`useAuth`), responsive Landing page, Sign-in page, and protected Dashboard.

**Architecture:** Client follows Feature-Based Architecture (`features/auth`, `features/landing`, `features/dashboard`, `shared/components/ui`). State is driven by React Context (`AuthContext`) which automatically hydrates existing sessions from `/api/auth/me` with `credentials: 'include'`. The visual layer is built using Tailwind CSS v4, Lucide React, and Shadcn-inspired primitives themed with the Warm Storycraft color tokens (`#8A582B`, `#996735`, `#D4A373`, `#756F68`, `#F7F4EE`, `#2B231D`).

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), React Router (`react-router-dom`), Lucide React, `clsx`, `tailwind-merge`.

**Spec:** [`docs/superpowers/specs/2026-11-05-frontend-warm-storycraft-design.md`](file:///c:/Users/SudalaimaniKannan/Documents/Codings/TripFlow/docs/superpowers/specs/2026-11-05-frontend-warm-storycraft-design.md)

## Global Constraints

- Use font **Poppins** across all headings, body text, buttons, and form labels.
- Theme strictly with the **Warm Storycraft** tokens:
  - Canvas: `#F7F4EE`
  - Card Surface: `#FFFFFF` / `#FAF8F5`
  - Border: `#E8DFD3`
  - Primary button: `#8A582B` (hover `#754820`)
  - Secondary: `#996735`
  - Tertiary / Accent: `#D4A373`
  - Muted: `#756F68`
  - Text Ink: `#2B231D`
- **Zero AI Slop**: No pill badges above headlines, no emojis, no gradient text fills, no generic 3-card icon boxes, no tech-jargon copy, and no Unicode arrows stapled to button text.
- Form inputs must have accessible labels, error states, and responsive touch targets.
- Cookie persistence: All auth API calls must pass `{ credentials: 'include' }` to synchronize HttpOnly cookies.
- Note on git commits: Per user instruction (*"In last we commit"*), individual task commit steps are recorded in the ledger and committed together at the final review.

## Review Focus

1. **Session hydration on page reload**: When a logged-in user refreshes `/dashboard`, the page must not flash a 401 redirect to `/signin`; it must hold a loading state until `/api/auth/me` completes.
2. **Invalid credential alert**: Entering an invalid email or password must render a clean warm-red Alert box with the error message from the backend.
3. **Show/Hide password toggle**: Clicking the toggle must switch input type between `password` and `text` without submitting the form or losing focus.
4. **Responsive mobile layout**: On a 375px mobile viewport, the Landing page hero and Sign-in card must fit comfortably without horizontal scrollbars.
5. **Clean Sign Out**: Clicking "Sign Out" on the dashboard must call `POST /api/auth/signout`, clear the auth context, and navigate to `/signin`.

---

## File Structure

```text
client/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   └── SignInCard.tsx       # Sign-in form card with validation & loading
│   │   │   ├── context/
│   │   │   │   └── AuthContext.tsx      # AuthProvider & Context
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts           # Custom hook consuming AuthContext
│   │   │   ├── services/
│   │   │   │   └── auth.api.ts          # Typed HTTP client with credentials: include
│   │   │   └── types/
│   │   │       └── auth.types.ts        # User, AuthState, Credentials, API response types
│   │   ├── landing/
│   │   │   ├── components/
│   │   │   │   ├── Navbar.tsx           # Brand, links, dynamic CTA
│   │   │   │   ├── HeroSection.tsx      # Value proposition & primary CTA
│   │   │   │   ├── EditorialPreview.tsx # Asymmetric reading card + reader notes
│   │   │   │   └── Footer.tsx           # Minimalist warm footer
│   │   │   └── LandingPage.tsx          # Full landing assembly
│   │   └── dashboard/
│   │       └── DashboardPage.tsx        # Protected user overview, greeting, and signout
│   ├── shared/
│   │   ├── components/
│   │   │   └── ui/                      # Reusable Shadcn UI primitives
│   │   │       ├── button.tsx           # Primary (#8A582B), outline, ghost, link
│   │   │       ├── input.tsx            # Styled input with warm border & focus ring
│   │   │       ├── card.tsx             # Card, CardHeader, CardTitle, CardContent, CardFooter
│   │   │       ├── label.tsx            # Accessible form label
│   │   │       └── alert.tsx            # Alert, AlertDescription (warm red error box)
│   │   └── utils/
│   │       └── cn.ts                    # clsx + twMerge utility function
│   ├── routes/
│   │   ├── AppRoutes.tsx                # BrowserRouter with route tree
│   │   └── ProtectedRoute.tsx           # Redirects unauthenticated users to /signin
│   ├── App.tsx                          # Root container wrapping AuthProvider & AppRoutes
│   ├── main.tsx                         # React 19 entry point
│   └── index.css                        # Tailwind directives, Poppins font import & Warm Storycraft tokens
├── package.json                         # Add tailwindcss, lucide-react, react-router-dom, clsx, tailwind-merge
└── vite.config.ts                       # Tailwind Vite plugin integration
```

---

### Task 1: Frontend Dependencies & Tailwind CSS v4 Setup with Poppins Font

**Files:**
- Modify: `client/package.json`
- Modify: `client/vite.config.ts`
- Modify: `client/src/index.css`
- Create: `client/src/shared/utils/cn.ts`

**Interfaces:**
- Produces: `cn(...inputs)` utility function, Tailwind classes, Poppins typography, Warm Storycraft CSS custom properties.

- [ ] **Step 1: Install frontend dependencies**

Run in `client`:
```bash
cd client
npm install tailwindcss @tailwindcss/vite react-router-dom lucide-react clsx tailwind-merge
```

- [ ] **Step 2: Configure `client/vite.config.ts` with Tailwind CSS v4 plugin**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
});
```

- [ ] **Step 3: Create `client/src/shared/utils/cn.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Update `client/src/index.css` with Poppins font and Warm Storycraft theme**

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

@theme {
  --font-sans: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --color-canvas: #F7F4EE;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #FAF8F5;
  --color-border-warm: #E8DFD3;
  --color-primary: #8A582B;
  --color-primary-hover: #754820;
  --color-secondary: #996735;
  --color-tertiary: #D4A373;
  --color-muted: #756F68;
  --color-ink: #2B231D;
  --color-destructive: #9E2A2B;
}

:root {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #F7F4EE;
  color: #2B231D;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

body {
  margin: 0;
  min-height: 100vh;
  background-color: #F7F4EE;
  color: #2B231D;
}
```

- [ ] **Step 5: Verify build in `client`**

Run: `npm run build` in `client`.
Expected: PASS with 0 errors.

---

### Task 2: Reusable Shadcn UI Primitives in Warm Storycraft Style

**Files:**
- Create: `client/src/shared/components/ui/button.tsx`
- Create: `client/src/shared/components/ui/input.tsx`
- Create: `client/src/shared/components/ui/label.tsx`
- Create: `client/src/shared/components/ui/card.tsx`
- Create: `client/src/shared/components/ui/alert.tsx`

**Interfaces:**
- Produces: `Button`, `Input`, `Label`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Alert`, `AlertDescription`.

- [ ] **Step 1: Create `client/src/shared/components/ui/button.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A582B] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      primary: 'bg-[#8A582B] text-white hover:bg-[#754820] shadow-sm',
      secondary: 'bg-[#EFE8DE] text-[#2B231D] hover:bg-[#E5DBCF]',
      outline: 'border border-[#E8DFD3] text-[#2B231D] bg-transparent hover:bg-[#FAF8F5]',
      ghost: 'text-[#2B231D] bg-transparent hover:bg-[#FAF8F5]',
      link: 'text-[#8A582B] underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-11 px-5 text-sm',
      lg: 'h-13 px-7 text-base font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
```

- [ ] **Step 2: Create `client/src/shared/components/ui/input.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border bg-[#FAF8F5] px-3.5 py-2 text-sm text-[#2B231D] placeholder:text-[#756F68]/60 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A582B] focus-visible:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-[#9E2A2B] focus-visible:ring-[#9E2A2B]' : 'border-[#E8DFD3]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
```

- [ ] **Step 3: Create `client/src/shared/components/ui/label.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../../utils/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-xs font-semibold uppercase tracking-wider text-[#756F68]', className)}
      {...props}
    />
  )
);
Label.displayName = 'Label';
```

- [ ] **Step 4: Create `client/src/shared/components/ui/card.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-[#E8DFD3] bg-[#FFFFFF] p-6 shadow-sm shadow-[#8A582B]/5',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-bold tracking-tight text-[#2B231D]', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-[#756F68]', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('', className)} {...props} />
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-4', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
```

- [ ] **Step 5: Create `client/src/shared/components/ui/alert.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../../utils/cn';

export const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative w-full rounded-xl border border-[#9E2A2B]/20 bg-[#FDF2F2] p-4 text-sm text-[#9E2A2B]',
        className
      )}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-xs font-medium leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';
```

- [ ] **Step 6: Verify build in `client`**

Run: `npm run build` in `client`.
Expected: PASS with 0 errors.

---

### Task 3: Auth Types & API Service

**Files:**
- Create: `client/src/features/auth/types/auth.types.ts`
- Create: `client/src/features/auth/services/auth.api.ts`

**Interfaces:**
- Produces: `User`, `LoginCredentials`, `ApiResponse<T>`, `authApi.signin()`, `authApi.getProfile()`, `authApi.signout()`.

- [ ] **Step 1: Create `client/src/features/auth/types/auth.types.ts`**

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, unknown>;
}

export interface AuthResponseData {
  user: User;
  token?: string;
}
```

- [ ] **Step 2: Create `client/src/features/auth/services/auth.api.ts`**

```typescript
import { ApiResponse, AuthResponseData, LoginCredentials, User } from '../types/auth.types';

const API_BASE_URL = 'http://localhost:5000/api';

class AuthApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      // Ensure cookies are included for session persistence
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);
      const data: ApiResponse<T> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'An unexpected authentication error occurred.');
      }

      return data;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Network error. Unable to reach authentication server.');
    }
  }

  async signin(credentials: LoginCredentials): Promise<User> {
    const res = await this.request<AuthResponseData>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return res.data.user;
  }

  async getProfile(): Promise<User> {
    const res = await this.request<{ user: User }>('/auth/me', {
      method: 'GET',
    });
    return res.data.user;
  }

  async signout(): Promise<void> {
    await this.request<null>('/auth/signout', {
      method: 'POST',
    });
  }
}

export const authApi = new AuthApiService();
```

- [ ] **Step 3: Verify build in `client`**

Run: `npm run build` in `client`.
Expected: PASS with 0 errors.

---

### Task 4: Auth State Context & `useAuth` Hook

**Files:**
- Create: `client/src/features/auth/context/AuthContext.tsx`
- Create: `client/src/features/auth/hooks/useAuth.ts`

**Interfaces:**
- Produces: `AuthProvider`, `useAuth(): { user, isAuthenticated, isLoading, signin, signout }`.

- [ ] **Step 1: Create `client/src/features/auth/context/AuthContext.tsx`**

```tsx
import React, { createContext, useCallback, useEffect, useState } from 'react';
import { authApi } from '../services/auth.api';
import { LoginCredentials, User } from '../types/auth.types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signin: (credentials: LoginCredentials) => Promise<void>;
  signout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Hydrate session on app load via /auth/me
  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await authApi.getProfile();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signin = async (credentials: LoginCredentials) => {
    const authenticatedUser = await authApi.signin(credentials);
    setUser(authenticatedUser);
  };

  const signout = async () => {
    try {
      await authApi.signout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signin,
        signout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

- [ ] **Step 2: Create `client/src/features/auth/hooks/useAuth.ts`**

```typescript
import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../context/AuthContext';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

- [ ] **Step 3: Verify build in `client`**

Run: `npm run build` in `client`.
Expected: PASS with 0 errors.

---

### Task 5: Sign-in Component & Page (`/signin`)

**Files:**
- Create: `client/src/features/auth/components/SignInCard.tsx`

**Interfaces:**
- Produces: `SignInCard` component with form validation, show/hide password, error banners, and redirect.

- [ ] **Step 1: Create `client/src/features/auth/components/SignInCard.tsx`**

```tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '../../../shared/components/ui/alert';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { useAuth } from '../hooks/useAuth';

export const SignInCard: React.FC = () => {
  const navigate = useNavigate();
  const { signin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signin({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE] px-4 py-12">
      <Card className="w-full max-w-md bg-[#FFFFFF] border-[#E8DFD3] shadow-md shadow-[#8A582B]/5 rounded-2xl">
        <CardHeader className="text-center pb-6">
          <Link to="/" className="inline-block mb-3 text-sm font-semibold tracking-wide text-[#8A582B] hover:text-[#754820] transition-colors">
            TripFlow
          </Link>
          <CardTitle className="text-2xl font-bold text-[#2B231D]">Sign In</CardTitle>
          <CardDescription className="text-sm text-[#756F68] mt-1">
            Enter your credentials to access your library
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#756F68] hover:text-[#2B231D] transition-colors cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex items-center justify-end">
              <span className="text-xs text-[#8A582B] hover:text-[#754820] cursor-pointer">
                Forgot password?
              </span>
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t border-[#E8DFD3]/60 pt-4">
          <p className="text-xs text-[#756F68]">
            Don't have an account?{' '}
            <span className="font-semibold text-[#8A582B] hover:text-[#754820] cursor-pointer">
              Sign up
            </span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
```

- [ ] **Step 2: Verify build in `client`**

Run: `npm run build` in `client`.
Expected: PASS with 0 errors.

---

### Task 6: Landing Page & Editorial Preview (`/`)

**Files:**
- Create: `client/src/features/landing/components/Navbar.tsx`
- Create: `client/src/features/landing/components/HeroSection.tsx`
- Create: `client/src/features/landing/components/EditorialPreview.tsx`
- Create: `client/src/features/landing/components/Footer.tsx`
- Create: `client/src/features/landing/LandingPage.tsx`

**Interfaces:**
- Produces: Full Landing page themed in Warm Storycraft.

- [ ] **Step 1: Create `client/src/features/landing/components/Navbar.tsx`**

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Button } from '../../../shared/components/ui/button';

export const Navbar: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="w-full border-b border-[#E8DFD3] bg-[#F7F4EE]">
      <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight text-[#2B231D]">
          TripFlow
        </Link>

        <nav className="flex items-center gap-6">
          <span className="text-sm font-medium text-[#756F68] hover:text-[#2B231D] transition-colors cursor-pointer">
            Explore
          </span>
          <span className="text-sm font-medium text-[#756F68] hover:text-[#2B231D] transition-colors cursor-pointer">
            About
          </span>

          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button variant="primary" size="sm">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/signin">
              <Button variant="outline" size="sm" className="border-[#8A582B] text-[#8A582B] hover:bg-[#8A582B] hover:text-white">
                Sign In
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
```

- [ ] **Step 2: Create `client/src/features/landing/components/HeroSection.tsx`**

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/button';

export const HeroSection: React.FC = () => {
  return (
    <section className="pt-20 pb-16 text-center max-w-3xl mx-auto px-6">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#2B231D] leading-tight">
        A quiet home for your reading life.
      </h1>
      <p className="mt-5 text-base sm:text-lg text-[#756F68] leading-relaxed max-w-2xl mx-auto">
        Track what you read, collect your favorite passages, and keep your personal library in one calm, distraction-free space.
      </p>
      <div className="mt-8 flex justify-center">
        <Link to="/signin">
          <Button variant="primary" size="lg" className="px-8 shadow-sm">
            Open Your Library
          </Button>
        </Link>
      </div>
    </section>
  );
};
```

- [ ] **Step 3: Create `client/src/features/landing/components/EditorialPreview.tsx`**

```tsx
import React from 'react';
import { Card } from '../../../shared/components/ui/card';

export const EditorialPreview: React.FC = () => {
  return (
    <section className="py-12 max-w-5xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left: Active Book Card */}
        <div className="md:col-span-7">
          <Card className="bg-[#FFFFFF] border-[#E8DFD3] p-8 shadow-sm rounded-2xl">
            <div className="text-xs uppercase tracking-widest text-[#996735] font-semibold mb-2">
              Currently Reading
            </div>
            <h3 className="text-2xl font-bold text-[#2B231D]">
              The Shadow of the Wind
            </h3>
            <p className="text-sm text-[#756F68] mt-1">Carlos Ruiz Zafón</p>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-medium text-[#756F68]">
                <span>Progress: Page 184 of 487</span>
                <span>38%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EFE8DE] overflow-hidden">
                <div className="h-full bg-[#D4A373] rounded-full w-[38%]" />
              </div>
            </div>

            <p className="mt-6 text-sm italic text-[#756F68] border-l-2 border-[#D4A373] pl-4">
              "Books are mirrors: you only see in them what you already have inside you."
            </p>
          </Card>
        </div>

        {/* Right: Editorial reader notes */}
        <div className="md:col-span-5 space-y-6">
          <div>
            <h4 className="text-base font-bold text-[#2B231D]">
              Distraction-free tracking
            </h4>
            <p className="text-sm text-[#756F68] mt-1.5 leading-relaxed">
              Log finished books, maintain a clean reading queue, and reflect on what you read without clutter.
            </p>
          </div>

          <div className="pt-2">
            <h4 className="text-base font-bold text-[#2B231D]">
              Always synchronized
            </h4>
            <p className="text-sm text-[#756F68] mt-1.5 leading-relaxed">
              Sign in once and access your books and reading progress from any device.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
```

- [ ] **Step 4: Create `client/src/features/landing/components/Footer.tsx`**

```tsx
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#E8DFD3] mt-20 py-8 bg-[#F7F4EE]">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#756F68] gap-4">
        <div>© 2026 TripFlow. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <span className="hover:text-[#2B231D] cursor-pointer">Privacy</span>
          <span className="hover:text-[#2B231D] cursor-pointer">Terms</span>
          <span className="hover:text-[#2B231D] cursor-pointer">Support</span>
        </div>
      </div>
    </footer>
  );
};
```

- [ ] **Step 5: Create `client/src/features/landing/LandingPage.tsx`**

```tsx
import React from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { EditorialPreview } from './components/EditorialPreview';
import { Footer } from './components/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE]">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <EditorialPreview />
      </main>
      <Footer />
    </div>
  );
};
```

- [ ] **Step 6: Verify build in `client`**

Run: `npm run build` in `client`.
Expected: PASS with 0 errors.

---

### Task 7: Protected Dashboard & Router Integration

**Files:**
- Create: `client/src/features/dashboard/DashboardPage.tsx`
- Create: `client/src/routes/ProtectedRoute.tsx`
- Create: `client/src/routes/AppRoutes.tsx`
- Modify: `client/src/App.tsx`

**Interfaces:**
- Produces: Protected Dashboard (`/dashboard`), Route tree, and complete functional frontend.

- [ ] **Step 1: Create `client/src/features/dashboard/DashboardPage.tsx`**

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';

export const DashboardPage: React.FC = () => {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  const handleSignout = async () => {
    await signout();
    navigate('/signin');
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recent';

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col">
      {/* Dashboard Topbar */}
      <header className="w-full border-b border-[#E8DFD3] bg-[#FFFFFF]">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight text-[#2B231D]">
            TripFlow
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#756F68] hidden sm:inline">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 w-full flex-1 space-y-6">
        <Card className="bg-[#FFFFFF] border-[#E8DFD3] p-6 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl text-[#2B231D]">
              Welcome back, {user?.name || 'Reader'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#756F68]">
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3]">
                <div className="text-xs font-semibold uppercase text-[#996735]">Email Address</div>
                <div className="text-[#2B231D] font-medium mt-1">{user?.email}</div>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3]">
                <div className="text-xs font-semibold uppercase text-[#996735]">Member Since</div>
                <div className="text-[#2B231D] font-medium mt-1">{formattedDate}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FFFFFF] border-[#E8DFD3] p-6 rounded-2xl shadow-sm">
          <h4 className="text-base font-bold text-[#2B231D]">Your Personal Library</h4>
          <p className="text-sm text-[#756F68] mt-1.5 leading-relaxed">
            Your reading library space is ready. Day 3 will introduce full account registration and password recovery.
          </p>
        </Card>
      </main>
    </div>
  );
};
```

- [ ] **Step 2: Create `client/src/routes/ProtectedRoute.tsx`**

```tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE]">
        <div className="text-sm text-[#756F68]">Loading your library...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
};
```

- [ ] **Step 3: Create `client/src/routes/AppRoutes.tsx`**

```tsx
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LandingPage } from '../features/landing/LandingPage';
import { SignInCard } from '../features/auth/components/SignInCard';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInCard />} />

        {/* Protected Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
};
```

- [ ] **Step 4: Update `client/src/App.tsx`**

```tsx
import React from 'react';
import { AuthProvider } from './features/auth/context/AuthContext';
import { AppRoutes } from './routes/AppRoutes';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
```

- [ ] **Step 5: Verify build in `client`**

Run in `client`:
```bash
npm run build
```
Expected output:
```text
vite v8.x.x building for production...
✓ built in xxxms
```
PASS with 0 TypeScript and build errors.
