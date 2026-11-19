import { pool } from './src/shared/db/pool.js';

async function resetDatabase() {
  console.log('🧹 Clearing all data from the database...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Truncate all business data tables
    await client.query(`
      TRUNCATE TABLE 
        request_timeline_events, 
        travel_expenses, 
        travel_requests, 
        users 
      CASCADE;
    `);

    // Reset department budgets and initialize default corporate budget with ₹0 utilized
    await client.query('TRUNCATE TABLE department_budgets CASCADE;');
    await client.query(`
      INSERT INTO department_budgets (department, fiscal_year, fiscal_quarter, total_allocation, utilized_amount)
      VALUES ('Engineering', 2026, 'Q4', 3500000.00, 0.00);
    `);

    await client.query('COMMIT');
    console.log('✅ Database data successfully cleared and initialized with clean Engineering budget!');

    // Verify row counts
    const tables = ['users', 'travel_requests', 'travel_expenses', 'request_timeline_events', 'department_budgets'];
    console.log('\n📊 Current Database Row Counts:');
    for (const t of tables) {
      const res = await client.query(`SELECT count(*) FROM "${t}"`);
      console.log(`  - ${t.padEnd(25)}: ${res.rows[0].count} rows`);
    }

    const budgetRes = await client.query(`SELECT * FROM department_budgets`);
    console.log('\n💼 Department Budget:');
    for (const b of budgetRes.rows) {
      console.log(`  - ${b.department} (${b.fiscal_year} ${b.fiscal_quarter}): Total Allocation ₹${b.total_allocation}, Utilized ₹${b.utilized_amount}`);
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to reset database:', err);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

resetDatabase();
