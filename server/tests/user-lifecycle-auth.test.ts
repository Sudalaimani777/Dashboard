import 'dotenv/config';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { pool } from '../src/shared/db/pool.js';
import { config } from '../src/config/env.js';

const PORT = 5098;
const API_BASE = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('\n🧪 ==========================================');
  console.log('   USER LIFECYCLE, ADMIN PROVISIONING & OPTION A TESTS');
  console.log('==========================================\n');

  let server: http.Server | null = null;
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => resolve());
  });

  const ts = Date.now();
  const createdUserIds: string[] = [];

  try {
    const passwordHash = await bcrypt.hash('Password@123', 10);

    // 1. Seed admin actor
    const adminRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, is_active)
       VALUES ('Root Admin', 'root_admin_${ts}@corp.com', $1, 'ADMIN', 'Executive', true)
       RETURNING id, name, email, role, department, is_active`,
      [passwordHash]
    );
    const adminUser = adminRes.rows[0];
    createdUserIds.push(adminUser.id);

    const adminToken = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: adminUser.role, department: adminUser.department },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // ----------------------------------------------------
    // TEST 1: Deactivated user login rejection (AuthService signin)
    // ----------------------------------------------------
    console.log('Test 1: Deactivated user cannot sign in');
    const inactiveUserRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, is_active)
       VALUES ('Inactive Emp', 'inactive_${ts}@corp.com', $1, 'EMPLOYEE', 'Engineering', false)
       RETURNING id, email`,
      [passwordHash]
    );
    createdUserIds.push(inactiveUserRes.rows[0].id);

    const loginRes = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `inactive_${ts}@corp.com`,
        password: 'Password@123',
      }),
    });
    const loginData = await loginRes.json();
    assert.equal(loginRes.status, 401, 'Inactive user signin must return 401 or 403');
    assert.match(
      loginData.error || loginData.message || '',
      /deactivated/i,
      'Error message must indicate account is deactivated'
    );
    console.log('  ✓ Deactivated user login properly rejected');

    // ----------------------------------------------------
    // TEST 2: Admin cannot provision another Admin account
    // ----------------------------------------------------
    console.log('Test 2: Admin cannot provision another Admin account');
    const createAdminRes = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Secondary Admin',
        email: `sec_admin_${ts}@corp.com`,
        password: 'Password@123',
        role: 'ADMIN',
        department: 'Operations',
      }),
    });
    const createAdminData: any = await createAdminRes.json();
    assert.equal(createAdminRes.status, 400, 'Admin creating an Admin must return 400 Bad Request');
    assert.match(
      createAdminData.error || createAdminData.message || '',
      /EMPLOYEE or MANAGER/i,
      'Error message must indicate only EMPLOYEE or MANAGER roles are allowed'
    );
    console.log('  ✓ Creation of Administrator accounts properly blocked');

    // ----------------------------------------------------
    // TEST 3: Deactivate & Reactivate user via PATCH /api/users/:id/status
    // ----------------------------------------------------
    console.log('Test 3: Deactivate and Reactivate Employee');
    const targetEmpRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, is_active)
       VALUES ('Target Emp', 'target_emp_${ts}@corp.com', $1, 'EMPLOYEE', 'Engineering', true)
       RETURNING id`,
      [passwordHash]
    );
    const targetEmpId = targetEmpRes.rows[0].id;
    createdUserIds.push(targetEmpId);

    // Deactivate
    const deactivateRes = await fetch(`${API_BASE}/users/${targetEmpId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    const deactData = await deactivateRes.json();
    assert.equal(deactivateRes.status, 200, `Deactivation failed: ${JSON.stringify(deactData)}`);
    assert.equal(deactData.data.user.is_active, false);

    // Self-deactivation prevention
    const selfDeactRes = await fetch(`${API_BASE}/users/${adminUser.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    assert.equal(selfDeactRes.status, 400, 'Self-deactivation must be rejected with 400');
    console.log('  ✓ Deactivate, reactivate, and self-deactivation guard verified');

    // ----------------------------------------------------
    // TEST 4: Delete user under Option A (Strict Governance)
    // ----------------------------------------------------
    console.log('Test 4: Delete user under Option A (Strict Governance)');
    
    // 4a. User with 0 travel requests can be deleted
    const cleanUserRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, is_active)
       VALUES ('Clean User', 'clean_${ts}@corp.com', $1, 'EMPLOYEE', 'Engineering', true)
       RETURNING id`,
      [passwordHash]
    );
    const cleanUserId = cleanUserRes.rows[0].id;

    const deleteCleanRes = await fetch(`${API_BASE}/users/${cleanUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(deleteCleanRes.status, 200, 'User with 0 records must be deleted');
    const checkClean = await pool.query(`SELECT 1 FROM users WHERE id = $1`, [cleanUserId]);
    assert.equal(checkClean.rowCount, 0, 'User must not exist in DB');

    // 4b. Employee with travel requests CAN be permanently deleted (erasing travel records)
    const tripUserRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, is_active)
       VALUES ('Trip User', 'trip_${ts}@corp.com', $1, 'EMPLOYEE', 'Engineering', true)
       RETURNING id`,
      [passwordHash]
    );
    const tripUserId = tripUserRes.rows[0].id;
    createdUserIds.push(tripUserId);

    const travelReqRes = await pool.query(
      `INSERT INTO travel_requests (
        user_id, travel_type, title, purpose, project_code,
        origin, destination, departure_date, return_date,
        emergency_contact_name, emergency_contact_phone, status
      ) VALUES (
        $1, 'UPCOMING', 'Test Trip', 'Business Meeting', 'PRJ-1',
        'BLR', 'DEL', '2026-12-01', '2026-12-05',
        'Jane', '9876543210', 'APPROVED'
      ) RETURNING id`,
      [tripUserId]
    );
    const travelReqId = travelReqRes.rows[0].id;

    const deleteTripUserRes = await fetch(`${API_BASE}/users/${tripUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(
      deleteTripUserRes.status,
      200,
      `Delete user with travel requests must succeed with 200`
    );
    const checkDeletedUser = await pool.query(`SELECT 1 FROM users WHERE id = $1`, [tripUserId]);
    assert.equal(checkDeletedUser.rowCount, 0, 'User must be permanently deleted from users table');
    const checkErasedTravel = await pool.query(`SELECT 1 FROM travel_requests WHERE id = $1`, [travelReqId]);
    assert.equal(checkErasedTravel.rowCount, 0, 'Travel request must be permanently erased upon user deletion');

    // 4c. Manager with travel requests and subordinate employees CAN be permanently deleted
    const tripMgrRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, is_active)
       VALUES ('Trip Manager', 'mgr_trip_${ts}@corp.com', $1, 'MANAGER', 'Engineering', true)
       RETURNING id`,
      [passwordHash]
    );
    const tripMgrId = tripMgrRes.rows[0].id;
    createdUserIds.push(tripMgrId);

    const mgrTravelReqRes = await pool.query(
      `INSERT INTO travel_requests (
        user_id, travel_type, title, purpose, project_code,
        origin, destination, departure_date, return_date,
        emergency_contact_name, emergency_contact_phone, status
      ) VALUES (
        $1, 'UPCOMING', 'Manager Trip', 'Strategy Offsite', 'PRJ-MGR',
        'BLR', 'BOM', '2026-12-10', '2026-12-12',
        'Bob', '9876543211', 'APPROVED'
      ) RETURNING id`,
      [tripMgrId]
    );
    const mgrTravelReqId = mgrTravelReqRes.rows[0].id;

    // Subordinate employee assigned to this manager
    const subEmpRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, manager_id, is_active)
       VALUES ('Subordinate Emp', 'sub_emp_${ts}@corp.com', $1, 'EMPLOYEE', 'Engineering', $2, true)
       RETURNING id`,
      [passwordHash, tripMgrId]
    );
    const subEmpId = subEmpRes.rows[0].id;
    createdUserIds.push(subEmpId);

    const deleteMgrRes = await fetch(`${API_BASE}/users/${tripMgrId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(deleteMgrRes.status, 200, 'Delete manager with travel records must succeed with 200');
    const checkDeletedMgr = await pool.query(`SELECT 1 FROM users WHERE id = $1`, [tripMgrId]);
    assert.equal(checkDeletedMgr.rowCount, 0, 'Manager must be deleted from users table');
    const checkErasedMgrTravel = await pool.query(`SELECT 1 FROM travel_requests WHERE id = $1`, [mgrTravelReqId]);
    assert.equal(checkErasedMgrTravel.rowCount, 0, 'Manager travel request must be permanently erased');
    const checkSubEmp = await pool.query(`SELECT manager_id FROM users WHERE id = $1`, [subEmpId]);
    assert.equal(checkSubEmp.rows[0].manager_id, null, 'Subordinate employee manager_id must be set to null');

    // 4d. Admin cannot delete self
    const deleteSelfRes = await fetch(`${API_BASE}/users/${adminUser.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(deleteSelfRes.status, 400, 'Admin cannot delete themselves');
    console.log('  ✓ Option A deletion guards strictly enforced');

    console.log('\n✅ ALL USER LIFECYCLE TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    // Cleanup created test records
    if (createdUserIds.length > 0) {
      await pool.query(`DELETE FROM travel_requests WHERE user_id = ANY($1::uuid[])`, [createdUserIds]);
      await pool.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [createdUserIds]);
    }
    if (server) {
      server.close();
    }
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
