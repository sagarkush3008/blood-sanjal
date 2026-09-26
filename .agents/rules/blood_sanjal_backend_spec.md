---
description: Complete Blood Sanjal Backend Architecture, Rules, Schemas, Security Gates, and Definition of Done.
globs: ["**/*"]
always_on: true
---

# Blood Sanjal — Backend AI Prompt Pack Specifications

Source: *Blood Sanjal — Complete Backend AI Prompt Pack* (Evolvix Infotech)

## Key Technical Standards:
- **Stack**: Node.js + Express + TypeScript + MongoDB/Mongoose + Cloudinary + Nodemailer.
- **Strictly Disallowed**: PostgreSQL, Prisma, TypeORM, Sequelize.
- **Rule of Work**: B1 implements, B2 verifies with real tests, authorization, side-effects, retries, and audit evidence.
- **Donor Privacy**: Phone, email, WhatsApp, full address, and exact coordinates MUST never leak in search results or public DTOs. Reveal only via accepted ContactRequest consent workflow.
- **Emergency Broadcasts**: Must NEVER trigger without administrative verification and approval.
- **Payments**: Provider/webhook authoritative only; never trust client-side success flags; enforce idempotency.
- **Audit**: Every sensitive admin mutation produces an immutable `AuditEvent`.
- **API Envelope**:
  - Success: `{ "success": true, "data": {...}, "meta": { "requestId": "...", "page": 1, "limit": 20, "total": 0 } }`
  - Error: `{ "success": false, "error": { "code": "CODE", "message": "...", "fields": {} }, "meta": { "requestId": "..." } }`
- **Timezones**: Always UTC in storage & responses; clients handle `Asia/Kathmandu` formatting.
