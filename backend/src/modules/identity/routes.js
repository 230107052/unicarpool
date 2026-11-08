import { Router } from 'express';
import { asyncHandler } from '../../shared/httpError.js';
import { requireAuth } from '../../middleware/auth.js';
import * as service from './service.js';

export const router = Router();

router.post('/register', asyncHandler(async (req, res) => {
  res.status(201).json(await service.register(req.body || {}));
}));
router.post('/login', asyncHandler(async (req, res) => {
  res.json(await service.login(req.body || {}));
}));
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ ...(await service.getProfile(req.token, req.user.id)), email: req.user.email });
}));
