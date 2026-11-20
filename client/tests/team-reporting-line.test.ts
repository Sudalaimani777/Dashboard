// client/tests/team-reporting-line.test.ts
import assert from 'node:assert/strict';
import { isUserInReportingLine, type DirectoryUser } from '../src/features/users/utils/users.utils';

console.log('🧪 Testing Team & Access "My Reporting Line" Filter Utility (TDD)...');

const adminA: DirectoryUser = {
  id: 'admin-a-id',
  name: 'Admin A',
  email: 'admin.a@example.com',
  role: 'ADMIN',
  department: 'Finance',
  manager_id: null,
  manager_name: null,
  reporting_admin_id: null,
  created_at: '2026-01-01',
};

const adminB: DirectoryUser = {
  id: 'admin-b-id',
  name: 'Sudhakar Admin B',
  email: 'admin.b@example.com',
  role: 'ADMIN',
  department: 'Finance',
  manager_id: null,
  manager_name: null,
  reporting_admin_id: null,
  created_at: '2026-01-01',
};

const managerA: DirectoryUser = {
  id: 'mgr-a-id',
  name: 'Manager Under A',
  email: 'mgr.a@example.com',
  role: 'MANAGER',
  department: 'Engineering',
  manager_id: null,
  manager_name: null,
  reporting_admin_id: adminA.id,
  created_at: '2026-01-02',
};

const managerB: DirectoryUser = {
  id: 'mgr-b-id',
  name: 'Manager Under B',
  email: 'mgr.b@example.com',
  role: 'MANAGER',
  department: 'Sales',
  manager_id: null,
  manager_name: null,
  reporting_admin_id: adminB.id,
  created_at: '2026-01-02',
};

const employeeUnderA: DirectoryUser = {
  id: 'emp-a-id',
  name: 'Dev Under Manager A',
  email: 'emp.a@example.com',
  role: 'EMPLOYEE',
  department: 'Engineering',
  manager_id: managerA.id,
  manager_name: managerA.name,
  reporting_admin_id: null,
  created_at: '2026-01-03',
};

const employeeUnderB: DirectoryUser = {
  id: 'emp-b-id',
  name: 'Rep Under Manager B',
  email: 'emp.b@example.com',
  role: 'EMPLOYEE',
  department: 'Sales',
  manager_id: managerB.id,
  manager_name: managerB.name,
  reporting_admin_id: null,
  created_at: '2026-01-03',
};

const unassignedEmployee: DirectoryUser = {
  id: 'emp-unassigned-id',
  name: 'Unassigned New Hire',
  email: 'emp.unassigned@example.com',
  role: 'EMPLOYEE',
  department: 'Operations',
  manager_id: null,
  manager_name: null,
  reporting_admin_id: null,
  created_at: '2026-01-04',
};

const allUsers: DirectoryUser[] = [
  adminA,
  adminB,
  managerA,
  managerB,
  employeeUnderA,
  employeeUnderB,
  unassignedEmployee,
];

// 1. Current Admin is included in their own line view
assert.equal(isUserInReportingLine(adminA, adminA.id, allUsers), true);
assert.equal(isUserInReportingLine(adminB, adminB.id, allUsers), true);
assert.equal(isUserInReportingLine(adminA, adminB.id, allUsers), false);
console.log('✓ Test 1: Admin self-identity in reporting line passed');

// 2. Direct reporting Manager
assert.equal(isUserInReportingLine(managerA, adminA.id, allUsers), true);
assert.equal(isUserInReportingLine(managerA, adminB.id, allUsers), false);
assert.equal(isUserInReportingLine(managerB, adminB.id, allUsers), true);
assert.equal(isUserInReportingLine(managerB, adminA.id, allUsers), false);
console.log('✓ Test 2: Direct reporting manager scoping passed');

// 3. Employee whose manager reports to the Admin
assert.equal(isUserInReportingLine(employeeUnderA, adminA.id, allUsers), true);
assert.equal(isUserInReportingLine(employeeUnderA, adminB.id, allUsers), false);
assert.equal(isUserInReportingLine(employeeUnderB, adminB.id, allUsers), true);
assert.equal(isUserInReportingLine(employeeUnderB, adminA.id, allUsers), false);
console.log('✓ Test 3: Indirect employee through manager reporting line passed');

// 4. Unassigned Employee
assert.equal(isUserInReportingLine(unassignedEmployee, adminA.id, allUsers), false);
assert.equal(isUserInReportingLine(unassignedEmployee, adminB.id, allUsers), false);
console.log('✓ Test 4: Unassigned employee correctly excluded from specific reporting line');

// 5. Edge cases: null or invalid admin id
assert.equal(isUserInReportingLine(managerA, '', allUsers), false);
assert.equal(isUserInReportingLine(managerA, undefined, allUsers), false);
console.log('✓ Test 5: Invalid admin IDs safely handled');

console.log('🎉 ALL TEAM REPORTING LINE TESTS PASSED!');
