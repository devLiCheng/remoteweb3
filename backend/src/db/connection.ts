import mysql2 from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join } from 'path';

const pool = mysql2.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'remoteweb3',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  multipleStatements: true,
});

export async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  if (params && params.length > 0) {
    const [rows] = await pool.query(sql, params);
    return rows as T[];
  }
  const [rows] = await pool.query(sql);
  return rows as T[];
}

export async function queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

export async function execute(sql: string, params?: unknown[]): Promise<mysql2.ResultSetHeader> {
  if (params && params.length > 0) {
    const [result] = await pool.query(sql, params);
    return result as mysql2.ResultSetHeader;
  }
  const [result] = await pool.query(sql);
  return result as mysql2.ResultSetHeader;
}

async function runMigrations() {
  const dbName = process.env.DB_NAME || 'remoteweb3';

  // Wait for MySQL to be ready (retry up to 60s)
  for (let i = 0; i < 30; i++) {
    try {
      await pool.query('SELECT 1');
      break;
    } catch {
      console.log(`[DB] Waiting for MySQL... (${i + 1}/30)`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = 'jobs'",
      [dbName]
    );
    const cnt = (rows as any[])[0]?.cnt || 0;

    if (cnt === 0) {
      console.log('[DB] Tables not found, running init.sql...');
      try {
        const sql = readFileSync(join(import.meta.dir, 'init.sql'), 'utf-8');
        await pool.query(sql);
      } catch {
        // init.sql might have already run via docker-entrypoint
        console.log('[DB] Init SQL already executed or partially applied.');
      }
      console.log('[DB] Database initialized successfully.');
    } else {
      console.log('[DB] Tables already exist, skipping init.');
    }
  } catch (err: any) {
    console.error('[DB] Migration error:', err.message);
  }
}

runMigrations();

export default pool;
