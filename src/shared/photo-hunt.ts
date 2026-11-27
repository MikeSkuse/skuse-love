export const photoHuntPhases = ['The day begins', 'Photographs', 'Speeches and Wedding Breakfast', 'Evening Celebrations'] as const;
// Original schedule indices are retained in saved completions for backwards compatibility.
export const photoHuntPhaseIds = [0, 2, 3, 5] as const;
export function photoHuntGroupForStage(stage: number): number {
  return stage >= 5 ? 3 : stage >= 3 ? 2 : stage >= 2 ? 1 : 0;
}
export function groupPhotoHuntSuggestions(groups: string[][]): string[][] {
  if (groups.length !== 11) return groups;
  const combined: string[][] = [[], [], [], []];
  groups.forEach((entries, stage) => {
    const target = combined[photoHuntGroupForStage(stage)];
    entries.forEach(entry => { if (!target.some(existing => existing.toLowerCase() === entry.toLowerCase())) target.push(entry); });
  });
  return combined;
}
export const defaultPhotoHunt: string[][] = groupPhotoHuntSuggestions([
  ['Guests arriving', 'A welcoming smile', 'A lovely wedding outfit'],
  ['The ceremony setting', 'A special wedding detail', 'Guests celebrating after the ceremony'],
  ['A group of friends', 'A candid smile', 'A beautiful detail at the venue'],
  ['A moment from the speeches', 'Guests raising a toast', 'A reaction to a speech'],
  ['The table decorations', 'A toast at the table', 'Friends enjoying the wedding breakfast'],
  ['An evening guest arriving', 'Friends reunited', 'A happy group of guests'],
  ['The dance floor', 'Guests dancing', 'Someone singing along'],
  ['The wedding cake', 'The cake cutting', 'A sweet detail'],
  ['The evening food', 'Guests enjoying a bite', 'A late-night smile'],
  ['The first dance', 'Guests watching the first dance', 'A dance floor moment'],
  ['The last dance', 'A favourite moment from the evening', 'Friends celebrating together'],
]);
export const photoHuntTimes = ['12:30', '13:00', '14:00', '15:00', '15:50', '18:00', '18:30', '19:00', '19:30', '20:15', '23:30'];
export function photoHuntPhase(stage: string | undefined, now: Date): number {
  if (stage && /^\d+$/.test(stage) && Number(stage) < photoHuntTimes.length) return photoHuntGroupForStage(Number(stage));
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)?.value || '';
  const time = `${get('hour')}:${get('minute')}`;
  let phase = 0;
  photoHuntTimes.forEach((start, index) => { if (start <= time) phase = index; });
  return photoHuntGroupForStage(phase);
}

export function shuffleSuggestions(entries: string[], random: () => number = Math.random): string[] {
  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function availablePhotoHuntSuggestions(suggestions: string[][] | null, phase: number, completed: { phase: number; text: string }[]): string[] {
  return (suggestions?.[phase] || []).filter(text => !completed.some(item => photoHuntGroupForStage(item.phase) === phase && item.text.toLowerCase() === text.toLowerCase())).slice(0, 3);
}
