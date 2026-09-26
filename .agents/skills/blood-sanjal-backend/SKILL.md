---
name: blood-sanjal-backend
description: Comprehensive backend architecture, 30-stage B1/B2 roadmap, security gates, schemas, and workflows for Blood Sanjal.
---

# Blood Sanjal — Complete Backend Specification & AI Prompt Pack

Reference: Evolvix Infotech — Blood Sanjal Complete Backend AI Prompt Pack (Pages 1 to 9).

## 1. Master Architecture & Mandates
- **Stack**: Node.js, Express, TypeScript, MongoDB / Mongoose, Cloudinary, Nodemailer.
- **Forbidden**: PostgreSQL, Prisma, TypeORM, Sequelize.
- **Core Principle**: B1 implements. B2 proves real behavior with tests, RBAC, side-effects, retries, failure states, and audit evidence.
- **Privacy Rule**: Donor phone, email, WhatsApp, full address, and exact location remain private until the consent workflow authorizes reveal.
- **Emergency Rule**: Emergency broadcasts must NEVER happen before required verification/approval.
- **Financial Rule**: Payments are authoritative only from backend/provider webhook state; never trust client-side success flags.
- **Cloudinary Rule**: Secrets stay server-side; private evidence uses authorized/signed access.
- **Nodemailer Rule**: Nodemailer runs on backend only; SMTP credentials and tokens are never logged.
- **Idempotency**: Use idempotency keys for retry-sensitive operations and unique database constraints.
- **Timezone**: UTC timestamps in JSON; clients format for `Asia/Kathmandu`.
- **OpenAPI**: Swagger/OpenAPI must match actual mounted routes.
- **Audit**: Every sensitive admin mutation creates an immutable `AuditEvent`.

---

## 2. Complete Backend Scope Matrix

1. **Auth**: Register, OTP, login, refresh/session, logout, password reset, account recovery.
2. **Users / Privacy**: Profile, blood group, location, privacy and donor preferences.
3. **Donors**: Donor profile, activation, search, availability, privacy-safe DTOs.
4. **Contact Requests**: Create, accept/decline/cancel, consent-controlled contact reveal.
5. **Blood Requests**: Create, evidence, verify, activate, match, fulfill, close, cancel, timeline.
6. **Emergency**: Create, verify, admin approve/reject, idempotent broadcast, responses, close.
7. **Donations**: Record, evidence, admin verification, counters, reminders, rewards, certificates.
8. **Campaigns**: Blood camps, publish/schedule/archive, participants, reminders.
9. **Notifications**: In-app, push adapter, targeted/scheduled notifications, email side-effects.
10. **Rewards**: Milestones, badges, issuance, duplicate prevention.
11. **Certificates**: Issue, secure document, verification code, public verification.
12. **Payments**: Fee/payment intent, provider adapter, webhook verification, status.
13. **Files**: Cloudinary upload, validation, ownership, signed/private access.
14. **Admin**: Dashboard, users, donors, requests, emergency, donations, campaigns, notifications, payments, reports, audit, settings.
15. **Reports**: Users, donors, blood demand, requests, donations, campaigns, payments, locations.
16. **Security**: RBAC, object auth, rate limits, validation, privacy, audit, request IDs.

---

## 3. MongoDB Collections & Schemas

