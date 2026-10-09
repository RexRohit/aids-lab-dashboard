const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { requireAdmin, JWT_SECRET } = require('../middleware/auth');
const { loginRateLimiter, recordFailedAttempt, resetFailedAttempts } = require('../middleware/rateLimiter');

// Admin username configured strictly from environment variable
const getAdminUsername = () => (process.env.ADMIN_USERNAME || 'admin').trim();

// Retrieve administrator password hash strictly from environment variables
function getAdminPasswordHash() {
  if (process.env.ADMIN_PASSWORD_HASH) {
    return process.env.ADMIN_PASSWORD_HASH.trim();
  }
  if (process.env.ADMIN_PASSWORD) {
    return bcrypt.hashSync(process.env.ADMIN_PASSWORD.trim(), 12);
  }
  return null;
}

// POST /api/admin/login with rate limiting protection
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.'
      });
    }

    const expectedUsername = getAdminUsername();
    const storedHash = getAdminPasswordHash();

    if (!storedHash) {
      console.error('[Security Warning] ADMIN_PASSWORD_HASH is not set in environment variables.');
      return res.status(500).json({
        success: false,
        error: 'Authentication service not configured. Please contact server administrator.'
      });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.toLowerCase() !== expectedUsername.toLowerCase()) {
      recordFailedAttempt(req);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Access denied.'
      });
    }

    const isMatch = await bcrypt.compare(password, storedHash);
    if (!isMatch) {
      recordFailedAttempt(req);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Access denied.'
      });
    }

    // Reset rate limiter failed count on successful authentication
    resetFailedAttempts(req);

    const tokenPayload = {
      username: expectedUsername,
      role: 'admin',
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    // Cookie configuration - secure & sameSite handling for cross-origin Vercel <-> Render
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    res.json({
      success: true,
      message: 'Admin authentication successful',
      token,
      user: {
        username: expectedUsername,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Authentication failed due to internal error.'
    });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  });

  res.json({
    success: true,
    message: 'Admin session terminated successfully.'
  });
});

// GET /api/admin/me
router.get('/me', requireAdmin, (req, res) => {
  res.json({
    success: true,
    authenticated: true,
    user: req.admin
  });
});

module.exports = router;
