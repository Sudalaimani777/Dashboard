import pg from 'pg';
import { config } from '../../config/env.js';

// PostgreSQL DATE parser (OID 1082): return as raw string 'YYYY-MM-DD'
// rather than JavaScript Date object, to avoid timezone shifts when converted to ISO strings
pg.types.setTypeParser(1082, (val: string) => val);

const { Pool } = pg;

export const pool = new Pool(
  config.databaseUrl
    ? { connectionString: config.databaseUrl }
    : {
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
      }
);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);
