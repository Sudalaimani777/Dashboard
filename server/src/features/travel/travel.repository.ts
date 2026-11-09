// server/src/features/travel/travel.repository.ts
import { pool, query } from '../../shared/db/pool.js';
import {
  TravelRequest,
  TravelExpense,
  TimelineEvent,
  DepartmentBudget,
  TravelRole,
  TravelStatus,
  TravelType,
  ExpenseCategory,
  RevisionTarget
} from './travel.types.js';

export interface CreateTravelRequestData {
  userId: string;
  managerId?: string | null;
  adminId?: string | null;
  travelType: TravelType;
  title: string;
  purpose: string;
  projectCode: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  supportingDocUrl?: string | null;
  expenses: Array<{
    category: ExpenseCategory;
    merchant: string;
    amount: number;
    expenseDate: string;
    receiptImageUrl?: string | null;
    notes?: string | null;
  }>;
  status?: TravelStatus;
  currency?: string;
}

export interface UpdateStatusWithTimelineData {
  requestId: string;
  actorId: string;
  actorRole: TravelRole;
  fromStatus?: TravelStatus | null;
  toStatus: TravelStatus;
  remarks?: string | null;
  revisionTarget?: RevisionTarget | null;
  eventType?: string;
}

export class TravelRepository {
  /**
   * Atomically creates a travel request, its itemized expenses,
   * and the initial audit timeline event in a single transaction.
   */
  async createRequestWithExpenses(data: CreateTravelRequestData): Promise<TravelRequest> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Resolve manager_id from user if not explicitly passed
      let effectiveManagerId = data.managerId || null;
      if (!effectiveManagerId) {
        const userRes = await client.query('SELECT manager_id FROM users WHERE id = $1', [data.userId]);
        effectiveManagerId = userRes.rows[0]?.manager_id || null;
      }

      const totalExpenses = data.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const initialStatus: TravelStatus = data.status || 'PENDING_MANAGER_REVIEW';
      const currency = data.currency || 'INR';

