# Blood Sanjal

**Connecting People. Saving Lives.**

Blood Sanjal is a Nepal-focused blood donation and blood request platform designed to connect blood donors with people who need blood.

The project includes a React Native mobile application and a Node.js backend using MongoDB, Cloudinary, and Nodemailer.

## Repository

**Recommended GitHub repository name:**

`blood-sanjal`

### GitHub Description

> Blood Sanjal is a Nepal-focused blood donation platform connecting blood donors and recipients with blood search, requests, emergency support, donations, campaigns, notifications, rewards, and certificates.

## Main Features

- User registration and login
- OTP/email verification
- Donor profiles
- Blood group management
- Blood donor search
- Location-based search
- Blood requests
- Emergency blood requests
- Donor contact request and consent
- Donation records
- Donation reminders
- Blood donation campaigns/camps
- Notifications
- Rewards and donor milestones
- Donation certificates
- Certificate verification
- Platform/search payments
- Cloudinary image/file uploads
- Email notifications with Nodemailer
- Admin dashboard and management
- Reports and analytics
- Audit logs
- Role-based access control
- Secure API architecture

## Technology Stack

### Mobile App
- React Native
- TypeScript
- React Navigation
- TanStack Query
- React Hook Form
- Zod
- Zustand

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- Cloudinary
- Nodemailer

## Project Structure

```text
blood-sanjal/
│
├── mobile/
│   ├── src/
│   ├── assets/
│   ├── app.json
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── uploads/
│   ├── tests/
│   └── package.json
│
├── docs/
│   ├── api/
│   └── architecture/
│
├── .gitignore
└── README.md
```

## Core Workflow

```text
User Registration
       ↓
OTP / Email Verification
       ↓
Complete Profile
       ↓
Find Blood / Request Blood
       ↓
Donor Contact Request
       ↓
Donor Consent
       ↓
Blood Connection
       ↓
Donation
       ↓
Verification
       ↓
Rewards / Certificate
```

Emergency workflow:

```text
Emergency Blood Request
       ↓
Backend Verification
       ↓
Admin Approval
       ↓
Matching Donors
       ↓
Notifications
       ↓
Donor Response
       ↓
Contact / Fulfillment
       ↓
Close Request
```

## Design

The mobile application uses a professional:

- White-first interface
- Light red blood/health accent
- Clean cards
- Rounded components
- Simple navigation
- Accessible typography
- Mobile-first layouts

## Backend Integration

The mobile application connects to the real Blood Sanjal backend.

The backend API is the source of truth for:

- Authentication
- Users
- Donors
- Blood requests
- Emergency requests
- Contact requests
- Donations
- Campaigns
- Notifications
- Rewards
- Certificates
- Payments
- Files
- Admin operations
- Reports
- Audit

No production feature should use fake/mock data instead of the real API.

## Security

- Role-based access control
- Secure authentication
- Protected API routes
- User/object authorization
- Donor privacy protection
- Consent-based contact reveal
- Secure Cloudinary access
- No secrets inside the mobile application
- Rate limiting
- Input validation
- Audit logging
- Secure payment verification

## Development

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/blood-sanjal.git
cd blood-sanjal
```

Install mobile dependencies:

```bash
cd mobile
npm install
```

Install backend dependencies:

```bash
cd ../backend
npm install
```

Create the required environment files before running the application.

## Environment

Backend configuration should include values for:

```env
PORT=
MONGODB_URI=
JWT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

Never commit real secrets to GitHub.

## Testing

The project should test:

- Authentication
- Donor search
- Blood requests
- Emergency requests
- Contact consent
- Donations
- Campaigns
- Notifications
- Rewards
- Certificates
- Payments
- Cloudinary uploads
- Authorization
- Privacy
- API integration
- Mobile E2E workflows

## Project Goal

Blood Sanjal aims to make blood discovery and donor connection easier, faster, and more organized while protecting donor privacy and maintaining a reliable digital record of requests and donations.

## License

Add the project's chosen license before public release.

---

**Blood Sanjal — Connecting People. Saving Lives.**
