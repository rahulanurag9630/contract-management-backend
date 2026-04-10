import { NODE_ENV } from '../config/config.js'

/**
 * Global error handling middleware.
 * Always returns a consistent { success, error } shape.
 * Never leaks stack traces in production.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    return res.status(409).json({
      success: false,
      error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
    })
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(422).json({ success: false, error: messages.join(', ') })
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Invalid ID format' })
  }

  const message = err.message || 'Internal server error'

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  })
}

/**
 * 404 handler — must be registered after all routes.
 */
export function notFound(req, res) {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` })
}
