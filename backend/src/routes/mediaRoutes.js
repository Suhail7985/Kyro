const express = require('express');
const { getPresignedUploadSignature } = require('../controllers/mediaController');
const { auth, applicantAuth } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Route that allows both internal users and external applicants to request signatures
router.get('/presign', (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type === 'applicant') {
      return applicantAuth(req, res, next);
    } else {
      return auth(req, res, next);
    }
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}, getPresignedUploadSignature);

module.exports = router;
