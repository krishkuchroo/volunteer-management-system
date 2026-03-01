# Deployment Guide

## Production Environment Variables

### server/.env
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

### client/.env.production
```env
VITE_API_URL=https://your-api-domain.com/api
```

## Steps

### 1. Database
```bash
createdb volunteer_management_prod
psql volunteer_management_prod < database/schema.sql
```

### 2. Backend
```bash
cd server
npm install --omit=dev
NODE_ENV=production node server.js

# Or with PM2:
npm install -g pm2
pm2 start server.js --name volunteer-api
pm2 save && pm2 startup
```

### 3. Frontend
```bash
cd client
npm run build
# Serve dist/ with nginx or deploy to Vercel/Netlify
```

### 4. Nginx Config
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/volunteer-management/client/dist;
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. SSL
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```
