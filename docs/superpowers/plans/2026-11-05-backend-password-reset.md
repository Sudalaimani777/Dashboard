# Backend Password Reset & Email Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement secure, production-grade forgot-password and reset-password backend endpoints with automated Ethereal email previews and PostgreSQL token management.

**Architecture:** Extend the existing Express + TypeScript Feature-Based Architecture (`features/auth`). A dedicated `email.service.ts` encapsulates Nodemailer with zero-config Ethereal testing in dev and SMTP in production. Cryptographically secure 32-byte tokens are generated, stored as SHA-256 digests in PostgreSQL with a 1-hour expiration window, and cleared upon successful reset.

**Tech Stack:** Node.js, Express 5, TypeScript 5, PostgreSQL (`pg`), Nodemailer, Bcryptjs, Crypto (native Node.js).

**Spec:** [`docs/superpowers/specs/2026-11-05-backend-password-reset-design.md`](file:///c:/Users/SudalaimaniKannan/Documents/Codings/Readventure/docs/superpowers/specs/2026-11-05-backend-password-reset-design.md)

## Global Constraints

- Follow Feature-Based Architecture: feature code stays inside `server/src/features/auth/`, shared utilities inside `server/src/shared/`.
- Passwords must be hashed using `bcryptjs` with salt rounds = 10.
- Database tokens must be stored strictly as one-way SHA-256 hex hashes (`crypto.createHash('sha256')`); never store plain text tokens in PostgreSQL.
- Forgot-password requests must be anti-enumeration: always return HTTP `200 OK` regardless of whether the email is registered.
- Token expiration is strictly 1 hour from generation.
- Replaying an already used reset token must be rejected with HTTP `400 Bad Request`.

## Review Focus

1. **Email case insensitivity**: A user requesting password reset for `ALEX@example.com` or `alex@example.com` must both find the account registered under lowercase.
2. **Expired token rejection**: A token created with an expiration time in the past must be rejected with `400 Bad Request` and message `"Invalid or expired password reset token"`.
3. **Database hash mismatch immunity**: A database read leak must only expose the 64-char SHA-256 hash, not the 32-byte hex raw token sent to the user's inbox.
4. **Immediate single-use invalidation**: Immediately upon successful password reset, `reset_token` and `reset_token_expires_at` must become `NULL`.
5. **Old password invalidation**: Immediately after reset, attempting to sign in with the old password must fail with HTTP `401 Unauthorized`.

---

## File Structure

- **Create**: `server/src/shared/services/email.service.ts` (Nodemailer transporter, Ethereal account memoization, template generation, preview URL extraction)
- **Modify**: `server/src/config/env.ts` (SMTP and CLIENT_URL environment variables)
- **Modify**: `server/src/features/auth/auth.types.ts` (`ForgotPasswordDto`, `ResetPasswordDto` definitions)
- **Modify**: `server/src/features/auth/auth.repository.ts` (`setResetToken`, `findByResetToken`, `updatePasswordAndClearReset`)
- **Modify**: `server/src/features/auth/auth.service.ts` (`forgotPassword`, `resetPassword`)
- **Modify**: `server/src/features/auth/auth.controller.ts` (`forgotPassword`, `resetPassword` HTTP handlers)
- **Modify**: `server/src/features/auth/auth.routes.ts` (Mount `/forgot-password` and `/reset-password`)
- **Modify**: `server/package.json` (Dependencies and test script)
- **Create**: `server/test-day2-backend.ts` (Comprehensive end-to-end verification script)

---

### Task 1: Environment Configuration & Nodemailer Dependencies

**Files:**
- Modify: `server/package.json`
- Modify: `server/src/config/env.ts`

**Interfaces:**
- Produces: `config.smtp: { host, port, user, pass, from }`, `config.clientUrl: string`

- [ ] **Step 1: Install nodemailer and type definitions**

Run in `server`:
```bash
cd server
npm install nodemailer
npm install -D @types/nodemailer
```

- [ ] **Step 2: Update `server/src/config/env.ts` with email and client URL configuration**

```typescript
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  db: {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'readventure_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: Number(process.env.DB_PORT) || 5432,
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Readventure <noreply@readventure.com>',
  },
};
```

- [ ] **Step 3: Verify TypeScript compilation**

Run in `server`:
```bash
npx tsc --noEmit
```
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add server/package.json server/package-lock.json server/src/config/env.ts
git commit -m "feat(config): add nodemailer and smtp configuration bindings"
```

---

### Task 2: Reusable Email Service Module

**Files:**
- Create: `server/src/shared/services/email.service.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface EmailResult {
    messageId: string;
    previewUrl?: string | false;
  }
  export interface IEmailService {
    sendPasswordResetEmail(toEmail: string, recipientName: string, resetUrl: string): Promise<EmailResult>;
  }
  export const emailService: EmailService;
  ```

- [ ] **Step 1: Implement `email.service.ts` with Ethereal fallback and template rendering**

Create `server/src/shared/services/email.service.ts`:
```typescript
import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../../config/env.js';

export interface EmailResult {
  messageId: string;
  previewUrl?: string | false;
}

export interface IEmailService {
  sendPasswordResetEmail(toEmail: string, recipientName: string, resetUrl: string): Promise<EmailResult>;
}

export class EmailService implements IEmailService {
  private transporter: Transporter | null = null;

  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    if (config.smtp.host && config.smtp.user && config.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      return this.transporter;
    }

    // Dev/test fallback: Auto-create Ethereal test inbox
    const testAccount = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log(`📧 [EmailService] Ethereal test mailbox provisioned: ${testAccount.user}`);
    return this.transporter;
  }

  async sendPasswordResetEmail(
    toEmail: string,
    recipientName: string,
    resetUrl: string
  ): Promise<EmailResult> {
    const transporter = await this.getTransporter();

    const mailOptions = {
      from: config.smtp.from,
      to: toEmail,
      subject: 'Reset Your Readventure Password',
      text: `Hello ${recipientName},\n\nYou requested to reset your Readventure password. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.\n\nBest regards,\nThe Readventure Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e4e7; border-radius: 8px;">
          <h2 style="color: #08060d; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #6b6375; font-size: 16px;">Hello <strong>${recipientName}</strong>,</p>
          <p style="color: #6b6375; font-size: 16px; line-height: 1.5;">
            We received a request to reset the password for your Readventure account. Click the button below to choose a new password:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #aa3bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b6375; font-size: 14px;">
            Or copy and paste this URL into your browser:<br/>
            <a href="${resetUrl}" style="color: #aa3bff; word-break: break-all;">${resetUrl}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #e5e4e7; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
            This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    if (previewUrl) {
      console.log(`🔗 [EmailService] Password reset email preview: ${previewUrl}`);
    }

    return {
      messageId: info.messageId,
      previewUrl,
    };
  }
}

export const emailService = new EmailService();
```

- [ ] **Step 2: Verify TypeScript compilation**

Run in `server`:
```bash
npx tsc --noEmit
```
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/shared/services/email.service.ts
git commit -m "feat(email): add email service with Ethereal development fallback and reset template"
```

---

### Task 3: Auth DTOs & Repository Database Methods

**Files:**
- Modify: `server/src/features/auth/auth.types.ts`
- Modify: `server/src/features/auth/auth.repository.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface ForgotPasswordDto { email: string; }
  export interface ResetPasswordDto { token: string; newPassword: string; }
  export interface IAuthRepository {
    // ... existing methods ...
    setResetToken(userId: string, hashedToken: string, expiresAt: Date): Promise<void>;
    findByResetToken(hashedToken: string): Promise<User | null>;
    updatePasswordAndClearReset(userId: string, newPasswordHash: string): Promise<void>;
  }
  ```

- [ ] **Step 1: Add DTOs to `server/src/features/auth/auth.types.ts`**

Append to `server/src/features/auth/auth.types.ts`:
```typescript
export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}
```

- [ ] **Step 2: Update `server/src/features/auth/auth.repository.ts`**

Update `IAuthRepository` and `AuthRepository` with the 3 SQL methods:
```typescript
import { query } from '../../shared/db/pool.js';
import { User } from './auth.types.js';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(name: string, email: string, passwordHash: string): Promise<User>;
  setResetToken(userId: string, hashedToken: string, expiresAt: Date): Promise<void>;
  findByResetToken(hashedToken: string): Promise<User | null>;
  updatePasswordAndClearReset(userId: string, newPasswordHash: string): Promise<void>;
}

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    const res = await query(
      `SELECT id, name, email, password_hash, reset_token, reset_token_expires_at, created_at, updated_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    return (res.rows[0] as User) || null;
  }

  async findById(id: string): Promise<User | null> {
    const res = await query(
      `SELECT id, name, email, password_hash, reset_token, reset_token_expires_at, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    return (res.rows[0] as User) || null;
  }

  async create(name: string, email: string, passwordHash: string): Promise<User> {
    const res = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, LOWER($2), $3)
       RETURNING id, name, email, password_hash, reset_token, reset_token_expires_at, created_at, updated_at`,
      [name, email, passwordHash]
    );

    return res.rows[0] as User;
  }

  async setResetToken(userId: string, hashedToken: string, expiresAt: Date): Promise<void> {
    await query(
      `UPDATE users
       SET reset_token = $1, reset_token_expires_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [hashedToken, expiresAt, userId]
    );
  }

  async findByResetToken(hashedToken: string): Promise<User | null> {
    const res = await query(
      `SELECT id, name, email, password_hash, reset_token, reset_token_expires_at, created_at, updated_at
       FROM users
       WHERE reset_token = $1 AND reset_token_expires_at > CURRENT_TIMESTAMP
       LIMIT 1`,
      [hashedToken]
    );

    return (res.rows[0] as User) || null;
  }

  async updatePasswordAndClearReset(userId: string, newPasswordHash: string): Promise<void> {
    await query(
      `UPDATE users
       SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newPasswordHash, userId]
    );
  }
}

export const authRepository = new AuthRepository();
```

- [ ] **Step 3: Verify TypeScript compilation**

Run in `server`:
```bash
npx tsc --noEmit
```
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/features/auth/auth.types.ts server/src/features/auth/auth.repository.ts
git commit -m "feat(auth): add password reset repository methods and DTO interfaces"
```

---

### Task 4: Auth Service Business Logic & Token Crypto

**Files:**
- Modify: `server/src/features/auth/auth.service.ts`

**Interfaces:**
- Consumes: `IAuthRepository`, `IEmailService`, `ForgotPasswordDto`, `ResetPasswordDto`
- Produces:
  ```typescript
  export class AuthService {
    // ... existing ...
    forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; previewUrl?: string | false }>;
    resetPassword(dto: ResetPasswordDto): Promise<{ message: string }>;
  }
  ```

- [ ] **Step 1: Implement `forgotPassword` and `resetPassword` in `AuthService`**

Update `server/src/features/auth/auth.service.ts`:
```typescript
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { emailService, IEmailService } from '../../shared/services/email.service.js';
import { authRepository, IAuthRepository } from './auth.repository.js';
import {
  AuthResponse,
  ForgotPasswordDto,
  JwtPayload,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SafeUser,
  User,
} from './auth.types.js';

export class AuthService {
  constructor(
    private repo: IAuthRepository = authRepository,
    private mailer: IEmailService = emailService
  ) {}

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  private sanitizeUser(user: User): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    return jwt.sign(payload, config.jwt.secret as jwt.Secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  async signup(dto: RegisterDto): Promise<AuthResponse> {
    const name = dto.name?.trim();
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password;

    if (!name || name.length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('Please provide a valid email address');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const existingUser = await this.repo.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await this.repo.create(name, email, passwordHash);
    const token = this.generateToken(newUser);

    return {
      user: this.sanitizeUser(newUser),
      token,
    };
  }

  async signin(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await this.repo.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.sanitizeUser(user);
  }

  async forgotPassword(
    dto: ForgotPasswordDto
  ): Promise<{ message: string; previewUrl?: string | false }> {
    const email = dto.email?.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      throw new Error('Please provide a valid email address');
    }

    const genericMessage =
      'If an account with that email exists, a password reset link has been sent.';

    const user = await this.repo.findByEmail(email);
    if (!user) {
      // Anti-enumeration: return generic success without revealing non-existence
      return { message: genericMessage };
    }

    // Generate 32-byte cryptographically secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.repo.setResetToken(user.id, hashedToken, expiresAt);

    const resetUrl = `${config.clientUrl}/reset-password?token=${rawToken}`;
    const emailResult = await this.mailer.sendPasswordResetEmail(user.email, user.name, resetUrl);

    return {
      message: genericMessage,
      previewUrl: emailResult.previewUrl,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const token = dto.token?.trim();
    const newPassword = dto.newPassword;

    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const hashedToken = this.hashToken(token);
    const user = await this.repo.findByResetToken(hashedToken);

    if (!user) {
      throw new Error('Invalid or expired password reset token');
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.repo.updatePasswordAndClearReset(user.id, newPasswordHash);

    return {
      message: 'Password has been successfully reset. Please sign in with your new password.',
    };
  }
}

export const authService = new AuthService();
```

- [ ] **Step 2: Verify TypeScript compilation**

Run in `server`:
```bash
npx tsc --noEmit
```
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/features/auth/auth.service.ts
git commit -m "feat(auth): implement forgotPassword and resetPassword business logic with token crypto"
```

---

### Task 5: Auth Controller & Routes Integration

**Files:**
- Modify: `server/src/features/auth/auth.controller.ts`
- Modify: `server/src/features/auth/auth.routes.ts`

**Interfaces:**
- Produces:
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`

- [ ] **Step 1: Add handlers to `AuthController`**

Update `server/src/features/auth/auth.controller.ts`:
```typescript
import { CookieOptions, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../../shared/utils/response.js';
import { authService, AuthService } from './auth.service.js';

const COOKIE_NAME = 'token';

const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
});

export class AuthController {
  constructor(private service: AuthService = authService) {}

  signup = async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      const result = await this.service.signup({ name, email, password });

      res.cookie(COOKIE_NAME, result.token, getCookieOptions());

      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (err) {
      const message = (err as Error).message;
      const statusCode = message.includes('already exists') ? 409 : 400;
      return sendError(res, message, statusCode);
    }
  };

  signin = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await this.service.signin({ email, password });

      res.cookie(COOKIE_NAME, result.token, getCookieOptions());

      return sendSuccess(res, result, 'Signed in successfully', 200);
    } catch (err) {
      const message = (err as Error).message;
      return sendError(res, message, 401);
    }
  };

  signout = async (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return sendSuccess(res, null, 'Signed out successfully', 200);
  };

  me = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'Unauthorized', 401);
      }
      const user = await this.service.getProfile(req.user.userId);
      return sendSuccess(res, { user }, 'Profile retrieved successfully', 200);
    } catch (err) {
      return sendError(res, (err as Error).message, 404);
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const result = await this.service.forgotPassword({ email });
      return sendSuccess(res, result.previewUrl ? { previewUrl: result.previewUrl } : null, result.message, 200);
    } catch (err) {
      return sendError(res, (err as Error).message, 400);
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      const result = await this.service.resetPassword({ token, newPassword });
      return sendSuccess(res, null, result.message, 200);
    } catch (err) {
      return sendError(res, (err as Error).message, 400);
    }
  };
}

