# Backend Feature Matrix

This matrix maps every source feature from the Blood Sanjal brief to its backend implementation module, endpoint, testing, and owner role.

| Feature | Module | Endpoints | Tests | Owner Role |
|---------|--------|-----------|-------|------------|
| Registration + OTP | `auth` | `POST /api/v1/auth/register`, `POST /api/v1/auth/verify-email` | Unit/Integration | Public |
| Login / Logout / Refresh | `auth` | `POST /api/v1/auth/login`, `logout`, `refresh` | Unit/Integration | Public/User |
| Password Reset | `auth` | `POST /api/v1/auth/forgot-password`, `reset-password` | Integration | Public |
| Profile & Blood Group | `users` / `donorProfiles` | `GET/PATCH /api/v1/me`, `PATCH /api/v1/me/donor-profile` | Unit/Integration | User |
| Find Blood (Donor Search) | `donorProfiles` / `payments` | `GET /api/v1/donors/search`, `GET /api/v1/donors/:id` | E2E/Integration | User |
| Contact Request | `contactRequests` | `GET/POST /api/v1/contact-requests`, `POST /api/v1/contact-requests/:id/accept` | Integration/E2E | User |
| Blood Request (Normal) | `bloodRequests` | `GET/POST /api/v1/blood-requests`, `PATCH /api/v1/blood-requests/:id` | Unit/Integration | User |
| Emergency Request | `bloodRequests` / `notifications` | `POST /api/v1/emergency-requests`, `POST /api/v1/emergency-requests/:id/verify` | Integration/E2E | Admin/System |
| Donation Records | `donations` | `GET/POST /api/v1/donations`, `POST /api/v1/donations/:id/verify` | Integration | User/Admin |
| Donation Reminders | `reminders` (jobs) | N/A (Background Job) | Unit/Integration | System |
| Blood Camps / Campaigns | `campaigns` | `GET/POST /api/v1/campaigns`, `POST /api/v1/campaigns/:id/publish` | Integration | Admin/Public |
| Notifications | `notifications` / `mail` | `GET /api/v1/notifications`, `POST /api/v1/notifications/:id/read` | Unit/Integration | User |
| Rewards & Recognition | `rewards` | `GET /api/v1/rewards/me`, `GET /api/v1/rewards` | Unit/Integration | User |
| Certificates | `certificates` / `files` | `GET /api/v1/certificates/me`, `GET /api/v1/certificates/verify/:code` | Integration | User/Public |
| Payments (Platform Fee) | `payments` / `integrations` | `POST /api/v1/payments/initiate`, `POST /api/v1/payments/webhooks/:provider` | Integration/E2E | User |
| Cloudinary Uploads | `files` / `integrations` | `POST /api/v1/files/sign`, `POST /api/v1/files/upload` | Integration | User |
| Admin: Users/Donors | `admin` / `users` | `GET/POST /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id` | Integration | Admin |
| Admin: Requests/Emergency | `admin` | `POST /api/v1/emergency-requests/:id/broadcast` | Integration | Admin |
| Reports / Analytics | `reports` | `GET /api/v1/admin/reports/overview`, `POST /api/v1/admin/report-jobs` | Integration | Admin |
