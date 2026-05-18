import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { etag } from 'hono/etag';
import { compress } from 'hono/compress';
import { jobsRouter } from './routes/jobs';
import { companiesRouter } from './routes/companies';
import { searchRouter } from './routes/search';
import { tagsRouter } from './routes/tags';
import { seoRouter } from './routes/seo';

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:5173', 'https://remoteweb3.com', 'https://www.remoteweb3.com'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Accept-Language'],
  maxAge: 86400,
}));
app.use('*', etag());
app.use('*', compress());
app.use('*', logger());

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// API routes
app.route('/api/jobs', jobsRouter);
app.route('/api/companies', companiesRouter);
app.route('/api/search', searchRouter);
app.route('/api/tags', tagsRouter);
app.route('/api/seo', seoRouter);

// 404
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default {
  port: parseInt(process.env.PORT || '3000'),
  fetch: app.fetch,
};
