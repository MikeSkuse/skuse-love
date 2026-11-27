import { useEffect, useState } from 'react';

type Claim = { game: 'bingo' | 'photo-hunt'; guest_name: string; created_at: string };
export default function PrizeClaimsAdmin({ token }: { token: string }) {
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [error, setError] = useState('');
  async function load() {
    try {
      const response = await fetch('/api/admin/prize-claims', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw Error();
      setClaims(await response.json()); setError('');
    } catch { setError('Could not load prize claims.'); }
  }
  useEffect(() => { let active = true; fetch('/api/admin/prize-claims', { headers: { Authorization: `Bearer ${token}` } }).then(response => { if (!response.ok) throw Error(); return response.json(); }).then(data => { if (active) setClaims(data); }).catch(() => { if (active) setError('Could not load prize claims.'); }); return () => { active = false; }; }, [token]);
  return <section><h2>Prize claims</h2><p>Guests who have completed a game and recorded their name.</p><button type="button" onClick={load}>Refresh prize claims</button>{error && <p role="alert">{error}</p>}{claims && (claims.length ? <ul className="prize-claims">{claims.map((claim, index) => <li key={index}><strong>{claim.guest_name}</strong><span>{claim.game === 'bingo' ? 'Wedding Bingo' : 'Photo hunt'} · {new Date(`${claim.created_at.replace(' ', 'T')}Z`).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short' })}</span></li>)}</ul> : <p>No prize claims yet.</p>)}</section>;
}
