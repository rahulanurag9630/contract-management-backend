import Contract from '../models/Contract.js'

/**
 * Restrict to admin users only.
 */
export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden — admin access required' })
  }
  next()
}

/**
 * Allow access only to the contract owner or an admin.
 * Attaches the found contract to req.contract for downstream use.
 */
export async function requireOwnerOrAdmin(req, res, next) {
  try {
    const contract = await Contract.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate('createdBy', 'name email role')

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found' })
    }

    const isOwner = contract.createdBy._id.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden — not your contract' })
    }

    req.contract = contract
    next()
  } catch (err) {
    next(err)
  }
}
