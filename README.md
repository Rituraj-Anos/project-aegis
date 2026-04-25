<p align="center">
  <img src="https://img.shields.io/badge/AEGIS-Shadow_Budget_Coach-00FF87?style=for-the-badge&labelColor=0A0F0D" alt="Project Aegis" />
</p>

<h1 align="center">Project Aegis</h1>
<p align="center"><strong>Real-Time Shadow Budget Coach for Impulse Spenders</strong></p>
<p align="center"><em>Built by Team 404 Not Found</em></p>

<p align="center">
  <a href="https://github.com/Rituraj-Anos/project-aegis/actions/workflows/ci.yml"><img src="https://github.com/Rituraj-Anos/project-aegis/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/node-20-green?logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
</p>

---

## About

**Project Aegis** is a full-stack personal finance platform that acts as a real-time "shadow budget coach" for impulse spenders. It monitors your spending in real time and proactively intervenes *before* you overspend — not after.

At its core is an AI-powered coach (Groq LLaMA 3.3 70B) that adapts its communication style based on your spending patterns. Gentle encouragement when you're doing well, firm intervention when you slip, and brutally honest feedback when you need a wake-up call. Every intercepted impulse purchase is projected forward to show you what that money *could have become* through SIP or FD investments over 10+ years.

---

## Features

### 🔐 Authentication & Security
- JWT access tokens with **refresh token rotation**
- **Google OAuth2** social login
- Password hashing with bcrypt (12 salt rounds)
- Redis-backed **rate limiting** and **brute force protection**
- Request **idempotency keys** to prevent duplicate operations
- XSS sanitization and NoSQL injection prevention
- Helmet, CORS, and security headers

### 💰 Financial Management
- Multi-account support (checking, savings, credit card, cash, investment, loan)
- Transaction tracking (income, expense, transfer) with **atomic balance updates**
- Budget management with **real-time spend tracking**
- Category-based spending limits with threshold alerts
- Shadow SIP/FD projection for every intercepted transaction

### 🤖 AI Coach
- Powered by **Groq API** (llama-3.3-70b-versatile)
- 3 adaptive personality modes: Gentle · Firm · Blunt
- Context-aware coaching based on spending history and patterns
- Automatic coach state escalation based on behavior
- Shadow budget insights with compounding projections

### 📊 Analytics & Reports
- Cash flow analysis (income vs. expenses over time)
- Category-wise spending breakdown
- Net worth history tracking
- Savings rate calculations
- **PDF and CSV report generation**
- File attachments with receipt OCR support

### 🔔 Notifications
- Push notifications via web push
- **Cron-based budget alerts** (daily digest, threshold warnings)
- Real-time alert delivery for intercepted transactions

### 🏗️ Infrastructure
- Fully **Dockerized** with docker-compose orchestration
- **Redis 7** caching layer for hot data
- **Nginx** reverse proxy with SSL termination
- **GitHub Actions** CI/CD pipeline
- Centralized structured logging
- Health check endpoint with dependency status

---

## Tech Stack

| Category       | Technology                          | Version |
|----------------|-------------------------------------|---------|
| **Runtime**    | Node.js                             | 20 LTS  |
| **Framework**  | Express                             | 5.x     |
| **Language**   | TypeScript (strict mode)            | 5.x     |
| **Database**   | MongoDB                             | 7.x     |
| **ODM**        | Mongoose                            | 9.x     |
| **Validation** | Zod                                 | 4.x     |
| **Cache**      | Redis                               | 7.x     |
| **AI**         | Groq API (llama-3.3-70b-versatile)  | —       |
| **Auth**       | JWT + Refresh Tokens + Google OAuth  | —       |
| **Storage**    | Local / AWS S3 / Cloudflare R2      | —       |
| **Testing**    | Jest (unit + integration)           | 29.x    |
| **DevOps**     | Docker, docker-compose, GitHub Actions | —    |
| **Proxy**      | Nginx                               | 1.25    |
| **Frontend**   | React + Vite + Framer Motion + Recharts | 19.x |

---

## Getting Started

### Prerequisites

