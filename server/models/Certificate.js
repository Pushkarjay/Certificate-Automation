const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  refNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  dofNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true // For faster verification lookups
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  program: {
    type: String,
    required: true,
    trim: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  qrCodeUrl: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    generatedBy: String,
    generatedAt: {
      type: Date,
      default: Date.now
    },
    lastVerified: Date,
    verificationCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
certificateSchema.index({ dofNo: 1 });
certificateSchema.index({ refNo: 1 });
certificateSchema.index({ name: 1 });
certificateSchema.index({ issueDate: -1 });

// Virtual for verification URL
certificateSchema.virtual('verificationUrl').get(function() {
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${this.dofNo}`;
});

// Ensure virtual fields are serialized
certificateSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
