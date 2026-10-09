// In-memory login rate limiter to protect against brute-force attacks
const loginAttempts = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // 5 failed attempts per IP

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1'
  );
}

function loginRateLimiter(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();

  const record = loginAttempts.get(ip);

  if (record) {
    // If window expired, reset attempts
    if (now - record.firstAttemptTime > WINDOW_MS) {
      loginAttempts.delete(ip);
    } else if (record.attempts >= MAX_ATTEMPTS) {
      const waitMinutes = Math.ceil((WINDOW_MS - (now - record.firstAttemptTime)) / 60000);
      return res.status(429).json({
        success: false,
        error: `Too many failed login attempts. For security, access is temporarily locked. Please try again in ${waitMinutes} minute(s).`
      });
    }
  }

  next();
}

function recordFailedAttempt(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || (now - record.firstAttemptTime > WINDOW_MS)) {
    loginAttempts.set(ip, { attempts: 1, firstAttemptTime: now });
  } else {
    record.attempts += 1;
  }
}

function resetFailedAttempts(req) {
  const ip = getClientIp(req);
  loginAttempts.delete(ip);
}

// Cleanup expired records every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (now - record.firstAttemptTime > WINDOW_MS) {
      loginAttempts.delete(ip);
    }
  }
}, 30 * 60 * 1000);

module.exports = {
  loginRateLimiter,
  recordFailedAttempt,
  resetFailedAttempts
};
