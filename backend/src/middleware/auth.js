const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { userHasRole, userHasPermission } = require('../utils/roles');

// Middleware for internal users (admin, recruiter, manager, employee)
async function auth(req, res, next) {
  let token = null;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === 'applicant') {
      return res.status(401).json({ message: 'This endpoint requires internal user access' });
    }

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Middleware for applicants (external users)
async function applicantAuth(req, res, next) {
  let token = null;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'applicant') {
      return res.status(401).json({ message: 'This endpoint requires applicant access' });
    }

    const applicant = await User.findOne({ _id: decoded.id, role: 'applicant' }).select('-passwordHash');
    if (!applicant || applicant.accountStatus !== 'active') {
      return res.status(401).json({ message: 'Applicant not found or account disabled' });
    }
    req.applicant = applicant;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Authorization middleware for internal users
function authorize(...roles) {
  const flattened = roles.flat(Infinity);
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if (flattened.length === 0) return next();
    if (!userHasRole(req.user, flattened)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

// Authorization middleware for specific permissions
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if (!userHasPermission(req.user, permission)) {
      return res.status(403).json({ message: `Permission required: ${permission}` });
    }
    next();
  };
}

module.exports = { auth, authorize, requirePermission, applicantAuth };
