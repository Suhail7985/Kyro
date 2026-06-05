const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(applicant) {
  return jwt.sign(
    { id: applicant._id, type: 'applicant', email: applicant.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

async function registerApplicant(req, res) {
  try {
    const { name, email, password, phone, location, education } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = Math.random().toString(36).slice(-8) + Date.now().toString(36);

    const applicant = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'applicant',
      accountStatus: 'active',
      conversionStatus: 'applicant',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      profile: {
        phone: phone || '',
        location: location || '',
        education: education || '',
        skills: [],
      },
    });

    // Send verification email
    const { sendEmail } = require('../utils/mailer');
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}&type=applicant`;
    await sendEmail({
      to: applicant.email,
      subject: 'Verify your Kyro email address',
      text: `Hello ${applicant.name},\n\nPlease verify your email by clicking the link: ${verificationLink}\n\nBest regards,\nKyro Recruitment Team`,
      html: `<p>Hello <b>${applicant.name}</b>,</p><p>Thank you for registering on Kyro! Please verify your email by clicking the link below:</p><p><a href="${verificationLink}">Verify Email</a></p><br><p>Best regards,<br>Kyro Recruitment Team</p>`
    });

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      emailVerificationSent: true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function loginApplicant(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const applicant = await User.findOne({ email: email.toLowerCase(), role: 'applicant' });
    if (!applicant || applicant.accountStatus !== 'active') {
      return res.status(401).json({ message: 'Invalid credentials or account disabled' });
    }

    const valid = await bcrypt.compare(password, applicant.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Email verification check
    if (!applicant.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email address before logging in. Check your inbox.' });
    }

    // MFA Check
    if (applicant.mfaEnabled) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      applicant.mfaCode = otp;
      applicant.mfaCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await applicant.save();

      // Send OTP email
      const { sendEmail } = require('../utils/mailer');
      await sendEmail({
        to: applicant.email,
        subject: 'Your Kyro 2FA Verification Code',
        text: `Your Kyro 2FA security code is: ${otp}\nIt expires in 10 minutes.`,
        html: `<p>Your Kyro security code is: <h2><code>${otp}</code></h2></p><p>It expires in 10 minutes.</p>`
      });

      return res.json({ mfaRequired: true, userId: applicant._id, type: 'applicant' });
    }

    // Update last login
    applicant.lastLogin = new Date();
    await applicant.save();

    const token = signToken(applicant);
    setAuthCookie(res, token);

    res.json({
      token,
      type: 'applicant',
      applicant: {
        id: applicant._id,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.profile?.phone || '',
        location: applicant.profile?.location || '',
        profile: applicant.profile || {},
        conversionStatus: applicant.conversionStatus,
        savedJobs: applicant.savedJobs || [],
        mfaEnabled: applicant.mfaEnabled,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function verifyEmail(req, res) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const applicant = await User.findOne({ emailVerificationToken: token, role: 'applicant' });
    if (!applicant) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    applicant.isEmailVerified = true;
    applicant.emailVerificationToken = undefined;
    await applicant.save();

    res.json({ message: 'Email verified successfully! You can now log in.' });
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

    const applicant = await User.findOne({ _id: userId, role: 'applicant' });
    if (!applicant) return res.status(404).json({ message: 'Applicant not found' });

    if (!applicant.mfaCode || applicant.mfaCode !== code || applicant.mfaCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired 2FA code' });
    }

    // Clear code
    applicant.mfaCode = undefined;
    applicant.mfaCodeExpires = undefined;
    applicant.lastLogin = new Date();
    await applicant.save();

    const token = signToken(applicant);
    setAuthCookie(res, token);

    res.json({
      token,
      type: 'applicant',
      applicant: {
        id: applicant._id,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.profile?.phone || '',
        location: applicant.profile?.location || '',
        profile: applicant.profile || {},
        conversionStatus: applicant.conversionStatus,
        savedJobs: applicant.savedJobs || [],
        mfaEnabled: applicant.mfaEnabled,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getApplicantProfile(req, res) {
  try {
    const applicant = await User.findById(req.applicant._id)
      .populate('savedJobs', 'title department location');

    res.json({
      applicant: {
        id: applicant._id,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.profile?.phone || '',
        location: applicant.profile?.location || '',
        linkedin: applicant.profile?.linkedin || '',
        portfolio: applicant.profile?.portfolio || '',
        bio: applicant.profile?.bio || '',
        profile: applicant.profile || {},
        savedJobs: applicant.savedJobs || [],
        conversionStatus: applicant.conversionStatus,
        mfaEnabled: applicant.mfaEnabled,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateApplicantProfile(req, res) {
  try {
    const { phone, location, linkedin, portfolio, bio, profile } = req.body;

    const applicant = await User.findById(req.applicant._id);
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    applicant.profile = {
      ...(applicant.profile || {}),
      phone: phone !== undefined ? phone : applicant.profile?.phone,
      location: location !== undefined ? location : applicant.profile?.location,
      linkedin: linkedin !== undefined ? linkedin : applicant.profile?.linkedin,
      portfolio: portfolio !== undefined ? portfolio : applicant.profile?.portfolio,
      bio: bio !== undefined ? bio : applicant.profile?.bio,
      ...(profile || {}),
    };

    applicant.markModified('profile');
    await applicant.save();

    res.json({
      message: 'Profile updated successfully',
      applicant: {
        id: applicant._id,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.profile.phone,
        location: applicant.profile.location,
        linkedin: applicant.profile.linkedin,
        portfolio: applicant.profile.portfolio,
        bio: applicant.profile.bio,
        profile: applicant.profile,
        mfaEnabled: applicant.mfaEnabled,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  registerApplicant,
  loginApplicant,
  verifyEmail,
  verifyMfa,
  getApplicantProfile,
  updateApplicantProfile,
};
