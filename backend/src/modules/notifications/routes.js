import { Router } from 'express';
import { userClient } from '../../config/supabase.js';
import { asyncHandler } from '../../shared/httpError.js';
import { throwIfError } from '../../shared/dbError.js';
import { requireAuth } from '../../middleware/auth.js';

export const router = Router();
router.use(requireAuth);

// FR7 (in-app view). E-mail delivery is done by the Notification Worker container.
router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await userClient(req.token).from('notifications')
    .select('id, subject, body, status, created_at').order('created_at', { ascending: false }).limit(50);
  throwIfError(error);
  res.json(data);
}));
