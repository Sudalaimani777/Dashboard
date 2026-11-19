# TripFlow Production Deployment & Operations Guide

> **Enterprise Production Infrastructure, Containerization, and Continuous Delivery Guide**  
> *Target System:* TripFlow Corporate Travel & Expense Governance Platform  
> *Runtime:* Node.js 20+ | *Frontend:* React 19 + Vite 8 | *Database:* PostgreSQL 14+ | *Orchestration:* Docker / Nginx / Cloud PaaS

---

## 🏛️ 1. Production Architecture Overview

TripFlow is architected for high availability, zero-downtime deployments, and strict operational security. In a production environment, the frontend single-page application (SPA) and backend Express API are decoupled and served through a high-performance reverse proxy with SSL termination.

```mermaid
flowchart TD
    subgraph Edge ["Edge & CDN Layer"]
        Users["Corporate Users\n(Desktop & Mobile Browsers)"]
        DNS["Route 53 / Cloudflare DNS\n(DDoS Protection & SSL/TLS 1.3)"]
    end

    subgraph Ingress ["Ingress & Reverse Proxy"]
        Nginx["Nginx Reverse Proxy / Load Balancer\n(Rate Limiting, Gzip/Brotli, SSL Termination)"]
    end

    subgraph Compute ["Compute Services"]
        SPA["Client Container / CDN Bucket\n(Vite 8 Static Bundle / Port 80)"]
        API1["TripFlow API Instance 1\n(Node.js 20 + Express 5)"]
        API2["TripFlow API Instance 2\n(Node.js 20 + Express 5)"]
    end

    subgraph Persistence ["Persistence & External Services"]
        DB[("Managed PostgreSQL Cluster\n(AWS RDS / Supabase / Neon)\nPrimary + Read Replica")]
        Cloudinary["Cloudinary CDN\n(Encrypted Proofs & Receipts)"]
        SMTP["Enterprise Mail Relay\n(Amazon SES / SendGrid)"]
    end

    Users --> DNS --> Nginx
    Nginx -- "/ (HTML/JS/CSS)" --> SPA
    Nginx -- "/api/* (REST + HttpOnly Cookies)" --> API1
    Nginx -- "/api/* (REST + HttpOnly Cookies)" --> API2
    API1 --> DB
    API2 --> DB
    API1 --> Cloudinary
    API1 --> SMTP
```

---

## 📦 2. Build Pipeline & Artifact Generation

TripFlow separates the client compilation from the server TypeScript transpile step.

### 2.1 Backend Build Pipeline (`server/`)
The backend compiles TypeScript source into ECMAScript modules in `server/dist`:

```bash
cd server
npm ci
npm run build
```
- **Input**: `server/src/**/*.ts`
- **Output**: `server/dist/`
- **Runtime Command**: `NODE_ENV=production node dist/index.js`

### 2.2 Frontend Build Pipeline (`client/`)
The client builds an optimized, code-split static single page bundle via Vite 8:

```bash
cd client
npm ci
npm run build
```
- **Type Check**: `tsc -b`
- **Bundler**: `vite build`
- **Output**: `client/dist/` (contains `index.html`, minified CSS with Tailwind v4, hashed JS chunks, and public assets)

---

## ⚙️ 3. Production Environment Configuration

All sensitive configuration must be delivered via secure environment variables. **Never check production `.env` files into version control.**

### 3.1 Production Environment Matrix (`server/.env`)

```ini
# ===============================================
# TripFlow Production Server Configuration
# ===============================================

# 1. Environment & Process
NODE_ENV=production
PORT=5000

# 2. Database (Managed PostgreSQL with SSL)
DATABASE_URL=postgresql://tripflow_admin:STRONG_PASSWORD_HERE@postgres.production.internal:5432/tripflow?sslmode=require

# 3. Security & Cryptographic Keys
# Generate with: openssl rand -hex 32
JWT_SECRET=f4a7c8e2b9d1e3f5a7c9b2d4e6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4
JWT_EXPIRES_IN=7d

# 4. Client URL & CORS Whitelist
# Must match your public production domain (HTTPS strictly required)
CLIENT_URL=https://travel.corp.yourcompany.com

# 5. Production Mailer (Amazon SES, SendGrid, or Corporate SMTP)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
EMAIL_FROM="TripFlow Governance <no-reply@corp.yourcompany.com>"

# 6. Cloudinary Production Storage
CLOUDINARY_CLOUD_NAME=corporate-tripflow-prod
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz12345
```

