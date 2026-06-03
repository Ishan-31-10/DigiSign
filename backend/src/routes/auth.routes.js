import { Router } from 'express';
const router = Router();
import { z } from 'zod';
import validate from '../utils/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import * as c from '../controllers/auth.controller.js';

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/\d/, 'Password must contain a digit'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const resetSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z.string().min(20),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/\d/),
});

const changePwSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/\d/),
});

router.post('/register', validate(registerSchema), asyncHandler(c.register));
router.post('/login', validate(loginSchema), asyncHandler(c.login));
router.post('/forgot-password', validate(forgotSchema), asyncHandler(c.forgotPassword));
router.post('/reset-password', validate(resetSchema), asyncHandler(c.resetPassword));
router.get('/me', authenticate, asyncHandler(c.me));
router.post('/change-password', authenticate, validate(changePwSchema), asyncHandler(c.changePassword));

export default router;
