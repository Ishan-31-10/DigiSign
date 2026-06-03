import { Router } from 'express';
const router = Router();
import { z } from 'zod';
import validate from '../utils/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { uploadPdf } from '../middleware/upload.js';
import * as c from '../controllers/document.controller.js';

const placement = z.object({
  signatureId: z.string().optional().nullable(),
  page: z.number().int().min(1),
  xRatio: z.number().min(0).max(1),
  yRatio: z.number().min(0).max(1),
  widthRatio: z.number().min(0.01).max(1),
  heightRatio: z.number().min(0.01).max(1),
  type: z.enum(['draw', 'type']),
  dataUrl: z.string().optional().nullable(),
  text: z.string().optional().nullable(),
  fontFamily: z.string().optional().nullable(),
});

const placementsSchema = z.object({
  placements: z.array(placement).max(50),
});

router.use(authenticate);

router.get('/', asyncHandler(c.list));
router.post('/', uploadPdf.single('file'), asyncHandler(c.upload));
router.get('/:id', asyncHandler(c.get));
router.delete('/:id', asyncHandler(c.remove));
router.get('/:id/file', asyncHandler(c.download));
router.put('/:id/placements', validate(placementsSchema), asyncHandler(c.savePlacements));
router.post('/:id/finalize', validate(placementsSchema), asyncHandler(c.finalize));

export default router;
