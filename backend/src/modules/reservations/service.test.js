
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.UNIVERSITY_EMAIL_DOMAIN = 'sdu.edu.kz';

test('rejects reservation without trip ID', async () => {

  const { reserve } = await import('./service.js');

  await assert.rejects(
    reserve('test-token', null),
    (error) => {
      assert.equal(error.status, 400);
      assert.equal(error.message, 'tripId is required');
      return true;
    }
  );
});
