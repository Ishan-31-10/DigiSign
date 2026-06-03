import Signature from '../models/Signature.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/response.js';
import * as audit from '../services/audit.service.js';

export const list = async (req, res) => {
  const sigs = await Signature.find({ user: req.user._id }).sort({ createdAt: -1 });
  return ok(res, { signatures: sigs });
};

export const create = async (req, res) => {
  const { label, type, dataUrl, text, fontFamily, isDefault } = req.body;

  if (type === 'draw' && !dataUrl) throw ApiError.badRequest('dataUrl is required for drawn signatures');
  if (type === 'type' && !text) throw ApiError.badRequest('text is required for typed signatures');

  if (isDefault) {
    await Signature.updateMany({ user: req.user._id, isDefault: true }, { isDefault: false });
  }

  const sig = await Signature.create({
    user: req.user._id,
    label,
    type,
    dataUrl,
    text,
    fontFamily,
    isDefault: !!isDefault,
  });

  await audit.log(req, { action: 'signature.create', targetType: 'Signature', targetId: sig._id });
  return created(res, { signature: sig });
};

export const remove = async (req, res) => {
  const sig = await Signature.findOne({ _id: req.params.id, user: req.user._id });
  if (!sig) throw ApiError.notFound('Signature not found');
  await sig.deleteOne();
  await audit.log(req, { action: 'signature.delete', targetType: 'Signature', targetId: sig._id });
  return ok(res, null, 'Signature deleted');
};
