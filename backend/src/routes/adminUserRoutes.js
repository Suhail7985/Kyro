const express = require('express');
const {
  createUser,
  listUsers,
  getUser,
  updateUser,
  resetPassword,
  activateUser,
  deactivateUser,
  deleteUser,
} = require('../controllers/adminUserController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(auth);
router.use(authorize(['admin']));

// User management
router.post('/', createUser);
router.get('/', listUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Account management
router.put('/:id/reset-password', resetPassword);
router.put('/:id/activate', activateUser);
router.put('/:id/deactivate', deactivateUser);

module.exports = router;
