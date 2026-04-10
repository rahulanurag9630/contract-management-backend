/**
 * Seed script — creates a default admin user.
 * Run once: node seed.js
 */
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { MONGO_URI, BCRYPT_SALT_ROUNDS } from './config/config.js'
import User from './models/User.js'

const ADMIN = {
  name: 'Admin',
  email: 'admin@demo.com',
  password: 'admin123',
  role: 'admin',
}

async function seed() {
  await mongoose.connect(MONGO_URI)
  console.log('MongoDB connected')

  const existing = await User.findOne({ email: ADMIN.email })
  if (existing) {
    console.log(`Admin already exists → email: ${ADMIN.email}`)
    await mongoose.disconnect()
    return
  }

  const hashed = await bcrypt.hash(ADMIN.password, BCRYPT_SALT_ROUNDS)
  await User.create({ ...ADMIN, password: hashed })

  console.log('✓ Admin user created')
  console.log(`  Email    : ${ADMIN.email}`)
  console.log(`  Password : ${ADMIN.password}`)
  console.log(`  Role     : admin`)

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
