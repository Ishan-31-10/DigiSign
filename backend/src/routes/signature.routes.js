import { Router } from 'express';
const router = Router();
import { z } from 'zod';
import validate from '../utils/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import * as c from '../controllers/signature.controller.js';

const createSchema = z
  .object({
    label: z.string().trim().max(60).optional(),
    type: z.enum(['draw', 'type']),
    dataUrl: z.string().max(2_500_000).optional().nullable(),
    text: z.string().trim().max(60).optional().nullable(),
    fontFamily: z.string().max(60).optional().nullable(),
    isDefault: z.boolean().optional(),
  })
  .refine((d) => (d.type === 'draw' ? !!d.dataUrl : !!d.text), {
    message: 'Provide dataUrl for drawn signatures or text for typed signatures',
  });

router.use(authenticate);
router.get('/', asyncHandler(c.list));
router.post('/', validate(createSchema), asyncHandler(c.create));
router.delete('/:id', asyncHandler(c.remove));

export default router;
