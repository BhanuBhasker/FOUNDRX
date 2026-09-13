/**
 * Applies database/schema.sql, views.sql, procedures.sql, triggers.sql
 * and seed.sql, in order, against the MySQL server described by .env.
 *
 * Usage: npm run db:setup   (run from the server/ workspace, or the repo
 * root script `npm run db:setup` which delegates here)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.resolve(__dirname, '../../../database');

const FILES = ['schema.sql', 'views.sql', 'procedures.sql', 'triggers.sql', 'seed.sql'];

/**
 * `DELIMITER $$` is a mysql-CLI-only directive that tells the interactive
 * client where a routine's body ends; it is not part of MySQL's wire
 * protocol. Sent over `mysql2`'s multi-statement query, the server parses
 * CREATE PROCEDURE/FUNCTION/TRIGGER bodies correctly on its own, so we
 * just strip the DELIMITER lines and turn our `$$` terminators back into
 * ordinary semicolons.
 */
function preprocessDelimiters(sql) {
  return sql
    .split('\n')
    .filter((line) => !/^\s*DELIMITER\b/i.test(line))
    .join('\n')
    .replace(/\$\$/g, ';');
}

async function run() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });

  for (const file of FILES) {
    const filePath = path.join(databaseDir, file);
    const sql = preprocessDelimiters(fs.readFileSync(filePath, 'utf8'));
    console.log(`→ Applying ${file} ...`);
    await connection.query(sql);
  }

  console.log('✔ Database setup complete.');
  await connection.end();
}

run().catch((err) => {
  console.error('✘ Database setup failed:', err.message);
  process.exit(1);
});
