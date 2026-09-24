# Backend Conventions & Architecture Rules

## 1. Module Boundaries
The backend is organized into domain-specific modules under `src/modules/` (e.g., `auth`, `users`, `bloodRequests`, `donations`).
Each module encapsulates its own:
- Controller (`*.controller.ts`)
- Route definitions (`*.routes.ts`)
- Service / Use cases (`*.service.ts`)
- Repository / Data access (`*.repository.ts`)
- Mongoose model / Schema (`*.model.ts`)
- Validation schema (`*.validation.ts`)
- DTOs / Types
- Tests (`*.test.ts`)

Shared infrastructure (e.g., logging, error handling, middlewares) remains centralized in `src/core/` and `src/shared/`.

## 2. Naming Conventions
- **Files:** `camelCase.ts` (e.g., `auth.middleware.ts`, `reminder.job.ts`).
- **Classes:** `PascalCase` (e.g., `BloodRequestService`).
- **Variables/Functions:** `camelCase` (e.g., `createBloodRequest`).
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`).
- **Interfaces/Types:** `PascalCase` (e.g., `IUser`).

## 3. Response Envelope
Every API response (success or failure) must follow a consistent format.
**Success:**
```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "..." }
}
```
**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "details": []
  },
  "meta": { "requestId": "..." }
}
```

## 4. Error Codes & HTTP Statuses
- 200 Success, 201 Created, 204 No Content
- 400 Bad Request / Malformed
- 401 Unauthenticated
- 403 Unauthorized
- 404 Not Found
- 409 Conflict / Duplicate
- 422 Semantic Validation Error
- 429 Rate Limit Exceeded
- 500 Internal Server Error
- 503 Dependency Unavailable

## 5. Auth Strategy & Identity
- **One-User Identity:** A single user identity model (`User`). A user can be a donor, recipient, or both.
- **Roles:** `USER` (default) and `ADMIN` (privileged).
- **Authentication:** JWT Access tokens + Refresh tokens. Strong password hashing (Bcrypt). OTPs for email/phone verification and password resets.

## 6. Privacy Policy (API Layer)
- **Donor Search:** Public search APIs must **never** expose donor phone, email, WhatsApp, full address, or exact geospatial coordinates.
- **Contact Request:** Donor PII is only revealed when the donor explicitly **accepts** a contact request.

## 7. Status Enums
- **Blood Requests:** `DRAFT`, `PENDING_VERIFICATION`, `VERIFIED`, `ACTIVE`, `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED`, `EXPIRED`.
- **Urgency:** `NORMAL`, `URGENT`, `EMERGENCY`.
- **Contact Requests:** `PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `COMPLETED`.

## 8. Audit Policy
Audit logs (`AuditLog` collection) must be generated for all critical and sensitive actions: Role changes, request verification, emergency broadcast, contact reveal, donation verification, payment state changes, certificate issuance, and admin destructive actions.

## 9. Testing Commands
- `npm run test` (Runs all tests via Jest)
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run lint` & `npm run typecheck`
