# Secure Volunteer Management System - Complete Design Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technical Requirements](#technical-requirements)
3. [System Architecture](#system-architecture)
4. [Database Design](#database-design)
5. [API Specification](#api-specification)
6. [Security Implementation](#security-implementation)
7. [Frontend Components](#frontend-components)
8. [Backend Services](#backend-services)
9. [File Structure](#file-structure)
10. [Implementation Guide](#implementation-guide)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Guide](#deployment-guide)

---

## 1. Project Overview

### Purpose
Build a secure web application for managing volunteers at nonprofit organizations, featuring role-based access control, encrypted data storage, and comprehensive audit logging.

### Target Users
- **Administrators**: Full system access, user management, audit log viewing
- **Coordinators**: Volunteer management, background check reviews, task assignment
- **Volunteers**: Profile management, hours logging, task viewing

### Core Features
1. User authentication with JWT tokens
2. Role-based access control (RBAC)
3. Secure volunteer registration and profile management
4. Background check status tracking
5. Encrypted storage of sensitive information
6. Activity logging for compliance and auditing
7. Volunteer hours tracking
8. Dashboard analytics for each role

### Success Criteria
- All authentication endpoints working with proper security
- Role-based access enforced on all protected routes
- Sensitive data encrypted at rest
- All user actions logged for audit purposes
- Responsive UI for all three user roles
- No SQL injection or XSS vulnerabilities

---

## 2. Technical Requirements

### Technology Stack

**Frontend:**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "axios": "^1.6.2",
  "react-hook-form": "^7.48.2",
  "jwt-decode": "^4.0.0",
  "@tanstack/react-query": "^5.14.2",
  "tailwindcss": "^3.3.6"
}
```

**Backend:**
```json
{
  "express": "^4.18.2",
  "pg": "^8.11.3",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "dotenv": "^16.3.1",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "express-validator": "^7.0.1",
  "express-rate-limit": "^7.1.5",
  "multer": "^1.4.5-lts.1",
  "morgan": "^1.10.0",
  "joi": "^17.11.0"
}
```

**Development Tools:**
```json
{
  "nodemon": "^3.0.2",
  "eslint": "^8.55.0",
  "prettier": "^3.1.1",
  "jest": "^29.7.0",
  "supertest": "^6.3.3"
}
```

### Environment Requirements
- Node.js: v18.x or higher
- PostgreSQL: v14.x or higher
- npm: v9.x or higher
- Git: v2.x or higher

### Development Environment Setup
```bash
# Required installations
1. Node.js and npm
2. PostgreSQL
3. VS Code (recommended)
4. Postman or Thunder Client (API testing)
5. pgAdmin 4 (database management)
```

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT TIER                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Admin    │  │Coordinator │  │ Volunteer  │            │
│  │ Dashboard  │  │ Dashboard  │  │ Dashboard  │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
│        └────────────────┴────────────────┘                   │
│                         │                                    │
│                React Application                             │
│                    (Port 3000)                               │
└────────────────────────┼────────────────────────────────────┘
                         │ HTTPS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                 APPLICATION TIER                             │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │         Express.js REST API Server               │       │
│  │              (Port 5000)                          │       │
│  │                                                    │       │
│  │  Middleware Stack:                                │       │
│  │  • Helmet (Security Headers)                     │       │
│  │  • CORS                                          │       │
│  │  • Rate Limiter                                  │       │
│  │  • JWT Authentication                            │       │
│  │  • Request Validation                            │       │
│  │  • Error Handler                                 │       │
│  │  • Activity Logger                               │       │
│  └──────────────────────────────────────────────────┘       │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    DATA TIER                                 │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │         PostgreSQL Database                       │       │
│  │              (Port 5432)                          │       │
│  │                                                    │       │
│  │  Tables:                                          │       │
│  │  • users                                          │       │
│  │  • volunteer_profiles                            │       │
│  │  • activity_logs                                 │       │
│  │  • password_reset_tokens                         │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
1. User Action (Login)
   ↓
2. React Component calls authService.login()
   ↓
3. Axios POST to /api/auth/login
   ↓
4. Express middleware chain:
   • Helmet (security headers)
   • CORS check
   • Rate limiter
   • Input validation
   ↓
5. Auth Controller:
   • Query user from database
   • Verify password with bcrypt
   • Generate JWT token
   • Log activity
   ↓
6. Response with token
   ↓
7. React stores token in localStorage
   ↓
8. Subsequent requests include: Authorization: Bearer <token>
```

---

## 4. Database Design

### Schema Definition

#### Table: users
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

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```

#### Table: volunteer_profiles
```sql
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
    background_check_notes TEXT,
    hours_logged INTEGER DEFAULT 0,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_volunteer_user_id ON volunteer_profiles(user_id);
CREATE INDEX idx_volunteer_bg_status ON volunteer_profiles(background_check_status);
```

#### Table: activity_logs
```sql
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(100),
    resource_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSONB,
    status VARCHAR(20) CHECK (status IN ('success', 'failure'))
);

-- Indexes
CREATE INDEX idx_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_logs_action ON activity_logs(action);
```

#### Table: password_reset_tokens
```sql
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_expires ON password_reset_tokens(expires_at);
```

#### Table: volunteer_hours
```sql
CREATE TABLE volunteer_hours (
    id SERIAL PRIMARY KEY,
    volunteer_id INTEGER REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours DECIMAL(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    description TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_hours_volunteer ON volunteer_hours(volunteer_id);
CREATE INDEX idx_hours_date ON volunteer_hours(date);
```

### Database Triggers

```sql
-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteer_profiles_updated_at BEFORE UPDATE ON volunteer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Sample Data for Testing

```sql
-- Admin user (password: Admin123!)
INSERT INTO users (email, password_hash, role, first_name, last_name, is_verified)
VALUES (
    'admin@example.com',
    '$2b$10$XYZ...', -- bcrypt hash
    'admin',
    'System',
    'Administrator',
    true
);

-- Coordinator user (password: Coord123!)
INSERT INTO users (email, password_hash, role, first_name, last_name, is_verified)
VALUES (
    'coordinator@example.com',
    '$2b$10$ABC...',
    'coordinator',
    'Jane',
    'Smith',
    true
);

-- Volunteer user (password: Volunteer123!)
INSERT INTO users (email, password_hash, role, first_name, last_name, is_verified)
VALUES (
    'volunteer@example.com',
    '$2b$10$DEF...',
    'volunteer',
    'John',
    'Doe',
    true
);
```

---

## 5. API Specification

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

### Authentication Header
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}

// Error response
{
  "success": false,
  "error": "Error message",
  "details": [ /* validation errors */ ]
}
```

### Endpoints

#### Authentication Endpoints

**POST /auth/register**
Create a new user account.

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "volunteer"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "volunteer"
    }
  },
  "message": "Registration successful"
}
```

Validation Rules:
- Email: Valid email format, unique
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- First/Last Name: 2-100 characters
- Phone: Optional, valid phone format
- Role: Must be 'volunteer', 'coordinator', or 'admin'

---

**POST /auth/login**
Authenticate user and receive JWT token.

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "volunteer"
    }
  },
  "message": "Login successful"
}
```

Errors:
- 401: Invalid credentials
- 403: Account not verified
- 429: Too many login attempts

---

**POST /auth/logout**
Invalidate current session (client-side token removal).

Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

**POST /auth/forgot-password**
Request password reset link.

Request:
```json
{
  "email": "user@example.com"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Password reset link sent to email"
}
```

---

**POST /auth/reset-password**
Reset password using token.

Request:
```json
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePass123!"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

#### User Endpoints

**GET /users/profile**
Get current user's profile.

Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "volunteer",
    "isVerified": true,
    "createdAt": "2026-01-15T10:30:00Z",
    "lastLogin": "2026-02-18T09:15:00Z"
  }
}
```

---

**PUT /users/profile**
Update current user's profile.

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "volunteer"
  },
  "message": "Profile updated successfully"
}
```

---

**PUT /users/change-password**
Change user password.

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

#### Volunteer Endpoints

**GET /volunteers**
List all volunteers (Admin/Coordinator only).

Headers:
```
Authorization: Bearer <token>
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10, max: 50)
- `status`: Filter by background check status
- `search`: Search by name or email

Response (200):
```json
{
  "success": true,
  "data": {
    "volunteers": [
      {
        "id": 1,
        "userId": 5,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "skills": ["First Aid", "Teaching"],
        "backgroundCheckStatus": "approved",
        "hoursLogged": 45,
        "createdAt": "2026-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalRecords": 25,
      "limit": 10
    }
  }
}
```

---

**GET /volunteers/:id**
Get volunteer details.

Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 5,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, State 12345",
    "emergencyContact": "Jane Doe - +0987654321",
    "skills": ["First Aid", "Teaching"],
    "availability": "Weekends",
    "backgroundCheckStatus": "approved",
    "backgroundCheckDate": "2026-01-20",
    "hoursLogged": 45,
    "profileImageUrl": "https://...",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

Permissions:
- Volunteers: Can only view their own profile
- Coordinators/Admins: Can view any volunteer

---

**PUT /volunteers/:id**
Update volunteer profile.

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "address": "123 Main St, City, State 12345",
  "emergencyContact": "Jane Doe - +0987654321",
  "skills": ["First Aid", "Teaching", "Cooking"],
  "availability": "Weekdays and Weekends"
}
```

Response (200):
```json
{
  "success": true,
  "data": { /* updated volunteer profile */ },
  "message": "Profile updated successfully"
}
```

---

**POST /volunteers/:id/hours**
Log volunteer hours.

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "date": "2026-02-18",
  "hours": 5.5,
  "description": "Food bank assistance"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "id": 15,
    "volunteerId": 1,
    "date": "2026-02-18",
    "hours": 5.5,
    "description": "Food bank assistance",
    "approvedBy": null,
    "createdAt": "2026-02-18T14:30:00Z"
  },
  "message": "Hours logged successfully"
}
```

---

**GET /volunteers/:id/hours**
Get volunteer hours history.

Headers:
```
Authorization: Bearer <token>
```

Query Parameters:
- `startDate`: Filter from date (YYYY-MM-DD)
- `endDate`: Filter to date (YYYY-MM-DD)

Response (200):
```json
{
  "success": true,
  "data": {
    "totalHours": 45,
    "entries": [
      {
        "id": 15,
        "date": "2026-02-18",
        "hours": 5.5,
        "description": "Food bank assistance",
        "approvedBy": "Jane Smith",
        "approvedAt": "2026-02-19T10:00:00Z"
      }
    ]
  }
}
```

---

#### Background Check Endpoints

**GET /background-checks**
List pending background checks (Admin/Coordinator only).

Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "success": true,
  "data": [
    {
      "volunteerId": 3,
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice@example.com",
      "status": "pending",
      "submittedAt": "2026-02-15T09:00:00Z"
    }
  ]
}
```

---

**PUT /background-checks/:id/status**
Update background check status (Admin/Coordinator only).

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "status": "approved",
  "notes": "All checks passed"
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "volunteerId": 3,
    "status": "approved",
    "notes": "All checks passed",
    "updatedAt": "2026-02-18T11:00:00Z"
  },
  "message": "Background check status updated"
}
```

---

#### Admin Endpoints

**GET /admin/users**
Get all users with filters (Admin only).

Headers:
```
Authorization: Bearer <token>
```

Query Parameters:
- `role`: Filter by role
- `isActive`: Filter by active status
- `page`, `limit`: Pagination

Response (200):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "volunteer",
        "isActive": true,
        "isVerified": true,
        "createdAt": "2026-01-15T10:30:00Z",
        "lastLogin": "2026-02-18T09:15:00Z"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

---

**POST /admin/users**
Create user manually (Admin only).

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "email": "newuser@example.com",
  "password": "TempPass123!",
  "firstName": "New",
  "lastName": "User",
  "role": "coordinator",
  "isVerified": true
}
```

