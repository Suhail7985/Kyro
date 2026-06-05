import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import * as auth from '../controllers/auth.controller';
import * as analytics from '../controllers/analytics.controller';
import * as employee from '../controllers/employee.controller';
import * as attendance from '../controllers/attendance.controller';
import * as leave from '../controllers/leave.controller';
import * as payroll from '../controllers/payroll.controller';
import * as recruitment from '../controllers/recruitment.controller';
import * as ai from '../controllers/ai.controller';
import * as performance from '../controllers/performance.controller';
import * as onboarding from '../controllers/onboarding.controller';
import * as notification from '../controllers/notification.controller';
import { resumeUpload, bulkResumeUpload, videoUpload } from '../middlewares/upload';

const router = Router();

// ─── Auth ────────────────────────────────────────────────────────────────────
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', authenticate, auth.me);

// ─── Analytics ───────────────────────────────────────────────────────────────
router.get('/analytics/admin', authenticate, authorize('management_admin'), analytics.adminDashboard);
router.get('/analytics/manager', authenticate, authorize('senior_manager'), analytics.managerDashboard);
router.get('/analytics/recruiter', authenticate, authorize('hr_recruiter'), analytics.recruiterDashboard);
router.get('/analytics/employee', authenticate, authorize('employee'), analytics.employeeDashboard);
router.get('/analytics/charts', authenticate, analytics.chartData);

// ─── Employees ───────────────────────────────────────────────────────────────
router.get('/employees', authenticate, authorize('management_admin', 'senior_manager', 'hr_recruiter'), employee.listEmployees);
router.get('/employees/:id', authenticate, employee.getEmployee);
router.post('/employees', authenticate, authorize('management_admin'), employee.createEmployee);
router.put('/employees/:id', authenticate, authorize('management_admin', 'hr_recruiter'), employee.updateEmployee);
router.delete('/employees/:id', authenticate, authorize('management_admin'), employee.deleteEmployee);
router.post('/employees/:id/attrition', authenticate, authorize('management_admin', 'senior_manager'), employee.computeAttrition);

// ─── Departments ─────────────────────────────────────────────────────────────
router.get('/departments', authenticate, employee.listDepartments);
router.post('/departments', authenticate, authorize('management_admin'), employee.createDepartment);
router.put('/departments/:id', authenticate, authorize('management_admin'), employee.updateDepartment);
router.delete('/departments/:id', authenticate, authorize('management_admin'), employee.deleteDepartment);

// ─── Designations ────────────────────────────────────────────────────────────
router.get('/designations', authenticate, employee.listDesignations);

// ─── Attendance ──────────────────────────────────────────────────────────────
router.post('/attendance/clock-in', authenticate, authorize('employee'), attendance.clockIn);
router.post('/attendance/clock-out', authenticate, authorize('employee'), attendance.clockOut);
router.get('/attendance', authenticate, attendance.history);
router.get('/attendance/report', authenticate, authorize('management_admin', 'senior_manager'), attendance.monthlyReport);

// ─── Leave ───────────────────────────────────────────────────────────────────
router.post('/leave', authenticate, authorize('employee'), leave.applyLeave);
router.get('/leave/me', authenticate, leave.myLeaves);
router.get('/leave/balance', authenticate, leave.leaveBalance);
router.get('/leave/pending', authenticate, authorize('senior_manager', 'management_admin'), leave.pendingLeaves);
router.put('/leave/:id/approve', authenticate, authorize('senior_manager', 'management_admin'), leave.approveLeave);
router.put('/leave/:id/reject', authenticate, authorize('senior_manager', 'management_admin'), leave.rejectLeave);

// ─── Payroll ─────────────────────────────────────────────────────────────────
router.get('/payroll/me', authenticate, payroll.myPayroll);
router.post('/payroll/process', authenticate, authorize('management_admin'), payroll.processPayroll);
router.get('/payroll/dashboard', authenticate, authorize('management_admin'), payroll.payrollDashboard);

// ─── Recruitment ─────────────────────────────────────────────────────────────
router.get('/jobs', authenticate, recruitment.listJobs);
router.post('/jobs', authenticate, authorize('hr_recruiter', 'management_admin'), recruitment.createJob);
router.put('/jobs/:jobId', authenticate, authorize('hr_recruiter', 'management_admin'), recruitment.updateJob);
router.delete('/jobs/:jobId', authenticate, authorize('hr_recruiter', 'management_admin'), recruitment.deleteJob);
router.post('/jobs/:jobId/resume', authenticate, authorize('applicant', 'hr_recruiter', 'management_admin'), resumeUpload.single('resume'), recruitment.uploadResume);
router.post('/jobs/:jobId/bulk-resumes', authenticate, authorize('hr_recruiter', 'management_admin'), bulkResumeUpload.array('resumes', 20), recruitment.bulkUpload);
router.get('/jobs/:jobId/leaderboard', authenticate, authorize('hr_recruiter', 'management_admin'), recruitment.leaderboard);
router.get('/applications', authenticate, authorize('hr_recruiter', 'management_admin'), recruitment.listApplications);
router.get('/applications/me', authenticate, authorize('applicant'), recruitment.myApplications);
router.put('/applications/:id/status', authenticate, authorize('hr_recruiter', 'management_admin'), recruitment.updateApplicationStatus);
router.post('/jobs/:jobId/interview-questions', authenticate, authorize('hr_recruiter', 'management_admin'), recruitment.generateQuestions);
router.post('/applications/:id/video', authenticate, authorize('applicant', 'hr_recruiter', 'management_admin'), videoUpload.single('video'), recruitment.uploadVideo);
router.get('/interviews/me', authenticate, authorize('applicant'), recruitment.myInterviews);

// ─── AI ──────────────────────────────────────────────────────────────────────
router.post('/ai/chat', authenticate, ai.chat);
router.get('/ai/top-candidates', authenticate, authorize('hr_recruiter', 'management_admin'), ai.topCandidates);
router.get('/ai/hiring-summary', authenticate, authorize('hr_recruiter', 'management_admin', 'senior_manager'), ai.hiringSummary);

// ─── Performance ─────────────────────────────────────────────────────────────
router.post('/performance', authenticate, authorize('senior_manager', 'management_admin', 'hr_recruiter'), performance.createReview);
router.get('/performance', authenticate, performance.listReviews);

// ─── Onboarding ──────────────────────────────────────────────────────────────
router.get('/onboarding', authenticate, onboarding.getOnboarding);
router.put('/onboarding', authenticate, onboarding.updateOnboarding);

// ─── Notifications ───────────────────────────────────────────────────────────
router.get('/notifications', authenticate, notification.listNotifications);
router.put('/notifications/read-all', authenticate, notification.markAllAsRead);
router.put('/notifications/:id/read', authenticate, notification.markAsRead);

// ─── User Management (Admin only) ────────────────────────────────────────────
router.get('/users', authenticate, authorize('management_admin'), auth.listUsers);
router.post('/users/create-manager', authenticate, authorize('management_admin'), auth.createManager);
router.post('/users/create-recruiter', authenticate, authorize('management_admin'), auth.createRecruiter);
router.post('/users/create-employee', authenticate, authorize('management_admin'), auth.createEmployeeUser);
router.put('/users/:id', authenticate, authorize('management_admin'), auth.updateUser);
router.delete('/users/:id', authenticate, authorize('management_admin'), auth.deleteUser);

export default router;
