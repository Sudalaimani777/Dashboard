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
      `SELECT id, name, email, password_hash, role, department, manager_id, reset_token, reset_token_expires_at, created_at, updated_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    return (res.rows[0] as User) || null;
  }

  async findById(id: string): Promise<User | null> {
    const res = await query(
      `SELECT id, name, email, password_hash, role, department, manager_id, reset_token, reset_token_expires_at, created_at, updated_at
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
       RETURNING id, name, email, password_hash, role, department, manager_id, reset_token, reset_token_expires_at, created_at, updated_at`,
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
