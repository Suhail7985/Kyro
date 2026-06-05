# Database ER Overview

## Core Entities

- **User** — authentication & role
- **Employee** — HR profile linked 1:1 to User
- **Department**, **Designation**
- **Attendance**, **Leave**, **LeaveBalance**, **Payroll**
- **Job**, **Candidate**, **Application** (with embedded resume analysis)
- **Interview** (AI-generated questions)
- **PerformanceReview**
- **Onboarding**
- **Notification**, **ChatHistory**

## Relationships

- User 1—1 Employee
- Employee N—1 Department, Designation, Manager (User)
- Application N—1 Job, N—1 Candidate
- Interview N—1 Application
- Attendance/Leave/Payroll N—1 Employee

## Indexes

- `User.email` unique
- `Employee.employeeId` unique
- `Attendance(userId, date)` unique
- `Application(jobId, candidateId)` unique
- `Application(jobId, aiScore)` for leaderboard
