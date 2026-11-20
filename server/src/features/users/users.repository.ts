import { query } from '../../shared/db/pool.js';
import { ManagedUserRole, UserDirectoryItem } from './users.types.js';

const USER_DIRECTORY_SELECT = `
  SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    u.department,
    u.manager_id,
    u.reporting_admin_id,
    u.is_active,
    m.name AS manager_name,
    adm.name AS reporting_admin_name,
    u.created_at,
    u.updated_at
  FROM users u
  LEFT JOIN users m ON u.manager_id = m.id
  LEFT JOIN users adm ON u.reporting_admin_id = adm.id
`;

export class UsersRepository {
  async listAll(): Promise<UserDirectoryItem[]> {
    const res = await query(
      `${USER_DIRECTORY_SELECT} ORDER BY CASE u.role WHEN 'ADMIN' THEN 0 WHEN 'MANAGER' THEN 1 ELSE 2 END, u.name ASC`
    );
    return res.rows as UserDirectoryItem[];
  }

  async findById(id: string): Promise<UserDirectoryItem | null> {
    const res = await query(`${USER_DIRECTORY_SELECT} WHERE u.id = $1 LIMIT 1`, [id]);
    return (res.rows[0] as UserDirectoryItem) || null;
  }

  async findByEmail(email: string): Promise<{ id: string; email: string } | null> {
    const res = await query(`SELECT id, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [
      email,
    ]);
    return (res.rows[0] as { id: string; email: string }) || null;
  }

  async createUser(params: {
    name: string;
    email: string;
    passwordHash: string;
    role: ManagedUserRole;
    department: string;
    managerId: string | null;
    reportingAdminId?: string | null;
  }): Promise<UserDirectoryItem> {
    const inserted = await query(
      `INSERT INTO users (name, email, password_hash, role, department, manager_id, reporting_admin_id)
       VALUES ($1, LOWER($2), $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        params.name,
        params.email,
        params.passwordHash,
        params.role,
        params.department,
        params.managerId,
        params.reportingAdminId ?? null,
      ]
    );
    const created = await this.findById(inserted.rows[0].id);
    if (!created) {
      throw new Error('Failed to load newly created user');
    }
    return created;
  }

  async updateUser(
    id: string,
    fields: {
      role?: ManagedUserRole;
      department?: string;
      managerId?: string | null;
      reportingAdminId?: string | null;
    }
  ): Promise<UserDirectoryItem | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (fields.role !== undefined) {
      setClauses.push(`role = $${idx++}`);
      values.push(fields.role);
    }
    if (fields.department !== undefined) {
      setClauses.push(`department = $${idx++}`);
      values.push(fields.department);
    }
    if (fields.managerId !== undefined) {
      setClauses.push(`manager_id = $${idx++}`);
      values.push(fields.managerId);
    }
    if (fields.reportingAdminId !== undefined) {
      setClauses.push(`reporting_admin_id = $${idx++}`);
      values.push(fields.reportingAdminId);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const res = await query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING id`,
      values
    );
    if (res.rowCount === 0) {
      return null;
    }
    return this.findById(id);
  }

  async countActiveAdmins(): Promise<number> {
    const res = await query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'ADMIN' AND is_active = true`);
    return Number(res.rows[0]?.count || 0);
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<UserDirectoryItem | null> {
    const res = await query(
      `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id`,
      [isActive, id]
    );
    if (res.rowCount === 0) {
      return null;
    }
    return this.findById(id);
  }

  async countUserTravelRecords(userId: string): Promise<number> {
    const res = await query(
      `SELECT COUNT(*)::int AS count FROM travel_requests WHERE user_id = $1 OR manager_id = $1 OR admin_id = $1`,
      [userId]
    );
    return Number(res.rows[0]?.count || 0);
  }

  async deleteUser(id: string): Promise<boolean> {
    await query(`UPDATE users SET manager_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_id = $1`, [id]);
    await query(`UPDATE users SET reporting_admin_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE reporting_admin_id = $1`, [id]);
    const res = await query(`DELETE FROM users WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }
}

export const usersRepository = new UsersRepository();
