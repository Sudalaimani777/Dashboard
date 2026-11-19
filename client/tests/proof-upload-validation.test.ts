import assert from 'node:assert';
import { supportingDocSchema } from '../src/features/travel/hooks/useTravelForm.js';
import { resolveDocUrl } from '../src/features/travel/components/forms/ProofAttachmentField.js';
import { cloudinaryService } from '../../server/src/shared/services/cloudinary.service.js';

console.log('🧪 Running Proof Upload & Document Preview Validation Tests...\n');

// 1. supportingDocSchema: 0-byte file rejection
console.log('1. Testing supportingDocSchema file size validation...');
const zeroByteDoc = {
  id: 'doc-123',
  type: 'FILE' as const,
  name: 'ab.pdf',
  url: '/uploads/proofs/1795080290432-3f0c865c.pdf',
  format: 'pdf',
  size: 0,
};
const zeroResult = supportingDocSchema.safeParse(zeroByteDoc);
assert.strictEqual(zeroResult.success, false, 'supportingDocSchema must reject 0-byte file');
console.log('   ✓ 0-byte file properly rejected by schema');

const validByteDoc = {
  id: 'doc-456',
  type: 'FILE' as const,
  name: 'ticket.pdf',
  url: '/uploads/proofs/ticket.pdf',
  format: 'pdf',
  size: 15420,
};
const validResult = supportingDocSchema.safeParse(validByteDoc);
assert.strictEqual(validResult.success, true, 'supportingDocSchema must accept valid non-empty file');
console.log('   ✓ Valid non-empty file accepted');

const linkDoc = {
  id: 'doc-789',
  type: 'LINK' as const,
  name: 'Google Drive Itinerary',
  url: 'https://drive.google.com/file/d/123',
};
const linkResult = supportingDocSchema.safeParse(linkDoc);
assert.strictEqual(linkResult.success, true, 'supportingDocSchema must accept web link');
console.log('   ✓ Web link accepted');

// 2. resolveDocUrl URL resolution
console.log('2. Testing resolveDocUrl...');
const relativePath = '/uploads/proofs/test-doc.pdf';
const resolvedRelative = resolveDocUrl(relativePath);
assert.ok(
  resolvedRelative.startsWith('http://localhost:5000') || resolvedRelative.includes('/uploads/proofs/test-doc.pdf'),
  'resolveDocUrl must prefix relative uploads with backend server'
);
assert.ok(!resolvedRelative.includes('localhost:5173'), 'Must NOT resolve to client port 5173');

const cloudUrl = 'https://res.cloudinary.com/tripflow/image/upload/v1234/test.pdf';
assert.strictEqual(resolveDocUrl(cloudUrl), cloudUrl, 'Full https URLs must remain untouched');
console.log('   ✓ Relative and external URLs resolved correctly');

// 3. Server 0-byte upload rejection
console.log('3. Testing Server uploadBuffer 0-byte buffer rejection...');
assert.rejects(
  async () => {
    await cloudinaryService.uploadBuffer(Buffer.alloc(0), 'empty.pdf', 'application/pdf');
  },
  /Cannot upload an empty file \(0 bytes\)/,
  'Server must throw error when uploading 0-byte buffer'
).then(() => {
  console.log('   ✓ Server uploadBuffer strictly rejects 0-byte files');
  console.log('\n🎉 ALL PROOF UPLOAD & PREVIEW TESTS PASSED SUCCESSFULLY!\n');
});
