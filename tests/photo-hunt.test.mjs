import { test } from 'node:test';
import assert from 'node:assert/strict';
import { photoHuntPhase, photoHuntPhases, defaultPhotoHunt, shuffleSuggestions, availablePhotoHuntSuggestions } from '../src/shared/photo-hunt.ts';

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

test('suggestions change at the phase boundary whether or not earlier suggestions were completed', () => {
  const lists = [[], [], ['photo 1', 'photo 2', 'photo 3'], ['speech 1', 'speech 2', 'speech 3', 'speech 4']];
  const before = photoHuntPhase('', new Date('2026-11-29T14:59:59Z'));
  const after = photoHuntPhase('', new Date('2026-11-29T15:00:00Z'));
  assert.deepEqual(availablePhotoHuntSuggestions(lists, before, []), ['photo 1', 'photo 2', 'photo 3']);
  assert.deepEqual(availablePhotoHuntSuggestions(lists, after, []), ['speech 1', 'speech 2', 'speech 3']);
  assert.deepEqual(availablePhotoHuntSuggestions(lists, after, [{ phase: before, text: 'photo 1' }]), ['speech 1', 'speech 2', 'speech 3']);
  assert.deepEqual(availablePhotoHuntSuggestions(lists, after, [{ phase: after, text: 'speech 1' }]), ['speech 2', 'speech 3', 'speech 4']);
});
