import mongoose from 'mongoose'

const contractVersionSchema = new mongoose.Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        if (ret.changedBy && ret.changedBy._id) {
          ret.changedBy.id = ret.changedBy._id.toString()
          delete ret.changedBy._id
          delete ret.changedBy.__v
          delete ret.changedBy.password
        }
      },
    },
  }
)

contractVersionSchema.index({ contractId: 1, versionNumber: 1 })

const ContractVersion = mongoose.model('ContractVersion', contractVersionSchema)
export default ContractVersion
