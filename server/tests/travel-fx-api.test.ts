// server/tests/travel-fx-api.test.ts
import { app } from '../src/app.js';
import { pool } from '../src/shared/db/pool.js';

const PORT = 5092;

async function testFxApi() {
  const server = app.listen(PORT);
  const baseUrl = `http://localhost:${PORT}/api/travel`;

  try {
    // 1. Valid currency request
    const res = await fetch(`${baseUrl}/fx-rate?from=USD&date=2026-11-10`);
    if (!res.ok) throw new Error(`Expected 200, got ${res.status}`);
    const json: any = await res.json();
    if (!json.success || !json.data.rate) {
      throw new Error(`Invalid response structure from /api/travel/fx-rate: ${JSON.stringify(json)}`);
    }

    // 2. Invalid currency request
    const badRes = await fetch(`${baseUrl}/fx-rate?from=XYZ`);
    if (badRes.status !== 400) throw new Error(`Expected 400 for bad currency, got ${badRes.status}`);

    console.log('PASS: /api/travel/fx-rate API tests passed');
  } finally {
    server.close();
    await pool.end();
  }
}

testFxApi().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
