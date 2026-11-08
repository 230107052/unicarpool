import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const options = { auth: { persistSession: false, autoRefreshToken: false } };

// Anonymous client: sign up / sign in / verify tokens.
export const anonClient = createClient(env.supabaseUrl, env.supabaseAnonKey, options);

// Client that acts AS the signed-in user: Row Level Security applies to every query.
// Use this by default so the database enforces access rules even if our code has a bug.
export function userClient(accessToken) {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    ...options,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

// service_role bypasses RLS. Do NOT use it for normal user requests.
export function adminClient() {
  if (!env.supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, options);
}
