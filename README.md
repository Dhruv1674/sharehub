# ShareHub — Campus Resource Sharing Platform

A hackathon MVP for safely sharing campus equipment and spaces.

## Stack
- Frontend: React + Vite + React Router + Axios + Lucide
- Backend: Node.js + Express + Mongoose
- Database: MongoDB
- Authentication: JWT + bcryptjs

## Features
- Student, owner and admin roles
- Registration/login
- Resource listing, search and filtering
- Eligibility/training requirements
- Booking requests, owner approval/rejection
- Fair-use limit (maximum 3 active/future approved bookings per user)
- Waitlist when a resource is unavailable or over capacity
- Check-in and check-out with condition notes/photos (photo URL)
- Damage/incident reporting
- Audit trail for key actions
- Role-protected API routes

## Run locally

### 1. Requirements
Install Node.js 18+ and MongoDB Community Server, or use MongoDB Atlas.

### 2. Backend
```bash
cd backend
cp .env.example .env
# Set MONGO_URI and JWT_SECRET in .env
npm install
npm run dev
```
Backend: http://localhost:5000

### 3. Frontend
In another terminal:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Frontend: http://localhost:5173

## Demo flow
1. Register an account with role `owner`, add a resource.
2. Register another account with role `student`.
3. Student requests the resource.
4. Owner approves or rejects from the Requests page.
5. Student checks in, records the starting condition, then checks out and records the return condition.
6. Review booking history and report an incident if needed.

## Demo accounts
Register them yourself through the UI. For judging, prepare:
- owner@demo.com (role Owner)
- student@demo.com (role Student)
- admin@demo.com (role Admin)

Use fictional data only.

## Important production notes
This is a hackathon prototype, not a production security certification. Before real institutional deployment:
- Add email/phone verification and institutional SSO.
- Store uploaded images in private object storage and validate file types.
- Add rate limiting, CSRF strategy where applicable, stronger audit retention and backups.
- Use a proper allocation policy agreed by the institution.
- Have authorised staff review safety, damage and penalty decisions.
- Configure CORS, HTTPS, secrets and database access restrictions.


## Fixes in this package
- Fixed the browser runtime error `React is not defined` in `AuthContext.jsx`.
- Added explicit Vite React plugin configuration.
- If you previously ran this app, stop the old dev server and start it again from this extracted folder.
