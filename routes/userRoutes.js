import { Router } from 'express'
import { getUsers, updateUserRole } from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/roleMiddleware.js'

const router = Router()

router.use(protect, requireAdmin)

router.get('/', getUsers)
router.patch('/:id/role', updateUserRole)

export default router
