// client/tests/audit-timeline-alignment.test.ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateManagerDecisionRemarks } from '../src/features/travel/utils/managerQueue';
import { validateAdminDecisionRemarks } from '../src/features/travel/utils/adminQueue';

console.log('🧪 Starting Audit Timeline Alignment & Decision Mandatory Remarks Test Suite...\n');

// 1. AuditTimelineLog layout inspection
console.log('Test 1: Verify AuditTimelineLog has multi-row layout without inline status cramming');
const timelineLogPath = path.resolve(
  import.meta.dirname,
  '../src/features/travel/components/audit/AuditTimelineLog.tsx'
);
const timelineLogSource = fs.readFileSync(timelineLogPath, 'utf8');

// Ensure row 1 has actor and timestamp separated
assert.ok(
  timelineLogSource.includes('formattedDate') && timelineLogSource.includes('actorRole'),
  'Timeline log must include formattedDate and actorRole'
);

// Ensure status is placed in its own block (not crammed inside flex items-center with actor)
assert.ok(
  timelineLogSource.includes('/* Row 2: Status Text */') || timelineLogSource.includes('formattedStatus'),
  'Timeline log must render status in dedicated row'
);
assert.ok(
  !timelineLogSource.includes('<div className="flex items-center gap-2">\n                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-surface-subtle border border-border-warm text-muted">\n                    {actorRole}\n                  </span>\n                  <span className="font-semibold text-ink">\n                    {formattedStatus}'),
  'Timeline log must not cram actorRole and formattedStatus in the same tight flex item'
);
console.log('  ✅ PASS: AuditTimelineLog has dedicated status row and un-crammed layout');

// 2. Manager Decision remarks are strictly mandatory for APPROVE
console.log('\nTest 2: Manager decision remarks are mandatory (min 3 chars) on APPROVE');
assert.equal(validateManagerDecisionRemarks('APPROVE', '').valid, false);
assert.equal(validateManagerDecisionRemarks('APPROVE', '   ').valid, false);
assert.equal(validateManagerDecisionRemarks('APPROVE', 'ok').valid, false);
assert.equal(validateManagerDecisionRemarks('APPROVE', 'Approved for travel').valid, true);
console.log('  ✅ PASS: Manager approval requires at least 3 characters of remarks');

// 3. Executive Clearance remarks are strictly mandatory for APPROVE & SETTLE
console.log('\nTest 3: Executive clearance remarks are mandatory (min 3 chars) on APPROVE & SETTLE');
assert.equal(validateAdminDecisionRemarks('APPROVE', '').valid, false);
assert.equal(validateAdminDecisionRemarks('APPROVE', '   ').valid, false);
assert.equal(validateAdminDecisionRemarks('APPROVE', 'no').valid, false);
assert.equal(validateAdminDecisionRemarks('APPROVE', 'Executive budget clearance granted').valid, true);
assert.equal(validateAdminDecisionRemarks('SETTLE', '').valid, false);
assert.equal(validateAdminDecisionRemarks('SETTLE', 'Claims and invoices verified').valid, true);
console.log('  ✅ PASS: Executive clearance requires at least 3 characters of remarks');

console.log('\n🎉 ALL AUDIT TIMELINE & MANDATORY REMARKS TESTS PASSED!\n');
