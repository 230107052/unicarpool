import { anonClient, userClient } from '../config/supabase.js';
import { HttpError, asyncHandler } from '../shared/httpError.js';
import { throwIfError } from '../shared/dbError.js';

// Single enforcement point for authentication (supports the Security quality attribute).
export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Authentication required');
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'Invalid or expired token');
  req.user = { id: data.user.id, email: data.user.email };
  req.token = token;
  next();
});

export const requireAdmin = asyncHandler(async (req, res, next) => {
  const { data, error } = await userClient(req.token)
    .from('profiles').select('role').eq('id', req.user.id).single();
  throwIfError(error);
  if (data.role !== 'admin') throw new HttpError(403, 'Admin only');
  next();
});
