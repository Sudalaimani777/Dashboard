// server/tests/travel-state-machine.test.ts
import { 
  validateStatusTransition, 
  canEmployeeModify, 
  isTerminalStatus,
  TravelStatus 
} from '../src/features/travel/travel.types.js';
import {
  validateCreateRequestPayload,
  validateManagerReviewPayload,
  validateAdminReviewPayload,
  validateResubmitPayload
} from '../src/features/travel/travel.validation.js';

function runStateMachineAndValidationTests() {
  console.log('🧪 Running Travel State Machine & Validation Test Suite...\n');
  let passedCount = 0;

  function assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`❌ Assertion failed: ${message}`);
    }
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  }

  // --- 1. Standard Upstream State Transitions ---
  console.log('--- 1. Standard Upstream State Transitions ---');
  assert(validateStatusTransition('DRAFT', 'PENDING_MANAGER_REVIEW'), 'DRAFT -> PENDING_MANAGER_REVIEW should be valid');
  assert(validateStatusTransition('PENDING_MANAGER_REVIEW', 'PENDING_ADMIN_APPROVAL'), 'PENDING_MANAGER_REVIEW -> PENDING_ADMIN_APPROVAL should be valid');
  assert(validateStatusTransition('PENDING_ADMIN_APPROVAL', 'APPROVED'), 'PENDING_ADMIN_APPROVAL -> APPROVED (Upcoming clearance) should be valid');
  assert(validateStatusTransition('PENDING_ADMIN_APPROVAL', 'SETTLED'), 'PENDING_ADMIN_APPROVAL -> SETTLED (Post-trip reimbursement payout) should be valid');

  // --- 2. Revision Loops & Strict Manager Re-Verification Invariant ---
  console.log('\n--- 2. Revision Loops & Strict Invariant Tests ---');
  // Manager requests revision from Employee
  assert(validateStatusTransition('PENDING_MANAGER_REVIEW', 'REVISION_REQUESTED_BY_MANAGER'), 'Manager can request revision from employee');
  assert(validateStatusTransition('REVISION_REQUESTED_BY_MANAGER', 'PENDING_MANAGER_REVIEW'), 'Employee resubmits to manager');

  // Admin revision Route A: via Manager
  assert(validateStatusTransition('PENDING_ADMIN_APPROVAL', 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER'), 'Admin can request revision via Manager (Route A)');
  assert(validateStatusTransition('REVISION_REQUESTED_BY_ADMIN_TO_MANAGER', 'REVISION_REQUESTED_BY_MANAGER'), 'Manager forwards revision to employee');
  assert(validateStatusTransition('REVISION_REQUESTED_BY_ADMIN_TO_MANAGER', 'PENDING_ADMIN_APPROVAL'), 'Manager re-escalates directly to Admin if clarified');

  // Admin revision Route B: direct to Employee
  assert(validateStatusTransition('PENDING_ADMIN_APPROVAL', 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'), 'Admin can request revision directly to Employee (Route B)');

  // THE CORE INVARIANT: Resubmission from Admin Revision to Employee MUST route to Manager first!
  assert(validateStatusTransition('REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE', 'PENDING_MANAGER_REVIEW'), 'Admin direct revision to employee MUST return to PENDING_MANAGER_REVIEW upon resubmission');
  assert(!validateStatusTransition('REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE', 'PENDING_ADMIN_APPROVAL'), 'Employee CANNOT bypass Manager directly to PENDING_ADMIN_APPROVAL');
  assert(!validateStatusTransition('REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE', 'APPROVED'), 'Employee CANNOT bypass directly to APPROVED');

  // Invalid shortcuts
  assert(!validateStatusTransition('DRAFT', 'APPROVED'), 'Direct skip from DRAFT to APPROVED is blocked');
  assert(!validateStatusTransition('DRAFT', 'PENDING_ADMIN_APPROVAL'), 'Direct skip from DRAFT to Admin review is blocked');

  // --- 3. Terminal States & Cancellation ---
  console.log('\n--- 3. Terminal States & Cancellation Tests ---');
  assert(isTerminalStatus('APPROVED'), 'APPROVED is terminal');
  assert(isTerminalStatus('SETTLED'), 'SETTLED is terminal');
  assert(isTerminalStatus('REJECTED'), 'REJECTED is terminal');
  assert(isTerminalStatus('CANCELLED'), 'CANCELLED is terminal');
  assert(!isTerminalStatus('PENDING_MANAGER_REVIEW'), 'PENDING_MANAGER_REVIEW is not terminal');

  // Terminal states cannot transition to anything
  assert(!validateStatusTransition('APPROVED', 'PENDING_MANAGER_REVIEW'), 'APPROVED cannot transition');
  assert(!validateStatusTransition('SETTLED', 'DRAFT'), 'SETTLED cannot transition');
  assert(!validateStatusTransition('REJECTED', 'APPROVED'), 'REJECTED cannot transition');

  // Both Manager and Admin can reject
  assert(validateStatusTransition('PENDING_MANAGER_REVIEW', 'REJECTED'), 'Manager can reject request');
  assert(validateStatusTransition('PENDING_ADMIN_APPROVAL', 'REJECTED'), 'Admin can reject request');

  // Employee can cancel drafts or revision requests
  assert(validateStatusTransition('DRAFT', 'CANCELLED'), 'Employee can cancel draft');
  assert(validateStatusTransition('REVISION_REQUESTED_BY_MANAGER', 'CANCELLED'), 'Employee can cancel under manager revision');

  // --- 4. Employee Modification Permissions ---
  console.log('\n--- 4. Employee Modification Permissions ---');
  assert(canEmployeeModify('DRAFT'), 'Employee can modify DRAFT');
  assert(canEmployeeModify('REVISION_REQUESTED_BY_MANAGER'), 'Employee can modify when Manager requests revision');
  assert(canEmployeeModify('REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'), 'Employee can modify when Admin requests revision directly');
  assert(!canEmployeeModify('PENDING_MANAGER_REVIEW'), 'Employee CANNOT modify while Manager is reviewing');
  assert(!canEmployeeModify('PENDING_ADMIN_APPROVAL'), 'Employee CANNOT modify while Admin is reviewing');
  assert(!canEmployeeModify('APPROVED'), 'Employee CANNOT modify APPROVED request');
  assert(!canEmployeeModify('SETTLED'), 'Employee CANNOT modify SETTLED request');

  // --- 5. Payload Validation Tests ---
  console.log('\n--- 5. Payload Validation Tests ---');
  
  // Valid Create Request Payload
  const validCreatePayload = {
    travel_type: 'UPCOMING' as const,
    title: 'APAC Architecture Summit - Singapore',
    purpose: 'Deliver tech architecture keynote and participate in enterprise planning.',
    project_code: 'PROJ-APAC-2026',
    origin: 'Bangalore (BLR)',
    destination: 'Singapore (SIN)',
    departure_date: '2026-11-20',
    return_date: '2026-11-24',
    emergency_contact_name: 'Meera Kannan',
    emergency_contact_phone: '+91 98400 12345',
    supporting_doc_url: 'https://storage.tripflow.internal/itinerary.pdf',
    expenses: [
      {
        category: 'FLIGHT' as const,
        merchant: 'Singapore Airlines',
        amount: 58000.00,
        expense_date: '2026-11-20',
        receipt_image_url: 'https://storage.tripflow.internal/flight.jpg',
        notes: 'Direct return flight'
      },
      {
        category: 'HOTEL' as const,
        merchant: 'Marina Bay Sands',
        amount: 32000.00,
        expense_date: '2026-11-21',
        receipt_image_url: 'https://storage.tripflow.internal/hotel.jpg'
      }
    ]
  };

  const validCreateResult = validateCreateRequestPayload(validCreatePayload);
  assert(validCreateResult.valid, 'Valid create payload passes validation');

  // Invalid Create Request Payload: Missing title and empty expenses
  const invalidCreatePayload = {
    ...validCreatePayload,
    title: '',
    expenses: []
  };
  const invalidCreateResult = validateCreateRequestPayload(invalidCreatePayload);
  assert(!invalidCreateResult.valid, 'Invalid create payload rejected');
  assert(
    invalidCreateResult.errors!.some(e => e.toLowerCase().includes('title')),
    'Catches missing title'
  );
  assert(
    invalidCreateResult.errors!.some(e => e.toLowerCase().includes('expense')),
    'Catches empty itemized expenses'
  );

  // Invalid: Negative expense amount
  const negativeExpensePayload = {
    ...validCreatePayload,
    expenses: [{ ...validCreatePayload.expenses[0], amount: -500 }]
  };
  const negativeExpenseResult = validateCreateRequestPayload(negativeExpensePayload);
  assert(!negativeExpenseResult.valid, 'Negative expense amount rejected');

  // Manager Review Validation
  const validManagerReview = {
    action: 'APPROVE_AND_FORWARD' as const,
    remarks: 'Validated necessity and project allocation.'
  };
  assert(validateManagerReviewPayload(validManagerReview).valid, 'Valid manager approval payload passes');

  const invalidManagerReview = {
    action: 'INVALID_ACTION'
  };
  assert(!validateManagerReviewPayload(invalidManagerReview).valid, 'Invalid manager action rejected');

  // Manager Revision requires remarks
  const emptyRemarksManagerRevision = {
    action: 'REQUEST_REVISION' as const,
    remarks: '   '
  };
  assert(!validateManagerReviewPayload(emptyRemarksManagerRevision).valid, 'Manager revision without remarks rejected');

  // Admin Review Validation
  const validAdminApprove = {
    action: 'APPROVE' as const,
    remarks: 'Budget headroom approved.'
  };
  assert(validateAdminReviewPayload(validAdminApprove).valid, 'Valid admin approval passes');

  const validAdminRevisionRouteA = {
    action: 'REQUEST_REVISION' as const,
    revision_target: 'MANAGER' as const,
    remarks: 'Please recheck flight options.'
  };
  assert(validateAdminReviewPayload(validAdminRevisionRouteA).valid, 'Valid admin revision Route A passes');

  const validAdminRevisionRouteB = {
    action: 'REQUEST_REVISION' as const,
    revision_target: 'EMPLOYEE' as const,
    remarks: 'Please upload tax invoice.'
  };
  assert(validateAdminReviewPayload(validAdminRevisionRouteB).valid, 'Valid admin revision Route B passes');

  const invalidAdminRevisionNoTarget = {
    action: 'REQUEST_REVISION' as const,
    remarks: 'Needs revision'
  };
  assert(!validateAdminReviewPayload(invalidAdminRevisionNoTarget).valid, 'Admin revision without revision_target rejected');

  // Resubmit Validation
  const validResubmit = {
    employee_response_notes: 'Updated quotes with corporate discount.'
  };
  assert(validateResubmitPayload(validResubmit).valid, 'Valid resubmission passes');

  console.log(`\n==========================================`);
  console.log(`🎉 ALL ${passedCount} FSM & VALIDATION TESTS PASSED!`);
  console.log(`==========================================\n`);
}

runStateMachineAndValidationTests();
