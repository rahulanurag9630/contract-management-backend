import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import { PORT, MONGO_URI, NODE_ENV, CLIENT_URL, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from './config/config.js'
import authRoutes from './routes/authRoutes.js'
import contractRoutes from './routes/contractRoutes.js'
import userRoutes from './routes/userRoutes.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'

const app = express()

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet())

// Allow both the configured client URL and common Vite dev ports
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow Postman / curl (no origin) and all allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`))
    }
  },
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// ─── Logging ─────────────────────────────────────────────────────────────────
if (NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// ─── Rate Limiter (auth routes only) ─────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: { success: false, error: 'Too many requests — please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/contracts', contractRoutes)
app.use('/api/users', userRoutes)

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API is running', env: NODE_ENV })
})

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ─── Database + Server ────────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`MongoDB connected: ${MONGO_URI}`)
    app.listen(PORT, () => {
      console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })
