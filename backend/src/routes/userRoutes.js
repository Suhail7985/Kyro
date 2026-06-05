const express = require('express');
const {
  listUsers,
  updateProfile,
  deleteUser,
  createAdmin,
  createUser,
  updateUser,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.put('/profile', authenticate, updateProfile);
router.get('/', authenticate, authorize('admin'), listUsers);
router.post('/', authenticate, authorize('admin'), createUser);
router.post('/admin', authenticate, authorize('admin'), createAdmin);
router.put('/:id', authenticate, authorize('admin'), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;
