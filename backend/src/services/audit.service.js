import AuditLog from '../models/AuditLog.js';

/**
 * Fire-and-forget audit logger. Never throws — audit failures must not
 * break the originating request.
 */
async function log(req, { action, targetType, targetId, metadata, status = 'success', actor }) {
  try {
    const actingUser = actor || req?.user || null;
    await AuditLog.create({
      actor: actingUser?._id || actingUser?.id,
      actorEmail: actingUser?.email,
      action,
      targetType,
      targetId,
      ip: req?.ip,
      userAgent: req?.get?.('user-agent'),
      metadata,
      status,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] failed to write log:', err.message);
  }
}

export { log };
