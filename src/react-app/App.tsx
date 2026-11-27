import { useEffect, useRef, useState } from 'react';
import Photos from './Photos';
import Quiz from './Quiz';
import Bingo from './Bingo';
import PhotoHunt from './PhotoHunt';
import PhotoHuntAdmin from './PhotoHuntAdmin';
import PrizeClaimsAdmin from './PrizeClaimsAdmin';
import { photoHuntPhase } from '../shared/photo-hunt';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';

const events = [['12:30','Guest arrival'],['13:00','Ceremony'],['14:00','Photographs'],['15:00','Speeches'],['15:50','Wedding breakfast'],['18:00','Evening guests arrive'],['18:30','DJ Begins'],['19:00','Cake cutting'],['19:30','Evening food'],['20:15','First dance'],['23:30','Last dance']];
const icons: Record<string,string> = { home:'⌂', schedule:'◷', more:'✳', venue:'⌖', faq:'?', upload:'↑', story:'♡', music:'♫', games:'✦' };
function Icon({name}:{name:string}) {
  const shape = name === 'photo-hunt' ? <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></> : name === 'bingo' ? <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></> : name === 'photos' ? <><path d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3.5"/></> : name === 'seating' ? <><path d="M6 13V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8"/><path d="M5 13h14v3H5zM7 16v5m10-5v5"/></> : name === 'quiz' ? <><path d="M9 18h6M10 21h4M8.5 14.8a6 6 0 1 1 7 0c-.9.6-1.5 1.4-1.5 2.2h-4c0-.8-.6-1.6-1.5-2.2Z"/></> : name === 'menu' ? <><circle cx="12" cy="12" r="5"/><path d="M3 3v6a2 2 0 0 0 4 0V3M5 3v18M21 3c-2 1-3 4-3 7h3v11M21 3v7"/></> : null;
  return <span className="icon" aria-hidden="true">{shape ? <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{shape}</svg> : icons[name] || '✦'}</span>;
}
function useSettings() { const [data,setData]=useState<Record<string,string>>({}); useEffect(()=>{fetch('/api/settings').then(r=>r.ok?r.json():{}).then(setData).catch(()=>{});},[]); return data; }
function currentEvent(stage?:string, now = new Date()) {
  if(stage && /^\d+$/.test(stage) && events[Number(stage)]) return {label:'Happening now', event:events[Number(stage)]};
  const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const get=(type:string)=>parts.find(p=>p.type===type)?.value || '';
  const time=`${get('hour')}:${get('minute')}`;
  let index=-1; events.forEach((e,i)=>{ if(e[0]<=time) index=i; });
  return index<0?{label:'Coming up',event:events[0]}:{label:'Happening now',event:events[index]};
}
function useCurrentEvent(stage?:string) {
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),1000);return ()=>window.clearInterval(timer)},[]);
  return currentEvent(stage,now);
}
function Header({title,eyebrow='MIKE & ANNA'}:{title:string,eyebrow?:string}) { return <header className="page-header"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><div className="ornament" aria-hidden="true">✦ <span>✧</span> ✦</div></header> }
function CardLink({to,icon,title,sub}:{to:string,icon:string,title:string,sub?:string}) {return <Link className="shortcut" to={to}><span className="shortcut-icon"><Icon name={icon}/></span><span><strong>{title}</strong>{sub && <small>{sub}</small>}</span><span className="arrow">›</span></Link>}
const weddingTasks = [
  ['flowers', 'Make lego flowers'],
  ['activity', 'Complete activity sheet / quiz'],
  ['guestbook', 'Sign our guest book'],
  ['dance', 'Have a boogie'],
  ['photos', 'Share photos to our wedding wall'],
  ['audio', 'Record us an Audio Guest Book Message'],
] as const;
function WeddingChecklist(){
  const current=useCurrentEvent();
  const [checked,setChecked]=useState<string[]>(()=>{
    try { const saved=JSON.parse(localStorage.getItem('wedding-day-checklist') || '[]'); return Array.isArray(saved) ? saved.filter((item):item is string=>typeof item==='string') : []; }
    catch { return []; }
  });
  function toggle(id:string){
    const next=checked.includes(id) ? checked.filter(item=>item!==id) : [...checked,id];
    setChecked(next);
    try { localStorage.setItem('wedding-day-checklist',JSON.stringify(next)); } catch { /* The checklist still works for this visit. */ }
  }
  return <section className="wedding-checklist" aria-labelledby="checklist-heading"><h2 id="checklist-heading">Your wedding day to do list</h2><div className="checklist-items">{weddingTasks.filter(([id])=>id!=='flowers' || (current.label==='Happening now' && (current.event===events[3] || current.event===events[4]))).map(([id,label])=><label key={id}><input type="checkbox" checked={checked.includes(id)} onChange={()=>toggle(id)}/><span>{label}</span></label>)}</div></section>;
}
function Home(){const settings=useSettings(), current=useCurrentEvent(settings.stage); return <><section className="hero"><div className="hero-top">THE WEDDING OF</div><img className="crest" src="/art/crest.png" alt=""/><h1>Mike <span>&</span> Anna</h1><div className="hero-date"><span></span> SUNDAY, 29 NOVEMBER 2026 <span></span></div><p>Our favourite day, with our favourite people.</p></section><section className="home-content"><div className="event-card"><div className="event-icon"><Icon name="schedule"/></div><div><span className="eyebrow">{current.label}</span><h2>{current.event?.[1] || 'Thank you for celebrating with us'}</h2>{current.event && <p>{current.event[0]} <span>·</span> Wedding day</p>}</div><Link to="/schedule" aria-label="View the schedule">→</Link></div><div className="section-heading"><div><h2>Explore the day</h2></div><span aria-hidden="true">✧</span></div><div className="shortcut-grid"><CardLink to="/seating" icon="seating" title="Find your seat"/><CardLink to="/schedule" icon="schedule" title="Order of the day"/><CardLink to="/photos" icon="photos" title="Wedding photos"/><CardLink to="/menu" icon="menu" title="Food & drink"/><CardLink to="/more" icon="more" title="Games and more"/></div><WeddingChecklist/><div className="welcome"><span>✦</span><p>We’re so happy you’re here to celebrate with us.</p><span>✦</span></div></section></>}
function Schedule(){const settings=useSettings(), current=useCurrentEvent(settings.stage); return <><Header title="Order of the day"/><div className="date-pill">SUNDAY <b>29</b> NOVEMBER 2026</div><div className="timeline">{events.map((e,i)=><div className="timeline-row" key={e[0]}><time>{e[0]}</time><div className={'timeline-dot '+(current.event===e?'active':'')}></div><div><h2>{e[1]}</h2>{current.event===e && <span className="tag">{current.label}</span>}</div>{i===0 && <span className="timeline-star">✧</span>}</div>)}</div><p className="note">Timings may change a little on the day.</p></>}
function Seating(){
  const [name,setName]=useState(''), [results,setResults]=useState<{name:string,table_number:string|number,table_name?:string|null}[]>([]), [message,setMessage]=useState('');
  useEffect(()=>{
    const query=name.trim();
    if(!query){setResults([]);setMessage('');return}
    const controller=new AbortController();
    setResults([]);setMessage('Searching…');
    const timer=setTimeout(async ()=>{
      try{
        const response=await fetch('/api/seating/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:query}),signal:controller.signal});
        const data=await response.json();
        if(!response.ok) throw new Error(data.error || 'Unable to look up seats right now.');
        if(!controller.signal.aborted){setResults(data);setMessage(data.length?'':'No matching names found. Please check the spelling or ask the couple.')}
      }catch(error){if(!controller.signal.aborted) setMessage(error instanceof Error?error.message:'Unable to look up seats right now.')}
    },250);
    return ()=>{clearTimeout(timer);controller.abort()};
  },[name]);
  return <><Header title="Find your seat"/><p className="intro">A place has been saved just for you.</p><div className="panel"><div className="panel-icon"><Icon name="seating"/></div><h2>Let’s find your table</h2><p>Start typing your name to find your table.</p><label htmlFor="name">Your name</label><input id="name" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={150}/><div aria-live="polite" aria-atomic="true">{message && <p className="result">{message}</p>}{results.length>0 && <ul className="seat-results">{results.map(guest=>{const table=String(guest.table_number);return <li key={guest.name}><strong>{guest.name}</strong><span>{table==='TopTable'||table==='0'?'Top Table':`Table ${table}`}{guest.table_name && ` - ${guest.table_name}`}</span></li>})}</ul>}</div></div></>
}function Menu(){return <><Header title="Food & drink"/><p className="intro">Good food, good company, and plenty to celebrate.</p><section className="menu-card"><h2>Canapés</h2><ul className="menu-list"><li>Fish &amp; Chips</li><li>Sirloin &amp; Chips</li><li>Yorkshire Pudding with Beef</li><li>Potato &amp; Onion Bhaji</li></ul></section><section className="menu-card"><h2>Wedding breakfast</h2><div className="menu-course"><h3>Starter</h3><p>Spiced Beer Braised Short Rib</p><p><strong>Vegetarian:</strong> Asparagus, Soft Poached Egg</p><p><strong>Children:</strong> Breaded Chicken Strips</p></div><div className="menu-course"><h3>Main</h3><p>Shepherd's Pie</p><p><strong>Vegetarian / Pescatarian:</strong> Poached Salmon</p><p><strong>Children:</strong> Penne Pasta with Meatballs</p></div><div className="menu-course"><h3>Dessert</h3><p>Trio: Apple &amp; Cinnamon Crumble, Sticky Toffee Pudding, Lemon &amp; Strawberry Tart</p><p><strong>Children:</strong> Chocolate Brownie Bits</p></div><div className="menu-course"><h3>Wine</h3><p><strong>White Wine:</strong> La Vivienda</p><p><strong>Alcohol Free:</strong> Bottega 0%</p><p><strong>Toasting wine:</strong> Bottega Millesimato</p></div></section><section className="menu-card"><h2>Evening celebrations</h2><p>Fire Pit Barbecue</p><ul className="menu-list"><li>Steak Burgers</li><li>Chicken Kebabs</li><li>Bratwurst Sausages</li><li>Hot Spiced Pork Sausages</li><li>Salt &amp; Pepper Wedges</li></ul></section><div className="info-box"><strong>A note on allergens</strong><p>If you have not already discussed allergens and dietary requirements with Anna or Mike please speak to a member of venue staff.</p></div></>}
function More(){return <><Header title="A little more"/><p className="intro">Everything else you need for our day together.</p><div className="more-list">{[['/venue','venue','Venue','Getting there and more'],['/faq','faq','FAQs','A few helpful answers'],['/games/photo-hunt','photo-hunt','Photo hunt','Capture the day'],['/games/quiz','quiz','The quiz','How well do you know us?'],['/games/bingo','bingo','Wedding Bingo','Spot the moments of the day']].map(([to,icon,title,sub])=><CardLink key={to} {...{to,icon,title,sub}}/>)}</div></>}
function Music(){const playlists=[
  ['Guests Assemble','Spotify','https://open.spotify.com/playlist/6vZYVhol8Ap9UGO5z8lUji?si=yCKcI8B-QAWnTltQ1f0AVA'],
  ['Eva Entrance','Spotify','https://open.spotify.com/playlist/5QOdl1RcNOYGGzoLijAUeS?si=OrXaWvo-Qw-wNCIjFvq8wg'],
  ['Bride Entrance','Spotify','https://open.spotify.com/playlist/0U3TVBR7MtKRkvghSAZEzK?si=0Fiyl3vISCeZv_txlPMo_g'],
  ['Signing Registry','Spotify','https://open.spotify.com/playlist/4LfqvUnRMI8cxOjlUOeV3U?si=pGjFkiwkRFO34jluOfownQ'],
  ['Exit','Spotify','https://open.spotify.com/playlist/4Y2IfLXyWX9Bh19qfxLDPG?si=t-3lY6HAQzqt9mSRwJkD4w'],
  ['Wedding Breakfast','YouTube Music','https://music.youtube.com/playlist?list=PLMYBHVoqLPqU&si=72W6qeCA2p-4NvE7&drli=1'],
];return <><Header title="Music"/><p className="intro">The playlists for our day.</p><div className="more-list">{playlists.map(([title,service,url])=><a className="shortcut" key={title} href={url}><span className="shortcut-icon"><Icon name="music"/></span><span><strong>{title}</strong><small>Listen on {service}</small></span><span className="arrow" aria-hidden="true">›</span></a>)}</div></>}
function Placeholder({title,text}:{title:string,text:string}){return <><Header title={title}/><div className="empty"><div>✧</div><h2>Coming soon</h2><p>{text}</p></div></>}
function Venue(){
  const s=useSettings();
  const [plan,setPlan]=useState<{label:string;src:string}|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(plan && dialog.current && !dialog.current.open) dialog.current.showModal()},[plan]);
  return <><Header title="The venue"/><p className="intro">How to get to and around our venue.</p>
    {s.venue && <div className="panel venue-details"><div className="panel-icon">⌖</div><h2>Venue details</h2><p className="preline">{s.venue}</p></div>}
    <section className="venue-section" aria-labelledby="venue-location"><h2 id="venue-location">Getting to The Pear Tree</h2><p>Find your way to the venue.</p><iframe className="venue-map" title="Map showing The Pear Tree venue" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2663.267482256027!2d-1.8638107000000002!3d51.581799700000005!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487143d46be22081%3A0x456cd1b126667393!2sThe%20Pear%20Tree!5e1!3m2!1sen!2suk!4v1795293884835!5m2!1sen!2suk" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></section>
    <section className="venue-section" aria-labelledby="venue-plans"><h2 id="venue-plans">Venue Maps</h2><p>Tap a floor plan to enlarge it.</p><div className="floor-plans">{[['Ground floor','/art/PearTreeGroundFloor.png'],['First floor','/art/PearTreeFirstFloor.png']].map(([label,src])=><figure key={src}><figcaption>{label}</figcaption><button type="button" onClick={()=>setPlan({label,src})} aria-label={`Enlarge ${label.toLowerCase()} floor plan`}><img src={src} alt={`The Pear Tree ${label.toLowerCase()} floor plan`} loading="lazy"/></button></figure>)}</div></section>
    <dialog ref={dialog} className="plan-dialog" aria-labelledby="plan-dialog-title" onClose={()=>setPlan(null)}><div className="plan-dialog-bar"><h2 id="plan-dialog-title">{plan?.label} floor plan</h2><button type="button" onClick={()=>dialog.current?.close()} aria-label="Close floor plan">×</button></div>{plan && <div className="plan-dialog-image"><img src={plan.src} alt={`The Pear Tree ${plan.label.toLowerCase()} floor plan`}/></div>}</dialog>
  </>;
}
function FAQ(){
  const s=useSettings();
  const questions=[
    ['Can we take photos of the ceremony?', <>Please keep phones and cameras away during the ceremony and let our photographers capture it all. There will be plenty of opportunities for photos later.</>],
    ['Can we post photos on social media?', <>We'd love to see your photos from the day via <a href="https://skuse.love/photos" target="_blank" rel="noreferrer">Photos</a>, where they'll be displayed at the wedding. Please hold off posting wedding photos on social media so we can be the first to share moments from the day.</>],
    ['What time do we get kicked out?', <>The disco will end with the last dance around 11:30 PM, and we need to leave the venue by midnight.</>],
    ['Should we book a taxi in advance?', <>Yes, we recommend booking taxis to your hotel or home in advance, as it may be harder to arrange one at the end of the evening.</>],
  ] as const;
  return <><Header title="Good to know"/><p className="intro">A few helpful details for the day.</p><section className="faq-list" aria-label="Frequently asked questions">{questions.map(([question,answer])=><details key={question} name="wedding-faq"><summary>{question}</summary><p>{answer}</p></details>)}</section>{s.faq && <div className="content-card faq-extra"><div><h2>More information</h2><p className="preline">{s.faq}</p></div></div>}</>;
}
function PhotoHuntPage(){const [stage,setStage]=useState<string | null>(null),[now,setNow]=useState(()=>new Date()),[failed,setFailed]=useState(false);useEffect(()=>{const controller=new AbortController();const load=()=>fetch('/api/settings',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{setStage(data.stage || '');setFailed(false)}).catch(()=>{if(!controller.signal.aborted)setFailed(true)});void load();const refresh=window.setInterval(load,30000),clock=window.setInterval(()=>setNow(new Date()),1000);return ()=>{controller.abort();window.clearInterval(refresh);window.clearInterval(clock)}},[]);if(stage===null)return <p className="note" role={failed?'alert':'status'}>{failed?'Could not load the photo hunt. Please refresh to try again.':'Loading photo hunt…'}</p>;return <PhotoHunt phase={photoHuntPhase(stage,now)}/>;}
function Admin(){const [token,setToken]=useState(''),[photos,setPhotos]=useState<{id:string,created_at:string}[]>([]),[stage,setStage]=useState(''),[venue,setVenue]=useState(''),[faq,setFaq]=useState(''),[bingoEntries,setBingoEntries]=useState(''),[huntEntries,setHuntEntries]=useState<string[][] | null>(null),[adminToken,setAdminToken]=useState(''),[msg,setMsg]=useState(''),[previews,setPreviews]=useState<Record<string,string>>({});const headers={Authorization:`Bearer ${token}`};async function load(){try{const r=await fetch('/api/admin/photos',{headers});if(!r.ok)throw Error();const data=await r.json();setPhotos(data);const settingsResponse=await fetch('/api/settings'); if(settingsResponse.ok){const settings=await settingsResponse.json();setStage(settings.stage || '');setVenue(settings.venue || '');setFaq(settings.faq || '');}const bingoResponse=await fetch('/api/bingo'); if(!bingoResponse.ok) throw Error(); setBingoEntries((await bingoResponse.json()).join('\n'));const huntResponse=await fetch('/api/photo-hunt'); if(!huntResponse.ok) throw Error(); setHuntEntries(await huntResponse.json());const pairs=await Promise.all(data.map(async(p:{id:string})=>{const image=await fetch(`/api/admin/photos/${p.id}`,{headers});return [p.id,URL.createObjectURL(await image.blob())]}));setPreviews(Object.fromEntries(pairs));setAdminToken(token);setMsg('Signed in.')}catch{setMsg('Could not sign in. Check your admin token.')}}async function moderate(id:string,status:string){const r=await fetch(`/api/admin/photos/${id}`,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({status})});if(r.ok){setPhotos(photos.filter(p=>p.id!==id));setMsg(`Photo ${status}.`)}else setMsg('Could not update photo.')}async function save(){const r=await fetch('/api/admin/settings',{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({stage,venue,faq})});setMsg(r.ok?'Settings saved.':'Could not save settings.')}async function saveBingo(){try{const entries=bingoEntries.split(/\r?\n/).map(entry=>entry.trim()).filter(Boolean);const r=await fetch('/api/admin/bingo',{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({entries})});const result=await r.json();setMsg(r.ok?'Bingo entries saved.':result.error || 'Could not save bingo entries.')}catch{setMsg('Could not save bingo entries.')}}return <><Header title="Admin"/><div className="panel admin"><label htmlFor="admin-token">Admin token</label><input id="admin-token" type="password" value={token} onChange={e=>setToken(e.target.value)}/><button onClick={load}>Sign in / refresh</button><p role="status">{msg}</p>{adminToken && <PrizeClaimsAdmin token={adminToken}/>}<h2>Event and content</h2><label htmlFor="stage">Current event override</label><select id="stage" value={stage} onChange={e=>setStage(e.target.value)}><option value="">Automatic</option>{events.map((e,i)=><option key={e[0]} value={i}>{e[0]} · {e[1]}</option>)}</select><label htmlFor="venue">Venue details</label><textarea id="venue" value={venue} onChange={e=>setVenue(e.target.value)}/><label htmlFor="faq">FAQ details</label><textarea id="faq" value={faq} onChange={e=>setFaq(e.target.value)}/><button onClick={save}>Save settings</button><h2>Wedding Bingo</h2><label htmlFor="bingo-entries">Bingo entries, one per line</label><p>Enter at least 16 unique entries (up to 100 characters each). Existing guest boards stay the same.</p><textarea id="bingo-entries" rows={12} value={bingoEntries} onChange={e=>setBingoEntries(e.target.value)}/><button onClick={saveBingo}>Save bingo entries</button>{huntEntries && <PhotoHuntAdmin key={JSON.stringify(huntEntries)} token={token} entries={huntEntries} onSaved={setMsg}/>}<h2>Pending photos</h2>{photos.length===0?<p>No pending photos loaded.</p>:photos.map(p=><div className="moderation" key={p.id}>{previews[p.id]&&<img src={previews[p.id]} alt="Pending submission"/>}<p>{p.created_at}</p><div><button onClick={()=>moderate(p.id,'approved')}>Approve</button><button className="secondary" onClick={()=>moderate(p.id,'rejected')}>Reject</button></div></div>)}</div></>}
function Shell(){const loc=useLocation();useEffect(()=>{window.scrollTo(0,0)},[loc.pathname]);return <><a className="skip" href="#main">Skip to content</a><div className="app-shell"><div className="topline"><Link to="/" aria-label="Mike and Anna home"><img src="/art/crest.png" alt="" /></Link><span>29 · 11 · 26</span></div><main id="main" className={loc.pathname==='/'?'home-main':'page-main'}><Routes><Route path="/" element={<Home/>}/><Route path="/schedule" element={<Schedule/>}/><Route path="/seating" element={<Seating/>}/><Route path="/menu" element={<Menu/>}/><Route path="/photos" element={<Photos/>}/><Route path="/photos/upload" element={<Navigate to="/photos" replace/>}/><Route path="/more" element={<More/>}/><Route path="/venue" element={<Venue/>}/><Route path="/faq" element={<FAQ/>}/><Route path="/admin" element={<Admin/>}/><Route path="/music" element={<Music/>}/><Route path="/games/quiz" element={<Quiz/>}/><Route path="/games/bingo" element={<Bingo/>}/><Route path="/games/photo-hunt" element={<PhotoHuntPage/>}/><Route path="*" element={<Placeholder title="Page not found" text="Please use the navigation to find your way back."/>}/></Routes></main><nav className="bottom-nav" aria-label="Main navigation">{[['/','home','Home'],['/schedule','schedule','Schedule'],['/photos','photos','Photos'],['/more','more','More']].map(([to,icon,label])=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>isActive?'active':''}><Icon name={icon}/><span>{label}</span></NavLink>)}</nav></div></>}
export default function App(){return <BrowserRouter><Shell/></BrowserRouter>}


