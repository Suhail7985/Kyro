# Kyro HRMS - Updated Architecture Documentation

## Overview

Complete redesign of the HRMS platform to support a two-tier user system:
1. **External Users (Applicants)** - Public career portal users
2. **Internal Users** - Management Admin, Senior Manager, HR Recruiter, Employee

## User Types and Roles

### External Users
- **Applicant** - Can register publicly, browse jobs, apply, record video interviews, track applications

### Internal Users (Created by Admin Only)
- **Management Admin** - Full platform access, user management, analytics
- **Senior Manager** - Team management, performance reviews, leave approvals, hiring oversight
- **HR Recruiter** - Recruitment management, job posting, applicant screening, hiring
- **Employee** - Employee self-service (attendance, payroll, leaves, profile)

## Authentication Flow

### Applicants (External - Public Registration)
```
1. Public Register Page → Create Applicant Account
2. Public Login Page → Login as Applicant
3. Get JWT Token (type: 'applicant')
4. Access Applicant Dashboard
```

### Internal Users (Admin-Created Only)
```
1. Admin creates account with email, role, department
2. System generates temporary password
3. User logs in with temporary password
4. Must change password on first login
5. Get JWT Token (type: 'user')
6. Access Role-based Dashboard
```

## Database Models

### Applicant Model
```javascript
{
  name, email, passwordHash,
  phone, location, linkedin, portfolio, bio,
  profile: { skills, experience, education, ... },
  applications: [ { jobId, status, resumeUrl, matchScore, ... } ],
  savedJobs: [ jobId ],
  conversionStatus: 'applicant' | 'selected' | 'onboarded' | 'employee',
  convertedTo: userId, // Reference to converted Employee User
  isActive, lastLogin
}
```

### User Model (Internal)
```javascript
{
  name, email, passwordHash,
  role: 'admin' | 'senior_manager' | 'hr_recruiter' | 'employee',
  employeeId, department, designation, managerId,
  accountStatus: 'active' | 'inactive' | 'pending',
  createdBy, lastLogin,
  profile: { phone, location, linkedin, bio, skills, ... }
}
```

### Job Model
```javascript
{
  title, department, description,
  responsibilities, requirements,
  requiredSkills, niceToHaveSkills,
  experienceRequired, experienceLevel,
  location, workType, salaryMin, salaryMax,
  employmentType, benefits,
  status: 'draft' | 'open' | 'closed' | 'filled',
  createdBy, applicantCount, viewCount
}
```

### Application Model
```javascript
{
  applicantId, jobId,
  resumeUrl, resumeText, matchScore,
  matchedSkills, missingSkills, aiFeedback,
  pipelineStatus: 'applied' | 'screening' | 'shortlisted' | 'interview' | 
                  'recruiter_review' | 'manager_review' | 'selected' | 'rejected' | 'onboarding',
  interviewVideos: [ { questionId, question, videoUrl, videoDuration, uploadedAt } ],
  recruiterFeedback, recruiterScore, recruiterReviewedAt,
  managerFeedback, managerScore, managerReviewedAt,
  isSelected, selectedDate,
  convertedToEmployeeId
}
```

## API Routes

### Applicant Auth (Public)
```
POST   /api/applicants/auth/register          - Register new applicant
POST   /api/applicants/auth/login             - Login applicant
GET    /api/applicants/auth/profile           - Get applicant profile
PUT    /api/applicants/auth/profile           - Update applicant profile
```

### Internal Auth
```
POST   /api/auth/login                        - Login internal user
GET    /api/auth/me                           - Get current user
```

### Admin User Management
```
POST   /api/admin/users                       - Create user
GET    /api/admin/users                       - List users
GET    /api/admin/users/:id                   - Get user details
PUT    /api/admin/users/:id                   - Update user
DELETE /api/admin/users/:id                   - Delete user
PUT    /api/admin/users/:id/reset-password    - Reset password
PUT    /api/admin/users/:id/activate          - Activate account
PUT    /api/admin/users/:id/deactivate        - Deactivate account
```

