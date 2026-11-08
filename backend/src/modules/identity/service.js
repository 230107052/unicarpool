import { anonClient, userClient } from '../../config/supabase.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../shared/httpError.js';
import { throwIfError } from '../../shared/dbError.js';
import { isUniversityEmail } from './validators.js';

// FR1: only verified university students can create an account.
export async function register({ email, password, fullName, studentId }) {
  if (!isUniversityEmail(email, env.universityEmailDomain))
    throw new HttpError(400, `Use your university e-mail (@${env.universityEmailDomain})`);
  if (typeof password !== 'string' || password.length < 8)
    throw new HttpError(400, 'Password must be at least 8 characters');
  if (!fullName || typeof fullName !== 'string') throw new HttpError(400, 'Full name is required');

  const { data, error } = await anonClient.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { full_name: fullName.trim(), student_id: studentId || '' } },
  });
  if (error) throw new HttpError(400, error.message);
  // Supabase sends the confirmation e-mail (enable "Confirm email" in Auth settings).
  return { message: 'Check your university e-mail to confirm your account.', userId: data.user?.id };
}

export async function login({ email, password }) {
  const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new HttpError(401, 'Invalid e-mail or password');
  return {
    accessToken: data.session.access_token,
    expiresAt: data.session.expires_at,
    user: { id: data.user.id, email: data.user.email },
  };
}

export async function getProfile(token, userId) {
  const { data, error } = await userClient(token)
    .from('profiles').select('id, full_name, role').eq('id', userId).single();
  throwIfError(error);
  return data;
}
