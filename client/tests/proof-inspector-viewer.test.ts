import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing ProofInspectorViewer collapsible on-demand preview...');

  const clientSrc = path.resolve(import.meta.dirname, '../src');
  const componentPath = path.join(
    clientSrc,
    'features/travel/components/audit/ProofInspectorViewer.tsx'
  );

  assert.ok(fs.existsSync(componentPath), 'ProofInspectorViewer.tsx must exist');
  const source = fs.readFileSync(componentPath, 'utf8');

  // 1. Must maintain state for showing preview, defaulted to false
  assert.ok(
    /const\s*\[\s*showPreview\s*,\s*setShowPreview\s*\]\s*=\s*useState(<boolean>)?\(\s*false\s*\)/.test(source),
    'ProofInspectorViewer must maintain showPreview state initialized to false'
  );

  // 2. Must feature a Preview toggle button with Eye / EyeOff icons
  assert.ok(
    source.includes('Eye') && source.includes('EyeOff'),
    'ProofInspectorViewer must import and use Eye and EyeOff icons'
  );

  // 3. Must have a toggle button with accessible aria-expanded and Preview label
  assert.ok(
    source.includes('aria-expanded={showPreview}'),
    'Preview button must have dynamic aria-expanded attribute'
  );
  assert.ok(
    source.includes('Hide Preview') && source.includes('Preview'),
    'Preview button must toggle text between "Preview" and "Hide Preview"'
  );

  // 4. Preview container must only render when showPreview is true
  assert.ok(
    source.includes('showPreview ?') || source.includes('{showPreview &&'),
    'Preview container must be conditionally rendered based on showPreview'
  );

  // 5. Switching document tabs must reset showPreview to false
  assert.ok(
    source.includes('setShowPreview(false)'),
    'Selecting a new document must reset showPreview to false'
  );

  // 6. Smooth Animation: Must use AnimatePresence and motion.div from motion/react
  assert.ok(
    source.includes("from 'motion/react'") &&
      source.includes('AnimatePresence') &&
      source.includes('motion'),
    'ProofInspectorViewer must import AnimatePresence and motion from motion/react'
  );

  assert.ok(
    source.includes('<AnimatePresence') && source.includes('<motion.div'),
    'Preview container must be wrapped in AnimatePresence and motion.div for smooth height/opacity animation'
  );

  assert.ok(
    source.includes('useReducedMotion'),
    'ProofInspectorViewer must respect user motion preferences via useReducedMotion'
  );

  // 7. Download Button: Must import Download icon and provide a download action
  assert.ok(
    source.includes('Download') && source.includes('handleDownload'),
    'ProofInspectorViewer must import Download icon and provide a handleDownload action'
  );

  assert.ok(
    source.includes('Download') && source.includes('onClick={handleDownload}'),
    'A Download button must trigger handleDownload when clicked'
  );

  console.log('✅ ALL PROOF INSPECTOR VIEWER TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