| Requirement         | Version   | Notes                                     |
|---------------------|-----------|-------------------------------------------|
| Docker Desktop      | ≥ 24.0    | Required for containerized setup          |
| Node.js             | 20 LTS    | Only needed for local development         |
| Groq API Key        | —         | Free at [console.groq.com](https://console.groq.com) |

### Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/Rituraj-Anos/project-aegis.git
cd project-aegis

# 2. Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# 3. Fill in your environment variables (see table below)
#    At minimum, set GROQ_API_KEY in backend/.env

# 4. Build and start all services
docker compose up --build

# 5. Verify the server is running
curl http://localhost:5000/health
```

The API will be live at `http://localhost:5000/api/v1`.

### Local Development (No Docker)

```bash
# Backend
cd backend
npm install
cp .env.example .env    # fill in values
npm run dev             # starts on :5000

# Frontend
cd frontend
npm install
cp .env.example .env    # set VITE_API_BASE_URL=http://localhost:5000
npm run dev             # starts on :5173
```

### Environment Variables

#### Root `.env`

| Variable              | Description                       | Example                    |
|-----------------------|-----------------------------------|----------------------------|
| `MONGO_URI`           | MongoDB connection string         | `mongodb://mongo:27017/aegis` |
| `REDIS_URL`           | Redis connection string           | `redis://redis:6379`       |
| `NODE_ENV`            | Environment                       | `development`              |

#### Backend `backend/.env`

| Variable                | Description                        | Example                              |
|-------------------------|------------------------------------|--------------------------------------|
| `PORT`                  | Server port                        | `5000`                               |
| `MONGO_URI`             | MongoDB connection string          | `mongodb://localhost:27017/aegis`     |
| `REDIS_URL`             | Redis connection string            | `redis://localhost:6379`             |
| `JWT_SECRET`            | Access token signing secret        | `your-jwt-secret-min-32-chars`       |
| `JWT_REFRESH_SECRET`    | Refresh token signing secret       | `your-refresh-secret-min-32-chars`   |
| `JWT_EXPIRES_IN`        | Access token TTL                   | `15m`                                |
| `JWT_REFRESH_EXPIRES_IN`| Refresh token TTL                  | `7d`                                 |
| `GROQ_API_KEY`          | Groq API key for AI coach          | `gsk_...`                            |
| `GOOGLE_CLIENT_ID`      | Google OAuth client ID             | `xxxx.apps.googleusercontent.com`    |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth client secret         | `GOCSPX-...`                         |
| `GOOGLE_CALLBACK_URL`   | OAuth callback URL                 | `http://localhost:5000/api/v1/auth/google/callback` |
| `STORAGE_PROVIDER`      | File storage backend               | `local` / `s3` / `r2`               |
| `S3_BUCKET`             | S3/R2 bucket name (if applicable)  | `aegis-uploads`                      |
| `CORS_ORIGIN`           | Allowed CORS origin                | `http://localhost:5173`              |

---

## API Reference

Base URL: `http://localhost:5000/api/v1`

### Auth

| Method | Endpoint                     | Auth | Description                          |
|--------|------------------------------|------|--------------------------------------|
| POST   | `/auth/register`             | ✗    | Register a new user                  |
| POST   | `/auth/login`                | ✗    | Login with email and password        |
| POST   | `/auth/refresh`              | ✗    | Refresh access token                 |
| POST   | `/auth/logout`               | ✓    | Logout and revoke refresh token      |
| GET    | `/auth/google`               | ✗    | Initiate Google OAuth2 flow          |
| GET    | `/auth/google/callback`      | ✗    | Google OAuth2 callback               |

### Accounts

| Method | Endpoint                     | Auth | Description                          |
|--------|------------------------------|------|--------------------------------------|
| GET    | `/accounts`                  | ✓    | List all user accounts               |
| POST   | `/accounts`                  | ✓    | Create a new account                 |
| GET    | `/accounts/:id`              | ✓    | Get account details                  |
| PATCH  | `/accounts/:id`              | ✓    | Update account                       |
| DELETE | `/accounts/:id`              | ✓    | Delete account                       |

### Transactions

| Method | Endpoint                     | Auth | Description                          |
|--------|------------------------------|------|--------------------------------------|
| GET    | `/transactions`              | ✓    | List transactions (paginated, filterable) |
| POST   | `/transactions`              | ✓    | Create a transaction                 |
| GET    | `/transactions/:id`          | ✓    | Get transaction details              |
| PATCH  | `/transactions/:id`          | ✓    | Update a transaction                 |
| DELETE | `/transactions/:id`          | ✓    | Delete a transaction                 |
| POST   | `/transactions/upload`       | ✓    | Bulk import from CSV                 |

### Budgets

| Method | Endpoint                     | Auth | Description                          |
|--------|------------------------------|------|--------------------------------------|
| GET    | `/budgets`                   | ✓    | Get user's budget configuration      |
| PUT    | `/budgets`                   | ✓    | Create or update budget              |
| GET    | `/budgets/status`            | ✓    | Get real-time budget spend status    |

### AI Coach

| Method | Endpoint                     | Auth | Description                          |
|--------|------------------------------|------|--------------------------------------|
| POST   | `/coach/chat`                | ✓    | Send a message to the AI coach       |
| GET    | `/coach/history`             | ✓    | Get coaching conversation history    |
| POST   | `/coach/state`               | ✓    | Set coach personality mode (0/1/2)   |
| GET    | `/coach/state`               | ✓    | Get current coach state              |

### Analytics

| Method | Endpoint                     | Auth | Description                          |
|--------|------------------------------|------|--------------------------------------|
| GET    | `/analytics/cashflow`        | ✓    | Cash flow over time                  |
| GET    | `/analytics/categories`      | ✓    | Spending by category                 |
| GET    | `/analytics/networth`        | ✓    | Net worth history                    |
| GET    | `/analytics/savings-rate`    | ✓    | Savings rate calculations            |
| GET    | `/analytics/category-heatmap`| ✓    | Category spend intensity heatmap     |

### Reports

| Method | Endpoint                     | Auth | Description                          |
|--------|------------------------------|------|--------------------------------------|
| POST   | `/reports/pdf`               | ✓    | Generate PDF financial report        |
| POST   | `/reports/csv`               | ✓    | Generate CSV export                  |
| GET    | `/reports`                   | ✓    | List generated reports               |
| GET    | `/reports/:id/download`      | ✓    | Download a report                    |

### Attachments

| Method | Endpoint                     | Auth | Description                          |
|--------|------------------------------|------|--------------------------------------|
| POST   | `/attachments`               | ✓    | Upload a receipt or document         |
| GET    | `/attachments/:id`           | ✓    | Get attachment metadata              |
| DELETE | `/attachments/:id`           | ✓    | Delete an attachment                 |

### Notifications

| Method | Endpoint                     | Auth | Description                          |
|--------|------------------------------|------|--------------------------------------|
| GET    | `/notifications`             | ✓    | List user notifications              |
| PATCH  | `/notifications/:id/read`    | ✓    | Mark notification as read            |
| POST   | `/notifications/subscribe`   | ✓    | Subscribe to push notifications      |

### Users & Admin

| Method | Endpoint                     | Auth  | Description                         |
|--------|------------------------------|-------|-------------------------------------|
| GET    | `/users/me`                  | ✓     | Get current user profile            |
| PATCH  | `/users/me`                  | ✓     | Update profile                      |
| DELETE | `/users/me`                  | ✓     | Delete account                      |
| GET    | `/admin/stats`               | Admin | Platform-wide statistics            |
| GET    | `/admin/users`               | Admin | List all users                      |
| PATCH  | `/admin/users/:id`           | Admin | Update user role/status             |

---

## AI Coach

The AI coach is powered by **Groq's llama-3.3-70b-versatile** model and adapts its personality based on your spending behavior.

### Personality Modes

| Mode | Level | Style | Example Response |
|------|-------|-------|------------------|
| 🌱 **Gentle** | `0` | Warm, encouraging, empathetic | *"Hey, I noticed some late-night orders. No judgment — let's see if we can redirect that energy toward your savings goal!"* |
| 💪 **Firm** | `1` | Direct, results-focused, data-driven | *"You've ordered late-night food 4 times this week. That's ₹4,200 — and it's a pattern. The math isn't in your favour."* |
| 🔥 **Blunt** | `2` | Brutally honest, no sugar-coating | *"STOP. ₹4,200 on Zomato this week alone. That's ₹41,800 you're burning in 10 years. Wake up."* |

### Changing Coach Mode

```bash
curl -X POST http://localhost:5000/api/v1/coach/state \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"coachState": 1}'
```

The system also auto-escalates: if you ignore multiple alerts, the coach tightens its tone automatically.

---

## Project Structure

```
project-aegis/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── accounts/       # Account CRUD, balance tracking
│   │   │   ├── auth/           # JWT, refresh tokens, Google OAuth
│   │   │   ├── budgets/        # Budget config, spend tracking
│   │   │   ├── coach/          # AI coach, Groq integration
│   │   │   ├── transactions/   # CRUD, CSV import, atomic ops
│   │   │   ├── analytics/      # Cash flow, categories, net worth
│   │   │   ├── reports/        # PDF/CSV generation
│   │   │   ├── attachments/    # File upload, S3/R2/local
│   │   │   ├── notifications/  # Push, cron alerts
│   │   │   ├── users/          # Profile management
│   │   │   └── admin/          # Platform stats, user management
│   │   ├── middleware/         # Auth, rate limit, idempotency, error handler
│   │   ├── config/            # DB, Redis, env, storage config
│   │   └── utils/             # Helpers, validators, logger
│   ├── tests/                 # Unit + integration tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── mock/              # Mock data + API layer (backend-free testing)
│   │   ├── components/        # Navbar, Layout, CoachOverlay
│   │   ├── pages/             # All route pages
│   │   └── index.css          # Sovereign Void design system
│   └── package.json
├── nginx/
│   └── nginx.conf             # Reverse proxy config
├── scripts/
│   └── seed.ts                # Database seeding script
├── .github/
│   └── workflows/
│       ├── ci.yml             # CI pipeline (lint, test, build)
│       └── deploy.yml         # CD pipeline (SSH deploy)
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## Testing

```bash
cd backend

# Run unit tests
npm run test:unit

# Run integration tests (requires MongoDB + Redis)
npm run test:integration

# Run all tests
npm test

# Generate coverage report
npm run test:coverage
```

### Current Status

| Metric       | Value                    |
|-------------|--------------------------|
| Total tests  | 38                       |
| Passing      | 37 ✅                    |
| Failing      | 1 ⚠️ (known fix in progress) |
| Coverage     | ~80%                     |
| CI           | Auto-runs on every push  |

---

## Docker Commands

```bash
# Start all services (MongoDB, Redis, Backend, Nginx)
docker compose up --build

# Start in detached mode
docker compose up -d --build

# View logs
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v

# Rebuild a specific service
docker compose build backend

# Run tests inside container
docker compose exec backend npm test
```

If a `Makefile` is available:

```bash
make dev        # Start in development mode
make up         # Start in production mode
make down       # Stop all services
make logs       # Tail logs
make test       # Run tests
make clean      # Remove containers + volumes
```

---

## Deployment

### CI/CD Pipeline

The project uses **GitHub Actions** for automated CI/CD:

1. **CI** (`ci.yml`) — Runs on every push and PR to `main`:
   - Lints TypeScript with ESLint
   - Runs full test suite
   - Builds production artifacts
   - Fails fast on any error

2. **CD** (`deploy.yml`) — Runs on push to `main` after CI passes:
   - Builds Docker images
   - Deploys via SSH to production server
   - Runs database migrations if needed
   - Zero-downtime restart via Nginx

### Production Setup

```
Client → Nginx (SSL/TLS) → Express Backend → MongoDB + Redis
                         → Static Frontend (Vite build)
```

- **SSL**: Let's Encrypt via Certbot (auto-renewal)
- **Proxy**: Nginx handles SSL termination, gzip, and static file serving
- **Process**: Docker containers managed by `docker-compose`

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. Create a **feature branch**: `git checkout -b feat/your-feature`
3. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add budget alerts via email
   fix: correct balance calculation on transfer
   docs: update API reference for coach endpoints
   ```
4. **Push** to your fork: `git push origin feat/your-feature`
5. Open a **Pull Request** to `main`

### Rules

- All PRs must pass CI (lint + tests)
- TypeScript strict mode — no `any` without justification
- New features require tests
- Keep PRs focused and small

---

## License

```
MIT License

Copyright (c) 2026 Team 404 Not Found

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<p align="center">
  <strong>Built with 💚 by Team 404 Not Found</strong><br/>
  <sub>Project Aegis — because your future self deserves better.</sub>
</p>
