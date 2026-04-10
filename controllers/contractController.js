import mongoose from 'mongoose'
import Contract from '../models/Contract.js'
import ContractVersion from '../models/ContractVersion.js'
import { isValidTransition } from '../utils/statusTransitions.js'

/**
 * GET /api/contracts
 * Admin: all non-deleted contracts
 * User: only their own non-deleted contracts
 * Query: search, status, startDate, endDate, sortBy, order, page, limit
 */
export async function getContracts(req, res, next) {
  try {
    const {
      search,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc',
      page: pageParam = 1,
      limit: limitParam = 10,
    } = req.query

    const page = Math.max(1, parseInt(pageParam))
    const limit = Math.min(100, Math.max(1, parseInt(limitParam)))
    const skip = (page - 1) * limit

    const filter = { isDeleted: false }

    // Non-admins only see their own contracts
    if (req.user.role !== 'admin') {
      filter.createdBy = req.user._id
    }

    // Status filter
    if (status && ['Draft', 'Active', 'Executed', 'Expired'].includes(status)) {
      filter.status = status
    }

    // Date range filter
    if (startDate) filter.startDate = { $gte: new Date(startDate) }
    if (endDate) filter.endDate = { ...filter.endDate, $lte: new Date(endDate) }

    // Text search on title and party names
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i')
      filter.$or = [
        { title: regex },
        { 'parties.name': regex },
      ]
    }

    const sortField = ['createdAt', 'updatedAt', 'title', 'status'].includes(sortBy)
      ? sortBy
      : 'createdAt'
    const sortDir = order === 'asc' ? 1 : -1

    const [contracts, total] = await Promise.all([
      Contract.find(filter)
        .populate('createdBy', 'name email')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit),
      Contract.countDocuments(filter),
    ])

    res.status(200).json({
      success: true,
      data: contracts.map((c) => c.toJSON()),
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
 * POST /api/contracts
 * Body: { title, description, parties, startDate, endDate, status? }
 */
export async function createContract(req, res, next) {
  try {
    const { title, description, parties, startDate, endDate } = req.body

    const contract = await Contract.create({
      title,
      description: description || '',
      parties: parties || [],
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'Draft',              // Always start as Draft
      createdBy: req.user._id,      // Always from JWT — never trust client
      currentVersion: 1,
    })

    await contract.populate('createdBy', 'name email')

    res.status(201).json({
      success: true,
      data: contract.toJSON(),
      message: 'Contract created successfully',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/contracts/:id
 * req.contract already attached and ownership verified by requireOwnerOrAdmin
 */
export async function getContractById(req, res, next) {
  try {
    res.status(200).json({ success: true, data: req.contract.toJSON() })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/contracts/:id
 * Saves a version snapshot BEFORE applying updates.
 * Body: { title?, description?, parties?, startDate?, endDate?, status? }
 */
export async function updateContract(req, res, next) {
  try {
    const contract = req.contract

    // Save snapshot of the current state before any changes
    await ContractVersion.create({
      contractId: contract._id,
      versionNumber: contract.currentVersion,
      snapshot: contract.toJSON(),
      changedBy: req.user._id,
    })

    // Apply allowed updates
    const allowed = ['title', 'description', 'parties', 'startDate', 'endDate', 'status']
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        if (field === 'status') {
          // No-op: status unchanged — skip transition validation
          if (req.body.status === contract.status) continue
          // Changing status: validate the transition
          if (!isValidTransition(contract.status, req.body.status)) {
            return res.status(400).json({
              success: false,
              error: `Invalid status transition from ${contract.status} to ${req.body.status}`,
            })
          }
        }
        contract[field] = field === 'startDate' || field === 'endDate'
          ? new Date(req.body[field])
          : req.body[field]
      }
    }

    contract.currentVersion += 1
    await contract.save()
    await contract.populate('createdBy', 'name email')

    res.status(200).json({
      success: true,
      data: contract.toJSON(),
      message: 'Contract updated successfully',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/contracts/:id
 * Soft delete only — sets isDeleted: true, never removes from DB.
 */
export async function deleteContract(req, res, next) {
  try {
    const contract = req.contract
    contract.isDeleted = true
    contract.deletedAt = new Date()
    contract.deletedBy = req.user._id
    await contract.save()

    res.status(200).json({
      success: true,
      data: {},
      message: 'Contract deleted successfully',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/contracts/:id/status
 * Body: { status: 'Active' | 'Executed' | 'Expired' }
 */
export async function updateContractStatus(req, res, next) {
  try {
    const contract = req.contract
    const { status: newStatus } = req.body

    if (!isValidTransition(contract.status, newStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status transition from ${contract.status} to ${newStatus}`,
      })
    }

    contract.status = newStatus
    await contract.save()
    await contract.populate('createdBy', 'name email')

    res.status(200).json({
      success: true,
      data: contract.toJSON(),
      message: `Contract status updated to ${newStatus}`,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/contracts/:id/versions
 * Returns all version history entries for a contract.
 */
export async function getContractVersions(req, res, next) {
  try {
    const versions = await ContractVersion.find({ contractId: req.params.id })
      .populate('changedBy', 'name email')
      .sort({ versionNumber: -1 })

    res.status(200).json({
      success: true,
      data: versions.map((v) => v.toJSON()),
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/contracts/:id/versions/:versionId
 * Returns a single version snapshot.
 */
export async function getContractVersion(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.versionId)) {
      return res.status(400).json({ success: false, error: 'Invalid version ID' })
    }

    const version = await ContractVersion.findOne({
      _id: req.params.versionId,
      contractId: req.params.id,
    }).populate('changedBy', 'name email')

    if (!version) {
      return res.status(404).json({ success: false, error: 'Version not found' })
    }

    res.status(200).json({ success: true, data: version.toJSON() })
  } catch (err) {
    next(err)
  }
}
