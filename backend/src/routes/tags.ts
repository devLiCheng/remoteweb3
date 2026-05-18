import { Hono } from 'hono';
import { query } from '../db/connection';

const tags = new Hono();

// Get all tags with job counts
tags.get('/', async (c) => {
  const type = c.req.query('type') || '';
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (type) {
    conditions.push('t.type = ?');
    params.push(type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await query(
    `SELECT t.*, COUNT(jt.job_id) as job_count
     FROM tags t
     LEFT JOIN job_tags jt ON t.id = jt.tag_id
     ${where}
     GROUP BY t.id
     ORDER BY job_count DESC, t.name ASC`,
    params
  );

  return c.json(rows);
});

export { tags as tagsRouter };
