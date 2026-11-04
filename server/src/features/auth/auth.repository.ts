import { query } from '../../shared/db/pool.js';
import { User } from './auth.types.js';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(name: string, email: string, passwordHash: string): Promise<User>;
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
}

export const authRepository = new AuthRepository();
