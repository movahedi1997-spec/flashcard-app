const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findByEmail, createUser } = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    if (findByEmail(email)) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = createUser({ id: Date.now().toString(), name, email, password: hashed });

    res.cookie('token', signToken(user), COOKIE_OPTS);
    return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  try {
    const user = findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.cookie('token', signToken(user), COOKIE_OPTS);
    return res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token', { path: '/' });
  return res.json({ message: 'Logged out.' });
});

// GET /api/auth/me  (optional — useful for debugging)
router.get('/me', (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({ user: { userId: payload.userId, email: payload.email, name: payload.name } });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

module.exports = router;
