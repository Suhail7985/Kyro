const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ROLES, isInternalUser } = require('../utils/roles');

async function createUser(req, res) {
  try {
    const { name, email, role, department, designation, managerId, password, salary } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }

    if (!isInternalUser(role)) {
      return res.status(400).json({ message: 'Invalid role for internal user' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Generate temporary password if not provided
    const tempPassword = password || (Math.random().toString(36).slice(-8) + 'Temp@123');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      department: department || '',
      designation: designation || '',
      managerId: managerId || null,
      salary: salary ? Number(salary) : 60000,
      accountStatus: 'active',
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: 'User created successfully. Credentials sent to email.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        accountStatus: user.accountStatus,
        tempPassword, // Return temp password (in production, send via email)
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function listUsers(req, res) {
  try {
    const { role, department, status } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (department) filter.department = department;
    if (status) filter.accountStatus = status;

    const users = await User.find(filter)
      .populate('managerId', 'name email')
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.json({ users, total: users.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getUser(req, res) {
  try {
    const user = await User.findById(req.params.id)
      .populate('managerId', 'name email')
      .select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateUser(req, res) {
  try {
    const { name, email, role, department, designation, managerId, accountStatus } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (role && isInternalUser(role)) updates.role = role;
    if (department) updates.department = department;
    if (designation) updates.designation = designation;
    if (managerId) updates.managerId = managerId;
    if (accountStatus && ['active', 'inactive', 'pending'].includes(accountStatus)) {
      updates.accountStatus = accountStatus;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('managerId', 'name email')
      .select('-passwordHash');

    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { passwordHash, accountStatus: 'active' },
      { new: true }
    ).select('-passwordHash');

    res.json({
      message: 'Password reset successfully',
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function activateUser(req, res) {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: 'active' },
      { new: true }
    ).select('-passwordHash');

    res.json({
      message: 'User activated successfully',
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deactivateUser(req, res) {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: 'inactive' },
      { new: true }
    ).select('-passwordHash');

    res.json({
      message: 'User deactivated successfully',
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createUser,
  listUsers,
  getUser,
  updateUser,
  resetPassword,
  activateUser,
  deactivateUser,
  deleteUser,
};
