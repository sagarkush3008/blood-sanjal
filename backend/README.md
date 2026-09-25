# Blood Sanjal - Backend

This is the Node.js + Express + TypeScript backend for the Blood Sanjal platform.

## Architecture & Tech Stack
- **Framework:** Express + Node.js
- **Language:** TypeScript
- **Database:** MongoDB + Mongoose
- **Queues/Jobs:** BullMQ + Redis
- **Validation:** Zod
- **Logging:** Winston (Structured JSON logging)
- **Security:** Helmet, express-rate-limit, CORS config
- **Testing:** Jest + Supertest

---

## 📖 Runbook: Local Setup & Configuration

### 1. General Setup
1. Install dependencies: `npm install`
2. Create your `.env` file: `cp .env.example .env`

### 2. MongoDB Setup
- **Local:** Install MongoDB Community Edition and ensure it runs on port `27017`. Set `MONGODB_URI=mongodb://localhost:27017/blood-sanjal-test`.
- **Atlas (Production):** Create a cluster, whitelist your deployment IPs, and set `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/bloodsanjal?retryWrites=true&w=majority`.

### 3. Redis Setup
- **Local:** Install Redis and run it on port `6379`. Set `REDIS_URL=redis://localhost:6379`.
- **Production:** Use a managed Redis (e.g. Upstash, AWS ElastiCache) and set `REDIS_URL=rediss://<user>:<pass>@host:port`.

### 4. Cloudinary Setup
Cloudinary is used for storing verification documents and campaign banners.
- Sign up at [Cloudinary](https://cloudinary.com).
- Copy your Cloud Name, API Key, and API Secret into `.env` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).

### 5. SMTP (Email) Setup
Nodemailer is used for notifications, OTP, and resets.
- **Local/Test:** Use [Mailtrap](https://mailtrap.io). Set `SMTP_HOST=smtp.mailtrap.io`, `SMTP_PORT=2525`, and update `SMTP_USER`/`SMTP_PASS`.
- **Production:** Use SendGrid, AWS SES, or Mailgun with TLS. Set `SMTP_SECURE=true`.

---

## 🛠️ Execution & Testing

### Seeding the Database
To populate your local environment with safe, fictional demo data (users, donors, campaigns, requests, etc.):
```bash
npm run seed
```
To wipe existing data before seeding (WARNING: Do not run in production):
```bash
npm run seed -- --reset
```

### Running the App
- **Development Mode:** `npm run dev`
- **Build:** `npm run build`
- **Production Mode:** `npm start` (Runs `dist/src/server.js`)

### Running Tests
Execute the comprehensive test suite (Unit, Integration, E2E):
```bash
npm test
```

---

## 🚀 Deployment & Production Readiness

This application is containerized and ready for CI/CD.

### Docker Deployment
1. Build the image:
   ```bash
   docker build -t blood-sanjal-backend .
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 --env-file .env blood-sanjal-backend
   ```

### Production Safeguards
- **Startup Validation:** The app will `FATAL` crash if started in `NODE_ENV=production` using default dummy secrets. You MUST provide secure values for `JWT_ACCESS_SECRET`, `MONGODB_URI`, `CLOUDINARY_API_SECRET`, etc.
- **Health Checks:** Container orchestration (K8s/ECS) can probe `/health` (Liveness) and `/ready` (Readiness, ensures DB connection is established).
- **Graceful Shutdown:** The server listens to `SIGTERM` and `SIGINT` to cleanly close HTTP and DB connections before exiting.
- **API Documentation:** The Swagger UI at `/api-docs` is automatically disabled when `NODE_ENV=production` to prevent leaking API schemas.

---

## 🩺 Troubleshooting

- **Redis Connection Refused / Job Errors:** Ensure Redis is running (`redis-cli ping`). If disabled, workers will fail to start.
- **MongoDB Timeout / Readiness Failing:** The `/ready` endpoint returns 503 if Mongoose is not connected. Check your `MONGODB_URI` and network firewalls.
- **Emails Not Sending:** Verify SMTP credentials. In local dev, check the Mailtrap inbox.
- **Seed Script Fails in Prod:** This is intentional. The seed script is hard-blocked from running in production to prevent data wiping.
