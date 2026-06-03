import { Router } from 'express';
const router = Router();
import { z } from 'zod';
import validate from '../utils/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as c from '../controllers/admin.controller.js';

const userUpdateSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  status: z.enum(['active', 'disabled']).optional(),
});

router.use(authenticate, requireRole('admin'));

router.get('/stats', asyncHandler(c.stats));
router.get('/users', asyncHandler(c.listUsers));
router.patch('/users/:id', validate(userUpdateSchema), asyncHandler(c.updateUser));
router.get('/documents', asyncHandler(c.listDocuments));
router.get('/audits', asyncHandler(c.listAudits));

export default router;
