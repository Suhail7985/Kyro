<div align="center">
  <img src="https://img.shields.io/badge/Status-Hackathon_Winner-gold?style=for-the-badge" alt="Hackathon Badge" />
  <br/>
  <h1>🚀 Kyro: The Future of HR Management</h1>
  <p><strong>A next-generation AI-powered Human Resource Management System (HRMS) built to automate modern workplaces.</strong></p>

  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/AI_Powered-Gemini-purple?style=for-the-badge&logo=google&logoColor=white" />
</div>

<br/>

## 🌟 The Vision

Modern HR is broken. Recruiters drown in resumes, onboarding requires data-entry across five different platforms, and tracking performance is incredibly manual. 

**Kyro** solves the entire lifecycle. Built to answer the challenge *"Build the Future of HR Management with AI-Powered Solutions"*, Kyro leverages powerful AI agents to streamline and automate HR operations—from the first resume drop to the final paycheck.

---

## 🔥 Key AI Features (Competition Scope)

### 1. 🤖 AI-Driven Resume Screening (Zero Human Intervention)
When candidates apply, Kyro’s AI engine instantly parses the resume, extracts their skills, and cross-references them against the required skills of the Job Posting to generate an **AI Match Score**. Unqualified candidates are filtered automatically.

### 2. 🎤 AI Voice Interaction & Video Interviews
We integrated robust voice interaction models. Candidates record asynchronous video interviews directly in the browser. The backend AI transcribes the audio, detects matching keywords, evaluates tone, and scores the candidate's verbal response—eliminating manual screening calls.

### 3. 💬 Real-Time AI Voice Assistant
Kyro features a persistent, globally available AI Chatbot on every dashboard. By leveraging the **Web Speech API**, users can click the microphone icon to speak naturally to the AI. The bot converts the speech to text, queries the HR database via Gemini, and provides instant answers.

### 4. 📍 GPS-Verified Attendance & AI Behavioral Flags
Employees clock in via the Employee Dashboard. The system securely captures browser **GPS coordinates** to verify if they are onsite or remote. The AI analyzes attendance history and automatically flags anomalies (e.g., burnout risk or unusual clock-in times) to Senior Managers.

---

## 🏢 Core HRMS & Multi-Role Architecture

Kyro is built for scale (5,000+ employees) and utilizes a strict Role-Based Access Control (RBAC) system with distinct, personalized dashboards:

- 👑 **Management Admin:** God-mode view. Access company-wide analytics, manage organizational departments, control user access, and execute 1-Click Stripe Payroll disbursements.
- 👔 **Senior Manager:** Team management hub. Approve leaves, track GPS attendance logs, and assign actionable goals/performance reviews to direct reports.
- 🎯 **HR Recruiter:** Recruitment command center. Manage job postings, generate AI interview questions, drag-and-drop candidates across the Kanban pipeline, and instantly convert candidates into active employees.
- 💼 **Employee:** The personal portal. Clock in/out, submit leave requests, view AI-summarized performance goals, and access digital payslips.

---

## 🛠️ Tech Stack Architecture

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, `@hello-pangea/dnd` (Kanban), Chart.js |
| **Backend** | Node.js, Express, Mongoose, Socket.io (Real-time WebSockets), Multer (Video handling) |
| **Database** | MongoDB Atlas |
| **AI Models** | Google Gemini API (Voice analysis, resume parsing, chatbot) |
| **Integrations** | Stripe API (Payroll), Web Speech API (Voice-to-text) |

---

## 🗺️ System Architecture

### Frontend Navigation
- **`/`** - Landing Page
- **`/login` | `/register`** - Authentication (Multi-role routing)
- **`/dashboard/candidate`** - Candidate portal for jobs & video interviews
- **`/dashboard/employee`** - Employee portal for GPS attendance & payslips
- **`/dashboard/recruiter`** - Kanban pipeline & AI resume screening
- **`/dashboard/manager`** - Team oversight, leaves, and performance reviews
- **`/dashboard/admin`** - God-mode analytics, user creation, and 1-click payroll

