import { Hono } from 'hono';
import { query, queryOne } from '../db/connection';

const companies = new Hono();

companies.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  const search = c.req.query('q') || '';

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (search) {
    conditions.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT c.*, (SELECT COUNT(*) FROM jobs WHERE company_id = c.id AND is_active = 1) as job_count FROM companies c ${where} ORDER BY job_count DESC LIMIT ? OFFSET ?`;
  const rows = await query(sql, [...params, limit, offset]);

  const [countResult] = await query<{ total: number }>(
    `SELECT COUNT(*) as total FROM companies ${where}`,
    params
  ) as [{ total: number }];

  return c.json({
    data: rows,
    pagination: { page, limit, total: countResult?.total || 0 },
  });
});

companies.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const company = await queryOne(
    `SELECT c.*, (SELECT COUNT(*) FROM jobs WHERE company_id = c.id AND is_active = 1) as job_count FROM companies c WHERE c.slug = ?`,
    [slug]
  );
  if (!company) return c.json({ error: 'Company not found' }, 404);

  const jobs = await query(
    'SELECT id, title, slug, location, is_remote, salary_min, salary_max, salary_currency, job_type, experience_level, posted_date FROM jobs WHERE company_id = ? AND is_active = 1 ORDER BY posted_date DESC LIMIT 20',
    [(company as any).id]
  );

  return c.json({ ...company, jobs });
});

export { companies as companiesRouter };
