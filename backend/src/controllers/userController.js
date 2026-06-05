const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function listUsers(req, res) {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { phone, location, linkedin, bio, skills, experience, education, onboardingComplete } =
      req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (phone !== undefined) user.profile.phone = phone;
    if (location !== undefined) user.profile.location = location;
    if (linkedin !== undefined) user.profile.linkedin = linkedin;
    if (bio !== undefined) user.profile.bio = bio;
    if (experience !== undefined) user.profile.experience = experience;
    if (education !== undefined) user.profile.education = education;
    if (skills !== undefined) user.profile.skills = Array.isArray(skills) ? skills : [];
    if (onboardingComplete !== undefined) user.profile.onboardingComplete = onboardingComplete;

    await user.save();
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role, department, designation, managerId, employeeId, salary } =
      req.body;
    const allowedRoles = ['employee', 'hr_recruiter', 'senior_manager', 'admin'];
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      department,
      designation,
      managerId,
      employeeId,
      salary,
      permissions: [],
      profile: { onboardingComplete: role === 'employee' ? false : true },
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      managerId: user.managerId,
      employeeId: user.employeeId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateUser(req, res) {
  try {
    const allowed = [
      'name',
      'email',
      'role',
      'department',
      'designation',
      'managerId',
      'employeeId',
      'salary',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.role && !['employee', 'hr_recruiter', 'senior_manager', 'admin'].includes(updates.role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select(
      '-passwordHash'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteUser(req, res) {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createAdmin(req, res) {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email: email?.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
    });
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { listUsers, updateProfile, deleteUser, createAdmin, createUser, updateUser };
