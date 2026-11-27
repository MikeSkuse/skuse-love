import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { photoHuntPhases } from '../shared/photo-hunt';

type Completed = { phase: number; text: string };
const storageKey = 'wedding-photo-hunt-completed-v1';
function loadCompleted(): Completed[] {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(saved) ? saved.filter(item => Number.isInteger(item?.phase) && typeof item?.text === 'string') : [];
  } catch { return []; }
}
export default function PhotoHunt({ phase }: { phase: number }) {
  const [suggestions, setSuggestions] = useState<string[][] | null>(null);
  const [completed, setCompleted] = useState<Completed[]>(loadCompleted);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const load = () => fetch('/api/photo-hunt', { signal: controller.signal }).then(response => {
      if (!response.ok) throw Error();
      return response.json() as Promise<string[][]>;
    }).then(data => { setSuggestions(data); setError(false); }).catch(() => { if (!controller.signal.aborted) setError(true); });
    void load();
    const timer = window.setInterval(load, 30000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, []);
  function toggle(item: Completed) {
    setCompleted(previous => {
      const exists = previous.some(entry => entry.phase === item.phase && entry.text === item.text);
      const next = exists ? previous.filter(entry => entry.phase !== item.phase || entry.text !== item.text) : [...previous, item];
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Progress remains available for this visit. */ }
      return next;
    });
  }
  const available = (suggestions?.[phase] || []).filter(text => !completed.some(item => item.phase === phase && item.text === text)).slice(0, 3);
  return <div className="photo-hunt">
    <header className="page-header"><span className="eyebrow">A LITTLE WEDDING DAY MAGIC</span><h1>Photo hunt</h1><div className="ornament" aria-hidden="true">✦ <span>✧</span> ✦</div></header>
    <p className="intro">Capture the little moments throughout the day. Tick each suggestion when you’ve taken your photo.</p>
    <section aria-labelledby="hunt-suggestions"><div className="hunt-heading"><div><span className="eyebrow">{photoHuntPhases[phase]}</span><h2 id="hunt-suggestions">Your photo suggestions</h2></div><span aria-hidden="true">✧</span></div>
      {error && <p role="alert" className="note">Could not refresh suggestions. Please check your connection.</p>}
      {!suggestions && !error ? <p role="status" className="note">Loading suggestions…</p> : available.length ? <div className="hunt-list">{available.map(text => <label className="hunt-item" key={text}><input type="checkbox" checked={false} onChange={() => toggle({ phase, text })}/><span>{text}</span></label>)}</div> : suggestions && <p className="note">You’ve completed all the suggestions for this part of the day.</p>}
    </section>
    <Link className="hunt-upload" to="/photos">Share your photos <span aria-hidden="true">→</span></Link>
    <section aria-labelledby="hunt-completed"><div className="hunt-heading"><div><span className="eyebrow">YOUR CAPTURED MOMENTS</span><h2 id="hunt-completed">Completed</h2></div><span aria-hidden="true">♡</span></div>{completed.length ? <div className="hunt-list">{completed.map(item => <label className="hunt-item hunt-done" key={`${item.phase}:${item.text}`}><input type="checkbox" checked onChange={() => toggle(item)}/><span>{item.text}<small>{photoHuntPhases[item.phase]}</small></span></label>)}</div> : <p className="note">Your completed suggestions will appear here.</p>}</section>
    <p className="note">Your progress is saved on this device.</p>
  </div>;
}
