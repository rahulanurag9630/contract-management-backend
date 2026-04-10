import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS } from '../config/config.js'

function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' })
    }

    const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
    const user = await User.create({ name, email, password: hashed })

    const token = signToken(user._id)

    res.status(201).json({
      success: true,
      data: { token, user: user.toJSON() },
      message: 'Account created successfully',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' })
    }

    const token = signToken(user._id)

    res.status(200).json({
      success: true,
      data: { token, user: user.toJSON() },
      message: 'Logged in successfully',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me
 * Requires: protect middleware (sets req.user)
 */
export async function getMe(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      data: req.user.toJSON(),
    })
  } catch (err) {
    next(err)
  }
}
