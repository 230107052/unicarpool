
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.UNIVERSITY_EMAIL_DOMAIN = 'sdu.edu.kz';

const { createRequireAuth } = await import('./auth.js');

async function checkAuth(user, authorization) {
  const getUser = async () => ({
    data: { user },
    error: null
  });

  const middleware = createRequireAuth(getUser, 'sdu.edu.kz');
  const req = { headers: { authorization } };

  let result;

  await middleware(req, {}, (error) => {
    result = error || 'allowed';
  });

  return { result, req };
}

test('allows verified SDU student', async () => {
  const user = {
    id: 'student-1',
    email: 'student@sdu.edu.kz',
    email_confirmed_at: '2026-11-08T10:00:00Z'
  };

  const { result, req } = await checkAuth(user, 'Bearer valid-token');

  assert.equal(result, 'allowed');
  assert.equal(req.user.id, 'student-1');
  assert.equal(req.token, 'valid-token');
});

test('rejects unverified SDU student with 403', async () => {
  const user = {
    id: 'student-2',
    email: 'student@sdu.edu.kz',
    email_confirmed_at: null
  };

  const { result } = await checkAuth(user, 'Bearer valid-token');

  assert.equal(result.status, 403);
  assert.equal(result.message, 'Verified university email required');
});

test('rejects missing authentication token with 401', async () => {
  const { result } = await checkAuth(null, undefined);

  assert.equal(result.status, 401);
  assert.equal(result.message, 'Authentication required');
});

test('rejects non-SDU user with 403', async () => {
  const user = {
    id: 'student-3',
    email: 'student@gmail.com',
    email_confirmed_at: '2026-11-08T10:00:00Z'
  };

  const { result } = await checkAuth(user, 'Bearer valid-token');

  assert.equal(result.status, 403);
});