### Backend Models
- **`User`** - Stores credentials, roles, salaries, and department info.
- **`Job`** - Job postings with required skills for AI matching.
- **`Application`** - Links a User to a Job. Stores the resume text, AI Match Score, and Pipeline Status.
- **`Attendance`** - Daily check-in/out logs with GPS coordinates and AI anomaly flags.
- **`Payroll`** - Stores monthly payslips, tax deductions, and Stripe transaction IDs.
- **`Leave`** - Stores time-off requests and manager approval status.

---

## 📡 Comprehensive API Reference

Kyro features a robust, RESTful API built with Node.js and Express.

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/register` | Public | Registers a new Candidate or Recruiter. |
| `POST` | `/api/auth/login` | Public | Authenticates user and returns JWT token. |
| `POST` | `/api/auth/verify-mfa` | Public | Verifies 2FA code sent via email. |
| `GET`  | `/api/auth/me` | Auth | Returns the currently logged-in user profile. |

### AI Integration (`/api/ai`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/ai/chat` | Auth | Processes text/voice queries and returns HR answers. |
| `GET`  | `/api/ai/job-recommendations`| Candidate| Uses AI to match candidate skills to open jobs. |

### Recruitment & Applications (`/api/applications`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/:jobId/apply` | Candidate | Uploads resume. Triggers instant AI Match Score. |
| `POST` | `/:id/video` | Candidate | Uploads webcam interview. Triggers AI voice transcript analysis. |
| `GET`  | `/` | Recruiter | Retrieves all applications for the Kanban board. |
| `PUT`  | `/:id/status` | Recruiter | Updates candidate pipeline status (drag-and-drop). |
| `POST` | `/bulk-score` | Recruiter | Forces AI to re-evaluate all resumes for a job. |

### HR Operations & Payroll (`/api/hr`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/attendance/check-in` | Employee | Logs GPS coordinates and calculates AI anomalies. |
| `GET`  | `/attendance` | Manager | Fetches individual or team attendance records. |
| `POST` | `/payroll/run` | Admin | Calculates taxes and triggers Stripe payout pipeline. |
| `GET`  | `/payroll` | Employee | Fetches personal payslip history. |
| `POST` | `/leaves/apply` | Employee | Submits a time-off request. |
| `PUT`  | `/leaves/:id/approve` | Manager | Approves a leave request. |

### Admin & Users (`/api/admin/users`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/` | Admin | Creates a new employee, sets salary, and generates password. |
| `GET`  | `/` | Admin | Fetches the entire company directory. |
| `DELETE`| `/:id` | Admin | Instantly revokes an employee's access to the system. |

---

## 🚀 Getting Started (Run Locally)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API Key

### 1. Installation
Clone the repo and install dependencies for both sides:
```bash
# Terminal 1 - Backend
cd backend && npm install

# Terminal 2 - Frontend
cd frontend && npm install
```

### 2. Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/kyro-hrms
JWT_SECRET=super_secret_key
GEMINI_API_KEY=your_gemini_key
AI_PROVIDER=gemini
STRIPE_SECRET_KEY=your_stripe_test_key # Optional for mock payroll
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000
```

### 3. Start the Engines
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```
Navigate to `http://localhost:5173`. 

---

## 🔑 Demo Credentials

To test the multi-role architecture, the backend automatically seeds these accounts on the first startup:

| Role | Email | Password |
|------|-------|----------|
| **Management Admin** | `admin@hiring.com` | `Admin123!` |
| **Senior Manager** | `manager@hiring.com` | `Manager123!` |
| **HR Recruiter** | `recruiter@hiring.com` | `Recruiter123!` |
| **Employee** | `employee@hiring.com` | `Employee123!` |

*(Note: Candidate accounts must be created dynamically via the "Register" page to upload a resume.)*

---

## 📈 The Demo Flow 
If you are presenting this project, follow this exact flow to wow the judges:
1. **Apply:** Register as a Candidate, apply for a job, and upload a resume to trigger the AI Match Score.
2. **Screen:** Log in as Recruiter, view the Kanban board, and show the AI Video Interview analysis.
3. **Onboard:** Drag the candidate to "Selected" and click *Convert to Employee*.
4. **Clock In:** Log in as the new Employee, click "Clock In Onsite", and allow the GPS prompt.
5. **Pay:** Log in as Admin, go to Payroll, and click *Disburse Funds* to trigger the automated Stripe pipeline.

---
*Built with ❤️ for the Future of HR Management Hackathon.*
