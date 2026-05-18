import { Hono } from 'hono';
import { query, queryOne, execute } from '../db/connection';

const jobs = new Hono();

// GET /api/jobs - List jobs with pagination and filters
jobs.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  const search = c.req.query('q') || '';
  const location = c.req.query('location') || '';
  const remote = c.req.query('remote');
  const type = c.req.query('type') || '';
  const level = c.req.query('level') || '';
  const salaryMin = parseInt(c.req.query('salary_min') || '0');
  const tag = c.req.query('tag') || '';
  const source = c.req.query('source') || '';
  const sort = c.req.query('sort') || 'posted_date';
  const order = c.req.query('order') === 'asc' ? 'ASC' : 'DESC';

  const conditions: string[] = ['j.is_active = 1'];
  const params: unknown[] = [];

  if (search) {
    conditions.push('(j.title LIKE ? OR j.description LIKE ? OR c.name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (location) {
    conditions.push('(j.city LIKE ? OR j.country LIKE ?)');
    params.push(`%${location}%`, `%${location}%`);
  }
  if (remote === '1') {
    conditions.push('j.is_remote = 1');
  }
  if (type) {
    conditions.push('j.job_type = ?');
    params.push(type);
  }
  if (level) {
    conditions.push('j.experience_level = ?');
    params.push(level);
  }
  if (salaryMin > 0) {
    conditions.push('j.salary_max >= ?');
    params.push(salaryMin);
  }
  if (tag) {
    conditions.push('j.id IN (SELECT job_id FROM job_tags jt JOIN tags t ON jt.tag_id = t.id WHERE t.slug = ?)');
    params.push(tag);
  }
  if (source) {
    conditions.push('j.source_site = ?');
    params.push(source);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortMap: Record<string, string> = {
    posted_date: 'j.posted_date',
    salary: 'j.salary_max',
    title: 'j.title',
  };
  const orderBy = sortMap[sort] || 'j.posted_date';

  const countSql = `SELECT COUNT(*) as total FROM jobs j JOIN companies c ON j.company_id = c.id ${where}`;
  const [countResult] = await query<{ total: number }>(countSql, params) as [{ total: number }];
  const total = countResult?.total || 0;

  const dataSql = `
    SELECT j.*, c.name as company_name, c.logo_url as company_logo, c.slug as company_slug,
           GROUP_CONCAT(DISTINCT t.name SEPARATOR ',') as tag_names
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    LEFT JOIN job_tags jt ON j.id = jt.job_id
    LEFT JOIN tags t ON jt.tag_id = t.id
    ${where}
    GROUP BY j.id
    ORDER BY ${orderBy} ${order}, j.id DESC
    LIMIT ? OFFSET ?
  `;
  const rows = await query(dataSql, [...params, limit, offset]);

  return c.json({
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/jobs/:id - Get single job with details
jobs.get('/:id', async (c) => {
  const id = c.req.param('id');
  const job = await queryOne(`
    SELECT j.*, c.name as company_name, c.logo_url as company_logo, c.slug as company_slug,
           c.description as company_description, c.website as company_website,
           c.headquarters as company_headquarters, c.company_size
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE j.id = ?
  `, [id]);

  if (!job) return c.json({ error: 'Job not found' }, 404);

  const tags = await query<{ name: string; slug: string; type: string }>(
    'SELECT t.name, t.slug, t.type FROM tags t JOIN job_tags jt ON t.id = jt.tag_id WHERE jt.job_id = ?',
    [id]
  );

  return c.json({ ...job, tags });
});

// GET /api/jobs/stats/overview - Get job statistics
jobs.get('/stats/overview', async (c) => {
  const [totalJobs] = await query<{ cnt: number }>('SELECT COUNT(*) as cnt FROM jobs WHERE is_active = 1');
  const [totalCompanies] = await query<{ cnt: number }>('SELECT COUNT(*) as cnt FROM companies');
  const [remoteJobs] = await query<{ cnt: number }>('SELECT COUNT(*) as cnt FROM jobs WHERE is_remote = 1 AND is_active = 1');
  const topTags = await query('SELECT t.name, t.slug, COUNT(*) as cnt FROM tags t JOIN job_tags jt ON t.id = jt.tag_id GROUP BY t.id ORDER BY cnt DESC LIMIT 15');
  const byType = await query('SELECT job_type as name, COUNT(*) as cnt FROM jobs WHERE is_active = 1 GROUP BY job_type');
  const byLevel = await query('SELECT experience_level as name, COUNT(*) as cnt FROM jobs WHERE is_active = 1 AND experience_level IS NOT NULL GROUP BY experience_level');
  const recentJobs = await query<{ posted_date: string; cnt: number }>(
    "SELECT DATE(posted_date) as posted_date, COUNT(*) as cnt FROM jobs WHERE is_active = 1 AND posted_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(posted_date) ORDER BY posted_date"
  );

  return c.json({
    totalJobs: totalJobs?.cnt || 0,
    totalCompanies: totalCompanies?.cnt || 0,
    remoteJobs: remoteJobs?.cnt || 0,
    topTags,
    byType,
    byLevel,
    recentJobs,
  });
});

export { jobs as jobsRouter };
