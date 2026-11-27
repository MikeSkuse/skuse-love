import { useState } from 'react';
import { photoHuntPhases } from '../shared/photo-hunt';

export default function PhotoHuntAdmin({ token, entries, onSaved }: { token: string; entries: string[][]; onSaved: (message: string) => void }) {
  const [drafts, setDrafts] = useState(() => entries.map(group => group.join('\n')));
  const [status, setStatus] = useState('');
  async function save() {
    try {
      const response = await fetch('/api/admin/photo-hunt', { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ phases: drafts.map(group => group.split(/\r?\n/).map(text => text.trim()).filter(Boolean)) }) });
      const result = await response.json();
      const message = response.ok ? 'Photo hunt suggestions saved.' : result.error || 'Could not save photo hunt suggestions.';
      setStatus(message); onSaved(message);
    } catch { setStatus('Could not save photo hunt suggestions.'); }
  }
  return <section><h2>Photo hunt</h2><p>Enter one suggestion per line for each stage. Suggestions appear during that stage; completed suggestions stay visible to guests.</p>{photoHuntPhases.map((phase, index) => <div key={phase}><label htmlFor={`hunt-phase-${index}`}>{phase}</label><textarea id={`hunt-phase-${index}`} rows={3} value={drafts[index]} onChange={event => setDrafts(previous => previous.map((value, i) => i === index ? event.target.value : value))}/></div>)}<button type="button" onClick={save}>Save photo hunt suggestions</button><p role="status">{status}</p></section>;
}
