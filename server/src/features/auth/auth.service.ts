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
      role: user.role || 'EMPLOYEE',
      department: user.department || 'Engineering',
      manager_id: user.manager_id || null,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'EMPLOYEE',
      department: user.department || 'Engineering',
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

    if (name.length > 100) {
      throw new Error('Name cannot exceed 100 characters');
    }

    const nameRegex = /^[\p{L}][\p{L}\s'.-]{1,99}$/u;
    if (!nameRegex.test(name)) {
      throw new Error('Name can only contain letters, spaces, hyphens, and apostrophes');
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
