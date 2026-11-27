import { test } from 'node:test';
import assert from 'node:assert/strict';
import { photoHuntPhase, photoHuntPhases, defaultPhotoHunt, shuffleSuggestions } from '../src/shared/photo-hunt.ts';

test('photo hunt follows the wedding day schedule and admin override', () => {
  assert.equal(photoHuntPhase('', new Date('2026-11-27T20:00:00Z')), 0);
  assert.equal(photoHuntPhase('', new Date('2026-11-29T14:59:00Z')), 2);
  assert.equal(photoHuntPhase('', new Date('2026-11-29T15:00:00Z')), 3);
  assert.equal(photoHuntPhase('1', new Date('2026-11-29T15:00:00Z')), 1);
  assert.equal(photoHuntPhase('3', new Date('2026-11-29T12:30:00Z')), 3);
  assert.equal(photoHuntPhase('', new Date('2026-11-30T08:00:00Z')), photoHuntPhases.length - 1);
  assert.equal(defaultPhotoHunt.length, photoHuntPhases.length);
  assert.ok(defaultPhotoHunt.every(group => group.length >= 3));
});

test('suggestion shuffle changes order without losing or mutating entries', () => {
  const entries = ['one', 'two', 'three', 'four'];
  const shuffled = shuffleSuggestions(entries, () => 0);
  assert.deepEqual(shuffled, ['two', 'three', 'four', 'one']);
  assert.deepEqual(entries, ['one', 'two', 'three', 'four']);
});