- **`User`**: name, email, phone, passwordHash, role, status, verification, bloodGroup, location, timestamps.
- **`DonorProfile`**: userId, bloodGroup, active, availability, privacy, lastDonationAt, counters.
- **`ContactRequest`**: requesterId, donorId, status, consent, revealState, timestamps.
- **`BloodRequest`**: requesterId, bloodGroup, location, urgency, hospital, details, evidence, status, verification, fulfillment.
- **`EmergencyRequest`**: request reference, verification, approval, broadcast state, audit state.
- **`Donation`**: donorId, campaignId, date, location, evidence, status, verifier, timestamps.
- **`Campaign`**: title, organizer, description, media, venue, location, dates, neededGroups, status.
- **`CampaignParticipant`**: campaignId, userId, status, reminder state.
- **`Notification`**: userId, type, title, body, data, channel, readAt, delivery state.
- **`NotificationJob`**: event/audience, channel, status, attempts, idempotencyKey.
- **`Reward` / `UserReward`**: milestones, badges, criteria, user issuance and uniqueness.
- **`Certificate`**: userId, donationId, certificateNumber, verifyCode, assetId, status.
- **`Payment`**: userId, purpose, amount, currency, provider, providerReference, status, idempotencyKey.
- **`FileAsset`**: ownerId, entityType/id, Cloudinary publicId, resourceType, secureUrl, accessPolicy.
- **`AuditEvent`**: actorId, role, action, entityType/id, requestId, safe metadata, timestamp.
- **`AdminSetting`**: key, value, type, description, updatedBy.

---

## 4. API Contract Rules

### Standard Envelopes
- **Success (2xx)**:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "requestId": "uuid", "page": 1, "limit": 20, "total": 0 }
  }
  ```
- **Error (4xx / 5xx)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Readable error message",
      "fields": { "field": "Reason" }
    },
    "meta": { "requestId": "uuid" }
  }
  ```

---

## 5. B1/B2 30-Stage Sequential Development Roadmap

| Stage | Module | B1 Implementation | B2 Verification & Proof |
| :--- | :--- | :--- | :--- |
| **01** | Foundation | Express/TS app, env validation, MongoDB, errors, request IDs, health/readiness, graceful shutdown | Clean checkout, missing-env & Mongo outage tests |
| **02** | Authentication | Register, OTP, login, refresh/session, logout, forgot/reset | Expiry, replay, brute-force, cross-account & session revocation tests |
| **03** | Nodemailer | Mail adapter, templates, delivery records, retry-safe sends (cover OTP, reset, contact, blood request, emergency, reminder, reward, cert) | SMTP outage, duplicate send & secret-leak tests |
| **04** | Users & Privacy | `/me`, profile, blood group, location, privacy, donor preferences | IDOR / cross-user / privacy regression tests |
| **05** | Donors & Search | Donor profile, activation, blood/location filters, availability, privacy-safe DTOs | Prove restricted fields never leak |
| **06** | Contact Requests | Create / accept / decline / cancel, consent reveal | Race, duplicate & unauthorized reveal tests |
| **07** | Blood Requests | Create, evidence, verification, activation, matching, fulfillment, close/cancel, timeline | State, duplicate & authorization tests |
| **08** | Emergency | Pending verification, admin approve/reject, idempotent notification job, donor response, close | Forged approval, duplicate broadcast, retry & audit tests |
| **09** | Donations | Create, evidence, history, admin verify/reject (only verified donation changes counters) | Duplicate verification & cross-user tests |
| **10** | Reminders | Server-side reminder scheduling from verified donation state | Idempotency, opt-out, timezone & duplicate tests |
| **11** | Campaigns | CRUD, publish/schedule/archive, participants, reminders, Cloudinary banner | Status & uniqueness tests |
| **12** | Notifications | Inbox, read state, targeted/scheduled messages, push adapter, email side-effects | Retry, targeting & idempotency tests |
| **13** | Rewards | Milestones and verified-donation issuance | Duplicate prevention & deterministic criteria tests |
| **14** | Certificates | Issue, asset, verify code & public verification | Authorization, uniqueness & invalid-code tests |
| **15** | Payments | Payment intent/order, provider adapter, webhook, status | Signature, replay, duplicate & failure tests |
| **16** | Cloudinary | Upload, file validation, ownership, signed/private access | Invalid file & unauthorized asset tests |
| **17** | Admin Users/Donors | List/search/detail/verify/suspend/activate as permitted | RBAC & audit tests |
| **18** | Admin Requests/Emerg. | Queues, verification, emergency approval/rejection, status control | Forged-role, duplicate-action & audit tests |
| **19** | Admin Donations | Verification queue, approve/reject, evidence review | Exact-once side-effects |
| **20** | Admin Campaigns | Create/edit/publish/schedule/archive and participants | Role & status tests |
| **21** | Admin Notifications | Target audience, compose, schedule, delivery status | Audience authorization, retry/idempotency tests |
| **22** | Admin Payments | Transactions, status filters, revenue summaries | Client cannot mutate payment truth |
| **23** | Reports | Users, donors, blood demand, requests, donations, campaigns, payments | Filters, aggregation & privacy tests |
| **24** | Audit | Immutable event service and admin audit API | Every sensitive mutation creates an event |
| **25** | Settings | Controlled platform settings | Role restriction & audit |
| **26** | Security | Headers, CORS, rate limits, validation, NoSQL defenses, webhook signing, file checks | Hostile-input suite |
| **27** | Tests / E2E | Unit / integration / contract / E2E | Complete user + admin journeys & deterministic fixtures |
| **28** | Seed / Local | Fictional idempotent seed data | Repeated seed & production guard |
| **29** | Production | Docker / CI / logging / health / backups / startup validation | Clean-build & outage tests |
| **30** | Final Audit | Requirement matrix | Every row mapped to real code, route, permission, validation, test & docs; unexplained MISSING blocks completion |

