import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Running TDD tests for RubberSegment component & integration...');

  const clientSrc = path.resolve(import.meta.dirname, '../src');
  const uiDir = path.join(clientSrc, 'shared/components/ui');

  // 1. Component files existence
  const componentPath = path.join(uiDir, 'RubberSegment.tsx');
  const cssPath = path.join(uiDir, 'RubberSegment.css');
  const indexExportPath = path.join(uiDir, 'index.ts');

  assert.ok(fs.existsSync(componentPath), 'RubberSegment.tsx must exist in shared/components/ui');
  assert.ok(fs.existsSync(cssPath), 'RubberSegment.css must exist in shared/components/ui');

  const componentSource = fs.readFileSync(componentPath, 'utf8');
  const cssSource = fs.readFileSync(cssPath, 'utf8');
  const indexSource = fs.readFileSync(indexExportPath, 'utf8');

  // 2. Export check
  assert.ok(
    componentSource.includes('export default function RubberSegment') ||
      componentSource.includes('export function RubberSegment') ||
      componentSource.includes('export const RubberSegment'),
    'RubberSegment must export RubberSegment'
  );
  assert.ok(
    indexSource.includes('RubberSegment'),
    'shared/components/ui/index.ts must export RubberSegment'
  );

  // 3. Variant support & Token integration
  assert.ok(
    componentSource.includes("variant === 'surface'") || componentSource.includes('variant ='),
    'RubberSegment must support variant prop'
  );
  assert.ok(
    componentSource.includes('#533AFD') || componentSource.includes('var(--color-primary'),
    'RubberSegment must incorporate Stripe brand primary #533AFD'
  );
  assert.ok(
    cssSource.includes('--rs-track') && cssSource.includes('--rs-thumb'),
    'RubberSegment.css must define CSS custom properties for track and thumb'
  );
  assert.ok(
    componentSource.includes('badge') || componentSource.includes('item.badge'),
    'RubberSegment must support badge/count slots for items'
  );

  // 4. Target integrations check
  const adminUsersPage = fs.readFileSync(
    path.join(clientSrc, 'features/users/pages/AdminUsersPage.tsx'),
    'utf8'
  );
  assert.ok(
    adminUsersPage.includes('<RubberSegment'),
    'AdminUsersPage.tsx must use RubberSegment'
  );
  assert.ok(
    adminUsersPage.includes('directoryScope') && adminUsersPage.includes('roleFilter'),
    'AdminUsersPage.tsx must integrate RubberSegment for directoryScope and roleFilter'
  );

  const adminGovPortal = fs.readFileSync(
    path.join(clientSrc, 'features/travel/components/AdminGovernancePortal.tsx'),
    'utf8'
  );
  assert.ok(
    adminGovPortal.includes('<RubberSegment'),
    'AdminGovernancePortal.tsx must use RubberSegment'
  );
  assert.ok(
    adminGovPortal.includes('adminScope'),
    'AdminGovernancePortal.tsx must integrate RubberSegment for adminScope'
  );

  const deptBudgetsPage = fs.readFileSync(
    path.join(clientSrc, 'features/travel/pages/DepartmentBudgetsPage.tsx'),
    'utf8'
  );
  assert.ok(
    deptBudgetsPage.includes('<RubberSegment'),
    'DepartmentBudgetsPage.tsx must use RubberSegment'
  );
  assert.ok(
    deptBudgetsPage.includes('selectedQuarter'),
    'DepartmentBudgetsPage.tsx must integrate RubberSegment for selectedQuarter'
  );

  const managerQueuePortal = fs.readFileSync(
    path.join(clientSrc, 'features/travel/components/ManagerQueuePortal.tsx'),
    'utf8'
  );
  assert.ok(
    managerQueuePortal.includes('<RubberSegment'),
    'ManagerQueuePortal.tsx must use RubberSegment'
  );
  assert.ok(
    managerQueuePortal.includes('personalSegment'),
    'ManagerQueuePortal.tsx must integrate RubberSegment for personalSegment'
  );

  const travelTypeToggle = fs.readFileSync(
    path.join(clientSrc, 'features/travel/components/forms/TravelTypeToggle.tsx'),
    'utf8'
  );
  assert.ok(
    travelTypeToggle.includes('<RubberSegment'),
    'TravelTypeToggle.tsx must use RubberSegment'
  );
  assert.ok(
    travelTypeToggle.includes("variant=\"surface\"") || travelTypeToggle.includes("variant='surface'"),
    'TravelTypeToggle.tsx must use surface variant'
  );

  const notificationsHubPage = fs.readFileSync(
    path.join(clientSrc, 'features/notifications/pages/NotificationsHubPage.tsx'),
    'utf8'
  );
  assert.ok(
    notificationsHubPage.includes('<RubberSegment'),
    'NotificationsHubPage.tsx must use RubberSegment'
  );
  assert.ok(
    notificationsHubPage.includes('activeFilter'),
    'NotificationsHubPage.tsx must integrate RubberSegment for activeFilter'
  );

  console.log('✅ ALL RUBBER SEGMENT TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
