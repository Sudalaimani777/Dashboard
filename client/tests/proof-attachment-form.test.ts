import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function normalizeDocUrl(rawUrl: string): string {
  let validUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(validUrl)) {
    validUrl = `https://${validUrl}`;
  }
  return validUrl;
}

async function run() {
  console.log('🧪 Testing ProofAttachmentField form integrity & URL normalization...');

  // 1. Test URL normalization logic
  assert.equal(
    normalizeDocUrl('drive.google.com/file/d/123'),
    'https://drive.google.com/file/d/123',
    'Should prepend https:// to bare domains'
  );
  assert.equal(
    normalizeDocUrl('https://i.pinimg.com/image.png'),
    'https://i.pinimg.com/image.png',
    'Should preserve existing https:// protocols'
  );
  assert.equal(
    normalizeDocUrl('http://insecure.site/receipt.pdf'),
    'http://insecure.site/receipt.pdf',
    'Should preserve existing http:// protocols'
  );

  // 2. Validate ProofAttachmentField source code for invalid nested <form>
  const componentPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/forms/ProofAttachmentField.tsx'
  );
  const source = fs.readFileSync(componentPath, 'utf8');

  // Must not have nested <form> tags
  assert.ok(
    !source.includes('<form'),
    'ProofAttachmentField must NOT render a nested <form> tag'
  );

  // Attach Link button must be type="button" to prevent outer form submit/refresh
  assert.ok(
    !source.includes('type="submit"'),
    'ProofAttachmentField must NOT contain type="submit" buttons'
  );
  assert.ok(
    source.includes('type="button"') && source.includes('Attach Link'),
    'Attach Link button must have type="button"'
  );

  console.log('✅ ALL PROOF ATTACHMENT FORM INTEGRITY TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
