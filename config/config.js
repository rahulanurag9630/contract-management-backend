import dotenv from 'dotenv'
dotenv.config()

export const PORT = process.env.PORT || 5000
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/contract_management'
export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_do_not_use_in_prod'
export const JWT_EXPIRES_IN = '7d'
export const NODE_ENV = process.env.NODE_ENV || 'development'
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'
export const BCRYPT_SALT_ROUNDS = 10
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
export const RATE_LIMIT_MAX = 10
