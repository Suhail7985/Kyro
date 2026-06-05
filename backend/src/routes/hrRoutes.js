const express = require('express');
const {
  listEmployees,
  getEmployee,
  updateEmployee,
  checkIn,
  checkOut,
  getAttendance,
  attendanceInsights,
  getPayroll,
  runPayroll,
  listPerformance,
  createPerformance,
  companyDashboard,
  applyLeave,
  getMyLeaves,
  pendingLeaves,
  approveLeave,
  rejectLeave,
} = require('../controllers/hrController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard/company', authenticate, authorize('admin', 'senior_manager'), companyDashboard);
router.get('/employees', authenticate, authorize('admin', 'senior_manager'), listEmployees);
router.get('/employees/:id', authenticate, authorize('admin', 'senior_manager'), getEmployee);
router.put('/employees/:id', authenticate, authorize('admin'), updateEmployee);

router.post('/attendance/check-in', authenticate, authorize('employee'), checkIn);
router.post('/attendance/check-out', authenticate, authorize('employee'), checkOut);
router.get('/attendance', authenticate, getAttendance);
router.get('/attendance/insights', authenticate, attendanceInsights);

router.get('/payroll', authenticate, getPayroll);
router.post('/payroll/run', authenticate, authorize('admin'), runPayroll);

router.post('/leaves', authenticate, authorize('employee'), applyLeave);
router.get('/leaves', authenticate, getMyLeaves);
router.get('/leaves/pending', authenticate, authorize('admin', 'senior_manager'), pendingLeaves);
router.put('/leaves/:id/approve', authenticate, authorize('admin', 'senior_manager'), approveLeave);
router.put('/leaves/:id/reject', authenticate, authorize('admin', 'senior_manager'), rejectLeave);

router.get('/performance', authenticate, listPerformance);
router.post('/performance', authenticate, authorize('admin', 'senior_manager'), createPerformance);

module.exports = router;
