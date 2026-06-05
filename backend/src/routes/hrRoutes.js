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
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard/company', auth, authorize('admin', 'senior_manager'), companyDashboard);
router.get('/employees', auth, authorize('admin', 'senior_manager'), listEmployees);
router.get('/employees/:id', auth, authorize('admin', 'senior_manager'), getEmployee);
router.put('/employees/:id', auth, authorize('admin'), updateEmployee);

router.post('/attendance/check-in', auth, authorize('employee'), checkIn);
router.post('/attendance/check-out', auth, authorize('employee'), checkOut);
router.get('/attendance', auth, getAttendance);
router.get('/attendance/insights', auth, attendanceInsights);

router.get('/payroll', auth, getPayroll);
router.post('/payroll/run', auth, authorize('admin'), runPayroll);

router.post('/leaves', auth, authorize('employee'), applyLeave);
router.get('/leaves', auth, getMyLeaves);
router.get('/leaves/pending', auth, authorize('admin', 'senior_manager'), pendingLeaves);
router.put('/leaves/:id/approve', auth, authorize('admin', 'senior_manager'), approveLeave);
router.put('/leaves/:id/reject', auth, authorize('admin', 'senior_manager'), rejectLeave);

router.get('/performance', auth, listPerformance);
router.post('/performance', auth, authorize('admin', 'senior_manager'), createPerformance);

module.exports = router;