---

## 6. Admin Panel API Contract

- `GET /api/v1/admin/dashboard/summary`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/:id`
- `PATCH /api/v1/admin/users/:id/status`
- `GET /api/v1/admin/donors`
- `GET /api/v1/admin/blood-requests`
- `POST /api/v1/admin/blood-requests/:id/verify`
- `GET /api/v1/admin/emergency-requests`
- `POST /api/v1/admin/emergency-requests/:id/approve`
- `POST /api/v1/admin/emergency-requests/:id/reject`
- `GET /api/v1/admin/donations`
- `POST /api/v1/admin/donations/:id/verify`
- `GET /api/v1/admin/campaigns`
- `POST /api/v1/admin/campaigns`
- `PATCH /api/v1/admin/campaigns/:id`
- `POST /api/v1/admin/notifications`
- `POST /api/v1/admin/notifications/schedule`
- `GET /api/v1/admin/payments`
- `GET /api/v1/admin/reports/:reportType`
- `GET /api/v1/admin/audit-events`
- `GET/PATCH /api/v1/admin/settings/:key`

---

## 7. Security / Privacy Acceptance Gates

| Area | Acceptance Requirement |
| :--- | :--- |
| **Passwords** | Strong hash (bcrypt/argon2); never plaintext |
| **OTP / Reset** | Short-lived, single-use, rate-limited |
| **Sessions** | Protected and revocable |
| **RBAC** | Server-side on every admin / protected mutation |
| **Object Auth** | Changing an ID must never bypass ownership |
| **Donor Privacy** | No public contact or exact location before consent |
| **Emergency** | No broadcast before required approval |
| **Payments** | Provider/webhook authoritative and replay-safe |
| **Cloudinary** | Secrets private; asset ownership and signed/private access |
| **Nodemailer** | SMTP private; no sensitive token logging; retry-safe |
| **MongoDB** | Whitelist filters/sorts and reject unsafe operators |
| **Audit** | Sensitive admin mutations produce immutable events |
| **Logging** | No passwords, tokens, raw PII or provider secrets |
| **Rate limits** | Auth, OTP, contact, emergency and expensive/report routes protected |

---

## 8. Definition of Done (DoD)

Declare the backend DONE only when:
1. Every P0/P1/P2 capability has a concrete implementation path.
2. Every protected route enforces authentication + RBAC + object-level authorization.
3. Donor privacy cannot be bypassed under any condition.
4. Emergency broadcasting is controlled, idempotent, and audited.
5. Cloudinary uploads are validated and ownership-protected.
6. Nodemailer is retry-safe and secret-safe.
7. Payments are replay-safe and authoritative only via webhook verification.
8. Unit / integration / security / E2E tests pass.
9. OpenAPI and README match actual routes.
10. The final feature matrix contains no unexplained MISSING items.
