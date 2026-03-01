# Volunteer Management System - Implementation Guide for Claude Code

## Project Goal
Build and deploy a secure volunteer management system with cybersecurity features. Live deployment on free hosting (Vercel + Railway).

---

## Tech Stack

**Frontend:** React + Vite + Tailwind CSS
**Backend:** Node.js + Express + PostgreSQL
**Security:** JWT + bcrypt + AES-256 encryption
**Deployment:** Vercel (frontend) + Railway (backend + database)

---

## File Structure

```
volunteer-management-system/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # Login, Register, ProtectedRoute
│   │   │   ├── admin/         # Admin dashboard components
│   │   │   ├── coordinator/   # Coordinator components
│   │   │   ├── volunteer/     # Volunteer components
│   │   │   └── common/        # Shared components
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── apiService.js
│   │   │   └── volunteerService.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
│
├── server/                     # Node.js backend
│   ├── config/
│   │   ├── database.js
│   │   └── cors.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── volunteer.controller.js
│   │   └── admin.controller.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── authorize.js
│   │   ├── validate.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── volunteer.routes.js
│   │   └── admin.routes.js
│   ├── utils/
│   │   ├── password.js
│   │   ├── jwt.js
│   │   └── encryption.js
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
└── database/
    ├── schema.sql
    └── seed.sql
```

---

## Database Schema

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'coordinator', 'volunteer')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE volunteer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    address_encrypted TEXT,
    emergency_contact_encrypted TEXT,
    skills TEXT[],
    availability TEXT,
    background_check_status VARCHAR(50) DEFAULT 'pending' 
        CHECK (background_check_status IN ('pending', 'in_progress', 'approved', 'rejected')),
    background_check_date DATE,
    hours_logged INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('success', 'failure'))
);

CREATE TABLE volunteer_hours (
    id SERIAL PRIMARY KEY,
    volunteer_id INTEGER REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours DECIMAL(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    description TEXT,
    approved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_volunteer_user_id ON volunteer_profiles(user_id);
CREATE INDEX idx_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_logs_timestamp ON activity_logs(timestamp DESC);
```

---

## Core API Endpoints

### Authentication
```
POST   /api/auth/register       - Create account
POST   /api/auth/login          - Login user
POST   /api/auth/logout         - Logout
```

### Users
```
GET    /api/users/profile       - Get current user
PUT    /api/users/profile       - Update profile
PUT    /api/users/change-password
```

### Volunteers
```
GET    /api/volunteers          - List all (admin/coordinator)
GET    /api/volunteers/:id      - Get volunteer
PUT    /api/volunteers/:id      - Update volunteer
POST   /api/volunteers/:id/hours - Log hours
GET    /api/volunteers/:id/hours - Get hours
```

### Admin
```
GET    /api/admin/users         - All users
POST   /api/admin/users         - Create user
DELETE /api/admin/users/:id     - Delete user
GET    /api/admin/audit-logs    - Activity logs
GET    /api/admin/statistics    - Dashboard stats
```

---

## Essential Code Snippets

### Password Hashing (server/utils/password.js)
```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

module.exports = { hashPassword, comparePassword };
```

### JWT Utils (server/utils/jwt.js)
```javascript
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
```

### Auth Middleware (server/middleware/auth.js)
```javascript
const { verifyToken } = require('../utils/jwt');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const token = authHeader.substring(7);
    req.user = verifyToken(token);
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

module.exports = authenticate;
```

### Authorization Middleware (server/middleware/authorize.js)
```javascript
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }
    next();
  };
}

module.exports = authorize;
```

### Encryption (server/utils/encryption.js)
```javascript
const crypto = require('crypto');
const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (!text) return null;
  const [ivHex, encryptedText] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
```

### Database Config (server/config/database.js)
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
```

### Express Server (server/server.js)
```javascript
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const volunteerRoutes = require('./routes/volunteer.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

### API Service (client/src/services/apiService.js)
```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Auth Context (client/src/context/AuthContext.jsx)
```javascript
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and load user
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## Environment Variables

### Server (.env)
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=generate_with_crypto_randomBytes_32_base64
ENCRYPTION_KEY=generate_with_crypto_randomBytes_32_hex
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
```

**Generate keys:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Client (.env)
```env
VITE_API_URL=https://your-api.railway.app/api
```

---

## Deployment Steps

### Railway (Backend + Database)

1. Create account at railway.app
2. New Project → Deploy from GitHub → Select server folder
3. Add PostgreSQL database (one click)
4. Set environment variables (see above)
5. Deploy (automatic on git push)

### Vercel (Frontend)

1. Create account at vercel.com
2. Import Git Repository → Select client folder
3. Framework: Vite
4. Set environment variable: `VITE_API_URL`
5. Deploy

### Database Setup

```bash
# Connect to Railway PostgreSQL
railway login
railway link

# Run migrations
railway run psql < database/schema.sql
railway run psql < database/seed.sql
```

---

## Package Dependencies

### Server
```bash
npm install express pg bcrypt jsonwebtoken dotenv helmet cors express-validator express-rate-limit
npm install --save-dev nodemon
```

### Client
```bash
npm create vite@latest
npm install react-router-dom axios
npm install --save-dev tailwindcss postcss autoprefixer
```

---

## Implementation Priority

### Week 1: Backend Core
- Database setup
- Authentication endpoints
- User CRUD
- Security middleware

### Week 2: Frontend Core
- React setup
- Auth pages
- Protected routes
- Basic dashboards

### Week 3: Features
- Volunteer management
- Hours logging
- Admin panel
- Styling

### Week 4: Deploy
- Railway setup
- Vercel deployment
- Environment config
- Testing

---

## Critical Security Checklist

```markdown
- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens with expiration
- [ ] RBAC on all protected routes
- [ ] Sensitive data encrypted (AES-256)
- [ ] SQL parameterized queries only
- [ ] Input validation on all endpoints
- [ ] Rate limiting on auth
- [ ] CORS configured properly
- [ ] HTTPS in production
- [ ] Environment variables secure
- [ ] No secrets in Git
```

---

## Demo Credentials

After deployment, seed these accounts:

```
Admin: admin@demo.com / Admin123!
Coordinator: coordinator@demo.com / Coord123!
Volunteer: volunteer@demo.com / Vol123!
```

---

## Testing Production

```bash
# Health check
curl https://your-api.railway.app/health

# Register
curl -X POST https://your-api.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","firstName":"Test","lastName":"User","role":"volunteer"}'

# Login
curl -X POST https://your-api.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

---

## Build Commands

```bash
# Install dependencies
cd server && npm install
cd client && npm install

# Development
cd server && npm run dev
cd client && npm run dev

# Production build
cd client && npm run build

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

This is everything needed to build and deploy the project. Focus on implementation, not theory.
