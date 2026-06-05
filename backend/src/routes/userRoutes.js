const express = require('express');
const {
  listUsers,
  updateProfile,
  deleteUser,
  createAdmin,
  createUser,
  updateUser,
} = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.put('/profile', auth, updateProfile);
router.get('/', auth, authorize('admin'), listUsers);
router.post('/', auth, authorize('admin'), createUser);
router.post('/admin', auth, authorize('admin'), createAdmin);
router.put('/:id', auth, authorize('admin'), updateUser);
router.delete('/:id', auth, authorize('admin'), deleteUser);

module.exports = router;
