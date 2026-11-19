// server/tests/travel-upload-and-multidoc.test.ts
import assert from 'node:assert/strict';
import { runMigrations } from '../src/shared/db/migrate.js';
import { pool } from '../src/shared/db/pool.js';
import { TravelService } from '../src/features/travel/travel.service.js';
import { cloudinaryService } from '../src/shared/services/cloudinary.service.js';
import type { SupportingDoc } from '../src/features/travel/travel.types.js';

async function run() {
  console.log('🧪 Starting Cloudinary Upload & Multi-Document Backend Tests...\n');

  // Step 1: Ensure migrations are up to date
  await runMigrations();

  const service = new TravelService();

  // Find or create test user
  const userRes = await pool.query(`SELECT id, role FROM users LIMIT 1`);
  if (userRes.rows.length === 0) {
    throw new Error('No user found in database. Run reset-db.ts or seed first.');
  }
  const testUserId = userRes.rows[0].id;

  // --- Test 1: Upload Buffer through CloudinaryService ---
  console.log('--- Test 1: CloudinaryService uploadBuffer ---');
  // 1x1 valid base64 PNG
  const validPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const uploadResult = await cloudinaryService.uploadBuffer(
    validPngBuffer,
    'receipt-flight.png',
    'image/png'
  );

  console.log('Upload Result:', uploadResult);
  assert(uploadResult.url && uploadResult.url.length > 5, 'Upload must return a valid URL');
  assert(uploadResult.url.includes('cloudinary.com') || uploadResult.url.includes('/uploads/'), 'URL must be Cloudinary or local');
  assert.equal(uploadResult.name, 'receipt-flight.png', 'Upload must preserve original name');
  console.log('  ✅ PASS: Upload returned valid URL and preserved metadata\n');

  // --- Test 2: Create Travel Request with Multiple Supporting Docs ---
  console.log('--- Test 2: Create Travel Request with Multiple Supporting Docs ---');
  const sampleDocs: SupportingDoc[] = [
    {
      id: 'doc-file-1',
      type: 'FILE',
      name: 'Air_India_Flight_Quotation.pdf',
      url: uploadResult.url,
      format: uploadResult.format,
      size: uploadResult.size,
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'doc-link-2',
      type: 'LINK',
      name: 'Marriott Hotel Itinerary Link',
      url: 'https://drive.google.com/file/d/sample-hotel-quote',
      uploadedAt: new Date().toISOString(),
    },
  ];

  const createdRequest = await service.createRequest(testUserId, {
    travel_type: 'UPCOMING',
    title: 'Multi-Doc Proof Verification Trip',
    purpose: 'Validating multiple proof attachments and Cloudinary upload in backend',
    project_code: 'ENG-2026',
    origin: 'Bengaluru',
    destination: 'London',
    departure_date: '2026-11-20',
    return_date: '2026-11-25',
    emergency_contact_name: 'HR Travel Ops',
    emergency_contact_phone: '+91 9999999999',
    supporting_docs: sampleDocs,
    isDraft: true,
    expenses: [
      {
        category: 'FLIGHT',
        merchant: 'Air India',
        amount: 85000,
        expense_date: '2026-11-20',
        notes: 'Roundtrip direct',
      },
      {
        category: 'HOTEL',
        merchant: 'Marriott London',
        amount: 55000,
        expense_date: '2026-11-21',
        notes: '4 nights lodging',
      },
    ],
  });

  console.log('Created Request ID:', createdRequest.id);
  assert(createdRequest.id, 'Created request must have an ID');
  assert(Array.isArray(createdRequest.supportingDocs), 'supportingDocs must be returned as an array');
  assert.equal(createdRequest.supportingDocs?.length, 2, 'Should have exactly 2 supporting documents');
  assert.equal(createdRequest.supportingDocs?.[0]?.name, 'Air_India_Flight_Quotation.pdf');
  assert.equal(createdRequest.supportingDocs?.[1]?.type, 'LINK');
  assert.equal(
    createdRequest.supportingDocUrl,
    uploadResult.url,
    'supportingDocUrl must be backwards-compatible with primary doc URL'
  );
  console.log('  ✅ PASS: Request created with 2 docs and primary doc URL fallback maintained\n');

  // --- Test 3: Fetch Request by ID ---
  console.log('--- Test 3: Fetch Request by ID and verify supportingDocs structure ---');
  const fetched = await service.getRequestById(createdRequest.id);
  assert(Array.isArray(fetched.supportingDocs), 'Fetched request must have supportingDocs array');
  assert.equal(fetched.supportingDocs.length, 2, 'Fetched supportingDocs length must match');
  console.log('  ✅ PASS: getRequestById properly retrieves JSONB supportingDocs\n');

  // --- Test 4: Resubmit Request with modified docs list ---
  console.log('--- Test 4: Resubmit Request with updated supportingDocs ---');
  const updatedDocs: SupportingDoc[] = [
    ...sampleDocs,
    {
      id: 'doc-link-3',
      type: 'LINK',
      name: 'Uber Airport Transit Estimate',
      url: 'https://uber.com/receipts/dummy-123',
      uploadedAt: new Date().toISOString(),
    },
  ];

  const resubmitted = await service.employeeResubmit(testUserId, createdRequest.id, {
    title: 'Multi-Doc Proof Verification Trip (Updated)',
    supporting_docs: updatedDocs,
    employee_response_notes: 'Added airport transit quote',
  });

  assert.equal(resubmitted.supportingDocs?.length, 3, 'Resubmitted request should now have 3 docs');
  assert.equal(resubmitted.supportingDocs?.[2]?.name, 'Uber Airport Transit Estimate');
  console.log('  ✅ PASS: Resubmission successfully updated multi-document proof array\n');

  console.log('====================================================');
  console.log('🎉 ALL CLOUDINARY & MULTI-DOC BACKEND TESTS PASSED!');
  console.log('====================================================\n');
}

run()
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
