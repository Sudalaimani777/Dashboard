import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  classifyAdminQueue,
  filterAdminRequests,
  isManagerPersonalTrip,
} from '../src/features/travel/utils/adminQueue';
import type { TravelRequest } from '../src/features/travel/types/travel.types';

async function run() {
  console.log('🧪 Testing Unified Admin Governance Queue & Filter Logic...');

  const clientSrc = path.resolve(import.meta.dirname, '../src');
  const portalSource = fs.readFileSync(
    path.join(clientSrc, 'features/travel/components/AdminGovernancePortal.tsx'),
    'utf8'
  );

  // 1. Unified Table & Status Segment Checks in AdminGovernancePortal
  assert.ok(
    portalSource.includes('tab=governance') || portalSource.includes("'governance'"),
    'AdminGovernancePortal must support tab=governance as primary unified workspace'
  );

  // Redundant tablist removal assertion
  assert.ok(
    !portalSource.includes('Filter governance queue by status'),
    'AdminGovernancePortal must NOT have redundant governance stage tablist'
  );

  // Active KPI card bindings and toolbar clean checks
  assert.ok(
    portalSource.includes("isActive: statusSegment === 'CLEARANCE'"),
    'AdminGovernancePortal Card 1 must bind active state for CLEARANCE'
  );
  assert.ok(
    !portalSource.includes('Reset to All'),
    'AdminGovernancePortal must NOT have redundant Reset to All button'
  );
  assert.ok(
    !portalSource.includes('Filter by trip type'),
    'AdminGovernancePortal must NOT have redundant trip type toggle'
  );

  assert.ok(
    portalSource.includes('/travel/requests/'),
    'AdminGovernancePortal row action must navigate directly to /travel/requests/:id'
  );
  assert.ok(
    !portalSource.includes('/travel/clearance/'),
    'AdminGovernancePortal must not route to deprecated /travel/clearance/:id'
  );

  // 2. Mock dataset testing for unified status classification
  const mockRequests: Partial<TravelRequest>[] = [
    {
      id: 'req-1',
      title: 'Exec Clearance Trip',
      status: 'PENDING_ADMIN_APPROVAL',
      totalExpenses: 25000,
      departureDate: '2026-12-01',
      returnDate: '2026-12-05',
    },
    {
      id: 'req-2',
      title: 'Line Manager Review Trip',
      status: 'PENDING_MANAGER_REVIEW',
      totalExpenses: 12000,
      departureDate: '2026-12-10',
      returnDate: '2026-12-12',
    },
    {
      id: 'req-3',
      title: 'Revision Dispatch Trip',
      status: 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER',
      totalExpenses: 8000,
      departureDate: '2026-12-15',
      returnDate: '2026-12-18',
    },
    {
      id: 'req-4',
      title: 'Settled Trip',
      status: 'SETTLED',
      totalExpenses: 15000,
      departureDate: '2026-11-01',
      returnDate: '2026-11-04',
    },
    {
      id: 'req-5',
      title: 'Approved Trip',
      status: 'APPROVED',
      totalExpenses: 18000,
      departureDate: '2026-11-10',
      returnDate: '2026-11-14',
    },
  ];

  const classified = classifyAdminQueue(mockRequests as TravelRequest[]);
  assert.equal(classified.awaitingExecutive.length, 1, 'Should have 1 awaiting executive');
  assert.equal(classified.tier1Oversight.length, 1, 'Should have 1 tier 1 oversight');
  assert.equal(classified.dispatchedRevisions.length, 1, 'Should have 1 in revisions');
  assert.equal(classified.ledgerArchive.length, 2, 'Should have 2 settled/approved in archive');

  console.log('✅ ALL UNIFIED ADMIN GOVERNANCE QUEUE TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
