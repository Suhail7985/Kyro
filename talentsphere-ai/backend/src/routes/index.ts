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

router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', authenticate, auth.me);

router.get('/analytics/admin', authenticate, authorize('admin'), analytics.adminDashboard);
router.get('/analytics/manager', authenticate, authorize('senior_manager'), analytics.managerDashboard);
router.get('/analytics/recruiter', authenticate, authorize('hr_recruiter'), analytics.recruiterDashboard);
router.get('/analytics/employee', authenticate, authorize('employee'), analytics.employeeDashboard);
router.get('/analytics/charts', authenticate, analytics.chartData);

router.get('/employees', authenticate, authorize('admin', 'senior_manager', 'hr_recruiter'), employee.listEmployees);
router.get('/employees/:id', authenticate, employee.getEmployee);
router.put('/employees/:id', authenticate, authorize('admin', 'hr_recruiter'), employee.updateEmployee);
router.post('/employees/:id/attrition', authenticate, authorize('admin', 'senior_manager'), employee.computeAttrition);
router.get('/departments', authenticate, employee.listDepartments);
router.post('/departments', authenticate, authorize('admin'), employee.createDepartment);
router.get('/designations', authenticate, employee.listDesignations);

router.post('/attendance/clock-in', authenticate, authorize('employee'), attendance.clockIn);
router.post('/attendance/clock-out', authenticate, authorize('employee'), attendance.clockOut);
router.get('/attendance', authenticate, attendance.history);
router.get('/attendance/report', authenticate, authorize('admin', 'senior_manager'), attendance.monthlyReport);

router.post('/leave', authenticate, authorize('employee'), leave.applyLeave);
router.get('/leave/me', authenticate, leave.myLeaves);
router.get('/leave/balance', authenticate, leave.leaveBalance);
router.get('/leave/pending', authenticate, authorize('senior_manager', 'admin'), leave.pendingLeaves);
router.put('/leave/:id/approve', authenticate, authorize('senior_manager', 'admin'), leave.approveLeave);
router.put('/leave/:id/reject', authenticate, authorize('senior_manager', 'admin'), leave.rejectLeave);

router.get('/payroll/me', authenticate, payroll.myPayroll);
router.post('/payroll/process', authenticate, authorize('admin', 'hr_recruiter'), payroll.processPayroll);
router.get('/payroll/dashboard', authenticate, authorize('admin', 'hr_recruiter'), payroll.payrollDashboard);

router.get('/jobs', authenticate, recruitment.listJobs);
router.post('/jobs', authenticate, authorize('hr_recruiter', 'admin'), recruitment.createJob);
router.post('/jobs/:jobId/resume', authenticate, resumeUpload.single('resume'), recruitment.uploadResume);
router.post('/jobs/:jobId/bulk-resumes', authenticate, bulkResumeUpload.array('resumes', 20), recruitment.bulkUpload);
router.get('/jobs/:jobId/leaderboard', authenticate, recruitment.leaderboard);
router.get('/applications', authenticate, recruitment.listApplications);
router.put('/applications/:id/status', authenticate, authorize('hr_recruiter', 'admin'), recruitment.updateApplicationStatus);
router.post('/jobs/:jobId/interview-questions', authenticate, authorize('hr_recruiter'), recruitment.generateQuestions);
router.post('/applications/:id/video', authenticate, videoUpload.single('video'), recruitment.uploadVideo);

router.post('/ai/chat', authenticate, ai.chat);
router.get('/ai/top-candidates', authenticate, authorize('hr_recruiter', 'admin'), ai.topCandidates);
router.get('/ai/hiring-summary', authenticate, authorize('hr_recruiter', 'admin', 'senior_manager'), ai.hiringSummary);

router.post('/performance', authenticate, authorize('senior_manager', 'admin', 'hr_recruiter'), performance.createReview);
router.get('/performance', authenticate, performance.listReviews);

router.get('/onboarding', authenticate, onboarding.getOnboarding);
router.put('/onboarding', authenticate, onboarding.updateOnboarding);

router.get('/notifications', authenticate, notification.listNotifications);
router.put('/notifications/read-all', authenticate, notification.markAllAsRead);
router.put('/notifications/:id/read', authenticate, notification.markAsRead);

export default router;
