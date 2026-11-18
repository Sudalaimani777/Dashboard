import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing ProofAttachmentField Inline Preview & Download...');

  const fieldPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/forms/ProofAttachmentField.tsx'
  );
  assert.ok(fs.existsSync(fieldPath), 'ProofAttachmentField.tsx must exist');
  const source = fs.readFileSync(fieldPath, 'utf8');

  // 1. Must have dedicated Preview and Download actions
  assert.ok(
    source.includes('Preview') && source.includes('Download'),
    'ProofAttachmentField must contain both Preview and Download action buttons'
  );

  // 2. Must support smooth dropdown preview via motion/react (not a popup modal)
  assert.ok(
    source.includes('AnimatePresence') && source.includes('motion'),
    'ProofAttachmentField must use AnimatePresence and motion for smooth dropdown preview'
  );

  // 3. Must have handleDownload for downloading files locally
  assert.ok(
    source.includes('handleDownload'),
    'ProofAttachmentField must implement handleDownload for file saving'
  );

  // 4. Must support toggling preview state
  assert.ok(
    source.includes('previewDocId') || source.includes('expandedDocId'),
    'ProofAttachmentField must maintain state for which document dropdown preview is expanded'
  );

  console.log('✅ ALL PROOF ATTACHMENT PREVIEW & DOWNLOAD TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
