import User from '../models/User.js'

/**
 * GET /api/users
 * Admin only — list all users with pagination.
 */
export async function getUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ])

    res.status(200).json({
      success: true,
      data: users.map((u) => u.toJSON()),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/users/:id/role
 * Admin only — change a user's role.
 * Body: { role: 'admin' | 'user' }
 */
export async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body

    if (!['admin', 'user'].includes(role)) {
      return res.status(422).json({ success: false, error: 'Role must be admin or user' })
    }

    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // Prevent admin from demoting themselves
    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ success: false, error: 'You cannot demote yourself' })
    }

    user.role = role
    await user.save()

    res.status(200).json({
      success: true,
      data: user.toJSON(),
      message: `User role updated to ${role}`,
    })
  } catch (err) {
    next(err)
  }
}