> [!WARNING]
> **Production Cookie Invariant**: When `NODE_ENV=production`, TripFlow sets `secure: true` on the `token` cookie. The client application **must** be served over HTTPS; otherwise, browsers will reject the session cookie, preventing user sign-in.

---

## 🐳 4. Containerization with Docker

TripFlow provides production-ready, multi-stage Dockerfiles designed for minimal image sizes, non-root execution, and caching efficiency.

### 4.1 Server Dockerfile (`server/Dockerfile`)

```dockerfile
# Multi-stage Dockerfile for TripFlow Express Server
# Stage 1: Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled files and migrations
COPY --from=builder /app/dist ./dist
COPY src/shared/db/migrations ./dist/shared/db/migrations
COPY src/shared/db/migrations ./src/shared/db/migrations

# Create non-root system user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000
CMD ["node", "dist/index.js"]
```

---

### 4.2 Client Dockerfile (`client/Dockerfile`)

```dockerfile
# Multi-stage Dockerfile for TripFlow React Client
# Stage 1: Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: High-Performance Nginx Static Server
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### 4.3 Orchestration: Docker Compose (`docker-compose.prod.yml`)

```yaml
version: '3.8'

services:
  # 1. PostgreSQL Database Service
  postgres:
    image: postgres:16-alpine
    container_name: tripflow-postgres
    restart: always
    environment:
      POSTGRES_DB: tripflow
      POSTGRES_USER: tripflow_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tripflow_user -d tripflow"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - tripflow-internal

  # 2. TripFlow Backend API Service
  api:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: tripflow-api
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      PORT: 5000
      NODE_ENV: production
      DATABASE_URL: postgresql://tripflow_user:${DB_PASSWORD}@postgres:5432/tripflow
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      CLIENT_URL: ${CLIENT_URL}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      EMAIL_FROM: ${EMAIL_FROM}
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
    networks:
      - tripflow-internal

  # 3. Client SPA & Ingress Proxy
  web:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: tripflow-web
    restart: always
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    volumes:
      - ./nginx.prod.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - tripflow-internal

volumes:
  pgdata:
    driver: local

networks:
  tripflow-internal:
    driver: bridge
```

---

## 🌐 5. Production Nginx Reverse Proxy Configuration

Below is an enterprise-grade Nginx configuration featuring HTTP-to-HTTPS redirection, SSL hardening, rate limiting, and caching policies.

```nginx
# /etc/nginx/conf.d/tripflow.conf

# 1. Rate Limiting Zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

# 2. HTTP to HTTPS Redirection
server {
    listen 80;
    listen [::]:80;
    server_name travel.corp.yourcompany.com;
    return 301 https://$host$request_uri;
}

