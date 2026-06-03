import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(password) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(password, salt);
};

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

/**
 * Generates a random reset token, stores its SHA-256 hash on the user and
 * returns the *plain* token (which is sent in the email/URL).
 */
userSchema.methods.createPasswordResetToken = function createPasswordResetToken(ttlMs) {
  const plain = crypto.randomBytes(32).toString('hex');
  this.resetTokenHash = crypto.createHash('sha256').update(plain).digest('hex');
  this.resetTokenExpiresAt = new Date(Date.now() + ttlMs);
  return plain;
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject({ versionKey: false });
  obj.id = obj._id;
  delete obj._id;
  delete obj.passwordHash;
  delete obj.resetTokenHash;
  delete obj.resetTokenExpiresAt;
  return obj;
};

export default mongoose.model('User', userSchema);
