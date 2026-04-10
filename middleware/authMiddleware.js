import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/config.js'
import User from '../models/User.js'

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Not authorized — no token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    const user = await User.findById(decoded.id).select('-password')
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized — user not found' })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized — invalid token' })
  }
}
