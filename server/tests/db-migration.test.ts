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

  // 5. Verify users table has reporting_admin_id column (Migration 007)
  const reportingAdminColRes = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'reporting_admin_id';
  `);
  if (reportingAdminColRes.rowCount === 0) {
    throw new Error("Expected users table to have 'reporting_admin_id' column (Migration 007).");
  }
  const raCol = reportingAdminColRes.rows[0];
  if (raCol.data_type !== 'uuid') {
    throw new Error(`Expected reporting_admin_id to be UUID, got '${raCol.data_type}'.`);
  }
  if (raCol.is_nullable !== 'YES') {
    throw new Error("Expected reporting_admin_id to be nullable (optional supervisor assignment).");
  }
  console.log('✓ Users table reporting_admin_id column verified (UUID, nullable)');

  // 6. Verify reporting_admin_id foreign key references users(id)
  const raFkRes = await pool.query(`
    SELECT tc.constraint_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'users'
      AND kcu.column_name = 'reporting_admin_id';
  `);
  if (raFkRes.rowCount === 0) {
    throw new Error("Expected reporting_admin_id to have a foreign key referencing users(id).");
  }
  const raFk = raFkRes.rows[0];
  if (raFk.referenced_table !== 'users' || raFk.referenced_column !== 'id') {
    throw new Error(`Expected reporting_admin_id FK to reference users(id), got ${raFk.referenced_table}(${raFk.referenced_column}).`);
  }
  console.log('✓ Users reporting_admin_id foreign key verified (references users.id)');

  // 7. Verify index on reporting_admin_id exists
  const raIdxRes = await pool.query(`
    SELECT indexname FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'idx_users_reporting_admin';
  `);
  if (raIdxRes.rowCount === 0) {
    throw new Error("Expected index 'idx_users_reporting_admin' on users.reporting_admin_id.");
  }
  console.log('✓ Users reporting_admin_id index verified');

  console.log('✓ Migration test passed successfully!');
  await pool.end();
}

testMigration().catch(async (err) => {
  console.error('Migration test failed:', err);
  await pool.end();
  process.exit(1);
});
