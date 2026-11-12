import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  computeUserStats,
  filterDirectoryUsers,
  validateNewUserForm,
  type DirectoryUser,
} from '../src/features/users/utils/users.utils';
import { updateUserSchema } from '../src/features/users/schemas/users.schema';

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

  const userFormModalSource = fs.readFileSync(
    path.join(clientSrc, 'features/users/components/UserFormModal.tsx'),
    'utf8'
  );
  assert.ok(
    userFormModalSource.includes('useForm') && userFormModalSource.includes('zodResolver'),
    'UserFormModal.tsx must use react-hook-form with zodResolver'
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

  // 4. Update user schema validation
  assert.equal(
    updateUserSchema.safeParse({ role: 'MANAGER', department: 'E', managerId: '' }).success,
    false
  );
  assert.equal(
    updateUserSchema.safeParse({ role: 'MANAGER', department: 'Product', managerId: '' }).success,
    true
  );

  console.log('✅ ALL ADMIN USER MANAGEMENT & INVITE-ONLY TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