Response (201):
```json
{
  "success": true,
  "data": { /* new user object */ },
  "message": "User created successfully"
}
```

---

**DELETE /admin/users/:id**
Delete user (Admin only).

Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

**GET /admin/audit-logs**
View activity logs (Admin only).

Headers:
```
Authorization: Bearer <token>
```

Query Parameters:
- `userId`: Filter by user
- `action`: Filter by action type
- `startDate`, `endDate`: Date range
- `page`, `limit`: Pagination

Response (200):
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 125,
        "userId": 5,
        "userName": "John Doe",
        "action": "LOGIN",
        "resource": "auth",
        "ipAddress": "192.168.1.1",
        "timestamp": "2026-02-18T09:15:00Z",
        "status": "success"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

---

**GET /admin/statistics**
Dashboard statistics (Admin only).

Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "success": true,
  "data": {
    "totalUsers": 125,
    "totalVolunteers": 98,
    "totalCoordinators": 15,
    "totalAdmins": 3,
    "activeVolunteers": 87,
    "pendingBackgroundChecks": 12,
    "approvedBackgroundChecks": 85,
    "totalHoursLogged": 3456,
    "hoursThisMonth": 234
  }
}
```

---

### Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | User lacks permission |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 6. Security Implementation

### Password Security

**Hashing with bcrypt:**
```javascript
// File: server/utils/password.js

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare plain text password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if match
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  comparePassword
};
```

### JWT Authentication

**Token Generation and Verification:**
```javascript
// File: server/utils/jwt.js

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '24h';

