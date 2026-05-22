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
import { adminRouter } from './routes/admin';

const app = new Hono();

app.use('*', cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3001',
    'https://remoteweb3.com',
    'https://www.remoteweb3.com',
    'https://admin.remoteweb3.com',
    'https://spider.remoteweb3.com',
    'https://api.remoteweb3.com',
  ],
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
app.route('/api/admin', adminRouter);

// 404
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error', message: err.message, stack: err.stack }, 500);
});

export default {
  port: parseInt(process.env.PORT || '3000'),
  fetch: app.fetch,
};
