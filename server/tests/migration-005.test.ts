// server/tests/migration-005.test.ts
import { pool } from '../src/shared/db/pool.js';

async function testMigration005() {
  const client = await pool.connect();
  try {
    // Check if new columns exist on travel_expenses
    const columnRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'travel_expenses' 
        AND column_name IN ('original_currency', 'original_amount', 'exchange_rate', 'inr_amount');
    `);
    
    if (columnRes.rowCount !== 4) {
      throw new Error(`Expected 4 new columns in travel_expenses, found ${columnRes.rowCount}`);
    }

    // Check if exchange_rates table exists
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'exchange_rates';
    `);

    if (tableRes.rowCount !== 1) {
      throw new Error('exchange_rates table does not exist');
    }

    console.log('PASS: migration-005 schema verified successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

testMigration005().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