      const insertReqRes = await client.query(
        `INSERT INTO travel_requests (
          user_id, manager_id, admin_id, travel_type, title, purpose, project_code,
          origin, destination, departure_date, return_date, emergency_contact_name,
          emergency_contact_phone, supporting_doc_url, total_expenses, status, currency
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          data.userId,
          effectiveManagerId,
          data.adminId || null,
          data.travelType,
          data.title,
          data.purpose,
          data.projectCode,
          data.origin,
          data.destination,
          data.departureDate,
          data.returnDate,
          data.emergencyContactName,
          data.emergencyContactPhone,
          data.supportingDocUrl || null,
          totalExpenses,
          initialStatus,
          currency
        ]
      );

      const requestRow = insertReqRes.rows[0];

      // Insert itemized expenses
      const expenseRows: any[] = [];
      for (const exp of data.expenses) {
        const expRes = await client.query(
          `INSERT INTO travel_expenses (
            travel_request_id, category, merchant, amount, expense_date, receipt_image_url, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *`,
          [
            requestRow.id,
            exp.category,
            exp.merchant,
            exp.amount,
            exp.expenseDate,
            exp.receiptImageUrl || null,
            exp.notes || null
          ]
        );
        expenseRows.push(expRes.rows[0]);
      }

      // Insert initial timeline event
      const timelineRes = await client.query(
        `INSERT INTO request_timeline_events (
          travel_request_id, actor_id, actor_role, event_type, from_status, to_status, remarks
        ) VALUES ($1, $2, 'EMPLOYEE', 'SUBMITTED', NULL, $3, 'Submitted initial travel request with itemized expenses')
        RETURNING *`,
        [requestRow.id, data.userId, initialStatus]
      );

      await client.query('COMMIT');

      const mappedRequest = this.mapRowToRequest(requestRow);
      mappedRequest.expenses = expenseRows.map(this.mapRowToExpense);
      mappedRequest.timeline = timelineRes.rows.map(this.mapRowToTimeline);
      return mappedRequest;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Alias for createRequestWithExpenses
   */
  async create(data: CreateTravelRequestData): Promise<TravelRequest> {
    return this.createRequestWithExpenses(data);
  }

  /**
   * Fetches a single request with joined requester details,
   * itemized expenses, and full audit timeline.
   */
  async findById(id: string): Promise<TravelRequest | null> {
    const res = await query(
      `SELECT 
        tr.*,
        u.name AS requester_name,
        u.email AS requester_email,
        u.department AS requester_department,
        mgr.name AS manager_name,
        adm.name AS admin_name
      FROM travel_requests tr
      LEFT JOIN users u ON tr.user_id = u.id
      LEFT JOIN users mgr ON tr.manager_id = mgr.id
      LEFT JOIN users adm ON tr.admin_id = adm.id
      WHERE tr.id = $1`,
      [id]
    );

    if (res.rows.length === 0) return null;

    const request = this.mapRowToRequest(res.rows[0]);

    // Fetch child expenses
    const expRes = await query(
      `SELECT * FROM travel_expenses WHERE travel_request_id = $1 ORDER BY expense_date ASC, created_at ASC`,
      [id]
    );
    request.expenses = expRes.rows.map(this.mapRowToExpense);

    // Fetch timeline events with actor name
    const timelineRes = await query(
      `SELECT rte.*, u.name as actor_name 
       FROM request_timeline_events rte
       LEFT JOIN users u ON rte.actor_id = u.id
       WHERE rte.travel_request_id = $1 
       ORDER BY rte.created_at ASC`,
      [id]
    );
    request.timeline = timelineRes.rows.map(this.mapRowToTimeline);

    return request;
  }

  /**
   * Fetches requests scoped to the authenticated user's role:
   * - EMPLOYEE: sees only their own requests
   * - MANAGER: sees requests where they are the assigned manager or manager of requester
   * - ADMIN: sees all requests across the organization
   */
  async findScopedRequests(
    actorId: string,
    role: TravelRole,
    statusFilter?: TravelStatus
  ): Promise<TravelRequest[]> {
    let sql = `
      SELECT 
        tr.*,
        u.name AS requester_name,
        u.email AS requester_email,
        u.department AS requester_department,
        mgr.name AS manager_name,
        adm.name AS admin_name
      FROM travel_requests tr
      LEFT JOIN users u ON tr.user_id = u.id
      LEFT JOIN users mgr ON tr.manager_id = mgr.id
      LEFT JOIN users adm ON tr.admin_id = adm.id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (role === 'EMPLOYEE') {
      params.push(actorId);
      conditions.push(`tr.user_id = $${params.length}`);
    } else if (role === 'MANAGER') {
      params.push(actorId);
      conditions.push(`(tr.manager_id = $${params.length} OR u.manager_id = $${params.length})`);
    } else if (role === 'ADMIN') {
      // Admin has organization-wide visibility
    }

    if (statusFilter) {
      params.push(statusFilter);
      conditions.push(`tr.status = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY tr.created_at DESC';

    const res = await query(sql, params);
    return res.rows.map(this.mapRowToRequest);
  }

  /**
   * Direct line Manager review queue
   */
  async getManagerQueue(managerId?: string): Promise<TravelRequest[]> {
    let sql = `
      SELECT 
        tr.*,
        u.name AS requester_name,
        u.email AS requester_email,
        u.department AS requester_department
      FROM travel_requests tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.status = 'PENDING_MANAGER_REVIEW'
    `;
    const params: any[] = [];

    if (managerId) {
      params.push(managerId);
      sql += ` AND (tr.manager_id = $1 OR u.manager_id = $1)`;
    }

    sql += ' ORDER BY tr.created_at ASC';

    const res = await query(sql, params);
    return res.rows.map(this.mapRowToRequest);
  }

  /**
   * Tier 2 Executive Admin governance queue
   */
  async getAdminQueue(): Promise<TravelRequest[]> {
    const res = await query(
      `SELECT 
        tr.*,
        u.name AS requester_name,
        u.email AS requester_email,
        u.department AS requester_department,
        mgr.name AS manager_name
      FROM travel_requests tr
      JOIN users u ON tr.user_id = u.id
      LEFT JOIN users mgr ON tr.manager_id = mgr.id
      WHERE tr.status = 'PENDING_ADMIN_APPROVAL'
      ORDER BY tr.created_at ASC`
    );
    return res.rows.map(this.mapRowToRequest);
  }

  /**
   * Atomically updates status, actor remarks, timestamps, and inserts
   * an immutable timeline event.
   */
  async updateStatusWithTimeline(data: UpdateStatusWithTimelineData): Promise<TravelRequest> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const isMgr = data.actorRole === 'MANAGER';
      const isAdmin = data.actorRole === 'ADMIN';

      let updateQuery: string;
      let updateParams: any[];

      if (isMgr) {
        updateQuery = `
          UPDATE travel_requests
          SET status = $1,
              manager_remarks = $2,
              manager_id = $3,
              manager_reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING *;
        `;
        updateParams = [data.toStatus, data.remarks || null, data.actorId, data.requestId];
      } else if (isAdmin) {
        updateQuery = `
          UPDATE travel_requests
          SET status = $1,
              admin_remarks = $2,
              admin_id = $3,
              revision_target = $4,
              admin_reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING *;
        `;
        updateParams = [data.toStatus, data.remarks || null, data.actorId, data.revisionTarget || null, data.requestId];
      } else {
        // Employee or system transition (e.g. resubmission or cancellation)
        updateQuery = `
          UPDATE travel_requests
          SET status = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *;
        `;
        updateParams = [data.toStatus, data.requestId];
      }

      const res = await client.query(updateQuery, updateParams);
      if (res.rows.length === 0) {
        throw new Error(`Travel request with ID ${data.requestId} not found.`);
      }

      const currentStatus = data.fromStatus || res.rows[0].status;
      const eventType = data.eventType || (
        data.toStatus === 'APPROVED' ? 'ADMIN_APPROVED' :
        data.toStatus === 'SETTLED' ? 'ADMIN_SETTLED' :
        data.toStatus === 'PENDING_ADMIN_APPROVAL' ? 'MANAGER_APPROVED' :
        data.toStatus.startsWith('REVISION') ? 'REVISION_REQUESTED' :
        data.toStatus === 'REJECTED' ? 'REJECTED' :
        data.toStatus === 'CANCELLED' ? 'CANCELLED' : 'STATUS_CHANGED'
      );

      await client.query(
        `INSERT INTO request_timeline_events (
          travel_request_id, actor_id, actor_role, event_type, from_status, to_status, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [
          data.requestId,
          data.actorId,
          data.actorRole,
          eventType,
          currentStatus,
          data.toStatus,
          data.remarks || null
        ]
      );

      await client.query('COMMIT');
      return this.mapRowToRequest(res.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Replaces existing expenses for a request (e.g. employee modifying under revision)
   * and recalculates total_expenses atomically.
   */
  async updateExpenses(
    requestId: string,
    expenses: Array<{
      category: ExpenseCategory;
      merchant: string;
      amount: number;
      expenseDate: string;
      receiptImageUrl?: string | null;
      notes?: string | null;
    }>
  ): Promise<TravelRequest> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete existing expenses
      await client.query('DELETE FROM travel_expenses WHERE travel_request_id = $1', [requestId]);

      // Insert new expenses
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

      for (const exp of expenses) {
        await client.query(
          `INSERT INTO travel_expenses (
            travel_request_id, category, merchant, amount, expense_date, receipt_image_url, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            requestId,
            exp.category,
            exp.merchant,
            exp.amount,
            exp.expenseDate,
            exp.receiptImageUrl || null,
            exp.notes || null
          ]
        );
      }

      // Update total_expenses on travel_requests
      const updateRes = await client.query(
        `UPDATE travel_requests
         SET total_expenses = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [totalExpenses, requestId]
      );

      await client.query('COMMIT');
      return this.mapRowToRequest(updateRes.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Fetches the department budget for the given fiscal year and quarter
   * with calculated available headroom and utilization percentage.
   */
  async getDepartmentBudget(
    department: string,
    fiscalYear: number,
    fiscalQuarter: string
  ): Promise<DepartmentBudget | null> {
    const res = await query(
      `SELECT * FROM department_budgets 
       WHERE department = $1 AND fiscal_year = $2 AND fiscal_quarter = $3`,
      [department, fiscalYear, fiscalQuarter]
    );

    if (res.rows.length === 0) return null;
    return this.mapRowToBudget(res.rows[0]);
  }

  /**
   * Updates department budget utilization amount by a delta (positive or negative)
   */
  async updateBudgetUtilization(
    department: string,
    fiscalYear: number,
    fiscalQuarter: string,
    amountDelta: number
  ): Promise<DepartmentBudget> {
    const res = await query(
      `UPDATE department_budgets
       SET utilized_amount = utilized_amount + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE department = $2 AND fiscal_year = $3 AND fiscal_quarter = $4
       RETURNING *`,
      [amountDelta, department, fiscalYear, fiscalQuarter]
    );

    if (res.rows.length === 0) {
      throw new Error(`Budget not found for ${department} ${fiscalYear} ${fiscalQuarter}`);
    }

    return this.mapRowToBudget(res.rows[0]);
  }

  // --- Row Mappers with snake_case and camelCase compatibility ---

  private mapRowToRequest(row: any): TravelRequest {
    const total = Number(row.total_expenses);
    return {
      id: row.id,
      user_id: row.user_id,
      userId: row.user_id,
      manager_id: row.manager_id,
      managerId: row.manager_id,
      admin_id: row.admin_id,
      adminId: row.admin_id,
      travel_type: row.travel_type,
      travelType: row.travel_type,
      title: row.title,
      purpose: row.purpose,
      project_code: row.project_code,
      projectCode: row.project_code,
      origin: row.origin,
      destination: row.destination,
      departure_date: row.departure_date ? row.departure_date.toISOString?.().split('T')[0] || String(row.departure_date) : '',
      departureDate: row.departure_date ? row.departure_date.toISOString?.().split('T')[0] || String(row.departure_date) : '',
      return_date: row.return_date ? row.return_date.toISOString?.().split('T')[0] || String(row.return_date) : '',
      returnDate: row.return_date ? row.return_date.toISOString?.().split('T')[0] || String(row.return_date) : '',
      emergency_contact_name: row.emergency_contact_name,
      emergencyContactName: row.emergency_contact_name,
      emergency_contact_phone: row.emergency_contact_phone,
      emergencyContactPhone: row.emergency_contact_phone,
      supporting_doc_url: row.supporting_doc_url,
      supportingDocUrl: row.supporting_doc_url,
      total_expenses: total,
      totalExpenses: total,
      status: row.status,
      revision_target: row.revision_target,
      revisionTarget: row.revision_target,
      manager_remarks: row.manager_remarks,
      managerRemarks: row.manager_remarks,
      manager_reviewed_at: row.manager_reviewed_at,
      managerReviewedAt: row.manager_reviewed_at,
      admin_remarks: row.admin_remarks,
      adminRemarks: row.admin_remarks,
      admin_reviewed_at: row.admin_reviewed_at,
      adminReviewedAt: row.admin_reviewed_at,
      currency: row.currency || 'INR',
      created_at: row.created_at,
      createdAt: row.created_at,
      updated_at: row.updated_at,
      updatedAt: row.updated_at,
      requester_name: row.requester_name,
      requesterName: row.requester_name,
      requester_email: row.requester_email,
      requesterEmail: row.requester_email,
      requester_department: row.requester_department,
      requesterDepartment: row.requester_department,
      manager_name: row.manager_name,
      managerName: row.manager_name,
      admin_name: row.admin_name,
      adminName: row.admin_name
    };
  }

  private mapRowToExpense(row: any): TravelExpense {
    const amt = Number(row.amount);
    return {
      id: row.id,
      travel_request_id: row.travel_request_id,
      travelRequestId: row.travel_request_id,
      category: row.category,
      merchant: row.merchant,
      amount: amt,
      expense_date: row.expense_date ? row.expense_date.toISOString?.().split('T')[0] || String(row.expense_date) : '',
      expenseDate: row.expense_date ? row.expense_date.toISOString?.().split('T')[0] || String(row.expense_date) : '',
      receipt_image_url: row.receipt_image_url,
      receiptImageUrl: row.receipt_image_url,
      notes: row.notes,
      created_at: row.created_at
    };
  }

  private mapRowToTimeline(row: any): TimelineEvent {
    return {
      id: row.id,
      travel_request_id: row.travel_request_id,
      actor_id: row.actor_id,
      actor_role: row.actor_role,
      actor_name: row.actor_name,
      event_type: row.event_type,
      from_status: row.from_status,
      to_status: row.to_status,
      remarks: row.remarks,
      created_at: row.created_at
    };
  }

  private mapRowToBudget(row: any): DepartmentBudget {
    const total = Number(row.total_allocation);
    const utilized = Number(row.utilized_amount);
    const headroom = total - utilized;
    const pct = total > 0 ? (utilized / total) * 100 : 0;

    return {
      id: row.id,
      department: row.department,
      fiscal_year: row.fiscal_year,
      fiscal_quarter: row.fiscal_quarter,
      total_allocation: total,
      utilized_amount: utilized,
      available_headroom: Math.round(headroom * 100) / 100,
      utilization_percentage: Math.round(pct * 100) / 100,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

export const travelRepository = new TravelRepository();
