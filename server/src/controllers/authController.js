import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_aegismind_jwt_key_32_chars_min';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export const register = async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'User with this email address already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userRole = ['admin', 'sec_analyst', 'auditor'].includes(role) ? role : 'sec_analyst';

    const user = db.createUser({
      email,
      password_hash,
      full_name,
      role: userRole
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const { password_hash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const { password_hash: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Authentication successful',
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
};

export const getMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { password_hash: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
};
