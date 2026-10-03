# Donor ACTIVE / INACTIVE Availability Implementation Rules

> Extracted from Blood Sanjal — Donor Availability Backend B1/B2 Prompt Pack

## Purpose
Implement a production-ready donor availability feature where a donor can switch between **ACTIVE** and **INACTIVE**. 
- **ACTIVE** donors are considered for eligible blood-request matching and notifications.
- **INACTIVE** donors must be excluded from new matching/broadcasts.

## 1. Data Model
- Use `donorStatus` with values `ACTIVE` and `INACTIVE` in the `DonorProfile`. Keep `HIDDEN` if it exists as a separate privacy state.
- Use `statusChangedAt` for tracking status updates.
- Do not silently make every new donor active unless specified.
- Ensure proper indexes (e.g., `donorStatus` with `bloodGroup`/`location`).

## 2. API Endpoints
- Implement `PATCH /api/v1/donors/me/status` to accept only `ACTIVE` or `INACTIVE`.
- Implement `GET /api/v1/donors/me/status` to return current availability and timestamp.
- **Validation:** 
  - Require authentication and donor ownership.
  - Reject ONLINE, AVAILABLE, booleans, null, or empty string. 
  - Prevent mass assignment of role, admin, account status, visibility, etc.
- **Security Responses:** Return `401` for unauthenticated, `403` for trying to change another donor, `400` for invalid status.

## 3. Search & Privacy Rules
- **Public Donor Search:** Return available only when `donorStatus` is `ACTIVE` and visibility rules pass. INACTIVE or HIDDEN donors must remain excluded.
- **Privacy:** Use public-safe DTOs. Never expose phone, email, WhatsApp, full address, or exact coordinates in search.
- Do not allow query parameters to bypass server-side status/visibility filtering.

## 4. Matching & Emergency Broadcasts
- **Blood Request Matching:** Update central matching service to exclude INACTIVE donors for new matches. ACTIVE means donor-declared availability, not a medical claim. Keep rules in service, not controllers.
- **Emergency Broadcast:** Only eligible ACTIVE donors are considered. INACTIVE donors receive no new emergency donor broadcast.
- **Safety:** Changing to INACTIVE only blocks *new* matches/broadcasts. Do not delete historical donations, audit events, or alter completed workflows. Add a final server-side availability check before any matching/broadcast side effect.

## 5. Audit & Testing
- **Audit:** Record donor availability changes capturing actor, donor profile, old/new status, timestamp, and request correlation ID. No PII or secrets.
- **Verification (B2):** Validate thoroughly using the defined Test Matrix (19 mandatory tests), including security tests against mass assignment, ID substitution, and filter bypasses. Verify no private tokens or password hashes leak.
