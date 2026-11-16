import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  computeUserStats,
  filterDirectoryUsers,
  validateNewUserForm,
  type DirectoryUser,
} from '../src/features/users/utils/users.utils';
import {
  createUserSchema,
  updateUserSchema,
} from '../src/features/users/schemas/users.schema';

async function run() {
  console.log('🧪 Testing Admin User Management helpers & invite-only auth...');

  const clientSrc = path.resolve(import.meta.dirname, '../src');

  // 1. Invite-only auth checks
  const signInSource = fs.readFileSync(
    path.join(clientSrc, 'features/auth/components/SignInCard.tsx'),
    'utf8'
  );
  assert.ok(
    !signInSource.includes('mode="sign-in"'),
    'SignInCard must not render the Create account mode switch'
  );

  const appRoutesSource = fs.readFileSync(path.join(clientSrc, 'routes/AppRoutes.tsx'), 'utf8');
  assert.ok(
    appRoutesSource.includes('path="/signup"') &&
      appRoutesSource.includes('<Navigate to="/signin" replace />'),
    'AppRoutes must redirect /signup to /signin'
  );
  assert.ok(
    appRoutesSource.includes('path="/admin/users/new"'),
    'AppRoutes must expose /admin/users/new dedicated Add Member page'
  );
  assert.ok(
    fs.existsSync(path.join(clientSrc, 'features/users/pages/NewUserPage.tsx')),
    'NewUserPage.tsx must exist'
  );

  const newUserPageSource = fs.readFileSync(
    path.join(clientSrc, 'features/users/pages/NewUserPage.tsx'),
    'utf8'
  );
  assert.ok(
    newUserPageSource.includes('useForm') && newUserPageSource.includes('zodResolver'),
    'NewUserPage.tsx must use react-hook-form with zodResolver'
  );
  assert.ok(
    newUserPageSource.includes('<select') && newUserPageSource.includes('id="new-user-role"'),
    'NewUserPage.tsx must use select dropdown for role'
  );

  const userFormModalSource = fs.readFileSync(
    path.join(clientSrc, 'features/users/components/UserFormModal.tsx'),
    'utf8'
  );
  assert.ok(
    userFormModalSource.includes('useForm') && userFormModalSource.includes('zodResolver'),
    'UserFormModal.tsx must use react-hook-form with zodResolver'
  );

  const adminUsersPageSource = fs.readFileSync(
    path.join(clientSrc, 'features/users/pages/AdminUsersPage.tsx'),
    'utf8'
  );
  assert.ok(
    adminUsersPageSource.includes("navigate('/admin/users/new')"),
    'AdminUsersPage must navigate to /admin/users/new on Add Member'
  );

  // 2. Directory filtering & KPI stats
  const sampleUsers: DirectoryUser[] = [
    {
      id: 'adm-1',
      name: 'Admin',
      email: 'admin@gmail.com',
      role: 'ADMIN',
      department: 'Executive',
      manager_id: null,
      manager_name: null,
      created_at: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 'mgr-1',
      name: 'Priya Nair',
      email: 'priya@corp.com',
      role: 'MANAGER',
      department: 'Sales',
      manager_id: null,
      manager_name: null,
      created_at: '2026-11-02T00:00:00.000Z',
    },
    {
      id: 'emp-1',
      name: 'Arjun Rao',
      email: 'arjun@corp.com',
      role: 'EMPLOYEE',
      department: 'Sales',
      manager_id: 'mgr-1',
      manager_name: 'Priya Nair',
      created_at: '2026-11-03T00:00:00.000Z',
    },
    {
      id: 'emp-2',
      name: 'Meera Iyer',
      email: 'meera@corp.com',
      role: 'EMPLOYEE',
      department: 'Engineering',
      manager_id: null,
      manager_name: null,
      created_at: '2026-11-04T00:00:00.000Z',
    },
  ];

  const stats = computeUserStats(sampleUsers);
  assert.equal(stats.total, 4);
  assert.equal(stats.managers, 1);
  assert.equal(stats.employees, 2);
  assert.equal(stats.unassignedEmployees, 1);

  assert.equal(filterDirectoryUsers(sampleUsers, { roleFilter: 'MANAGER' }).length, 1);
  assert.equal(filterDirectoryUsers(sampleUsers, { departmentFilter: 'Sales' }).length, 2);
  assert.equal(filterDirectoryUsers(sampleUsers, { query: 'priya' }).length, 2); // Priya + Arjun (manager_name)

  // 3. Create user validation
  const invalid = validateNewUserForm({
    name: 'A',
    email: 'bad',
    password: '123',
    role: 'EMPLOYEE',
    department: '',
  });
  assert.equal(invalid.valid, false);

  const valid = validateNewUserForm({
    name: 'Kiran Verma',
    email: 'kiran@corp.com',
    password: 'Password@123',
    role: 'EMPLOYEE',
    department: 'Engineering',
    managerId: 'mgr-1',
  });
  assert.equal(valid.valid, true);

  // 3b. Admin provisioning validation (rejected)
  const invalidAdmin = validateNewUserForm({
    name: 'Co Admin',
    email: 'coadmin@corp.com',
    password: 'Password@123',
    role: 'ADMIN' as any,
    department: 'Executive',
  });
  assert.equal(invalidAdmin.valid, false, 'Admin role creation must be rejected by schema');

  // 3c. Status filtering
  const sampleWithStatus: DirectoryUser[] = [
    { ...sampleUsers[0], is_active: true },
    { ...sampleUsers[1], is_active: false },
    { ...sampleUsers[2], is_active: true },
    { ...sampleUsers[3], is_active: false },
  ];
  assert.equal(
    filterDirectoryUsers(sampleWithStatus, { statusFilter: 'ACTIVE' } as any).length,
    2,
    'Status filter ACTIVE must return 2 users'
  );
  assert.equal(
    filterDirectoryUsers(sampleWithStatus, { statusFilter: 'INACTIVE' } as any).length,
    2,
    'Status filter INACTIVE must return 2 users'
  );

  // 4. Update user schema validation
  assert.equal(
    updateUserSchema.safeParse({ role: 'MANAGER', department: 'E', managerId: '' }).success,
    false
  );
  assert.equal(
    updateUserSchema.safeParse({ role: 'MANAGER', department: 'Product', managerId: '' }).success,
    true
  );

  // 5. Admin deletion warning & travel records erasure notice
  assert.ok(
    adminUsersPageSource.includes('erase') &&
      adminUsersPageSource.includes("can't bring back"),
    'AdminUsersPage must explicitly warn the admin that deleting the employee or manager will erase their travel records and cannot be brought back'
  );
  assert.ok(
    adminUsersPageSource.includes('confirmDeleteChecked') ||
      adminUsersPageSource.includes('confirmRecordErasure') ||
      adminUsersPageSource.includes('deleteAcknowledged'),
    'AdminUsersPage must include a confirmation acknowledgment checkbox for erasing records'
  );

  // 6. Admin creation feature must be removed
  assert.equal(
    createUserSchema.safeParse({
      name: 'Secondary Admin',
      email: 'sec_admin@corp.com',
      password: 'Password@123',
      role: 'ADMIN',
      department: 'Operations',
    }).success,
    false,
    'createUserSchema must reject role ADMIN'
  );
  assert.equal(
    createUserSchema.safeParse({
      name: 'Manager User',
      email: 'mgr@corp.com',
      password: 'Password@123',
      role: 'MANAGER',
      department: 'Operations',
    }).success,
    true,
    'createUserSchema must accept role MANAGER'
  );
  assert.equal(
    createUserSchema.safeParse({
      name: 'Employee User',
      email: 'emp@corp.com',
      password: 'Password@123',
      role: 'EMPLOYEE',
      department: 'Operations',
    }).success,
    true,
    'createUserSchema must accept role EMPLOYEE'
  );

  assert.ok(
    !newUserPageSource.includes('value="ADMIN"'),
    'NewUserPage must not offer ADMIN role option in dropdown'
  );

  console.log('✅ ALL ADMIN USER MANAGEMENT & INVITE-ONLY TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
