import { Router } from 'express';
import { asyncHandler } from '../../shared/httpError.js';
import { requireAuth } from '../../middleware/auth.js';
import * as service from './service.js';

export const router = Router();
router.use(requireAuth);

router.get('/mine', asyncHandler(async (req, res) => res.json(await service.listMine(req.token, req.user.id))));
router.get('/:id', asyncHandler(async (req, res) => res.json(await service.getOne(req.token, req.params.id))));
router.post('/', asyncHandler(async (req, res) =>
  res.status(201).json(await service.reserve(req.token, (req.body || {}).tripId))));
router.delete('/:id', asyncHandler(async (req, res) => res.json(await service.cancel(req.token, req.params.id))));
