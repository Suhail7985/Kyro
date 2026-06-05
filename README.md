# Kyro – Next-Gen AI HRMS (FWC TM-01)

This repository contains two separate HRMS projects:
- The root `backend/` + `frontend/` app is the main Kyro platform.
- The `talentsphere-ai/` subfolder is a second, independently packaged TalentSphere AI application.

A full-stack **Human Resource Management System** with AI-driven recruitment, employee self-service, company-wide analytics, and multi-role access for modern workplaces.

## Features (Competition Scope)

### Core HRMS
- Employee data management (department, ID, manager, salary)
- Attendance (check-in/out, hours, AI anomaly flags)
- Payroll (payslips, batch processing)
- Performance tracking with AI-generated summaries

### Recruitment & AI (5+ AI features)
1. Automated resume screening (no human intervention)
2. AI job–employee matching
3. HR chatbot with **voice input** (Web Speech API)
4. Attendance anomaly detection
5. Performance review AI insights

### Other
- Video interviews (MediaRecorder)
- Bulk resume rescore for recruiters
- Onboarding forms
- Multi-role login: **Admin, Senior Manager, HR Recruiter, Employee**
- Personalized dashboards per role; admin/manager see company-wide BI
- Mobile-responsive UI (Tailwind)
- CI/CD — GitHub Actions → Heroku + Vercel

See `docs/ARCHITECTURE.md` and `docs/AI_FEATURES.md`.

## Tech Stack

| Layer | Stack |
|-------|--------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, react-chartjs-2 |
| Backend | Node.js, Express, Mongoose, Multer, Helmet, express-rate-limit |
| Database | MongoDB |
| AI | OpenAI API (default) or Google Gemini |
| Deploy | Vercel (frontend), Heroku (backend) |

## Project Structure

```
my-hiring-platform/
├── backend/          # Express API
├── frontend/         # React SPA
├── .github/workflows/  # CI/CD
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)

### 1. Clone and install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Backend environment

Copy `backend/.env.example` to `backend/.env` and set:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hiring-platform
JWT_SECRET=your-long-random-secret
OPENAI_API_KEY=sk-...          # optional; uses keyword scoring if missing
GEMINI_API_KEY=...             # optional; set AI_PROVIDER=gemini
AI_PROVIDER=openai
ADMIN_EMAIL=admin@hiring.com
ADMIN_PASSWORD=Admin123!       # seeded on first startup
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend environment

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 4. Run locally

```bash
# Terminal 1 – backend
cd backend && npm run dev

# Terminal 2 – frontend
cd frontend && npm run dev
```

Open http://localhost:5173

### Demo accounts (auto-seeded)

| Role | Email | Password |
|------|-------|----------|
| Management Admin | `admin@hiring.com` | `Admin123!` (from `.env`) |
| Senior Manager | `manager@hiring.com` | `Manager123!` |
| HR Recruiter | `recruiter@hiring.com` | `Recruiter123!` |
| Employee | `employee@hiring.com` | `Employee123!` |

Register new **Employee** or **HR Recruiter** accounts from the UI.

## API Routes

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | Public | Register (candidate/recruiter) |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Auth | Current user |
| PUT | `/api/users/profile` | Auth | Update onboarding profile |
| GET | `/api/users` | Admin | List users |
| DELETE | `/api/users/:id` | Admin | Delete user |
| POST | `/api/jobs` | Recruiter/Admin | Create job |
| GET | `/api/jobs` | Auth | List jobs |
| POST | `/api/applications/:jobId/upload` | Candidate | Upload resume + AI score |
| GET | `/api/applications?job=` | Auth | List applications |
| PUT | `/api/applications/:id/status` | Recruiter | Shortlist/reject |
| POST | `/api/applications/:id/video` | Candidate | Upload interview video |
| POST | `/api/applications/bulk-score` | Recruiter | Re-score all resumes for a job |
| GET | `/api/statistics` | Admin/Manager/Recruiter | Dashboard analytics |
| GET | `/api/hr/attendance` | Auth | Attendance records |
| POST | `/api/hr/attendance/check-in` | Employee | Check in |
| GET | `/api/hr/payroll` | Auth | Payslips |
| POST | `/api/ai/chat` | Auth | HR AI assistant |
| GET | `/api/ai/job-recommendations` | Auth | AI job matching |
| GET | `/api/hr/dashboard/company` | Admin/Manager | Company KPIs |

## Deployment

### Heroku (backend)

1. Create Heroku app: `heroku create your-hiring-api`
2. Set config vars: `MONGO_URI`, `JWT_SECRET`, `OPENAI_API_KEY`, `FRONTEND_URL` (Vercel URL)
3. Add MongoDB Atlas connection string to `MONGO_URI`
4. Push `backend/` or use GitHub Action secrets:
   - `HEROKU_API_KEY`, `HEROKU_APP_NAME`, `HEROKU_EMAIL`

### Vercel (frontend)

1. Import `frontend/` folder in Vercel
2. Set `VITE_API_URL` to your Heroku API URL
3. GitHub Action secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### GitHub Actions secrets

| Secret | Purpose |
|--------|---------|
| `HEROKU_API_KEY` | Heroku deploy token |
| `HEROKU_APP_NAME` | Heroku app name |
| `HEROKU_EMAIL` | Heroku account email |
| `VERCEL_TOKEN` | Vercel deploy token |
| `VERCEL_ORG_ID` | Vercel team/org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `VITE_API_URL` | Production API URL for frontend build |

**Security:** Never commit `.env` files or API keys. Use platform environment variables only.

## Demo Flow

1. Register as **Recruiter** → create a job with required skills
2. Register as **Candidate** → complete onboarding → upload resume for the job
3. View AI score on candidate dashboard; record video interview
4. As recruiter → review applicants, sort by score, shortlist/reject, watch video
5. Login as **Admin** → view analytics charts and manage users

## License

MIT – hackathon / portfolio use.
