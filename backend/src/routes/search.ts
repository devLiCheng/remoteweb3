import { Hono } from 'hono';
import { query } from '../db/connection';

const search = new Hono();

search.get('/', async (c) => {
  const q = c.req.query('q') || '';
  const locale = c.req.query('locale') || 'en';
  const limit = Math.min(parseInt(c.req.query('limit') || '10'), 20);

  if (!q || q.length < 2) {
    return c.json({ jobs: [], companies: [], tags: [] });
  }

  const like = `%${q}%`;

  const jobs = await query(
    `SELECT j.id, j.title, j.slug, j.location, j.is_remote, j.salary_min, j.salary_max, j.posted_date,
            c.name as company_name, c.logo_url as company_logo
     FROM jobs j JOIN companies c ON j.company_id = c.id
     WHERE j.is_active = 1 AND (j.title LIKE ? OR c.name LIKE ? OR j.location LIKE ?)
     ORDER BY j.posted_date DESC LIMIT ?`,
    [like, like, like, limit]
  );

  const companies = await query(
    `SELECT c.id, c.name, c.slug, c.logo_url, c.headquarters,
            (SELECT COUNT(*) FROM jobs WHERE company_id = c.id AND is_active = 1) as job_count
     FROM companies c WHERE c.name LIKE ? ORDER BY job_count DESC LIMIT ?`,
    [like, limit]
  );

  const tags = await query(
    'SELECT id, name, slug, type FROM tags WHERE name LIKE ? LIMIT ?',
    [like, limit]
  );

  return c.json({ jobs, companies, tags });
});

export { search as searchRouter };
