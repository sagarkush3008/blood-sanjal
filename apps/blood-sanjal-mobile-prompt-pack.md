# BLOOD SANJAL - React Native Mobile Application AI Build + Verify Prompt Pack

**Tagline:** Connecting People. Saving Lives.

**Purpose:** Build a production-quality React Native mobile app that consumes the real Blood Sanjal backend. Every user-facing business workflow must be connected to the real API, not mocked.

---

## 1. Document Purpose & Core Rules
- Translates the Node.js + MongoDB backend contract into a React Native mobile application.
- Respect backend contracts: privacy-safe donor search, controlled emergency broadcasting, configurable fees, Cloudinary media, Nodemailer templates, idempotent notifications, auditability.
- **Core Rule:** The actual backend OpenAPI/Swagger contract is authoritative.

## 2. Product Experience
- Nepal-focused blood donor and request platform.
- Primary mobile goals: Find compatible donors (privacy-safe), Create/track requests, Emergency requests (pending until admin approval), Contact requests, Donations, Campaigns, Notifications, Rewards, Payments, Profile management, Admin area.

## 3. Technology Stack
- **Framework:** React Native + TypeScript (Expo preferred)
- **Navigation:** React Navigation
- **Server State:** TanStack Query
- **Client State:** Zustand
- **Forms/Validation:** React Hook Form + Zod
- **HTTP:** Axios (centralized)
- **Storage:** Expo SecureStore
- **Media:** Expo ImagePicker / DocumentPicker
- **Notifications:** Expo Notifications
- **Charts:** React Native chart library
- **Testing:** Jest + React Native Testing Library + Detox/Maestro

## 4. Premium UI Design System (White + Light Red)
- **Primary red:** `#B4233C`
- **Deep red:** `#8B1023`
- **Light red:** `#FFF1F3`
- **Soft pink:** `#FFF7F8`
- **Text:** `#1F2937`
- **Muted:** `#6B7280`
- **Border:** `#E5E7EB`
- **Success:** `#16803C`
- **Warning:** `#A15C00`
- **Danger:** `#B42318`
- **Surface:** `#FFFFFF`
- **Rules:** 12-20px corner radius, soft shadows, large white space, skeleton loading, bottom sheets, confirm dialogs, no distracting animations.

## 5. Navigation Architecture (Bottom Tabs)
1. **Home:** Summary, urgent requests, nearby, campaigns, reminders.
2. **Find Blood:** Search donors (privacy-safe).
3. **Requests:** Normal and emergency requests.
4. **Donate:** Recording, status, history.
5. **Profile:** Privacy, rewards, certificates, settings.
*(Admin navigation only for authorized users).*

## 6. Key Workflows
- **Auth:** Register, OTP, Login, Refresh, Forgot/Reset Password.
- **Home:** Greeting, notifications, location context, live content (requests, camps).
- **Find Blood:** Filters -> Search -> Payment (if required) -> Results -> Contact Request.
- **Contact Request:** PENDING, ACCEPTED (reveals info), DECLINED, EXPIRED.
- **Request Blood:** Normal (guided form -> PENDING_VERIFICATION -> ACTIVE). Emergency (Warning -> Submit -> PENDING_VERIFICATION -> Admin Approves -> ACTIVE & Broadcasted).
- **Donation:** Submit details -> Upload Evidence -> Admin Verification -> Update counters/rewards.
- **Campaigns:** Discovery, participation, reminders.
- **Notifications:** Inbox for alerts, requests, reminders, rewards.
- **Rewards/Certificates:** View badges, milestones, download/share certificates.
- **Payments:** Platform fee, mock provider in dev, real provider (eSewa/Khalti) in prod. Polling for success.
- **Admin Mobile Area:** Dashboard, Users, Donors, Requests, Emergency Review, Donations, Campaigns, etc.

## 7. API Client Architecture (`src/api/`)
- Centralized Axios client.
- Request/correlation ID propagation.
- Handle 401 (refresh), 403, 422, 429, 500.
- TanStack Query: Use stable query keys, server pagination, invalidation on mutations.

## 8. Offline & Resilience
- Cache/read previously viewed data.
- Queue low-risk drafts.
- **Never fake success** for payments, approvals, contact reveals, or verification.
- Provide reconnect/refetch capabilities.

## 9. Development Process (M0 -> M19)
- Execute sequentially.
- A stage is complete ONLY after real backend interaction is proven (B2 Verify).
- After each module: TS checks, lint, unit tests, API integration tests.
- Produce artifacts: Screen inventory, Route inventory, Mapping, Test results.

## 10. AI Coding Agent Master Instruction
- Do not invent endpoints. Use OpenAPI.
- Do not replace real API data with mocks.
- For every screen: **BUILD -> CONNECT REAL API -> TEST -> FIX -> VERIFY**.
- Build the UI beautifully, but prove every important button against the real backend.
