import test from 'node:test';
import assert from 'node:assert/strict';
import { isUniversityEmail } from './validators.js';

test('accepts university e-mail', () => {
  assert.equal(isUniversityEmail('a.student@example.edu', 'example.edu'), true);
});
test('rejects other domains and look-alikes', () => {
  assert.equal(isUniversityEmail('a@gmail.com', 'example.edu'), false);
  assert.equal(isUniversityEmail('a@evil-example.edu', 'example.edu'), false);
  assert.equal(isUniversityEmail('not-an-email', 'example.edu'), false);
});
