const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const EBook = require('../models/EBook');
const db = require('../models/index')
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

const User = db.User
const JWT_SECRET = process.env.JWT_SECRET || 'mekanism';

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (Author or Reader)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email:
 *                 type: string
 *                 example: author@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *               role:
 *                 type: string
 *                 enum: [author, reader]
 *                 example: author
 *               username:
 *                 type: string
 *                 example: AuthorName
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const user = await User.create({ username, email, password, role });
    res.status(201).json({ message: 'Registration successful', userId: user.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user to receive a JWT access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: author@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful, returns token
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user || !(await user.validPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
