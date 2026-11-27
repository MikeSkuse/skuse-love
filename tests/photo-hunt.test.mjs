import { test } from 'node:test';
import assert from 'node:assert/strict';
import { photoHuntPhase, photoHuntPhases, defaultPhotoHunt, shuffleSuggestions, availablePhotoHuntSuggestions, groupPhotoHuntSuggestions } from '../src/shared/photo-hunt.ts';

test('photo hunt groups schedule phases and honours the event override', () => {
  assert.equal(photoHuntPhase('', new Date('2026-11-27T12:59:00Z')), 0);
  assert.equal(photoHuntPhase('', new Date('2026-11-27T13:00:00Z')), 0);
  assert.equal(photoHuntPhase('', new Date('2026-11-29T14:00:00Z')), 1);
  assert.equal(photoHuntPhase('', new Date('2026-11-29T15:00:00Z')), 2);
  assert.equal(photoHuntPhase('', new Date('2026-11-29T15:50:00Z')), 2);
  assert.equal(photoHuntPhase('', new Date('2026-11-29T18:00:00Z')), 3);
  assert.equal(photoHuntPhase('', new Date('2026-11-29T23:30:00Z')), 3);
  assert.equal(photoHuntPhase('1', new Date('2026-11-29T15:00:00Z')), 0);
  assert.equal(photoHuntPhase('4', new Date('2026-11-29T12:30:00Z')), 2);
  assert.equal(photoHuntPhase('10', new Date('2026-11-29T12:30:00Z')), 3);
  assert.equal(photoHuntPhase('', new Date('2026-11-30T08:00:00Z')), 0);
  assert.equal(photoHuntPhase('', new Date('2026-07-01T14:00:00Z')), 2);
  assert.equal(defaultPhotoHunt.length, photoHuntPhases.length);
  assert.ok(defaultPhotoHunt.every(group => group.length >= 3));
});

test('legacy lists are combined without losing entries or retaining duplicates', () => {
  const old = Array.from({ length: 11 }, (_, index) => [`entry ${index}`]);
  old[1].push('ENTRY 0');
  const grouped = groupPhotoHuntSuggestions(old);
  assert.deepEqual(grouped, [['entry 0', 'entry 1'], ['entry 2'], ['entry 3', 'entry 4'], ['entry 5', 'entry 6', 'entry 7', 'entry 8', 'entry 9', 'entry 10']]);
  assert.deepEqual(groupPhotoHuntSuggestions(grouped), grouped);
});

test('suggestion shuffle changes order without losing or mutating entries', () => {
  const entries = ['one', 'two', 'three', 'four'];
  const shuffled = shuffleSuggestions(entries, () => 0);
  assert.deepEqual(shuffled, ['two', 'three', 'four', 'one']);
  assert.deepEqual(entries, ['one', 'two', 'three', 'four']);
});

test('suggestions change between groups and respect legacy completed entries', () => {
  const lists = [['arrival', 'ceremony', 'hello', 'welcome'], ['photo 1', 'photo 2', 'photo 3'], ['speech 1', 'speech 2', 'speech 3'], ['evening 1', 'evening 2', 'evening 3']];
  const before = photoHuntPhase('', new Date('2026-11-29T13:59:59Z'));
  const after = photoHuntPhase('', new Date('2026-11-29T14:00:00Z'));
  assert.deepEqual(availablePhotoHuntSuggestions(lists, before, [{ phase: 1, text: 'ceremony' }]), ['arrival', 'hello', 'welcome']);
  assert.deepEqual(availablePhotoHuntSuggestions(lists, after, []), ['photo 1', 'photo 2', 'photo 3']);
  assert.deepEqual(availablePhotoHuntSuggestions(lists, after, [{ phase: 1, text: 'ceremony' }]), ['photo 1', 'photo 2', 'photo 3']);
});
