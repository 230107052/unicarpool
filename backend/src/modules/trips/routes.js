import { Router } from 'express';
import { asyncHandler } from '../../shared/httpError.js';
import { requireAuth } from '../../middleware/auth.js';
import * as service from './service.js';
import { tripReservationFacade as facade } from '../../facade/index.js';

export const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => res.json(await facade.searchTrips(req.token, req.query))));
router.post('/', asyncHandler(async (req, res) =>
  res.status(201).json(await facade.createTrip(req.token, req.user.id, req.body || {}))));
router.get('/:id', asyncHandler(async (req, res) => res.json(await service.getTrip(req.token, req.params.id))));
router.patch('/:id', asyncHandler(async (req, res) =>
  res.json(await service.updateTrip(req.token, req.params.id, req.body || {}))));
router.delete('/:id', asyncHandler(async (req, res) => res.json(await service.cancelTrip(req.token, req.params.id))));
