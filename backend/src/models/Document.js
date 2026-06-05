const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['tax_declaration', 'contract', 'id_proof', 'certificate', 'other'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: String,
    fileUrl: { type: String, required: true },
    fileSize: Number,
    mimeType: String,
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    signatureStatus: {
      type: String,
      enum: ['not_required', 'pending_signature', 'signed', 'declined'],
      default: 'not_required',
    },
    signedAt: Date,
    docusignEnvelopeId: String,
    expiresAt: Date,
  },
  { timestamps: true }
);

documentSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Document', documentSchema);
