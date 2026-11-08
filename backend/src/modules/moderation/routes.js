import { Router } from 'express';
import { userClient } from '../../config/supabase.js';
import { HttpError, asyncHandler } from '../../shared/httpError.js';
import { throwIfError } from '../../shared/dbError.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';

export const router = Router();
router.use(requireAuth);

// any student can report a user or a trip
router.post('/', asyncHandler(async (req, res) => {
  const { reason, tripId, targetUserId } = req.body || {};
  if (typeof reason !== 'string' || !reason.trim()) throw new HttpError(400, 'reason is required');
  const { error } = await userClient(req.token).from('reports').insert({
    reporter_id: req.user.id, reason: reason.trim(), trip_id: tripId || null, target_user_id: targetUserId || null,
  });
  throwIfError(error);
  res.status(201).json({ message: 'Report submitted' });
}));

// administrator: list and resolve reports (RLS also restricts this to admins)
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const { data, error } = await userClient(req.token).from('reports').select('*').order('created_at', { ascending: false });
  throwIfError(error);
  res.json(data);
}));
router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const status = (req.body || {}).status;
  if (!['resolved', 'dismissed', 'open'].includes(status)) throw new HttpError(400, 'invalid status');
  const { data, error } = await userClient(req.token).from('reports').update({ status }).eq('id', req.params.id).select().single();
  throwIfError(error);
  res.json(data);
}));
// TODO (team): user management for administrators (block/unblock users)
