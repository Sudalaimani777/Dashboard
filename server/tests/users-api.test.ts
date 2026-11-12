import 'dotenv/config';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/shared/db/pool.js';
import { config } from '../src/config/env.js';
import { runMigrations } from '../src/shared/db/migrate.js';

const PORT = 5099;
const API_BASE = `http://localhost:${PORT}/api`;

async function runUsersApiTests() {
  console.log('\n🧪 ==========================================');
  console.log('   ADMIN USER MANAGEMENT & INVITE-ONLY API TESTS');
  console.log('==========================================\n');

  await runMigrations();

  let server: http.Server | null = null;
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => resolve());
  });

  const ts = Date.now();
  const createdIds: string[] = [];

  try {
    // Seed test actors (1 employee, 1 manager, 1 admin)
    const empRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ('Users Emp', 'users_emp_${ts}@corp.com', 'h', 'EMPLOYEE', 'Engineering')
       RETURNING id, name, email, role, department`
    );
    const mgrRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ('Users Mgr', 'users_mgr_${ts}@corp.com', 'h', 'MANAGER', 'Engineering')
       RETURNING id, name, email, role, department`
    );
    const admRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ('Users Adm', 'users_adm_${ts}@corp.com', 'h', 'ADMIN', 'Executive')
       RETURNING id, name, email, role, department`
    );

    const empUser = empRes.rows[0];
    const mgrUser = mgrRes.rows[0];
    const admUser = admRes.rows[0];
    createdIds.push(empUser.id, mgrUser.id, admUser.id);

    const signToken = (u: any) =>
      jwt.sign({ userId: u.id, email: u.email, role: u.role, department: u.department }, config.jwt.secret, {
        expiresIn: '1h',
      });

    const empToken = signToken(empUser);
    const mgrToken = signToken(mgrUser);
    const admToken = signToken(admUser);

    // 1. Public self-registration (/api/auth/signup) must be disabled (403)
    const signupRes = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rogue User',
        email: `rogue_${ts}@corp.com`,
        password: 'Password@123',
      }),
    });
    assert.equal(signupRes.status, 403, 'Public /api/auth/signup must return 403');

    // 2. GET /api/users RBAC checks
    const unauthRes = await fetch(`${API_BASE}/users`);
    assert.equal(unauthRes.status, 401, 'Unauthenticated GET /api/users must return 401');

    const empListRes = await fetch(`${API_BASE}/users`, {
      headers: { Cookie: `token=${empToken}` },
    });
    assert.equal(empListRes.status, 403, 'Employee GET /api/users must return 403');

    const mgrListRes = await fetch(`${API_BASE}/users`, {
      headers: { Cookie: `token=${mgrToken}` },
    });
    assert.equal(mgrListRes.status, 403, 'Manager GET /api/users must return 403');

    const admListRes = await fetch(`${API_BASE}/users`, {
      headers: { Cookie: `token=${admToken}` },
    });
    assert.equal(admListRes.status, 200, 'Admin GET /api/users must return 200');
    const admListJson: any = await admListRes.json();
    assert.ok(Array.isArray(admListJson.data.users), 'Response must include users array');
    assert.ok(
      admListJson.data.users.every((u: any) => u.password_hash === undefined),
      'Must never expose password_hash'
    );

    // 3. POST /api/users: Admin creates a Manager with direct initial password
    const newMgrEmail = `created_mgr_${ts}@corp.com`;
    const createMgrRes = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${admToken}` },
      body: JSON.stringify({
        name: 'Priya Nair',
        email: newMgrEmail,
        password: 'ManagerPass@123',
        role: 'MANAGER',
        department: 'Sales',
      }),
    });
    assert.equal(createMgrRes.status, 201, 'Admin creating Manager must return 201');
    const createMgrJson: any = await createMgrRes.json();
    const createdMgr = createMgrJson.data.user;
    createdIds.push(createdMgr.id);
    assert.equal(createdMgr.role, 'MANAGER');
    assert.equal(createdMgr.department, 'Sales');

    // 4. POST /api/users: Admin creates an Employee assigned to createdMgr
    const newEmpEmail = `created_emp_${ts}@corp.com`;
    const createEmpRes = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${admToken}` },
      body: JSON.stringify({
        name: 'Arjun Rao',
        email: newEmpEmail,
        password: 'EmployeePass@123',
        role: 'EMPLOYEE',
        department: 'Sales',
        managerId: createdMgr.id,
      }),
    });
    assert.equal(createEmpRes.status, 201, 'Admin creating Employee must return 201');
    const createEmpJson: any = await createEmpRes.json();
    const createdEmp = createEmpJson.data.user;
    createdIds.push(createdEmp.id);
    assert.equal(createdEmp.role, 'EMPLOYEE');
    assert.equal(createdEmp.manager_id, createdMgr.id);

    // 5. Provisioned Employee can sign in immediately with the direct initial password
    const signinRes = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmpEmail, password: 'EmployeePass@123' }),
    });
    assert.equal(signinRes.status, 200, 'Admin-created user must be able to sign in immediately');

    // 6. Duplicate email returns 409
    const dupRes = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${admToken}` },
      body: JSON.stringify({
        name: 'Duplicate',
        email: newEmpEmail,
        password: 'EmployeePass@123',
        role: 'EMPLOYEE',
        department: 'Sales',
      }),
    });
    assert.equal(dupRes.status, 409, 'Duplicate email must return 409');

    // 7. Invalid managerId (e.g. pointing to an EMPLOYEE) returns 400
    const badMgrRes = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${admToken}` },
      body: JSON.stringify({
        name: 'Bad Manager Link',
        email: `bad_mgr_${ts}@corp.com`,
        password: 'EmployeePass@123',
        role: 'EMPLOYEE',
        department: 'Sales',
        managerId: createdEmp.id,
      }),
    });
    assert.equal(badMgrRes.status, 400, 'Assigning a non-MANAGER as managerId must return 400');

    // 8. PATCH /api/users/:id updates department, role, and managerId
    const patchRes = await fetch(`${API_BASE}/users/${createdEmp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${admToken}` },
      body: JSON.stringify({
        department: 'Engineering',
        role: 'MANAGER',
        managerId: null,
      }),
    });
    assert.equal(patchRes.status, 200, 'Admin updating user must return 200');
    const patchJson: any = await patchRes.json();
    assert.equal(patchJson.data.user.department, 'Engineering');
    assert.equal(patchJson.data.user.role, 'MANAGER');
    assert.equal(patchJson.data.user.manager_id, null);

    // 9. Guard: cannot assign user as their own manager
    const selfMgrRes = await fetch(`${API_BASE}/users/${createdEmp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${admToken}` },
      body: JSON.stringify({ managerId: createdEmp.id }),
    });
    assert.equal(selfMgrRes.status, 400, 'Self-manager assignment must return 400');

    // 10. Guard: Admin cannot demote themselves
    const selfDemoteRes = await fetch(`${API_BASE}/users/${admUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${admToken}` },
      body: JSON.stringify({ role: 'EMPLOYEE' }),
    });
    assert.equal(selfDemoteRes.status, 400, 'Admin self-demotion must return 400');

    console.log('✅ ALL ADMIN USER MANAGEMENT & INVITE-ONLY API TESTS PASSED!');
  } finally {
    await pool.query("DELETE FROM users WHERE email LIKE 'rogue_%@corp.com'");
    if (createdIds.length > 0) {
      await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [createdIds]);
    }
    if (server) {
      await new Promise<void>((resolve) => (server as http.Server).close(() => resolve()));
    }
    await pool.end();
  }
}

runUsersApiTests().catch((err) => {
  console.error('❌ Users API test failed:', err);
  process.exit(1);
});
