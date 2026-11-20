import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Responsive Action Banners & Footers (TDD RED)...');

  const detailPagePath = path.resolve('client/src/features/travel/pages/TravelDetailPage.tsx');
  const newPagePath = path.resolve('client/src/features/travel/pages/NewTravelRequestPage.tsx');
  const resubmitPagePath = path.resolve('client/src/features/travel/pages/ResubmitTravelRequestPage.tsx');
  const proofFieldPath = path.resolve('client/src/features/travel/components/forms/ProofAttachmentField.tsx');

  const detailCode = fs.readFileSync(detailPagePath, 'utf8');
  const newCode = fs.readFileSync(newPagePath, 'utf8');
  const resubmitCode = fs.readFileSync(resubmitPagePath, 'utf8');
  const proofCode = fs.readFileSync(proofFieldPath, 'utf8');

  // 1. TravelDetailPage alert banners must use responsive flex-col sm:flex-row
  assert.ok(
    detailCode.includes('flex flex-col sm:flex-row sm:items-center justify-between'),
    'TravelDetailPage action banners must use flex flex-col sm:flex-row sm:items-center'
  );

  // 2. NewTravelRequestPage and ResubmitTravelRequestPage footer must stack buttons on mobile
  assert.ok(
    newCode.includes('flex flex-col-reverse sm:flex-row sm:items-center justify-between') ||
    newCode.includes('flex-col-reverse sm:flex-row'),
    'NewTravelRequestPage form footer buttons must stack on mobile'
  );

  assert.ok(
    resubmitCode.includes('flex flex-col-reverse sm:flex-row sm:items-center justify-between') ||
    resubmitCode.includes('flex-col-reverse sm:flex-row'),
    'ResubmitTravelRequestPage form footer buttons must stack on mobile'
  );

  // 3. ProofAttachmentField document row must use responsive layout
  assert.ok(
    proofCode.includes('flex flex-col sm:flex-row sm:items-center justify-between') ||
    proofCode.includes('flex-col sm:flex-row'),
    'ProofAttachmentField document row must use responsive stacking for mobile buttons'
  );

  console.log('✅ Responsive action bars structural tests passed!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
