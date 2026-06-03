import { Router } from 'express';
const router = Router();
import asyncHandler from '../utils/asyncHandler.js';
import { uploadPdf } from '../middleware/upload.js';
import * as c from '../controllers/verification.controller.js';

router.get('/:id', asyncHandler(c.byId));
router.get('/hash/:hash', asyncHandler(c.byHash));
router.post('/', uploadPdf.single('file'), asyncHandler(c.byFile));

export default router;
