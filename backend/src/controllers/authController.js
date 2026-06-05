const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role, type: 'user' }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

async function register(req, res) {
  try {
    return res.status(403).json({
      message: 'Internal users cannot self-register. Only admins can create accounts. Please use the applicant registration instead.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.accountStatus !== 'active') {
      return res.status(401).json({ message: 'Account is not active' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    // MFA Check
    if (user.mfaEnabled) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      user.mfaCode = otp;
      user.mfaCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      // Send OTP email
      const { sendEmail } = require('../utils/mailer');
      await sendEmail({
        to: user.email,
        subject: 'Your Kyro 2FA Verification Code',
        text: `Your Kyro 2FA security code is: ${otp}\nIt expires in 10 minutes.`,
        html: `<p>Your Kyro security code is: <h2><code>${otp}</code></h2></p><p>It expires in 10 minutes.</p>`
      });

      return res.json({ mfaRequired: true, userId: user._id, type: 'user' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user);
    setAuthCookie(res, token);

    res.json({
      token,
      type: 'user',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        employeeId: user.employeeId,
        profile: user.profile,
        mfaEnabled: user.mfaEnabled,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function verifyMfa(req, res) {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ message: 'User ID and code are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.mfaCode || user.mfaCode !== code || user.mfaCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired 2FA code' });
    }

    // Clear code
    user.mfaCode = undefined;
    user.mfaCodeExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user);
    setAuthCookie(res, token);

    res.json({
      token,
      type: 'user',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        employeeId: user.employeeId,
        profile: user.profile,
        mfaEnabled: user.mfaEnabled,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function toggleMfa(req, res) {
  try {
    const { enabled } = req.body;
    const user = await User.findById(req.user?._id || req.applicant?._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.mfaEnabled = !!enabled;
    await user.save();

    res.json({
      message: `MFA has been ${user.mfaEnabled ? 'enabled' : 'disabled'} successfully.`,
      mfaEnabled: user.mfaEnabled,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getMe(req, res) {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      designation: req.user.designation,
      employeeId: req.user.employeeId,
      profile: req.user.profile,
      accountStatus: req.user.accountStatus,
      mfaEnabled: req.user.mfaEnabled,
    },
  });
}

async function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
}

module.exports = {
  register,
  login,
  verifyMfa,
  toggleMfa,
  getMe,
  logout,
};
