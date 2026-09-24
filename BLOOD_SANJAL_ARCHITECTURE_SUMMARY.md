# Blood Sanjal Backend Architecture & Implementation Plan

This document serves as a permanent memory reference extracted from the "Blood Sanjal Backend AI Prompt Pack" by Evolvix Infotech.

## 1. Project Overview
- **Tagline:** Connecting People. Saving Lives.
- **Target Area:** Nepal (Pilot in Birgunj, Parsa). Hierarchy: Province -> District -> Municipality/City -> Area.
- **Core Technology Stack:** Node.js, Express, TypeScript, MongoDB, Mongoose, Cloudinary, Nodemailer.
- **Architecture Goal:** Replace a Firebase-based brief with a robust Node.js/MongoDB backend designed to serve a modern mobile-first UI (like React/Next.js).

## 2. Non-Negotiable Engineering Rules
- **Database:** MongoDB + Mongoose only (No PostgreSQL, Prisma, TypeORM, etc.).
- **Identity:** Single user identity model; a user can be a donor, recipient, or both. Admin is a distinct role.
- **Security & Auth:** Server-side authentication/authorization for all protected routes. No plaintext secrets. Use hashed short-lived OTPs/tokens.
- **Privacy First:** Never expose a donor's phone, email, full address, or exact location in public search. Contact info is only revealed through an approved contact-request workflow.
- **Emergency Flow:** Emergency requests must be admin/system verified before broadcasting to donors.
- **Monetization Constraint:** Blood is never paid for. A configurable platform/search fee is allowed but abstracted.
- **Reliability:** Idempotent background jobs for notifications, explicit audit logs for sensitive actions, no medical diagnosis guarantees.

## 3. Data Model (Key Collections)
- **Identity & Profiles:** `users`, `donorProfiles`, `sessions`, `otpCodes`, `passwordResets`.
- **Core Features:** `bloodRequests` (normal & emergency), `contactRequests` (consent-based privacy reveal), `donations` (verified records).
- **Engagement:** `campaigns`, `campaignParticipants`, `rewards`, `certificates`, `notifications`, `emailEvents`.
- **Infrastructure:** `locations`, `payments` (abstracted), `fileAssets` (Cloudinary refs), `auditLogs`, `settings`, `reportJobs`.

## 4. API & Integration Conventions
- **HTTP/REST:** Versioned API (`/api/v1`), consistent JSON envelope (`{ success, data, meta, error }`), correlation IDs.
- **Media (Cloudinary):** Backend owns upload auth and asset metadata. Uses signed URLs for private evidence.
- **Email (Nodemailer):** Queue-based asynchronous delivery with retry logic, deduplication, and template registry. Redact secrets from logs.
- **Background Jobs (BullMQ/Redis):** Used for OTP cleanup, donation reminders, emergency broadcasts, and report generation.
- **Payments:** `IPaymentProvider` interface with a mock implementation to easily swap in Nepali gateways (eSewa, Khalti) later. Uses minor currency units (e.g., paisa).

## 5. Development Stages (The A0-B30 Blueprint)
The project is broken down into specific stages for implementation:
- **B1-B2:** Foundation, Configuration, Auth, OTP, Sessions.
- **B3-B5:** User Profiles, RBAC, Location Hierarchy, Donor Availability.
- **B6-B7:** Normal & Emergency Blood Requests.
- **B8-B9:** Donor Search, Fees, Contact Request & Privacy Reveal.
- **B10-B11:** Donation Records, Verification, and Reminders.
- **B12-B15:** Blood Camps, Notifications Engine, Rewards, Certificates.
- **B16-B18:** Payment Abstraction, Cloudinary Service, Nodemailer Infrastructure.
- **B19-B22:** Admin Management (Users, Content, Campaigns, Reports, Audit Logs, Settings).
- **B23-B24:** Background Jobs, Security, Privacy, Abuse Hardening.
- **B25-B26:** OpenAPI Docs, Comprehensive Test Suite (Unit, Integration, E2E).
- **B27-B30:** Seed Data, Deployment Readiness, Final Legal/Privacy Review, and a No-Feature-Left-Behind Audit.

## 6. Acceptance Gates & Quality
Features are not considered "DONE" until they pass strict acceptance gates involving:
- Unit, Integration, Security, and E2E coverage.
- Proper OpenAPI documentation matching the routes.
- Privacy-safe DTOs preventing NoSQL injection and PII leakage.
- Production readiness (Docker, CI/CD, Health checks).
