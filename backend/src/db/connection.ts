import mysql2 from 'mysql2/promise';

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

export default pool;
