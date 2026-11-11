import { pool } from './src/shared/db/pool.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log(`
Usage:
  npx tsx server/set-role.ts <email> <role> [manager_email]

Examples:
  npx tsx server/set-role.ts admin@test.com ADMIN
  npx tsx server/set-role.ts manager@test.com MANAGER
  npx tsx server/set-role.ts emp@test.com EMPLOYEE manager@test.com
    `);
    process.exit(1);
  }

  const [email, roleInput, managerEmail] = args;
  const role = roleInput.toUpperCase();

  if (!['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(role)) {
    console.error(`❌ Invalid role: "${roleInput}". Allowed roles: EMPLOYEE, MANAGER, ADMIN`);
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const userRes = await client.query('SELECT id, name, email, role FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      console.error(`❌ User with email "${email}" not found in database. Please sign up first via the UI (/signup).`);
      process.exit(1);
    }

    const user = userRes.rows[0];
    let managerId: string | null = null;

    if (managerEmail) {
      const mgrRes = await client.query('SELECT id, name, role FROM users WHERE email = $1', [managerEmail]);
      if (mgrRes.rows.length === 0) {
        console.error(`❌ Manager with email "${managerEmail}" not found in database.`);
        process.exit(1);
      }
      managerId = mgrRes.rows[0].id;
    }

    if (managerId !== null) {
      await client.query('UPDATE users SET role = $1, manager_id = $2 WHERE id = $3', [role, managerId, user.id]);
      console.log(`✅ Successfully updated ${email}: Role = ${role}, Reports to = ${managerEmail}`);
    } else {
      await client.query('UPDATE users SET role = $1 WHERE id = $2', [role, user.id]);
      console.log(`✅ Successfully updated ${email}: Role = ${role}`);
    }

  } catch (err) {
    console.error('❌ Error updating user role:', err);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

main();
