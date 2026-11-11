import assert from 'node:assert/strict';
import { getStatusBadgeConfig } from '../src/features/travel/components/TravelStatusBadge';

async function run() {
  console.log('🧪 Testing TravelStatusBadge configuration...');

  const pendingMgr = getStatusBadgeConfig('PENDING_MANAGER_REVIEW');
  assert.equal(pendingMgr.label, 'Pending Manager Review');
  assert.ok(!pendingMgr.label.includes('●'), 'Badge label must not contain colored dots');
  assert.ok(pendingMgr.className.includes('text-amber-800') || pendingMgr.className.includes('amber'), 'Pending review should have amber tone');

  const pendingAdm = getStatusBadgeConfig('PENDING_ADMIN_APPROVAL');
  assert.equal(pendingAdm.label, 'Pending Admin Clearance');
  assert.ok(!pendingAdm.label.includes('●'), 'Badge label must not contain colored dots');

  const approved = getStatusBadgeConfig('APPROVED');
  assert.equal(approved.label, 'Approved');
  assert.ok(!approved.label.includes('●'), 'Badge label must not contain colored dots');

  const settled = getStatusBadgeConfig('SETTLED');
  assert.equal(settled.label, 'Settled (Paid)');
  assert.ok(!settled.label.includes('●'), 'Badge label must not contain colored dots');

  const revMgr = getStatusBadgeConfig('REVISION_REQUESTED_BY_MANAGER');
  assert.equal(revMgr.label, 'Revision Required (Manager)');
  assert.ok(!revMgr.label.includes('●'), 'Badge label must not contain colored dots');

  const revAdmToMgr = getStatusBadgeConfig('REVISION_REQUESTED_BY_ADMIN_TO_MANAGER');
  assert.equal(revAdmToMgr.label, 'Admin Revision (via Manager)');

  const revAdmToEmp = getStatusBadgeConfig('REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE');
  assert.equal(revAdmToEmp.label, 'Admin Revision (Direct)');

  const rejected = getStatusBadgeConfig('REJECTED');
  assert.equal(rejected.label, 'Rejected');

  const cancelled = getStatusBadgeConfig('CANCELLED');
  assert.equal(cancelled.label, 'Cancelled');

  console.log('✅ ALL TRAVEL STATUS BADGE TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
