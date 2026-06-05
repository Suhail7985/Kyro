# API Reference

Base URL: `http://localhost:5000/api/v1`

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register employee/recruiter |
| POST | /auth/login | Login |
| GET | /auth/me | Current user |
| POST | /auth/logout | Logout |

## Analytics

| GET | /analytics/admin | Admin dashboard |
| GET | /analytics/manager | Manager dashboard |
| GET | /analytics/recruiter | Recruiter dashboard |
| GET | /analytics/employee | Employee dashboard |
| GET | /analytics/charts | Chart series data |

## HR

| POST | /attendance/clock-in | Clock in |
| POST | /attendance/clock-out | Clock out |
| GET | /attendance | History |
| POST | /leave | Apply leave |
| PUT | /leave/:id/approve | Approve |
| GET | /leave/balance | Balance |
| GET | /payroll/me | Payslips |
| POST | /payroll/process | Run payroll |

## Recruitment

| POST | /jobs | Create job |
| GET | /jobs | List jobs |
| POST | /jobs/:jobId/resume | Upload + AI analyze |
| POST | /jobs/:jobId/bulk-resumes | Bulk screening |
| GET | /jobs/:jobId/leaderboard | Rankings |
| POST | /jobs/:jobId/interview-questions | AI questions |

## AI

| POST | /ai/chat | HR assistant |
| GET | /ai/top-candidates?skill=React | Ranked list |
| GET | /ai/hiring-summary | Summary |
