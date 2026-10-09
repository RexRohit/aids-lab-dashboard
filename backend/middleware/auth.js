const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'aids-lab-audit-admin-secret-2026-key';

function requireAdmin(req, res, next) {
  // Check HttpOnly Cookie first, then Authorization Header Bearer token
  let token = req.cookies?.admin_token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Admin session or token is missing.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired admin session. Please log in again.'
    });
  }
}

module.exports = {
  requireAdmin,
  JWT_SECRET
};