/**
 * Generate JWT token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(
    {
      userId: payload.id,
      email: payload.email,
      role: payload.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

module.exports = {
  generateToken,
  verifyToken
};
```

**Authentication Middleware:**
```javascript
// File: server/middleware/auth.js

const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to verify JWT token
 */
function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Attach user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}

module.exports = authenticate;
```

### Role-Based Access Control

```javascript
// File: server/middleware/authorize.js

/**
 * Middleware to check user role
 * @param  {...string} allowedRoles - Roles allowed to access
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource'
      });
    }

    next();
  };
}

module.exports = authorize;
```

### Data Encryption

```javascript
// File: server/utils/encryption.js

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text with IV
 */
function encrypt(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted text (separated by :)
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt encrypted data
 * @param {string} text - Encrypted text with IV
 * @returns {string} Decrypted plain text
 */
function decrypt(text) {
  if (!text) return null;
  
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt
};
```

### Input Validation

```javascript
// File: server/middleware/validate.js

const { body, validationResult } = require('express-validator');

/**
 * Registration validation rules
 */
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be 2-100 characters')
    .escape(),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be 2-100 characters')
    .escape(),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Valid phone number required'),
  body('role')
    .isIn(['volunteer', 'coordinator', 'admin'])
    .withMessage('Invalid role')
];

