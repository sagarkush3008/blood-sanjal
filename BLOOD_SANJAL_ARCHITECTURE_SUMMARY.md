# Blood Sanjal — Backend AI Specification & Architecture Blueprint

> Complete permanent specification extracted from **"Blood Sanjal: Complete Backend AI Prompt Pack"** by Evolvix Infotech (Pages 1–9).

---

## 1. Master Coding-Agent Directives
- **Role**: Senior Backend Engineer for Blood Sanjal.
- **Technology Stack**: Node.js + Express + TypeScript + MongoDB / Mongoose + Cloudinary (controlled media) + Nodemailer (server-side email).
- **Strictly Prohibited**: DO NOT use PostgreSQL, Prisma, TypeORM, or Sequelize.
- **The Core Law**: Never declare a module complete simply because the server boots or a route returns `200 OK`.
  - **B1**: Implement routes, services, DTOs, data access, and input validation.
  - **B2**: Prove real behavior with tests, RBAC, authorization, side-effects, retries, failure states, and audit evidence.
- **Timezone**: All dates in database and JSON responses are UTC. Clients format for `Asia/Kathmandu`.
- **OpenAPI**: Swagger/OpenAPI must match actual mounted routes.

---

## 2. Complete Backend Scope Matrix (16 Core Domains)

| Domain | Required Backend Responsibility |
| :--- | :--- |
| **Auth** | Register, OTP, login, refresh/session, logout, password reset, account recovery |
| **Users / Privacy** | Profile, blood group, location, privacy and donor preferences |
| **Donors** | Donor profile, activation, search, availability and privacy-safe DTOs |
| **Contact Requests** | Request, accept/decline/cancel, consent-controlled contact reveal |
| **Blood Requests** | Create, evidence, verify, activate, match, fulfill, close, cancel, timeline |
| **Emergency** | Create, verify, admin approve/reject, idempotent broadcast, responses, close |
| **Donations** | Record, evidence, admin verification, counters, reminders, rewards, certificates |
| **Campaigns** | Blood camps, publish/schedule/archive, participants and reminders |
| **Notifications** | In-app, push adapter, targeted/scheduled notifications and email side effects |
| **Rewards** | Milestones, badges, issuance and duplicate prevention |
| **Certificates** | Issue, secure document, verification code and public verification |
| **Payments** | Fee/payment intent, provider adapter, webhook verification and status |
| **Files** | Cloudinary upload, validation, ownership and signed/private access |
| **Admin** | Dashboard, users, donors, requests, emergency, donations, campaigns, notifications, payments, reports, audit, settings |
| **Reports** | Users, donors, blood demand, requests, donations, campaigns, payments, locations |
| **Security** | RBAC, object auth, rate limits, validation, privacy, audit, request IDs |

---

## 3. Project Directory Structure

```
backend/
├── src/
│   ├── config/             # Environment, DB, Cloudinary, Nodemailer configurations
│   ├── common/             # Errors, middleware, auth, validation, pagination, idempotency, audit
│   ├── modules/
│   │   ├── auth/           # Registration, login, OTP, tokens, password recovery
│   │   ├── users/          # Profiles, settings, location, privacy
│   │   ├── donors/         # Search, donor profiles, availability
│   │   ├── contactRequests/# Consent-based contact reveal state machine
│   │   ├── bloodRequests/  # Blood requests, urgency, verification, fulfillment
│   │   ├── emergency/      # Admin approval & idempotent broadcast
│   │   ├── donations/      # Verified donation records & counters
│   │   ├── campaigns/      # Blood camp management & participants
│   │   ├── notifications/  # Push, email, in-app notification jobs
│   │   ├── rewards/        # Badges, milestones, issuance rules
│   │   ├── certificates/   # Issuance, PDF generation, public QR verification
│   │   ├── payments/       # Gateway adapters, webhook handlers, verification
│   │   ├── files/          # Cloudinary upload, validation, signed access
│   │   ├── reports/        # Analytics, blood demand aggregations
│   │   ├── admin/          # Admin APIs & verification workflows
│   │   └── settings/       # System configuration & parameters
│   ├── integrations/       # Cloudinary, Mail, Payments (eSewa/Khalti), Push adapters
│   ├── jobs/               # Background schedulers, queue workers
│   ├── docs/               # OpenAPI / Swagger specs
│   └── server.ts           # Application bootstrap & graceful shutdown
├── tests/                  # Unit, Integration, Contract, E2E suites
├── scripts/                # Seeds, migrations, dev utilities
├── package.json
└── README.md
```

---

## 4. MongoDB Collections & Schemas