# 3. HTTPS Server Block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name travel.corp.yourcompany.com;

    # SSL Certificates (Let's Encrypt / Custom Corporate Cert)
    ssl_certificate /etc/letsencrypt/live/travel.corp.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/travel.corp.yourcompany.com/privkey.pem;

    # SSL Protocol & Cipher Hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Enterprise Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Compression Settings
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    # Static Frontend Assets
    root /usr/share/nginx/html;
    index index.html;

    # Client-Side Routing Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static Asset Aggressive Caching
    location ~* \.(?:css|js|woff2?|svg|png|jpg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # API Proxy Routing
    location /api/ {
        limit_req zone=api_limit burst=30 nodelay;

        proxy_pass http://tripflow-api:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for Cloudinary file uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        client_max_body_size 12M;
    }

    # Strict Rate Limiting on Authentication Endpoints
    location /api/auth/signin {
        limit_req zone=auth_limit burst=5 nodelay;
        proxy_pass http://tripflow-api:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🗄️ 6. Database Production Operations & Migrations

### 6.1 Executing Migrations in Production
Database migrations must be applied as part of the deployment pipeline **prior** to bringing up new application containers:

```bash
# In the CI/CD deployment runner or Kubernetes init container:
cd server
npm run migrate
```
The migration script is idempotent and transactional:
- If a migration fails, the entire transaction rolls back (`ROLLBACK`).
- Completed migrations are recorded in `schema_migrations`.

### 6.2 Connection Pooling Tuning (`server/src/shared/db/pool.ts`)
For high-concurrency production deployments, tune PostgreSQL pool parameters:

```typescript
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 25,                       // Maximum clients in the pool per Node instance
  idleTimeoutMillis: 30000,      // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5s if connection cannot be made
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

### 6.3 Backup & Disaster Recovery Runbook
1. **Automated Nightly Backups**:
   ```bash
   pg_dump -Fc -h postgres.production.internal -U tripflow_user tripflow > /backups/tripflow_$(date +%Y%m%d_%H%M%S).dump
   ```
2. **Point-In-Time-Recovery (PITR)**: Enable Write-Ahead Logging (WAL) archiving to Amazon S3 or GCP Cloud Storage.
3. **Database Restoration Test**:
   ```bash
   pg_restore -C -d postgres -U tripflow_user /backups/tripflow_20261118.dump
   ```

---

## 🚀 7. Continuous Integration & Delivery (CI/CD)

Below is an automated **GitHub Actions** deployment pipeline (`.github/workflows/deploy.yml`):

```yaml
name: TripFlow CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  # 1. Quality & Test Gate
  test-and-verify:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: tripflow_test
          POSTGRES_PASSWORD: testpassword
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout Source
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Backend Lint & Tests
        env:
          DATABASE_URL: postgresql://postgres:testpassword@localhost:5432/tripflow_test
          JWT_SECRET: test-secret-key-for-continuous-integration-1234
        run: |
          cd server
          npm ci
          npm run migrate
          npm run test:fsm
          npm run test:repo
          npm run test:service
          npm run test:api
          npm run test:dates

      - name: Frontend Build Verification
        run: |
          cd client
          npm ci
          npm run build

  # 2. Container Build & Zero-Downtime Rollout
  deploy-production:
    needs: test-and-verify
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & Push API Image
        uses: docker/build-push-action@v5
        with:
          context: ./server
          push: true
          tags: ghcr.io/${{ github.repository }}/tripflow-api:latest

      - name: Build & Push Web Image
        uses: docker/build-push-action@v5
        with:
          context: ./client
          push: true
          tags: ghcr.io/${{ github.repository }}/tripflow-web:latest

      - name: Deploy to Production Host via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/tripflow
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml run --rm api npm run migrate
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

---

## 📈 8. Monitoring, Observability & Health Probes

### 8.1 Production Health Check Probes
The backend exposes `GET /api/health` for Kubernetes / load balancer health probes:

```bash
# Probe Command
curl -f http://localhost:5000/api/health || exit 1
```

- **Liveness Probe**: Confirms the Express process is accepting event loop cycles.
- **Readiness Probe**: Queries `SELECT 1` against the PostgreSQL connection pool to verify database connectivity.

### 8.2 Production Logging
- Node.js server logs to `stdout` / `stderr`.
- Use a log shipping agent (Vector, FluentBit, or AWS CloudWatch Agent) to forward logs to Datadog or ELK Stack.
- Critical log markers to alert on:
  - `Unexpected error on idle PostgreSQL client`
  - `Cloudinary upload failed`
  - `Invalid status transition` (potential state tampering)

---

## 🔄 9. Rollback Runbook

If a critical defect is identified post-release:
1. **Container Rollback**:
   ```bash
   docker compose -f docker-compose.prod.yml down
   # Point image tags to previous stable SHA
   docker compose -f docker-compose.prod.yml up -d
   ```
2. **Database Reversion**:
   If a migration must be reverted, examine the specific SQL file in `server/src/shared/db/migrations/` and execute the corresponding `DROP` or `ALTER` statement via `psql`.
3. **Session Invalidation**:
   If an auth issue occurs during the incident, rotate `JWT_SECRET` in `.env` and restart the API container to force all users to re-authenticate.
