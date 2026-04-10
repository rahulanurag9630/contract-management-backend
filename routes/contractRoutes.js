import { Router } from 'express'
import {
  getContracts,
  createContract,
  getContractById,
  updateContract,
  deleteContract,
  updateContractStatus,
  getContractVersions,
  getContractVersion,
} from '../controllers/contractController.js'
import { protect } from '../middleware/authMiddleware.js'
import { requireOwnerOrAdmin } from '../middleware/roleMiddleware.js'
import {
  createContractRules,
  updateContractRules,
  statusRules,
  validate,
} from '../validators/contractValidator.js'

const router = Router()

// All contract routes require authentication
router.use(protect)

// Collection routes
router.get('/', getContracts)
router.post('/', createContractRules, validate, createContract)

// Single contract routes — requireOwnerOrAdmin checks ownership & attaches req.contract
router.get('/:id', requireOwnerOrAdmin, getContractById)
router.put('/:id', requireOwnerOrAdmin, updateContractRules, validate, updateContract)
router.delete('/:id', requireOwnerOrAdmin, deleteContract)
router.patch('/:id/status', requireOwnerOrAdmin, statusRules, validate, updateContractStatus)

// Version routes
router.get('/:id/versions', requireOwnerOrAdmin, getContractVersions)
router.get('/:id/versions/:versionId', requireOwnerOrAdmin, getContractVersion)

export default router
