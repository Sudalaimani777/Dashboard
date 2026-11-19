import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Auditing entire codebase for residual legacy brown hex values...');

  const srcDir = path.resolve(import.meta.dirname, '../src');
  const bannedHexCodes = [
    '#8A582B',
    '#754820',
    '#996735',
    '#D4A373',
    '#E8DFD3',
    '#2B231D',
    '#F7F4EE',
  ];

  function scanDirectory(dir: string): string[] {
    const violations: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        violations.push(...scanDirectory(fullPath));
      } else if (/\.(tsx?|css)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const hex of bannedHexCodes) {
          if (content.toUpperCase().includes(hex.toUpperCase())) {
            violations.push(`${path.relative(srcDir, fullPath)} contains ${hex}`);
          }
        }
      }
    }
    return violations;
  }

  const violations = scanDirectory(srcDir);
  assert.equal(
    violations.length,
    0,
    `Found residual legacy brown hex codes in src:\n${violations.join('\n')}`
  );

  console.log('✅ ALL RESIDUAL AUDIT CHECKS PASSED: ZERO LEGACY BROWN TOKENS IN SRC!');
}

run().catch((err) => {
  console.error('❌ Residual audit failed:', err);
  process.exit(1);
});
