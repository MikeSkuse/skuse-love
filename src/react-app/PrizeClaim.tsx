import { useState, type FormEvent } from 'react';

export default function PrizeClaim({ game }: { game: 'bingo' | 'photo-hunt' | 'quiz' }) {
  const key = `wedding-prize-${game}`;
  const [claim] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved && typeof saved.id === 'string') return saved as { id: string; submitted: boolean };
    } catch { /* A claim can still be made during this visit. */ }
    const created = { id: crypto.randomUUID(), submitted: false };
    try { localStorage.setItem(key, JSON.stringify(created)); } catch { /* Keep the ID in memory for retries. */ }
    return created;
  });
  const [submitted, setSubmitted] = useState(claim.submitted);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || !name.trim()) return;
    setSending(true); setError('');
    try {
      const response = await fetch('/api/prize-claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: claim.id, game, name: name.trim() }) });
      if (!response.ok) throw Error();
      try { localStorage.setItem(key, JSON.stringify({ ...claim, submitted: true })); } catch { /* The server still has the claim. */ }
      setSubmitted(true);
    } catch { setError('We couldn’t record your name. Please try again.'); }
    finally { setSending(false); }
  }
  return <section className="panel prize-claim" aria-labelledby={`prize-${game}`}>
    <div className="panel-icon" aria-hidden="true">✦</div><h2 id={`prize-${game}`}>You’ve won a prize!</h2><p>Go and find Mike to collect it.</p>
    {submitted ? <p role="status">Your name has been recorded. Go and find Mike!</p> : <form onSubmit={submit}><label htmlFor={`prize-name-${game}`}>Your name</label><input id={`prize-name-${game}`} value={name} onChange={event => setName(event.target.value)} maxLength={100} required autoComplete="name"/><button disabled={sending} type="submit">{sending ? 'Saving…' : 'Record my name'}</button>{error && <p role="alert">{error}</p>}</form>}
  </section>;
}