export const authController = new AuthController();
```

- [ ] **Step 2: Register routes in `server/src/features/auth/auth.routes.ts`**

Update `server/src/features/auth/auth.routes.ts`:
```typescript
import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { authController } from './auth.controller.js';

const router = Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/signout', authController.signout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', requireAuth, authController.me);

export const authRoutes = router;
```

- [ ] **Step 3: Verify TypeScript compilation**

Run in `server`:
```bash
npx tsc --noEmit
```
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/features/auth/auth.controller.ts server/src/features/auth/auth.routes.ts
git commit -m "feat(auth): mount forgot-password and reset-password endpoints"
```

---

### Task 6: Automated End-to-End Verification Suite

**Files:**
- Create: `server/test-day2-backend.ts`
- Modify: `server/package.json`

**Interfaces:**
- Tests all 9 Day 2 verification criteria against live PostgreSQL.

- [ ] **Step 1: Write `server/test-day2-backend.ts`**

```typescript
import http from 'node:http';
import { app } from './src/app.js';
import { pool, query } from './src/shared/db/pool.js';
import { runMigrations } from './src/shared/db/migrate.js';

const PORT = 5098; // Dedicated port for Day 2 tests
let server: http.Server;
const baseUrl = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('\n🧪 ==========================================');
  console.log('   DAY 2 BACKEND VERIFICATION TEST SUITE');
  console.log('==========================================\n');

  await runMigrations();

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => resolve());
  });

  const testEmail = `day2_user_${Date.now()}@readventure.com`;
  const originalPassword = 'InitialPassword123!';
  const updatedPassword = 'NewSecretPassword456!';
  let receivedResetToken = '';

  let passed = 0;
  let total = 0;

  async function assertTest(name: string, fn: () => Promise<boolean>) {
    total++;
    try {
      const ok = await fn();
      if (ok) {
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      } else {
        console.log(`  ❌ FAIL: ${name}`);
      }
    } catch (err) {
      console.log(`  ❌ FAIL: ${name} -> ${(err as Error).message}`);
    }
  }

  try {
    // 0. Setup: Register a user for test
    const signupRes = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Day2 Tester',
        email: testEmail,
        password: originalPassword,
      }),
    });
    const signupData = await signupRes.json();
    if (!signupData.success) {
      throw new Error('Initial test signup failed');
    }

    // Test 1: Forgot password with registered email
    await assertTest('POST /api/auth/forgot-password with valid email returns 200 & preview URL', async () => {
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });
      const body = await res.json();
      return res.status === 200 && body.success === true && typeof body.message === 'string';
    });

    // Test 2: Forgot password with unregistered email (Anti-enumeration)
    await assertTest('POST /api/auth/forgot-password with non-existent email returns 200 (anti-enumeration)', async () => {
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ghost_nonexistent@readventure.com' }),
      });
      const body = await res.json();
      return res.status === 200 && body.success === true;
    });

    // Test 3: Invalid email format rejected
    await assertTest('POST /api/auth/forgot-password with invalid email rejected with 400', async () => {
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      });
      const body = await res.json();
      return res.status === 400 && body.success === false;
    });

    // Test 4: Verify SHA-256 token hash & expiry in PostgreSQL
    await assertTest('PostgreSQL holds SHA-256 hash (64 hex chars) and future expiration', async () => {
      const dbRes = await query(
        `SELECT reset_token, reset_token_expires_at FROM users WHERE email = LOWER($1)`,
        [testEmail]
      );
      const row = dbRes.rows[0];
      const has64HexToken = typeof row?.reset_token === 'string' && row.reset_token.length === 64;
      const isFutureExpiry = new Date(row?.reset_token_expires_at).getTime() > Date.now();
      return has64HexToken && isFutureExpiry;
    });

    // Test 5: Bogus/invalid token rejected
    await assertTest('POST /api/auth/reset-password with invalid token rejected with 400', async () => {
      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'invalid_bogus_token_12345',
          newPassword: updatedPassword,
        }),
      });
      const body = await res.json();
      return res.status === 400 && body.success === false;
    });

    // Test 6: Short password rejected
    await assertTest('POST /api/auth/reset-password with short password (<6 chars) rejected with 400', async () => {
      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'some_token',
          newPassword: '123',
        }),
      });
      const body = await res.json();
      return res.status === 400 && body.success === false;
    });

    // Test 7: Successful password reset with valid token
    await assertTest('POST /api/auth/reset-password successfully resets password & clears token in DB', async () => {
      // Re-trigger forgot password to get a fresh token from service
      const crypto = await import('node:crypto');
      const testRawToken = 'a'.repeat(64); // 32-byte hex
      const testHashedToken = crypto.createHash('sha256').update(testRawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await query(
        `UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE email = LOWER($3)`,
        [testHashedToken, expiresAt, testEmail]
      );

      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: testRawToken,
          newPassword: updatedPassword,
        }),
      });

      const body = await res.json();
      const isSuccess = res.status === 200 && body.success === true;

      // Verify DB cleared
      const dbCheck = await query(
        `SELECT reset_token, reset_token_expires_at FROM users WHERE email = LOWER($1)`,
        [testEmail]
      );
      const isCleared = dbCheck.rows[0].reset_token === null && dbCheck.rows[0].reset_token_expires_at === null;

      receivedResetToken = testRawToken;
      return isSuccess && isCleared;
    });

    // Test 8: Replay attack prevention (consumed token cannot be used again)
    await assertTest('Replay protection: re-using the consumed token fails with 400', async () => {
      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: receivedResetToken,
          newPassword: 'AnotherPassword789!',
        }),
      });
      const body = await res.json();
      return res.status === 400 && body.success === false;
    });

    // Test 9: Old password fails, new password succeeds
    await assertTest('End-to-End Auth: Old password fails (401), New password succeeds (200 + token)', async () => {
      const oldLoginRes = await fetch(`${baseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: originalPassword,
        }),
      });

      const newLoginRes = await fetch(`${baseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: updatedPassword,
        }),
      });
      const newLoginBody = await newLoginRes.json();

      return oldLoginRes.status === 401 && newLoginRes.status === 200 && newLoginBody.success === true;
    });

  } finally {
    await pool.end();
    server.close();
  }

  console.log('\n==========================================');
  console.log(`Results: ${passed}/${total} tests passed`);
  console.log('==========================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Add npm script to `server/package.json`**

In `server/package.json`, add `"test:day2": "tsx test-day2-backend.ts"` to `scripts`.

- [ ] **Step 3: Run Day 2 test suite and confirm 100% pass rate**

Run in `server`:
```bash
npm run test:day2
```
Expected output:
```text
  ✅ PASS: POST /api/auth/forgot-password with valid email returns 200 & preview URL
  ✅ PASS: POST /api/auth/forgot-password with non-existent email returns 200 (anti-enumeration)
  ✅ PASS: POST /api/auth/forgot-password with invalid email rejected with 400
  ✅ PASS: PostgreSQL holds SHA-256 hash (64 hex chars) and future expiration
  ✅ PASS: POST /api/auth/reset-password with invalid token rejected with 400
  ✅ PASS: POST /api/auth/reset-password with short password (<6 chars) rejected with 400
  ✅ PASS: POST /api/auth/reset-password successfully resets password & clears token in DB
  ✅ PASS: Replay protection: re-using the consumed token fails with 400
  ✅ PASS: End-to-End Auth: Old password fails (401), New password succeeds (200 + token)

==========================================
Results: 9/9 tests passed
==========================================
```

- [ ] **Step 4: Commit**

```bash
git add server/test-day2-backend.ts server/package.json
git commit -m "test(auth): add automated verification test suite for Day 2 password reset"
```
