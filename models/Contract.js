import mongoose from 'mongoose'

const partySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  { _id: false }
)

const contractSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    parties: {
      type: [partySchema],
      default: [],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Executed', 'Expired'],
      default: 'Draft',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        if (ret.createdBy && ret.createdBy._id) {
          ret.createdBy.id = ret.createdBy._id.toString()
          delete ret.createdBy._id
          delete ret.createdBy.__v
          delete ret.createdBy.password
        }
      },
    },
  }
)

// Indexes for query performance
contractSchema.index({ isDeleted: 1, status: 1 })
contractSchema.index({ createdBy: 1, isDeleted: 1 })
contractSchema.index({ title: 'text' })

const Contract = mongoose.model('Contract', contractSchema)
export default Contract
