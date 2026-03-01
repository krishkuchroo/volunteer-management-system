# Secure Volunteer Management System

A full-stack web application for managing volunteers at nonprofit organizations, featuring role-based access control, encrypted data storage, and comprehensive audit logging.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Query, React Router v6 |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT, bcrypt |
| Security | Helmet, CORS, express-rate-limit, AES-256-CBC encryption |

## Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL v14+

### 1. Database Setup
```bash
createdb volunteer_management
psql volunteer_management < database/schema.sql
psql volunteer_management < database/seed.sql
```

### 2. Backend
```bash
cd server
cp .env.example .env
# Edit .env — fill in DB credentials and generate secrets (see below)
npm install
npm run dev
```

Generate secrets:
```bash
# JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption key (must be 64 hex chars = 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The app runs at **http://localhost:5173** and the API at **http://localhost:5000**.

## Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | password (update seed.sql with real hashes) |
| Coordinator | coordinator@example.com | password |
| Volunteer | volunteer@example.com | password |

> The seed file uses a placeholder hash. Generate real bcrypt hashes before using:
> ```bash
> node -e "const b=require('bcrypt');b.hash('Admin123!',10).then(console.log)"
> ```

## Project Structure

```
volunteer-management-system/
├── client/          # React frontend (Vite)
├── server/          # Express API
├── database/        # SQL schema, seed, migrations
└── docs/            # Documentation
```

## API Base URL

`http://localhost:5000/api`

See `docs/DESIGN_DOCUMENT.md` for full API specification.

## Security Features

- Passwords hashed with bcrypt (10 rounds)
- JWT authentication (24h expiry)
- Role-based access control (admin / coordinator / volunteer)
- AES-256-CBC encryption for sensitive fields (address, emergency contact)
- Rate limiting (100 req/15min general; 5 req/15min on auth endpoints)
- Security headers via Helmet
- SQL injection prevention via parameterized queries
- XSS prevention via React's default escaping + express-validator `.escape()`
- All user actions logged to `activity_logs` table
