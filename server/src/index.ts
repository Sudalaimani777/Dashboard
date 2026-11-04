import { app } from './app.js';
import { config } from './config/env.js';
import { runMigrations } from './shared/db/migrate.js';
import { pool } from './shared/db/pool.js';

async function bootstrap() {
  try {
    // Verify database connection
    const client = await pool.connect();
    console.log('PostgreSQL database connection established successfully.');
    client.release();

    // Run migrations
    await runMigrations();

    // Start server
    app.listen(config.port, () => {
      console.log(`Server listening on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', (err as Error).message);
    process.exit(1);
  }
}

bootstrap();