| Collection | Key Fields | Purpose |
| :--- | :--- | :--- |
| `User` | `name`, `email`, `phone`, `passwordHash`, `role` (`DONOR`, `RECIPIENT`, `ADMIN`, `SUPER_ADMIN`), `status` (`ACTIVE`, `SUSPENDED`, `PENDING`), `verification`, `bloodGroup`, `location`, `timestamps` | Core identity & authentication |
| `DonorProfile` | `userId`, `bloodGroup`, `active`, `availability`, `privacy`, `lastDonationAt`, `counters` (`totalDonations`, `livesSaved`) | Donor state, eligibility & stats |
| `ContactRequest`| `requesterId`, `donorId`, `status` (`PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`), `consent`, `revealState`, `timestamps` | Privacy-preserving contact reveal |
| `BloodRequest` | `requesterId`, `bloodGroup`, `location`, `urgency` (`NORMAL`, `URGENT`), `hospital`, `details`, `evidence`, `status`, `verification`, `fulfillment` | Blood requests lifecycle |
| `EmergencyRequest` | `request reference`, `verification`, `approval`, `broadcast state`, `audit state` | Rapid emergency broadcast with admin gating |
| `Donation` | `donorId`, `campaignId`, `date`, `location`, `evidence`, `status`, `verifier`, `timestamps` | Verified donation proofs & counter updates |
| `Campaign` | `title`, `organizer`, `description`, `media`, `venue`, `location`, `dates`, `neededGroups`, `status` | Blood donation camp events |
| `CampaignParticipant` | `campaignId`, `userId`, `status`, `reminder state` | Blood camp RSVPs & attendees |
| `Notification` | `userId`, `type`, `title`, `body`, `data`, `channel` (`IN_APP`, `PUSH`, `EMAIL`), `readAt`, `delivery state` | Multi-channel user notifications |
| `NotificationJob` | `event/audience`, `channel`, `status`, `attempts`, `idempotencyKey` | Reliable background notification worker |
| `Reward` / `UserReward` | `milestones`, `badges`, `criteria`, `user issuance and uniqueness` | Donor recognition & gamification |
| `Certificate` | `userId`, `donationId`, `certificateNumber`, `verifyCode`, `assetId`, `status` | Verified PDF certificates & verification |
| `Payment` | `userId`, `purpose`, `amount`, `currency`, `provider`, `providerReference`, `status`, `idempotencyKey` | Platform payments & search fee processing |
| `FileAsset` | `ownerId`, `entityType/id`, `Cloudinary publicId`, `resourceType`, `secureUrl`, `accessPolicy` | Managed media & medical evidence |
| `AuditEvent` | `actorId`, `role`, `action`, `entityType/id`, `requestId`, `safe metadata`, `timestamp` | Immutable compliance and security log |
| `AdminSetting` | `key`, `value`, `type`, `description`, `updatedBy` | Dynamic application runtime settings |

---

## 5. API Envelopes & Contract Rules

