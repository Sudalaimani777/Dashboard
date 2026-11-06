# Readventure Database Schema Documentation

This document describes the PostgreSQL database schema, data types, indexes, and cryptographic security designs utilized in the **Readventure** backend.

---

## 🗄️ Database Architecture

* **Database Engine**: PostgreSQL 14+
* **Primary Key Strategy**: UUID v4 (`gen_random_uuid()`) to prevent enumeration attacks and facilitate distributed scaling.
* **Timestamps**: All timestamps stored as `TIMESTAMPTZ` (UTC with timezone).
* **Migration Runner**: Built-in transactional migration runner in `server/src/shared/db/migrate.ts`.

---

## 📋 Schema Definition: `users` Table

The `users` table stores account identities, authentication credentials, and single-use password recovery tokens.

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Column Reference

| Column Name | Data Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **No** | `gen_random_uuid()` | Unique immutable user identifier. |
| `name` | `VARCHAR(100)` | **No** | None | User's full display name. |
| `email` | `VARCHAR(255)` | **No** | None | User's primary email address (case-insensitive unique index). |
| `password_hash` | `VARCHAR(255)` | **No** | None | Salted bcrypt hash of the user's password (10 rounds). |
| `reset_token` | `VARCHAR(255)` | **Yes** | `NULL` | Cryptographic SHA-256 digest of the raw 32-byte recovery token. |
| `reset_token_expires_at`| `TIMESTAMPTZ` | **Yes** | `NULL` | Expiration timestamp for the reset token (set to $now + 1\text{ hour}$). |
| `created_at` | `TIMESTAMPTZ` | **No** | `CURRENT_TIMESTAMP`| Account creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | **No** | `CURRENT_TIMESTAMP`| Last profile modification timestamp. |

---

## ⚡ Indexes

| Index Name | Table | Columns | Type | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `users_pkey` | `users` | `id` | B-tree | Primary Key lookup by user UUID. |
| `users_email_key` | `users` | `email` | B-tree (Unique) | Enforces account uniqueness and speeds up `/auth/signin`. |
| `idx_users_email` | `users` | `email` | B-tree | Accelerated index for email queries. |
| `idx_users_reset_token` | `users` | `reset_token` | B-tree | High-performance lookup of hashed reset tokens during recovery. |

---

## 🛡️ Security & Cryptographic Invariants

1. **Password Storage**: Passwords are never stored in plaintext. They are salted and hashed using `bcryptjs` with 10 salt rounds before being written to PostgreSQL.
2. **Reset Token Hashing**: 
   - A raw 32-byte hexadecimal token (64 characters) is generated using `crypto.randomBytes(32)`.
   - The user receives the raw token in their email link (`/reset-password?token=<rawToken>`).
   - The database stores **only the SHA-256 hash** (`crypto.createHash('sha256').update(rawToken).digest('hex')`).
   - If the database is compromised, an attacker cannot forge or use reset tokens because the SHA-256 operation is one-way.
3. **Replay Protection**: When a token is consumed via `/auth/reset-password`, the backend atomically updates `password_hash` and sets `reset_token = NULL` and `reset_token_expires_at = NULL`. A consumed token cannot be reused.

---

## 🔄 Migrations

Migrations are stored as raw SQL files in `server/src/shared/db/migrations/`:
- `001_create_users_table.sql`: Initial schema creation.

### Executing Migrations
```bash
npm run migrate
```
The runner records executed migrations in the `migrations` table to ensure idempotency.
