import { Hono } from 'hono';
import { query, execute } from '../db/connection';

const admin = new Hono();

// === JOBS ADMIN ===
admin.post('/jobs', async (c) => {
  const body = await c.req.json();
  const { title, company_id, location, is_remote, job_type, experience_level, salary_min, salary_max, description, requirements, source_site, tag_ids } = body;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const result = await execute(
    `INSERT INTO jobs (title, slug, company_id, location, is_remote, job_type, experience_level, salary_min, salary_max, description, requirements, source_site, posted_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [title, slug, company_id, location, is_remote ? 1 : 0, job_type, experience_level, salary_min, salary_max, description, requirements, 'manual']
  );
  if (tag_ids?.length) {
    for (const tagId of tag_ids) {
      await execute('INSERT IGNORE INTO job_tags (job_id, tag_id) VALUES (?, ?)', [result.insertId, tagId]);
    }
  }
  return c.json({ id: result.insertId });
});

admin.put('/jobs/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { title, company_id, location, is_remote, job_type, experience_level, salary_min, salary_max, description, requirements, is_active, tag_ids } = body;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  await execute(
    `UPDATE jobs SET title=?, slug=?, company_id=?, location=?, is_remote=?, job_type=?, experience_level=?, salary_min=?, salary_max=?, description=?, requirements=?, is_active=? WHERE id=?`,
    [title, slug, company_id, location, is_remote ? 1 : 0, job_type, experience_level, salary_min, salary_max, description, requirements, is_active ? 1 : 0, id]
  );
  if (tag_ids) {
    await execute('DELETE FROM job_tags WHERE job_id = ?', [id]);
    for (const tagId of tag_ids) {
      await execute('INSERT IGNORE INTO job_tags (job_id, tag_id) VALUES (?, ?)', [id, tagId]);
    }
  }
  return c.json({ success: true });
});

admin.delete('/jobs/:id', async (c) => {
  const id = c.req.param('id');
  await execute('UPDATE jobs SET is_active = 0 WHERE id = ?', [id]);
  return c.json({ success: true });
});

// === COMPANIES ADMIN ===
admin.post('/companies', async (c) => {
  const body = await c.req.json();
  const { name, website, description, industry, company_size, headquarters, founded_year, logo_url, is_verified } = body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const result = await execute(
    `INSERT INTO companies (name, slug, website, description, industry, company_size, headquarters, founded_year, logo_url, is_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, slug, website, description, industry, company_size, headquarters, founded_year, logo_url, is_verified ? 1 : 0]
  );
  return c.json({ id: result.insertId });
});

admin.put('/companies/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, website, description, industry, company_size, headquarters, founded_year, logo_url, is_verified } = body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  await execute(
    `UPDATE companies SET name=?, slug=?, website=?, description=?, industry=?, company_size=?, headquarters=?, founded_year=?, logo_url=?, is_verified=? WHERE id=?`,
    [name, slug, website, description, industry, company_size, headquarters, founded_year, logo_url, is_verified ? 1 : 0, id]
  );
  return c.json({ success: true });
});

// === TAGS ADMIN ===
admin.post('/tags', async (c) => {
  const body = await c.req.json();
  const { name, type } = body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const result = await execute('INSERT INTO tags (name, slug, type) VALUES (?, ?, ?)', [name, slug, type]);
  return c.json({ id: result.insertId });
});

admin.delete('/tags/:id', async (c) => {
  const id = c.req.param('id');
  await execute('DELETE FROM tags WHERE id = ?', [id]);
  return c.json({ success: true });
});

export { admin as adminRouter };
