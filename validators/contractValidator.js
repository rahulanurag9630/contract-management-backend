import { body, validationResult } from 'express-validator'

export const createContractRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),

  body('description')
    .optional()
    .trim(),

  body('parties')
    .isArray({ min: 1 }).withMessage('At least one party is required'),

  body('parties.*.name')
    .trim()
    .notEmpty().withMessage('Party name is required'),

  body('parties.*.email')
    .trim()
    .notEmpty().withMessage('Party email is required')
    .isEmail().withMessage('Party email must be valid'),

  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid date'),

  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date')
      }
      return true
    }),
]

export const updateContractRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),

  body('description')
    .optional()
    .trim(),

  body('parties')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one party is required'),

  body('parties.*.name')
    .optional()
    .trim()
    .notEmpty().withMessage('Party name is required'),

  body('parties.*.email')
    .optional()
    .trim()
    .isEmail().withMessage('Party email must be valid'),

  body('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid date'),

  body('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (req.body.startDate && new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date')
      }
      return true
    }),

  body('status')
    .optional()
    .isIn(['Draft', 'Active', 'Executed', 'Expired']).withMessage('Invalid status value'),
]

export const statusRules = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Draft', 'Active', 'Executed', 'Expired']).withMessage('Invalid status value'),
]

/**
 * Shared validator runner — returns 422 on failure.
 */
export function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    })
  }
  next()
}
