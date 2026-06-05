# Kyro HRMS — Architecture Documentation

## Overview

Next-generation HRMS for FWC IT Services (TM-01) combining core HR operations with AI automation.

## Roles & Access

| Role | Dashboard | Capabilities |
|------|-----------|--------------|
| Management Admin | `/admin` | Company + individual analytics, user management, full stats |
| Senior Manager | `/manager` | Company-wide BI charts, workforce view |
| HR Recruiter | `/recruiter` | Jobs, AI resume screening, applicant review, bulk rescore |
| Employee | `/employee` | Attendance, payroll, performance, careers, video interview |

Legacy roles `candidate` and `recruiter` map to `employee` and `hr_recruiter`.

## AI Features (5 implemented)

1. **Resume screening & scoring** — OpenAI/Gemini or keyword fallback; fully automated pipeline
2. **Job–employee matching** — `GET /api/ai/job-recommendations`
3. **HR conversational assistant** — `POST /api/ai/chat` with Web Speech API voice input (browser)
4. **Attendance anomaly detection** — `GET /api/hr/attendance/insights`
5. **Performance review AI summaries** — generated on `POST /api/hr/performance`

## Core HRMS Modules

- **Employee data** — User model extended with department, salary, managerId, employeeId
- **Attendance** — check-in/out, hours, AI flags
- **Payroll** — monthly payslips, admin payroll run
- **Performance** — reviews with AI summary and recommendations
- **Recruitment** — jobs, applications, video interviews (existing)

## Scalability (5,000+ users)

- MongoDB indexes on `role`, `department`, `userId+date`
- Employee list capped at 500 per request (pagination-ready)
- Stateless JWT API — horizontal scaling on Heroku/Render
- Rate limiting via `express-rate-limit`

## Tech Stack

- Frontend: React 18, Vite, Tailwind (responsive), Chart.js
- Backend: Node.js, Express, Mongoose
- AI: OpenAI API (free tier credits) with rule-based fallbacks
- Deploy: Vercel + Heroku + GitHub Actions

## API Structure

```
/api/auth      — JWT authentication
/api/hr        — attendance, payroll, performance, employees
/api/ai        — chat, job recommendations
/api/jobs      — job postings
/api/applications — resumes, video, status
/api/statistics — BI aggregates
```

## Security

- bcrypt password hashing
- Secrets in environment variables only
- Helmet + CORS + rate limits
