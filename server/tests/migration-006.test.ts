// server/tests/migration-006.test.ts
import { pool } from '../src/shared/db/pool.js';

async function testMigration006() {
  const client = await pool.connect();
  try {
    // 1. Check if notifications table exists
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'notifications';
    `);

    if (tableRes.rowCount !== 1) {
      throw new Error('notifications table does not exist');
    }

    // 2. Check if all required columns exist
    const expectedColumns = [
      'id',
      'user_id',
      'actor_id',
      'request_id',
      'type',
      'title',
      'message',
      'link_url',
      'is_read',
      'created_at'
    ];

    const columnRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications';
    `);

    const existingColumns = columnRes.rows.map(r => r.column_name);
    for (const col of expectedColumns) {
      if (!existingColumns.includes(col)) {
        throw new Error(`Expected column '${col}' not found in notifications table`);
      }
    }

    // 3. Check foreign key constraints
    const fkRes = await client.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'notifications';
    `);

    const fks = fkRes.rows;
    const userFk = fks.find(f => f.column_name === 'user_id');
    if (!userFk || userFk.foreign_table_name !== 'users' || userFk.delete_rule !== 'CASCADE') {
      throw new Error(`Expected foreign key on user_id referencing users(id) with ON DELETE CASCADE`);
    }

    const actorFk = fks.find(f => f.column_name === 'actor_id');
    if (!actorFk || actorFk.foreign_table_name !== 'users' || actorFk.delete_rule !== 'SET NULL') {
      throw new Error(`Expected foreign key on actor_id referencing users(id) with ON DELETE SET NULL`);
    }

    const reqFk = fks.find(f => f.column_name === 'request_id');
    if (!reqFk || reqFk.foreign_table_name !== 'travel_requests' || reqFk.delete_rule !== 'CASCADE') {
      throw new Error(`Expected foreign key on request_id referencing travel_requests(id) with ON DELETE CASCADE`);
    }

    // 4. Check indexes
    const indexRes = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'notifications';
    `);
    const existingIndexes = indexRes.rows.map(r => r.indexname);
    if (!existingIndexes.includes('idx_notifications_user_lookup')) {
      throw new Error("Missing index 'idx_notifications_user_lookup'");
    }
    if (!existingIndexes.includes('idx_notifications_request')) {
      throw new Error("Missing index 'idx_notifications_request'");
    }

    console.log('PASS: migration-006 schema, columns, foreign keys, and indexes verified successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

testMigration006().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
