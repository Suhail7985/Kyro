# TalentSphere AI — Next-Gen AI HRMS

Enterprise Human Resource Management System for **FWC AI/ML Fullstack Hackathon** (TM-01).

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Recharts, Zustand, React Hook Form, Zod |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Database | MongoDB Atlas (or local MongoDB) |
| AI | Google Gemini + OpenAI-compatible fallback layer |
| Storage | Cloudinary (optional) + local uploads |
| DevOps | Docker, Docker Compose, GitHub Actions |

## AI Features (8+)

1. **AI Resume Screening** — automated parsing & scoring
2. **AI Candidate Ranking** — bulk upload leaderboard
3. **AI Interview Question Generation**
4. **AI HR Assistant** — chat + voice (Web Speech API)
5. **AI Performance Review Generator**
6. **Attrition Risk Prediction** — explainable scoring
7. **Conversational memory** — ChatHistory in MongoDB
8. **Keyword + LLM hybrid** fallback when APIs unavailable

## Roles

- **Management Admin** — company dashboard, analytics, payroll
- **Senior Manager** — team KPIs, leave approvals, performance
- **HR Recruiter** — jobs, bulk screening, rankings, interviews
- **Employee** — attendance, leave, payroll, careers, onboarding

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB running locally OR MongoDB Atlas URI

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed    # 1 admin, 5 managers, 10 recruiters, 100 employees, 50 candidates, 25 jobs, 200 applications
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open **http://localhost:3000**

### Demo Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@talentsphere.ai | Admin@123456 |
| Manager | manager1@talentsphere.ai | Manager@123 |
| Recruiter | recruiter1@talentsphere.ai | Recruiter@123 |
| Employee | employee1@talentsphere.ai | Employee@123 |

### Docker

```bash
cd docker
docker compose up --build
```

## Documentation

- [Architecture](docs/architecture/ARCHITECTURE.md)
- [API Reference](docs/architecture/API.md)
- [Hackathon Demo Guide](docs/architecture/DEMO_GUIDE.md)
- [Database ER](docs/architecture/DATABASE.md)

## Deployment

- **Frontend:** Vercel — set `NEXT_PUBLIC_API_URL`
- **Backend:** Render — set all vars from `backend/.env.example`
- **Database:** MongoDB Atlas free tier

## Project Structure

```
talentsphere-ai/
├── frontend/          # Next.js 15 App Router
├── backend/           # Express TypeScript API
├── docker/            # Docker Compose
├── docs/architecture/ # Documentation
└── .github/workflows/ # CI/CD
```

## License

MIT — FWC Hackathon submission.
