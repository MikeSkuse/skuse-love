import { useEffect, useState } from 'react';

const storageKey = 'wedding-bingo-v1';
type Board = { entries: string[]; marked: number[] };
function loadBoard(): Board | null {
  try {
    const board = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (Array.isArray(board?.entries) && board.entries.length === 16 && board.entries.every((entry: unknown) => typeof entry === 'string') && Array.isArray(board.marked)) return board;
  } catch { /* Storage may be unavailable. */ }
  return null;
}
function makeBoard(entries: string[]): Board {
  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { entries: shuffled.slice(0, 16), marked: [] };
}

export default function Bingo() {
  const [board, setBoard] = useState<Board | null>(loadBoard);
  const [error, setError] = useState('');
  useEffect(() => {
    if (board) { try { localStorage.setItem(storageKey, JSON.stringify(board)); } catch { /* The game still works for this visit. */ } return; }
    const controller = new AbortController();
    fetch('/api/bingo', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw Error();
      const entries: string[] = await response.json();
      if (!Array.isArray(entries) || entries.length < 16) throw Error();
      setBoard(makeBoard(entries));
    }).catch(() => { if (!controller.signal.aborted) setError('Could not load your board. Please refresh to try again.'); });
    return () => controller.abort();
  }, [board]);
  function toggle(index: number) {
    setBoard(previous => previous && { ...previous, marked: previous.marked.includes(index) ? previous.marked.filter(i => i !== index) : [...previous.marked, index] });
  }
  const lines = board && [...Array.from({ length: 4 }, (_, i) => [i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 3]), ...Array.from({ length: 4 }, (_, i) => [i, i + 4, i + 8, i + 12]), [0, 5, 10, 15], [3, 6, 9, 12]];
  const bingo = lines && lines.some(line => line.every(index => board!.marked.includes(index)));
  return <div className="bingo-page">
    <header className="page-header"><span className="eyebrow">A LITTLE WEDDING DAY MAGIC</span><h1>Wedding Bingo</h1><div className="ornament" aria-hidden="true">✦ <span>✧</span> ✦</div></header>
    <p className="intro">Tap a square when you spot it. Complete a row, column or diagonal to get bingo.</p>
    {error ? <p role="alert" className="note">{error}</p> : !board ? <p className="note" role="status">Creating your bingo board…</p> : <><p className="bingo-status" role="status">{bingo ? 'Bingo! You completed a line! ✨' : `${board.marked.length} of 16 squares marked`}</p><div className="bingo-grid" aria-label="Your wedding bingo board">{board.entries.map((entry, index) => <button type="button" key={index} aria-pressed={board.marked.includes(index)} className={board.marked.includes(index) ? 'marked' : ''} onClick={() => toggle(index)}><span>{entry}</span>{board.marked.includes(index) && <span className="bingo-check" aria-hidden="true">✓</span>}</button>)}</div><p className="note">Your board and progress are saved on this device.</p></>}
  </div>;
}
