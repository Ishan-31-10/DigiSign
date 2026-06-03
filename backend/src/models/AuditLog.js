import mongoose from 'mongoose';

/**
 * Append-only log of important platform actions.
 * Stored in MongoDB (single source of truth) so admins can search them.
 */
const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: { type: String }, // denormalized for deleted-user safety
    action: {
      type: String,
      required: true,
      index: true,
      // Examples:
      //   user.register, user.login, user.login_failed,
      //   user.password_reset_requested, user.password_reset_completed,
      //   document.upload, document.delete, document.download,
      //   document.sign, document.verify,
      //   signature.create, signature.delete,
      //   admin.user_update, admin.user_disable
    },
    targetType: { type: String }, // "Document", "User", ...
    targetId: { type: mongoose.Schema.Types.ObjectId },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
