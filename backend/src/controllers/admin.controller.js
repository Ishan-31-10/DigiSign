import User from '../models/User.js';
import Document from '../models/Document.js';
import AuditLog from '../models/AuditLog.js';
import ApiError from '../utils/ApiError.js';
import { ok } from '../utils/response.js';
import * as audit from '../services/audit.service.js';

export const stats = async (_req, res) => {
  const [users, docs, signed, drafts, audits] = await Promise.all([
    User.countDocuments(),
    Document.countDocuments(),
    Document.countDocuments({ status: 'signed' }),
    Document.countDocuments({ status: { $in: ['uploaded', 'draft'] } }),
    AuditLog.countDocuments(),
  ]);

  const recentDocs = await Document.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('owner', 'name email');

  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);

  return ok(res, {
    counts: { users, docs, signed, drafts, audits },
    recentDocs,
    recentUsers,
  });
};

export const listUsers = async (req, res) => {
  const { q } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [
      { email: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
    ];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  return ok(res, { users });
};

export const updateUser = async (req, res) => {
  const { role, status } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (user._id.toString() === req.user._id.toString() && status === 'disabled') {
    throw ApiError.badRequest("You can't disable your own admin account");
  }
  if (user._id.toString() === req.user._id.toString() && role && role !== 'admin') {
    throw ApiError.badRequest("You can't demote your own admin account");
  }

  if (role) user.role = role;
  if (status) user.status = status;
  await user.save();

  await audit.log(req, {
    action: 'admin.user_update',
    targetType: 'User',
    targetId: user._id,
    metadata: { role, status },
  });

  return ok(res, { user });
};

export const listDocuments = async (req, res) => {
  const docs = await Document.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('owner', 'name email');
  return ok(res, { documents: docs });
};

export const listAudits = async (req, res) => {
  const { action, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (action) filter.action = action;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('actor', 'name email'),
    AuditLog.countDocuments(filter),
  ]);

  return ok(res, { items, total, page: Number(page), limit: Number(limit) });
};
