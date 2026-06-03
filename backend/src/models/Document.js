import mongoose from 'mongoose';

/**
 * Status lifecycle:
 *   uploaded  -> just uploaded, no signatures placed yet
 *   draft     -> user added signatures but did not finalize
 *   signed    -> finalized; signed PDF has been generated & hashed
 */
const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: { type: String, required: true },
    storageKey: { type: String, required: true }, // path under UPLOAD_DIR
    signedStorageKey: { type: String }, // path of signed PDF (after finalize)
    sizeBytes: { type: Number, required: true },
    mimeType: { type: String, default: 'application/pdf' },
    pageCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['uploaded', 'draft', 'signed'],
      default: 'uploaded',
      index: true,
    },

    /**
     * Placed signatures on the document. Coordinates are normalized
     * (0..1) so the frontend can render them on any page size.
     */
    placements: [
      {
        signatureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signature' },
        page: { type: Number, required: true, min: 1 },
        xRatio: { type: Number, required: true, min: 0, max: 1 },
        yRatio: { type: Number, required: true, min: 0, max: 1 },
        widthRatio: { type: Number, required: true, min: 0, max: 1 },
        heightRatio: { type: Number, required: true, min: 0, max: 1 },
        // Snapshot of the signature image / text at the time of signing
        type: { type: String, enum: ['draw', 'type'], required: true },
        dataUrl: { type: String },
        text: { type: String },
        fontFamily: { type: String },
      },
    ],

    // Set on finalize
    documentHash: { type: String, index: true }, // SHA-256 of signed PDF
    verificationId: { type: String, unique: true, sparse: true, index: true },
    signedAt: { type: Date },
    signedByName: { type: String },
    signedByEmail: { type: String },
  },
  { timestamps: true }
);

documentSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model('Document', documentSchema);