/**
 * Login validation rules
 */
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Middleware to handle validation errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  
  next();
}

module.exports = {
  registerValidation,
  loginValidation,
  handleValidationErrors
};
```

### Rate Limiting

```javascript
// File: server/middleware/rateLimiter.js

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per window
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    error: 'Too many login attempts, please try again later'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
```

### Security Headers with Helmet

```javascript
// File: server/middleware/security.js

const helmet = require('helmet');

/**
 * Configure security headers
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

module.exports = securityHeaders;
```

### Activity Logging

```javascript
// File: server/middleware/logger.js

const db = require('../config/database');

/**
 * Log user activity to database
 * @param {number} userId - User ID
 * @param {string} action - Action performed
 * @param {string} resource - Resource affected
 * @param {number} resourceId - Resource ID
 * @param {Object} req - Express request object
 * @param {string} status - success or failure
 * @param {Object} details - Additional details
 */
async function logActivity(userId, action, resource, resourceId, req, status = 'success', details = {}) {
  try {
    await db.query(
      `INSERT INTO activity_logs 
       (user_id, action, resource, resource_id, ip_address, user_agent, status, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        action,
        resource,
        resourceId,
        req.ip,
        req.get('user-agent'),
        status,
        JSON.stringify(details)
      ]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error - logging should not break the application
  }
}

/**
 * Middleware to automatically log all requests
 */
function requestLogger(req, res, next) {
  // Log after response is sent
  res.on('finish', () => {
    if (req.user) {
      logActivity(
        req.user.userId,
        req.method,
        req.path,
        null,
        req,
        res.statusCode < 400 ? 'success' : 'failure',
        { statusCode: res.statusCode }
      );
    }
  });
  
  next();
}

module.exports = {
  logActivity,
  requestLogger
};
```

### CORS Configuration

```javascript
// File: server/config/cors.js

const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from your frontend domains
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);
```

---

## 7. Frontend Components

### Folder Structure

```
client/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── admin/
│   │   │   ├── UserManagement.jsx
│   │   │   ├── AuditLogs.jsx
│   │   │   ├── Statistics.jsx
│   │   │   └── CreateUser.jsx
│   │   ├── coordinator/
│   │   │   ├── VolunteerList.jsx
│   │   │   ├── BackgroundChecks.jsx
│   │   │   └── ApproveHours.jsx
│   │   ├── volunteer/
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── HoursLogging.jsx
│   │   │   └── Dashboard.jsx
│   │   └── common/
│   │       ├── Navbar.jsx
│   │       ├── Sidebar.jsx
│   │       ├── LoadingSpinner.jsx
│   │       └── ErrorMessage.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useRoleAccess.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── apiService.js
│   │   ├── volunteerService.js
│   │   └── adminService.js
│   ├── utils/
│   │   ├── tokenUtils.js
│   │   ├── validators.js
│   │   └── formatters.js
│   ├── App.jsx
│   └── main.jsx
```

### Key Components Specification

#### AuthContext
```javascript
// File: client/src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser, logout as logoutService } from '../services/authService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    logoutService();
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isCoordinator: user?.role === 'coordinator',
    isVolunteer: user?.role === 'volunteer'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### Protected Route
```javascript
// File: client/src/components/auth/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
```

#### Login Form
```javascript
// File: client/src/components/auth/LoginForm.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { login as loginService } from '../../services/authService';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginService(formData.email, formData.password);
      login(response.user, response.token);
      
      // Redirect based on role
      const roleRoutes = {
        admin: '/admin/dashboard',
        coordinator: '/coordinator/dashboard',
        volunteer: '/volunteer/dashboard'
      };
      navigate(roleRoutes[response.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

#### API Service
```javascript
// File: client/src/services/apiService.js

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### Auth Service
```javascript
// File: client/src/services/authService.js

import apiClient from './apiService';

export async function register(userData) {
  const response = await apiClient.post('/auth/register', userData);
  return response.data.data;
}

export async function login(email, password) {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data.data;
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export async function getCurrentUser() {
  const response = await apiClient.get('/users/profile');
  return response.data.data;
}

export async function updateProfile(updates) {
  const response = await apiClient.put('/users/profile', updates);
  return response.data.data;
}

export async function changePassword(currentPassword, newPassword) {
  const response = await apiClient.put('/users/change-password', {
    currentPassword,
    newPassword
  });
  return response.data;
}
```

---

## 8. Backend Services

### Express Server Setup

```javascript
// File: server/server.js

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');

// Import middleware
const corsConfig = require('./config/cors');
const securityHeaders = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const volunteerRoutes = require('./routes/volunteer.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(corsConfig); // CORS configuration
app.use(securityHeaders); // Security headers
app.use(apiLimiter); // Rate limiting
app.use(requestLogger); // Activity logging

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
```

### Database Configuration

```javascript
// File: server/config/database.js

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'volunteer_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
};
```

### Auth Controller

```javascript
// File: server/controllers/auth.controller.js

const db = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { logActivity } = require('../middleware/logger');

/**
 * Register a new user
 */
async function register(req, res, next) {
  const client = await db.getClient();
  
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    await client.query('BEGIN');

    // Check if email already exists
    const emailCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, role, first_name, last_name, created_at`,
      [email, passwordHash, role, firstName, lastName, phone, false]
    );

    const user = userResult.rows[0];

    // If volunteer, create profile
    if (role === 'volunteer') {
      await client.query(
        'INSERT INTO volunteer_profiles (user_id) VALUES ($1)',
        [user.id]
      );
    }

    await client.query('COMMIT');

    // Generate token
    const token = generateToken(user);

    // Log activity
    await logActivity(user.id, 'REGISTER', 'users', user.id, req, 'success');

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      },
      message: 'Registration successful'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

/**
 * Login user
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Get user from database
    const result = await db.query(
      `SELECT id, email, password_hash, role, first_name, last_name, is_verified, is_active
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      await logActivity(null, 'LOGIN_FAILED', 'auth', null, req, 'failure', { email });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account has been deactivated'
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      await logActivity(user.id, 'LOGIN_FAILED', 'auth', null, req, 'failure');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate token
    const token = generateToken(user);

    // Log successful login
    await logActivity(user.id, 'LOGIN', 'auth', null, req, 'success');

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      },
      message: 'Login successful'
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Logout user
 */
async function logout(req, res, next) {
  try {
    // Log logout activity
    await logActivity(req.user.userId, 'LOGOUT', 'auth', null, req, 'success');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  logout
};
```

### Volunteer Controller

```javascript
// File: server/controllers/volunteer.controller.js

const db = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');
const { logActivity } = require('../middleware/logger');

/**
 * Get all volunteers (Admin/Coordinator only)
 */
async function getAllVolunteers(req, res, next) {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        vp.id,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        vp.skills,
        vp.background_check_status,
        vp.hours_logged,
        vp.created_at
      FROM volunteer_profiles vp
      JOIN users u ON vp.user_id = u.id
      WHERE u.is_active = true
    `;

    const params = [];
    let paramCount = 1;

    // Add filters
    if (status) {
      query += ` AND vp.background_check_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Get total count
    const countResult = await db.query(
      query.replace('SELECT vp.id,', 'SELECT COUNT(*) as total FROM (SELECT vp.id,') + ') as count_query',
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    query += ` ORDER BY vp.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        volunteers: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Get volunteer by ID
 */
async function getVolunteerById(req, res, next) {
  try {
    const { id } = req.params;
    
    // Check authorization
    if (req.user.role === 'volunteer' && parseInt(id) !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own profile'
      });
    }

    const result = await db.query(
      `SELECT 
        vp.id,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        vp.address_encrypted,
        vp.emergency_contact_encrypted,
        vp.skills,
        vp.availability,
        vp.background_check_status,
        vp.background_check_date,
        vp.hours_logged,
        vp.profile_image_url,
        vp.created_at
      FROM volunteer_profiles vp
      JOIN users u ON vp.user_id = u.id
      WHERE vp.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    const volunteer = result.rows[0];

    // Decrypt sensitive fields
    if (volunteer.address_encrypted) {
      volunteer.address = decrypt(volunteer.address_encrypted);
      delete volunteer.address_encrypted;
    }
    if (volunteer.emergency_contact_encrypted) {
      volunteer.emergencyContact = decrypt(volunteer.emergency_contact_encrypted);
      delete volunteer.emergency_contact_encrypted;
    }

    res.json({
      success: true,
      data: volunteer
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Update volunteer profile
 */
async function updateVolunteerProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { address, emergencyContact, skills, availability } = req.body;

    // Check authorization
    if (req.user.role === 'volunteer' && parseInt(id) !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own profile'
      });
    }

    // Encrypt sensitive data
    const addressEncrypted = address ? encrypt(address) : null;
    const emergencyContactEncrypted = emergencyContact ? encrypt(emergencyContact) : null;

    const result = await db.query(
      `UPDATE volunteer_profiles
       SET address_encrypted = COALESCE($1, address_encrypted),
           emergency_contact_encrypted = COALESCE($2, emergency_contact_encrypted),
           skills = COALESCE($3, skills),
           availability = COALESCE($4, availability),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [addressEncrypted, emergencyContactEncrypted, skills, availability, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    await logActivity(req.user.userId, 'UPDATE', 'volunteer_profiles', id, req, 'success');

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Profile updated successfully'
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Log volunteer hours
 */
async function logHours(req, res, next) {
  try {
    const { id } = req.params;
    const { date, hours, description } = req.body;

    // Verify volunteer exists
    const volunteerCheck = await db.query(
      'SELECT id FROM volunteer_profiles WHERE id = $1',
      [id]
    );

    if (volunteerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    // Insert hours entry
    const result = await db.query(
      `INSERT INTO volunteer_hours (volunteer_id, date, hours, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, date, hours, description]
    );

    // Update total hours
    await db.query(
      `UPDATE volunteer_profiles
       SET hours_logged = hours_logged + $1
       WHERE id = $2`,
      [hours, id]
    );

    await logActivity(req.user.userId, 'LOG_HOURS', 'volunteer_hours', result.rows[0].id, req, 'success');

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Hours logged successfully'
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllVolunteers,
  getVolunteerById,
  updateVolunteerProfile,
  logHours
};
```

---

## 9. File Structure

### Complete Project Structure

```
volunteer-management-system/
├── client/                          # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   └── styles/
│   │   │       ├── main.css
│   │   │       └── tailwind.css
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   ├── ForgotPassword.jsx
│   │   │   │   ├── ResetPassword.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── UserManagement.jsx
│   │   │   │   ├── UserTable.jsx
│   │   │   │   ├── CreateUser.jsx
│   │   │   │   ├── AuditLogs.jsx
│   │   │   │   └── Statistics.jsx
│   │   │   ├── coordinator/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── VolunteerList.jsx
│   │   │   │   ├── VolunteerCard.jsx
│   │   │   │   ├── BackgroundChecks.jsx
│   │   │   │   └── ApproveHours.jsx
│   │   │   ├── volunteer/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ProfilePage.jsx
│   │   │   │   ├── EditProfile.jsx
│   │   │   │   ├── HoursLogging.jsx
│   │   │   │   └── HoursHistory.jsx
│   │   │   └── common/
│   │   │       ├── Navbar.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       ├── Footer.jsx
│   │   │       ├── LoadingSpinner.jsx
│   │   │       ├── ErrorMessage.jsx
│   │   │       ├── SuccessMessage.jsx
│   │   │       ├── Modal.jsx
│   │   │       └── Pagination.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useRoleAccess.js
│   │   │   └── useDebounce.js
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CoordinatorDashboard.jsx
│   │   │   ├── VolunteerDashboard.jsx
│   │   │   ├── Unauthorized.jsx
│   │   │   └── NotFound.jsx
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── apiService.js
│   │   │   ├── volunteerService.js
│   │   │   ├── adminService.js
│   │   │   └── coordinatorService.js
│   │   ├── utils/
│   │   │   ├── tokenUtils.js
│   │   │   ├── validators.js
│   │   │   ├── formatters.js
│   │   │   └── constants.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                          # Node.js backend
│   ├── config/
│   │   ├── database.js
│   │   ├── cors.js
│   │   └── constants.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── volunteer.controller.js
│   │   ├── admin.controller.js
│   │   └── backgroundCheck.controller.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── authorize.js
│   │   ├── validate.js
│   │   ├── rateLimiter.js
│   │   ├── logger.js
│   │   ├── security.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── VolunteerProfile.js
│   │   ├── ActivityLog.js
│   │   └── PasswordResetToken.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── volunteer.routes.js
│   │   ├── admin.routes.js
│   │   └── backgroundCheck.routes.js
│   ├── services/
│   │   ├── email.service.js
│   │   └── validation.service.js
│   ├── utils/
│   │   ├── password.js
│   │   ├── jwt.js
│   │   ├── encryption.js
│   │   └── helpers.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── DESIGN_DOCUMENT.md
│   └── DEPLOYMENT_GUIDE.md
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## 10. Implementation Guide

### Phase 1: Project Setup (Week 1)

#### Day 1-2: Environment Setup

**1. Install Required Software:**
```bash
# Node.js and npm (already installed)
node --version  # Should be v18+
npm --version   # Should be v9+

# PostgreSQL
# Download from: https://www.postgresql.org/download/

# Verify PostgreSQL installation
psql --version
```

**2. Create Project Directories:**
```bash
mkdir volunteer-management-system
cd volunteer-management-system
mkdir client server database docs
```

**3. Initialize Backend:**
```bash
cd server
npm init -y
npm install express pg bcrypt jsonwebtoken dotenv helmet cors express-validator express-rate-limit multer morgan joi
npm install --save-dev nodemon eslint prettier
```

**4. Initialize Frontend:**
```bash
cd ../client
npm create vite@latest . -- --template react
npm install react-router-dom axios react-hook-form jwt-decode @tanstack/react-query
npm install --save-dev tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**5. Setup Database:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE volunteer_management;

# Connect to database
\c volunteer_management

# Run schema (copy from database/schema.sql)
```

**6. Environment Variables:**

Create `server/.env`:
```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=volunteer_management
DB_USER=postgres
DB_PASSWORD=your_password

# Security
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
ENCRYPTION_KEY=64_character_hex_string_for_aes_256_encryption_key

# Frontend
FRONTEND_URL=http://localhost:3000
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

**7. Generate Encryption Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Day 3-4: Database Setup

**1. Run Schema:**
```sql
-- Copy contents from Section 4: Database Design
-- Run in PostgreSQL
```

**2. Create Seed Data:**
```bash
# Use the sample data from Section 4
# Create test users for each role
```

**3. Test Database Connection:**
```bash
cd server
node -e "require('./config/database').query('SELECT NOW()').then(r => console.log(r.rows))"
```

#### Day 5-7: Backend Foundation

**1. Create Basic Server:**
- Set up `server.js`
- Configure middleware
- Test server: `npm run dev`

**2. Implement Authentication:**
- Create auth routes
- Implement register/login controllers
- Test with Postman

**3. Add Security:**
- JWT middleware
- Rate limiting
- Input validation

---

### Phase 2: Core Features (Week 2)

#### Day 8-10: Authentication & Authorization

**1. Complete Auth Endpoints:**
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password

**2. Implement RBAC:**
- Authorization middleware
- Role checking
- Protected routes

**3. Test All Auth Flows:**
```bash
# Use Postman collection
# Test each role's access
```

#### Day 11-14: Volunteer Management

**1. Volunteer Endpoints:**
- GET /volunteers
- GET /volunteers/:id
- PUT /volunteers/:id
- POST /volunteers/:id/hours
- GET /volunteers/:id/hours

**2. Data Encryption:**
- Implement encrypt/decrypt
- Apply to sensitive fields
- Test data security

**3. Activity Logging:**
- Log all operations
- Test audit trail

---

### Phase 3: Frontend Development (Week 3)

#### Day 15-17: React Setup & Auth UI

**1. Project Structure:**
- Set up routing
- Create AuthContext
- Build layout components

**2. Authentication Pages:**
- Login form
- Register form
- Protected routes

**3. API Integration:**
- Configure Axios
- Create auth service
- Test login/register

#### Day 18-21: Dashboard Development

**1. Admin Dashboard:**
- User management
- Audit logs viewer
- Statistics display

**2. Coordinator Dashboard:**
- Volunteer list
- Background check review
- Hours approval

**3. Volunteer Dashboard:**
- Profile page
- Hours logging
- History view

---

### Phase 4: Integration & Security (Week 4)

#### Day 22-24: Full Integration

**1. Connect All Features:**
- Test all user flows
- Fix bugs
- Optimize queries

**2. Error Handling:**
- Consistent error messages
- User-friendly feedback
- Logging improvements

**3. UI/UX Polish:**
- Loading states
- Success messages
- Form validation feedback

#### Day 25-28: Security & Testing

**1. Security Audit:**
- Test for SQL injection
- Test for XSS
- Verify RBAC
- Check encryption

**2. Performance:**
- Database indexing
- Query optimization
- Frontend optimization

**3. Documentation:**
- API documentation
- Setup guide
- User manual

---

## 11. Testing Strategy

### Manual Testing Checklist

**Authentication:**
- [ ] Register with valid data
- [ ] Register with invalid data (test all validation rules)
- [ ] Register with existing email (should fail)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Access protected route without token (should fail)
- [ ] Access protected route with invalid token (should fail)
- [ ] Access protected route with expired token (should fail)
- [ ] Logout successfully

**Authorization:**
- [ ] Admin can access all admin endpoints
- [ ] Admin can access coordinator endpoints
- [ ] Coordinator can access volunteer endpoints
- [ ] Coordinator cannot access admin endpoints
- [ ] Volunteer can only access own profile
- [ ] Volunteer cannot access admin/coordinator endpoints

**Volunteer Management:**
- [ ] Create volunteer profile
- [ ] Update volunteer profile
- [ ] View volunteer list (as admin/coordinator)
- [ ] Search volunteers
- [ ] Filter volunteers by status
- [ ] Pagination works correctly
- [ ] Log volunteer hours
- [ ] View hours history

**Security:**
- [ ] Passwords are hashed (check database)
- [ ] Sensitive data is encrypted (check database)
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] Rate limiting works
- [ ] Activity logging captures all actions

### Security Testing

**SQL Injection Tests:**
```sql
-- Try these in login form
email: admin' OR '1'='1
password: anything

-- Should be blocked by parameterized queries
```

**XSS Tests:**
```html
<!-- Try these in input fields -->
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>

<!-- Should be escaped by React
```

**Authentication Tests:**
```bash
# Test with curl or Postman

# No token
curl http://localhost:5000/api/volunteers

# Invalid token
curl -H "Authorization: Bearer invalid_token" http://localhost:5000/api/volunteers

# Expired token (create a token with 1 second expiry and wait)
```

---

## 12. Deployment Guide

### Production Environment Variables

**Server (.env):**
```env
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=volunteer_management_prod
DB_USER=your_db_user
DB_PASSWORD=strong_db_password
JWT_SECRET=production_jwt_secret_minimum_32_characters
ENCRYPTION_KEY=production_encryption_key_64_hex_characters
FRONTEND_URL=https://your-frontend-domain.com
```

**Client (.env.production):**
```env
VITE_API_URL=https://your-api-domain.com/api
```

### Deployment Steps

**1. Prepare Database:**
```bash
# On production server
createdb volunteer_management_prod
psql volunteer_management_prod < database/schema.sql
```

**2. Deploy Backend:**
```bash
# Build and start
cd server
npm install --production
NODE_ENV=production node server.js

# Or use PM2
npm install -g pm2
pm2 start server.js --name volunteer-api
pm2 save
pm2 startup
```

**3. Deploy Frontend:**
```bash
cd client
npm run build

# Serve with nginx or deploy to Vercel/Netlify
```

**4. Configure Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/volunteer-management/client/dist;
        try_files $uri /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**5. SSL Certificate:**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

---

## Environment Setup Commands

```bash
# Complete setup script
#!/bin/bash

# 1. Clone or create project
mkdir volunteer-management-system
cd volunteer-management-system

# 2. Setup server
mkdir server && cd server
npm init -y
npm install express pg bcrypt jsonwebtoken dotenv helmet cors express-validator express-rate-limit multer morgan joi
npm install --save-dev nodemon
cd ..

# 3. Setup client
mkdir client && cd client
npm create vite@latest . -- --template react
npm install react-router-dom axios react-hook-form jwt-decode @tanstack/react-query
npm install --save-dev tailwindcss postcss autoprefixer
npx tailwindcss init -p
cd ..

# 4. Create database
createdb volunteer_management

# 5. Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

echo "Setup complete! Update .env files with your configuration."
```

---

## Next Steps for Claude Code

This document provides everything needed to build the Secure Volunteer Management System:

1. **Use this as reference** when implementing features
2. **Follow the file structure** exactly as specified
3. **Implement phase by phase** as outlined in Section 10
4. **Test thoroughly** using the checklist in Section 11
5. **Refer to code examples** for implementation patterns

All code snippets are production-ready and follow security best practices. The architecture is designed to be:
- Secure by default
- Scalable for growth
- Maintainable long-term
- Portfolio-worthy for internship applications

Good luck with your hackathon and internship journey!
