# Digital CERCA Hub Backend

Express + PostgreSQL backend implementing core functional requirements:

- User registration/login with role-based access (`citizen`, `staff`)
- Online application submission and status workflow
- Document upload with basic format/size checks
- Appointment scheduling and queue numbering
- Application tracking and status history
- Notifications (in-app model, extendable to SMS/email)
- Staff dashboard and application review actions
- Digital records search for archival/audit use
- Announcement board
- Complaint/feedback submission and resolution tracking

## Quick Start

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:
   - `cd backend`
   - `npm install`
3. Initialize DB schema:
   - `npm run db:init`
4. Start API:
   - `npm run dev`

Base URL: `http://localhost:4000/api`
