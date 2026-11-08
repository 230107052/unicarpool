import test from 'node:test';
import assert from 'node:assert/strict';
import { isUniversityEmail, isVerifiedUniversityUser } from './validators.js';

test('accepts university e-mail', () => {
  assert.equal(isUniversityEmail('a.student@example.edu', 'example.edu'), true);
});
test('rejects other domains and look-alikes', () => {
  assert.equal(isUniversityEmail('a@gmail.com', 'example.edu'), false);
  assert.equal(isUniversityEmail('a@evil-example.edu', 'example.edu'), false);
  assert.equal(isUniversityEmail('not-an-email', 'example.edu'), false);
});


test('accepts verified SDU student', () => {
  const user = {
    email: 'student@sdu.edu.kz',
    email_confirmed_at: '2026-11-08T10:00:00Z'
  };

  assert.equal(isVerifiedUniversityUser(user, 'sdu.edu.kz'), true);
});

test('rejects unverified SDU student', () => {
  const user = {
    email: 'student@sdu.edu.kz',
    email_confirmed_at: null
  };

  assert.equal(isVerifiedUniversityUser(user, 'sdu.edu.kz'), false);
});

test('rejects verified non-SDU user', () => {
  const user = {
    email: 'student@gmail.com',
    email_confirmed_at: '2026-11-08T10:00:00Z'
  };

  assert.equal(isVerifiedUniversityUser(user, 'sdu.edu.kz'), false);
});