### Recruitment & Job Management
```
GET    /api/recruitment/jobs                  - Browse jobs (public)
GET    /api/recruitment/jobs/:jobId           - Get job details (public)
POST   /api/recruitment/apply/:jobId          - Apply for job (applicant)
GET    /api/recruitment/my-applications       - Get my applications (applicant)
POST   /api/recruitment/save-job/:jobId       - Save/unsave job (applicant)
GET    /api/recruitment/applicants/:jobId     - View applicants (recruiter)
PUT    /api/recruitment/applications/:appId/status - Update app status
POST   /api/recruitment/applications/:appId/shortlist - Shortlist applicant
POST   /api/recruitment/applications/:appId/reject - Reject applicant
POST   /api/recruitment/applications/:appId/convert-to-employee - Admin convert
```

### Video Interviews
```
POST   /api/interviews/questions/:jobId       - Generate interview questions (recruiter)
POST   /api/interviews/upload/:appId          - Upload video response (applicant)
GET    /api/interviews/my-videos/:appId       - Get my videos (applicant)
PUT    /api/interviews/rerecord/:appId/:vidId - Re-record video (applicant)
GET    /api/interviews/view/:appId            - View videos (recruiter/manager)
```

## Hiring Pipeline

```
APPLICANT JOURNEY:
1. Register as Applicant
   ↓
2. Browse Open Jobs (Career Portal)
   ↓
3. View Job Details & Responsibilities
   ↓
4. Apply with Resume Upload
   ↓
5. AI Resume Screening (Automatic)
   ├─ Match Score Calculated
   ├─ Skills Extracted
   ├─ Feedback Generated
   ↓
6. Status: Screening → Shortlisted (if passed)
   ↓
7. AI Interview Generation (Questions Generated)
   ↓
8. Record Video Responses (Applicant records answers)
   ↓
9. Submit Videos (Ready for Recruiter Review)
   ↓
10. Recruiter Reviews (Watches videos, adds feedback)
    ├─ Can shortlist or reject
    ↓
11. Manager Review (Senior Manager reviews qualified candidates)
    ├─ Can approve or reject
    ↓
12. Selected Status
    ↓
13. Admin Converts to Employee
    ├─ Creates Employee Account
    ├─ Generates Employee ID
    ├─ Assigns Department & Manager
    ├─ Sets Active Status
    ↓
14. Employee Onboarding
```

## Role Permissions

### Admin
- Full Access
- Create/Edit/Delete Users (Recruiter, Manager, Employee)
- Manage Jobs
- View All Applicants & Analytics
- Convert Applicants to Employees
- Reset Passwords & Account Management

### HR Recruiter
- Create/Edit Jobs
- View Job Applicants
- Screen Resumes (AI Summary)
- Watch Interview Videos
- Shortlist/Reject Applicants
- Add Feedback
- Generate Hiring Reports

### Senior Manager
- View Team Members
- Review Shortlisted Candidates
- Watch Interview Videos
- Add Hiring Feedback
- Manage Performance
- View Team Analytics

### Employee
- Clock In/Out
- Apply Leave
- View Payroll
- Update Profile
- View Attendance
- Download Documents

### Applicant
- View Open Jobs
- Search & Filter Jobs
- Browse Job Details
- Apply for Jobs
- Upload Resume
- Record Video Interviews
- Track Application Status
- Save Jobs
- Update Profile

## Key Features

### Public Career Portal
- Professional Wellfound-style design
- Browse and search open jobs
- Advanced filters (location, experience, salary)
- Responsive job cards
- Job details with full description
- Apply directly

### Applicant Dashboard
- Overview of applications
- My Applications (status tracking)
- Saved Jobs
- AI Interview Recording
- Profile & Resume Management
- Documents

### AI Resume Screening
- Automatic parsing of uploaded resumes
- Extract skills, experience, education
- Generate match score
- Compare with job requirements
- Provide hiring recommendations

