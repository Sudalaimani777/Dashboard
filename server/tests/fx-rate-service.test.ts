// server/tests/fx-rate-service.test.ts
import { ExchangeRateService } from '../src/shared/services/exchangeRate.service.js';
import { pool } from '../src/shared/db/pool.js';

async function testFxRateService() {
  try {
    // 1. INR to INR should return 1.0 immediately without DB or network call
    const inrRes = await ExchangeRateService.getRate('INR', '2026-11-10');
    if (inrRes.rate !== 1.0) throw new Error(`Expected INR rate 1.0, got ${inrRes.rate}`);

    // 2. Fetch USD to INR for a known date
    const usdRes = await ExchangeRateService.getRate('USD', '2026-11-10');
    if (usdRes.rate <= 50 || usdRes.rate >= 120) {
      throw new Error(`Unexpected USD rate: ${usdRes.rate}`);
    }

    // 3. Subsequent call should hit DB_CACHE
    const cachedRes = await ExchangeRateService.getRate('USD', '2026-11-10');
    if (cachedRes.source !== 'DB_CACHE') {
      throw new Error(`Expected DB_CACHE source, got ${cachedRes.source}`);
    }

    // 4. Invalid currency should throw
    let threw = false;
    try {
      await ExchangeRateService.getRate('INVALID_CURRENCY');
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('Expected invalid currency to throw');

    console.log('PASS: ExchangeRateService tests passed');
  } finally {
    await pool.end();
  }
}

testFxRateService().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
