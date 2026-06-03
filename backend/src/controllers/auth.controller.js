import jwt from "jsonwebtoken";
import crypto from "crypto";
import * as ms from "../utils/ms.js";
import env from "../config/env.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { ok, created } from "../utils/response.js";
import * as audit from "../services/audit.service.js";

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("Email is already registered");

  const user = new User({ name, email });
  await user.setPassword(password);
  await user.save();

  await audit.log(req, {
    action: "user.register",
    targetType: "User",
    targetId: user._id,
    actor: user,
  });

  const token = signToken(user);
  return created(res, { token, user: publicUser(user) }, "Account created");
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    await audit.log(req, {
      action: "user.login_failed",
      status: "failure",
      metadata: { email },
    });
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (user.status !== "active") {
    await audit.log(req, {
      action: "user.login_failed",
      status: "failure",
      metadata: { email, reason: "disabled" },
      actor: user,
    });
    throw ApiError.forbidden("Account is disabled");
  }
  const okPassword = await user.verifyPassword(password);
  if (!okPassword) {
    await audit.log(req, {
      action: "user.login_failed",
      status: "failure",
      metadata: { email },
      actor: user,
    });
    throw ApiError.unauthorized("Invalid email or password");
  }

  user.lastLoginAt = new Date();
  await user.save();

  await audit.log(req, { action: "user.login", actor: user });
  const token = signToken(user);
  return ok(res, { token, user: publicUser(user) }, "Login successful");
};

export const me = async (req, res) => ok(res, { user: publicUser(req.user) });

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way (don't leak account existence)
  const genericMessage =
    "If an account with that email exists, a password reset link has been generated.";

  if (!user) {
    return ok(res, null, genericMessage);
  }

  const ttl = ms.parse(env.resetTokenExpiresIn);
  const token = user.createPasswordResetToken(ttl);
  await user.save();

  const resetUrl = `${env.frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(
    user.email,
  )}`;

  await audit.log(req, {
    action: "user.password_reset_requested",
    targetType: "User",
    targetId: user._id,
    actor: user,
  });

  // For this MVP we don't ship an email provider; expose the link in
  // non-production so QA / the reviewer can complete the flow.
  const payload = env.isProd ? null : { resetUrl };
  return ok(res, payload, genericMessage);
};

export const resetPassword = async (req, res) => {
  const { email, token, password } = req.body;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({ email }).select(
    "+resetTokenHash +resetTokenExpiresAt +passwordHash",
  );

  if (
    !user ||
    !user.resetTokenHash ||
    user.resetTokenHash !== tokenHash ||
    !user.resetTokenExpiresAt ||
    user.resetTokenExpiresAt < new Date()
  ) {
    throw ApiError.badRequest("Reset link is invalid or has expired");
  }

  await user.setPassword(password);
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();

  await audit.log(req, {
    action: "user.password_reset_completed",
    targetType: "User",
    targetId: user._id,
    actor: user,
  });

  return ok(res, null, "Password updated. You can now sign in.");
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+passwordHash");
  const okPass = await user.verifyPassword(currentPassword);
  if (!okPass) throw ApiError.badRequest("Current password is incorrect");
  await user.setPassword(newPassword);
  await user.save();
  await audit.log(req, { action: "user.password_changed" });
  return ok(res, null, "Password updated");
};
