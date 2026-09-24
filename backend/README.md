# Blood Sanjal - Backend

This is the Node.js + Express + TypeScript backend for the Blood Sanjal platform.

## Architecture & Tech Stack

- **Framework:** Express + Node.js
- **Language:** TypeScript
- **Database:** MongoDB + Mongoose
- **Validation:** Zod
- **Logging:** Winston (Structured JSON logging)
- **Security:** Helmet, express-rate-limit, CORS config
- **Testing:** Jest + Supertest

## Local Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy the example environment file and update it with your local credentials.
   ```bash
   cp .env.example .env
   ```
   *Note: Make sure your local MongoDB instance is running, or provide an Atlas URI.*

3. **Run Development Server:**
   ```bash
   npm run dev
   ```
   The server should start on `http://localhost:3000` (or your configured `PORT`).

4. **Run Tests:**
   ```bash
   npm test
   ```

## Folder Structure
- `/src/config`: Environment, Database, and Logger configurations.
- `/src/core`: Shared HTTP handlers, middlewares (error, notFound, requestId), and Error definitions.
- `/src/modules`: Domain-specific features (Auth, Users, Donors, etc.).
- `/tests`: Integration and unit tests.

## Seed Scripts
*(Coming soon in B27 phase)*

## API Conventions
All APIs return a structured response envelope:
```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "uuid" }
}
```
