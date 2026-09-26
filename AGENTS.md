# Blood Sanjal — Backend AI Specification & Permanent Memory Rules

> Extracted and synthesized from **Blood Sanjal: Complete Backend AI Prompt Pack (Pages 1–9)** by Evolvix Infotech.

---

## 1. Master Coding-Agent Directives

You are the senior backend engineer for **Blood Sanjal**.
- **Core Technology Stack**: Node.js + Express + TypeScript + MongoDB / Mongoose + Cloudinary (media) + Nodemailer (email).
- **Prohibited Technologies**: DO NOT use PostgreSQL, Prisma, TypeORM, or Sequelize under any circumstances.
- **The Core Rule**: Never declare a module complete simply because the server boots or a route returns `200 OK`.
  - **B1**: Implements the module, routes, DTOs, services, schemas, and error handling.
  - **B2**: Proves real-world behavior with tests, RBAC, authorization, side-effects, retries, failure states, and audit evidence.

---

## 2. Non-Negotiable Security, Privacy & Business Rules

1. **Server-Side Security & RBAC**:
   - Server-side authentication, RBAC, and object-level authorization are mandatory across all protected endpoints.
   - Changing an ID in parameters must NEVER bypass ownership checks (prevent IDOR).
2. **Strict Donor Privacy**:
   - Donor phone, email, WhatsApp, full address, and exact coordinates MUST remain private and masked.
   - Contact info can ONLY be revealed after the recipient initiates a contact request AND the donor explicitly accepts via the consent workflow.
3. **Emergency Broadcast Control**:
   - Emergency broadcasts must NEVER be triggered automatically or publicly without required verification/approval by an admin.
   - Broadcasting jobs must be idempotent and audited.
4. **Authoritative Financial State**:
   - Payments are authoritative ONLY from the backend and payment provider webhook verification. Never trust a client-sent success flag.
   - Replay attacks and duplicate charges must be strictly blocked with idempotency keys.
5. **Private Media & Cloudinary**:
   - Cloudinary API secrets must never leak to clients.
   - Medical evidence, donor proof, and sensitive assets must use signed/authorized access policies.
6. **Email & Nodemailer**:
   - Nodemailer runs only on the backend with retry-safe sends and template registries.
   - SMTP credentials, OTP tokens, and passwords must NEVER be logged or leaked.
7. **Timezones & Formats**:
   - All timestamps stored in MongoDB and returned in JSON must be **UTC**.
   - Mobile and web clients format timestamps for local time (`Asia/Kathmandu`).
8. **Audit Trail**:
   - Every sensitive mutation (user status change, blood request verification, emergency broadcast approval, donation verification, settings update) must generate an immutable `AuditEvent`.

---

## 3. Standard API Contract

### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid-v4",
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Readable human-friendly error message",
    "fields": { "fieldName": "Field specific error" }
  },
  "meta": {
    "requestId": "uuid-v4"
  }
}
```

### API Routing Rules
- Versioning: `/api/v1/...`
- Whitelist all query filters and sort keys; NEVER pass raw `req.query` or `req.body` directly into Mongo queries (prevents NoSQL injection).
- Document and stabilize all error codes (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, etc.).
- Never leak stack traces, DB connection strings, or third-party secrets in error responses.

---

## 4. MongoDB Collections & Schemas

| Collection | Core Fields & Purpose |
| :--- | :--- |
| `User` | `name`, `email`, `phone`, `passwordHash`, `role` (`DONOR`, `RECIPIENT`, `ADMIN`, `SUPER_ADMIN`), `status` (`ACTIVE`, `SUSPENDED`, `PENDING`), `verification`, `bloodGroup`, `location`, `timestamps` |
| `DonorProfile` | `userId`, `bloodGroup`, `active`, `availability`, `privacy`, `lastDonationAt`, `counters` (`totalDonations`, `livesSaved`) |
| `ContactRequest` | `requesterId`, `donorId`, `status` (`PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`), `consent`, `revealState`, `timestamps` |
| `BloodRequest` | `requesterId`, `bloodGroup`, `location`, `urgency` (`NORMAL`, `URGENT`), `hospital`, `details`, `evidence`, `status` (`PENDING_VERIFICATION`, `ACTIVE`, `FULFILLED`, `CLOSED`, `CANCELLED`), `verification`, `fulfillment` |
| `EmergencyRequest` | `request reference`, `verification`, `approval`, `broadcast state`, `audit state` |
| `Donation` | `donorId`, `campaignId`, `date`, `location`, `evidence`, `status` (`PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`), `verifier`, `timestamps` |
| `Campaign` | `title`, `organizer`, `description`, `media`, `venue`, `location`, `dates`, `neededGroups`, `status` (`DRAFT`, `PUBLISHED`, `COMPLETED`, `ARCHIVED`) |
| `CampaignParticipant`| `campaignId`, `userId`, `status`, `reminder state` |
| `Notification` | `userId`, `type`, `title`, `body`, `data`, `channel` (`IN_APP`, `PUSH`, `EMAIL`), `readAt`, `delivery state` |
| `NotificationJob` | `event/audience`, `channel`, `status`, `attempts`, `idempotencyKey` |
| `Reward` / `UserReward` | `milestones`, `badges`, `criteria`, `user issuance and uniqueness` |
| `Certificate` | `userId`, `donationId`, `certificateNumber`, `verifyCode`, `assetId`, `status` |
| `Payment` | `userId`, `purpose`, `amount`, `currency`, `provider`, `providerReference`, `status`, `idempotencyKey` |
| `FileAsset` | `ownerId`, `entityType/id`, `Cloudinary publicId`, `resourceType`, `secureUrl`, `accessPolicy` |
| `AuditEvent` | `actorId`, `role`, `action`, `entityType/id`, `requestId`, `safe metadata`, `timestamp` |
| `AdminSetting` | `key`, `value`, `type`, `description`, `updatedBy` |

---

## 5. End-to-End Business Lifecycles

1. **Register → Search → Contact**:
   `Register` → `OTP verify` → `Login` → `Profile` → `Blood group` → `Donor activation` → `Find Blood` → `Privacy-safe results` → `Contact request` → `Donor notification` → `Accept` → `Permitted contact reveal` → `Audit`.
2. **Blood Request**:
   `Create` → `Validate` → `PENDING_VERIFICATION` → `Admin verifies` → `ACTIVE` → `Matching donors notified` → `Responses` → `Fulfillment` → `FULFILLED/CLOSED` → `Timeline`.
3. **Emergency Flow**:
   `Create` → `PENDING_VERIFICATION` → `Admin review` → `APPROVED/REJECTED` → `Idempotent broadcast jobs created` → `Donor responses` → `Consent` → `Fulfillment/Cancel/Close` → `Audit`.
4. **Donation Flow**:
   `Create donation` → `Optional evidence` → `Unverified` → `Admin verifies/rejects` → `Verified donation updates counters` → `Reminder scheduling` → `Reward milestone` → `Certificate generated` → `Notification/Email`.
5. **Campaign Flow**:
   `Admin draft` → `Media upload` → `Publish/Schedule` → `Discovery` → `Participant RSVP` → `Reminders` → `Complete` → `Archive/Report`.
6. **Payment Flow**:
   `Backend intent` → `Provider checkout` → `Provider webhook` → `Signature verification` → `Update state once` → `Client refetches status` (no duplicate charges).

---

## 6. Admin Panel API Blueprint

- `GET /api/v1/admin/dashboard/summary` (KPIs: users, donors, pending requests, emergency, donations, campaigns, revenue)
- `GET /api/v1/admin/users`, `GET /api/v1/admin/users/:id`, `PATCH /api/v1/admin/users/:id/status`
- `GET /api/v1/admin/donors` (Filter by blood group, location, status)
- `GET /api/v1/admin/blood-requests`, `POST /api/v1/admin/blood-requests/:id/verify`
- `GET /api/v1/admin/emergency-requests`, `POST /api/v1/admin/emergency-requests/:id/approve`, `POST /api/v1/admin/emergency-requests/:id/reject`
- `GET /api/v1/admin/donations`, `POST /api/v1/admin/donations/:id/verify`
- `GET /api/v1/admin/campaigns`, `POST /api/v1/admin/campaigns`, `PATCH /api/v1/admin/campaigns/:id`
- `POST /api/v1/admin/notifications`, `POST /api/v1/admin/notifications/schedule`
- `GET /api/v1/admin/payments` (Transaction log, revenue summary)
- `GET /api/v1/admin/reports/:reportType` (Aggregations for users, donors, demand, donations)
- `GET /api/v1/admin/audit-events` (Immutable security audit log)
- `GET/PATCH /api/v1/admin/settings/:key` (System constants, thresholds, emergency rules)

---

## 7. Definition of Done (DoD)

Declare any module or the overall backend **DONE** ONLY when:
- Every protected route enforces authentication + RBAC + object-level ownership authorization.
- Donor privacy cannot be bypassed (masked DTOs before consent).
- Emergency broadcasting is strictly gated by verification, idempotent, and audited.
- Cloudinary uploads are validated and ownership-protected.
- Nodemailer is retry-safe, secret-safe, and templated.
- Payments are webhook-authoritative and replay-safe.
- All unit, integration, and E2E test suites pass without regression.
- OpenAPI / Swagger documentation strictly matches mounted routes.
