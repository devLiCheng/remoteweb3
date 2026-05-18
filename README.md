# RemoteWeb3

> 🌐 Web3 Remote Jobs Platform - Find the best blockchain, crypto, and Web3 remote jobs worldwide.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 6 |
| 3D Graphics | Three.js + React Three Fiber + Drei |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Backend | Bun + Hono 4 |
| Database | MySQL 8 |
| i18n | react-i18next (EN/ZH) |
| SEO | Schema.org + Open Graph + Meta tags |

## Features

- 🎨 **Futuristic 3D Homepage** - Immersive Web3-themed design with Three.js particle effects
- 🌍 **Internationalization** - Full English & Chinese support
- 🔍 **Advanced Search** - Filter by skills, location, salary, job type, experience level
- 🏢 **Company Profiles** - Detailed company pages with open positions
- 📊 **Job Statistics** - Real-time stats dashboard
- ⚡ **Blazing Fast** - Sub-second page loads with code splitting
- 📱 **Responsive** - Mobile-first design
- 🔒 **SEO Optimized** - Schema.org structured data, Open Graph, meta tags

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.3
- [MySQL](https://www.mysql.com) 8.0+
- [Node.js](https://nodejs.org) 22+ (optional)

### Database Setup

```bash
mysql -u root -p < backend/src/db/init.sql
```

### Backend

```bash
cd backend
cp .env.example .env  # Edit DB credentials
bun install
bun run dev
# API running at http://localhost:3000
```

### Frontend

```bash
cd frontend
bun install
bun run dev
# Dev server at http://localhost:5173
```

### Both Together

```bash
bun run dev
```

## Deployment

One-click deployment to Ubuntu server:

```bash
chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh
```

The script handles:
- System updates & dependencies (Bun, Node, Nginx, MySQL)
- Database setup & initialization
- Backend deployment with PM2 process manager
- Frontend build & static serving via Nginx
- SSL certificate via Let's Encrypt
- Security headers & Gzip compression

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/jobs` | List jobs (paginated, filterable) |
| `GET /api/jobs/:id` | Job detail with tags |
| `GET /api/jobs/stats/overview` | Job statistics |
| `GET /api/companies` | List companies |
| `GET /api/companies/:slug` | Company detail with jobs |
| `GET /api/search?q=` | Quick search |
| `GET /api/tags` | List all tags with counts |
| `GET /api/seo?path=` | SEO metadata |

## Data Sources

Job data is aggregated from multiple Web3 job boards:
- web3.career
- cryptojobslist.com
- cryptocurrencyjobs.co
- remote3.co
- wellfound.com
- And more...

Data scraping is powered by Playwright MCP integration.

## Project Structure

```
remoteweb3/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.ts    # MySQL connection pool
│   │   │   └── init.sql         # Database schema & seed data
│   │   ├── routes/
│   │   │   ├── jobs.ts          # Job endpoints
│   │   │   ├── companies.ts     # Company endpoints
│   │   │   ├── search.ts        # Search endpoint
│   │   │   ├── tags.ts          # Tags endpoint
│   │   │   └── seo.ts           # SEO metadata endpoint
│   │   └── index.ts             # Hono server entry
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ThreeBackground.tsx  # 3D Three.js scene
│   │   │   ├── ParticleField.tsx    # CSS fallback particles
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── JobCard.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── StatsCounter.tsx
│   │   │   └── LoadingScreen.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── JobsPage.tsx
│   │   │   ├── JobDetailPage.tsx
│   │   │   ├── CompaniesPage.tsx
│   │   │   └── CompanyDetailPage.tsx
│   │   ├── i18n/
│   │   │   └── index.ts
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── deploy/
│   └── deploy.sh
├── package.json
└── README.md
```

## License

MIT

---

Built with ❤️ for the Web3 community.
