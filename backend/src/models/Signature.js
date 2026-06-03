import mongoose from 'mongoose';

/**
 * A reusable signature owned by a user.
 *  - type "draw": dataUrl holds a base64-encoded PNG produced by the canvas pad
 *  - type "type": text + fontFamily render the signature server-side
 */
const signatureSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: { type: String, default: 'My signature', trim: true, maxlength: 60 },
    type: { type: String, enum: ['draw', 'type'], required: true },
    dataUrl: { type: String }, // PNG data URL for "draw"
    text: { type: String, trim: true, maxlength: 60 }, // for "type"
    fontFamily: { type: String, default: 'Helvetica' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Signature', signatureSchema);
