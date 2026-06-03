import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';

function extractToken(req) {
  const header = req.get('authorization') || req.get('Authorization');
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

async function authenticate(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized('Authentication required');

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('Account no longer exists');
    if (user.status !== 'active') throw ApiError.forbidden('Account is disabled');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient permissions'));
    next();
  };
}

export { authenticate, requireRole };
