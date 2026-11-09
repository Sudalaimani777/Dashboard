// server/tests/db-migration.test.ts
import { pool } from '../src/shared/db/pool.js';
import { runMigrations } from '../src/shared/db/migrate.js';

async function testMigration() {
  console.log('Testing travel governance migration...');
  await runMigrations();

  // 1. Verify all 4 required travel governance tables exist
  const tablesRes = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('travel_requests', 'travel_expenses', 'department_budgets', 'request_timeline_events');
  `);

  const foundTables = tablesRes.rows.map(r => r.table_name);
  console.log('Found tables:', foundTables);

  const expectedTables = ['travel_requests', 'travel_expenses', 'department_budgets', 'request_timeline_events'];
  for (const table of expectedTables) {
    if (!foundTables.includes(table)) {
      throw new Error(`Expected table '${table}' was not found in database.`);
    }
  }

  // 2. Check travel_requests.currency default is INR
  const colRes = await pool.query(`
    SELECT column_default FROM information_schema.columns 
    WHERE table_name = 'travel_requests' AND column_name = 'currency';
  `);
  
  if (!colRes.rows[0] || !colRes.rows[0].column_default.includes('INR')) {
    throw new Error(`Expected currency default 'INR', got ${colRes.rows[0]?.column_default}`);
  }
  console.log('✓ Currency column defaults to INR');

  // 3. Verify users table has role and manager_id columns
  const userColsRes = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name IN ('role', 'manager_id', 'department');
  `);
  const foundUserCols = userColsRes.rows.map(r => r.column_name);
  console.log('Found users columns:', foundUserCols);
  if (!foundUserCols.includes('role') || !foundUserCols.includes('manager_id') || !foundUserCols.includes('department')) {
    throw new Error(`Expected users to have 'role', 'manager_id', and 'department' columns.`);
  }
  console.log('✓ Users table columns verified');

  // 4. Verify travel_expenses foreign key cascade
  const fkRes = await pool.query(`
    SELECT confdeltype FROM pg_constraint 
    WHERE conname LIKE '%travel_expenses_travel_request_id%' 
       OR conrelid = 'travel_expenses'::regclass AND contype = 'f';
  `);
  console.log('Found foreign keys on travel_expenses:', fkRes.rowCount);
  if (fkRes.rowCount === 0) {
    throw new Error('Expected foreign key on travel_expenses referencing travel_requests');
  }

  console.log('✓ Migration test passed successfully!');
  await pool.end();
}

testMigration().catch(async (err) => {
  console.error('Migration test failed:', err);
  await pool.end();
  process.exit(1);
});