### Video Interview System
- Applicant-only video upload
- AI-generated questions based on role
- Record multiple video responses
- Re-record capability
- Timestamp tracking
- Recruiter/Manager review interface

### Recruiting Tools (Recruiter)
- Job Management (Create, Edit, Close)
- Applicant Pipeline View
- Resume Screening (AI scores displayed)
- Video Interview Viewer
- Bulk Actions (Shortlist, Reject)
- Hiring Reports & Analytics

### Admin Controls
- User Creation & Management
- Department Management
- Account Status Control
- Password Reset
- Applicant-to-Employee Conversion
- Platform Analytics

## Security Considerations

1. **Separate JWT Token Types**
   - Applicant tokens (30 days) - for external users
   - User tokens (7 days) - for internal users

2. **Role-Based Access Control**
   - Applicants cannot access internal endpoints
   - Internal users cannot access applicant endpoints
   - Admin-only endpoints require admin role

3. **Data Isolation**
   - Applicants only see their own applications
   - Recruiters only see applicants for their posted jobs
   - Managers see team-related data only

4. **Account Management**
   - Account status tracking (active/inactive/pending)
   - Admin-controlled access
   - Password reset capabilities

## File Structure

```
backend/src/
├── models/
│   ├── User.js              (Internal users)
│   ├── Applicant.js         (External applicants)
│   ├── Job.js               (Job postings)
│   ├── Application.js       (Applications/Pipeline)
│   └── ...
├── controllers/
│   ├── authController.js           (Internal login)
│   ├── applicantAuthController.js  (Applicant registration/login)
│   ├── adminUserController.js      (User management)
│   ├── recruitmentController.js    (Job/Application flow)
│   ├── videoInterviewController.js (Interview videos)
│   └── ...
├── routes/
│   ├── authRoutes.js              (Internal auth)
│   ├── applicantAuthRoutes.js     (Applicant auth)
│   ├── adminUserRoutes.js         (Admin user mgmt)
│   ├── recruitmentRoutes.js       (Job/Application)
│   ├── videoInterviewRoutes.js    (Interviews)
│   └── ...
├── middleware/
│   ├── auth.js                    (auth, applicantAuth, authorize)
│   └── ...
└── ...
```

## Frontend Structure (To Be Updated)

```
src/
├── pages/
│   ├── AuthPages/
│   │   ├── ApplicantLogin.jsx       (Public login)
│   │   ├── ApplicantRegister.jsx    (Public register)
│   │   └── InternalLogin.jsx        (Internal user login)
│   ├── CareerPortal/
│   │   ├── CareerPage.jsx           (Job listings)
│   │   ├── JobDetailsPage.jsx       (Full job details)
│   │   └── ApplyPage.jsx            (Application form)
│   ├── ApplicantDashboard/
│   │   ├── OverviewPage.jsx
│   │   ├── ApplicationsPage.jsx
│   │   ├── SavedJobsPage.jsx
│   │   ├── VideoInterviewPage.jsx
│   │   └── ProfilePage.jsx
│   ├── RecruiterDashboard/
│   │   ├── JobsPage.jsx
│   │   ├── ApplicantsPage.jsx
│   │   └── HiringAnalytics.jsx
│   ├── AdminDashboard/
│   │   ├── UserManagementPage.jsx
│   │   ├── JobManagementPage.jsx
│   │   └── ConversionPage.jsx
│   └── ...
└── ...
```

## Implementation Status

✅ **Completed:**
- Applicant model with full schema
- Updated User model for internal users
- Updated Job model with comprehensive fields
- Updated Application model with pipeline
- Applicant authentication controller
- Internal user management controller
- Recruitment controller (job browsing, applications)
- Video interview controller
- Updated roles and permissions
- New routes and middleware
- App.js integration

⏳ **To Be Implemented:**
- Frontend Career Portal
- Applicant Dashboard UI
- Recruiter Dashboard updates
- Admin User Management UI
- Video Interview UI
- Job Management UI (Create, Edit)
- PDF/Resume preview
- Email notifications
- Analytics dashboards