### Success Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "c1f7a634-...",
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Donor phone number is invalid.",
    "fields": {
      "phone": "Must be a valid 10-digit mobile number."
    }
  },
  "meta": {
    "requestId": "c1f7a634-..."
  }
}
```

---

## 6. Complete 30-Stage B1/B2 Sequential Development Plan

1. **Stage 01 — Foundation**: Express/TS setup, env validation, MongoDB connection, central error handling, request correlation IDs, health/readiness endpoints (`/health/live`, `/health/ready`), graceful shutdown.
2. **Stage 02 — Authentication**: Registration, OTP generation & verification, JWT access/refresh token pair, session management, logout, password recovery.
3. **Stage 03 — Nodemailer**: Central email adapter, templates (OTP, reset, contact request, blood request, emergency broadcast, reminders, rewards, certificates), retry-safe delivery.
4. **Stage 04 — Users & Privacy**: `/me` profile endpoints, blood group, location hierarchy, privacy preferences, donor preferences, IDOR protection.
5. **Stage 05 — Donors & Search**: Search filters (blood group, province, district, city, coordinates), availability toggle, privacy-safe DTOs (masked phone/email/exact location).
6. **Stage 06 — Contact Requests**: Contact request lifecycle (`PENDING` → `ACCEPTED` / `DECLINED` / `CANCELLED`), consent-controlled contact reveal.
7. **Stage 07 — Blood Requests**: Create request, attach medical prescription/evidence, verification, activation, matching donors notified, fulfillment, timeline.
8. **Stage 08 — Emergency**: Emergency request creation, administrative verification queue, approved/rejected flow, idempotent broadcast notification jobs, donor response tracking.
9. **Stage 09 — Donations**: Create donation record, upload evidence, administrative verification queue, updating donor stats & counters upon verification.
10. **Stage 10 — Reminders**: Server-side donation eligibility calculation (e.g., 90 days post-donation), automated notification scheduling, opt-out handling.
11. **Stage 11 — Campaigns**: Blood donation camps CRUD, draft/publish/schedule/archive lifecycles, participant registration, reminders, Cloudinary banners.
12. **Stage 12 — Notifications**: In-app inbox, read/unread states, targeted & scheduled notifications, push notification adapter, delivery status.
13. **Stage 13 — Rewards**: Milestone badges (e.g., 1st Donation, 5 Donations, Bronze, Silver, Gold), deterministic criteria validation, duplicate prevention.
14. **Stage 14 — Certificates**: Certificate generation upon verified donation, unique verification codes, public verification API.
15. **Stage 15 — Payments**: Payment intent creation, payment gateway abstraction (eSewa / Khalti / Mock), webhook validation, signature verification, idempotent status update.
16. **Stage 16 — Cloudinary**: File upload handler, MIME validation, size limits, ownership verification, private/signed access for medical prescriptions.
17. **Stage 17 — Admin Users & Donors**: Administrative user search, detail view, role management, account suspension/activation, audit logging.
18. **Stage 18 — Admin Requests & Emergency**: Blood request queue, emergency request approval/rejection, broadcast monitor, full audit history.
19. **Stage 19 — Admin Donations**: Donation verification queue, proof inspection, approve/reject workflow with atomic counter side-effects.
20. **Stage 20 — Admin Campaigns**: Campaign creation, editorial approval, participant lists, schedule management.
21. **Stage 21 — Admin Notifications**: Broadcast composer, targeted audience filters (by blood group, district, role), scheduled job runner.
22. **Stage 22 — Admin Payments**: Transaction ledger, financial summaries, provider reconciliation.
23. **Stage 23 — Reports & Analytics**: Aggregated KPIs, blood demand heatmaps, donation trends, monthly summaries.
24. **Stage 24 — Audit System**: Immutable audit event service, querying audit events with role and date filters.
25. **Stage 25 — Platform Settings**: Dynamic system settings (emergency radiuses, reminder thresholds, contact reveal rules).
26. **Stage 26 — Security Hardening**: Helmet security headers, strict CORS, rate limiting, NoSQL injection defenses, parameter validation.
27. **Stage 27 — Comprehensive Test Suite**: Unit, integration, contract, and E2E automated test runs.
28. **Stage 28 — Idempotent Seeding**: Realistic seed data for development, staging, and demo environments with production guards.
29. **Stage 29 — Production Readiness**: Docker containerization, health check integration, log aggregation, backup strategies.
30. **Stage 30 — Final No-Feature-Left-Behind Audit**: Complete traceability matrix verifying every requirement against active code, routes, and tests.

---

## 7. Admin Panel API Contract

- `GET /api/v1/admin/dashboard/summary` — Overview metrics and KPIs
- `GET /api/v1/admin/users` — Search and filter users
- `GET /api/v1/admin/users/:id` — Detailed user view
- `PATCH /api/v1/admin/users/:id/status` — Modify user status (ACTIVE, SUSPENDED)
- `GET /api/v1/admin/donors` — List donors with availability and status
- `GET /api/v1/admin/blood-requests` — Blood requests verification queue
- `POST /api/v1/admin/blood-requests/:id/verify` — Verify blood request
- `GET /api/v1/admin/emergency-requests` — Emergency broadcast queue
- `POST /api/v1/admin/emergency-requests/:id/approve` — Approve & broadcast emergency
- `POST /api/v1/admin/emergency-requests/:id/reject` — Reject emergency request
- `GET /api/v1/admin/donations` — Donations verification queue
- `POST /api/v1/admin/donations/:id/verify` — Verify donation and credit counters
- `GET /api/v1/admin/campaigns` — List all campaigns
- `POST /api/v1/admin/campaigns` — Create new campaign
- `PATCH /api/v1/admin/campaigns/:id` — Update or publish campaign
- `POST /api/v1/admin/notifications` — Send targeted notification
- `POST /api/v1/admin/notifications/schedule` — Schedule broadcast
- `GET /api/v1/admin/payments` — Financial transaction list
- `GET /api/v1/admin/reports/:reportType` — Generate domain reports
- `GET /api/v1/admin/audit-events` — Read immutable audit log
- `GET/PATCH /api/v1/admin/settings/:key` — Manage system settings

---

## 8. Security & Privacy Acceptance Gates

- **Passwords**: Bcrypt/Argon2 hashing with salt; never stored or logged in plaintext.
- **OTPs**: 6-digit cryptographic random codes, 5–10 min TTL, single-use, rate-limited.
- **Sessions**: JWT access tokens (15m expiry) + revocable refresh tokens (7d–30d).
- **Object-Level Authorization**: Users cannot read or manipulate records belonging to other users.
- **Zero-PII Search**: Public search never returns phone, email, WhatsApp, or exact GPS coordinates.
- **Emergency Broadcast**: Requires administrative verification before triggering push/SMS/email jobs.
- **Idempotency**: All webhook handlers and broadcast jobs use idempotency keys.
- **Audit Logging**: All administrative actions produce immutable audit records with actor ID, timestamp, and action metadata.

---

## 9. Definition of Done (DoD)

The backend is declared complete when:
1. Every functional requirement (P0, P1, P2) is fully implemented.
2. Every protected endpoint enforces authentication + RBAC + ownership authorization.
3. Donor privacy is mathematically protected by DTO filtering.
4. Emergency broadcasts are idempotent, auditable, and admin-gated.
5. Cloudinary uploads are validated and ownership-verified.
6. Email sends are retry-safe and never log secrets.
7. Payment state transitions are webhook-authoritative.
8. Unit, integration, and E2E test suites pass with 0 errors.
9. OpenAPI documentation exactly matches live routes.
10. The final audit matrix has 0 unexplained missing items.
