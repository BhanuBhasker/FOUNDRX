import { app } from './app.js';
import { env } from './config/env.js';
import { checkDatabaseConnection } from './config/db.js';

async function start() {
  try {
    await checkDatabaseConnection();
    console.log('✔ Connected to MySQL database:', env.db.database);
  } catch (error) {
    console.error('✘ Could not connect to MySQL. Did you run `npm run db:setup`?');
    console.error(error.message);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`🚀 FOUNDRX API listening on http://localhost:${env.port}`);
  });
}

start();
