export const photoHuntPhases = [
  'Guest arrival', 'Ceremony', 'Photographs', 'Speeches', 'Wedding breakfast',
  'Evening guests arrive', 'DJ Begins', 'Cake cutting', 'Evening food', 'First dance', 'Last dance',
] as const;
export const defaultPhotoHunt: string[][] = [
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
];
export const photoHuntTimes = ['12:30', '13:00', '14:00', '15:00', '15:50', '18:00', '18:30', '19:00', '19:30', '20:15', '23:30'];
export function photoHuntPhase(stage: string | undefined, now: Date): number {
  if (stage && /^\d+$/.test(stage) && Number(stage) < photoHuntPhases.length) return Number(stage);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)?.value || '';
  const date = `${get('year')}-${get('month')}-${get('day')}`;
  if (date < '2026-11-29') return 0;
  if (date > '2026-11-29') return photoHuntPhases.length - 1;
  const time = `${get('hour')}:${get('minute')}`;
  let phase = 0;
  photoHuntTimes.forEach((start, index) => { if (start <= time) phase = index; });
  return phase;
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
  return (suggestions?.[phase] || []).filter(text => !completed.some(item => item.phase === phase && item.text === text)).slice(0, 3);
}
