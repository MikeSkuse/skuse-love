import { Hono } from "hono";

type Bindings = { DB: D1Database; PHOTOS: R2Bucket; ADMIN_TOKEN?: string };
const app = new Hono<{ Bindings: Bindings }>();
const jsonError = (message: string, status: 400 | 401 | 404 | 413 | 429 | 503) => new Response(JSON.stringify({ error: message }), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const digest = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))), b => b.toString(16).padStart(2, "0")).join("");
async function limited(db: D1Database, key: string, max: number) {
  const now = Math.floor(Date.now() / 1000);
  const row = await db.prepare("INSERT INTO rate_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires < ? THEN 1 ELSE count+1 END, expires=CASE WHEN expires < ? THEN ? ELSE expires END RETURNING count").bind(key, now+3600, now, now, now+3600).first<{count:number}>();
  return (row?.count ?? max+1) > max;
}
app.use('/api/*', async (c, next) => { await next(); c.header('Cache-Control', 'no-store'); c.header('X-Content-Type-Options', 'nosniff'); });
app.use('/api/admin/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (await limited(c.env.DB, `admin:${ip}`, 100)) return jsonError('Please try again later.',429);
  const supplied = c.req.header('Authorization')?.replace(/^Bearer /, '') || '';
  if (!c.env.ADMIN_TOKEN || !supplied || await digest(supplied) !== await digest(c.env.ADMIN_TOKEN)) return jsonError('Unauthorised', 401);
  await next();
});
app.get('/api/settings', async c => { const rows = await c.env.DB.prepare('SELECT key,value FROM settings').all<{key:string,value:string}>(); return c.json(Object.fromEntries(rows.results.map(x => [x.key,x.value]))); });
app.post('/api/seating', async c => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (await limited(c.env.DB, `seat:${ip}`, 20)) return jsonError('Please try again later.',429);
  const body = await c.req.json<{name?:string}>().catch(() => ({} as {name?:string}));
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 150) return jsonError('Enter your name.',400);
  const row = await c.env.DB.prepare('SELECT table_number FROM seating_plan WHERE lower(trim(name))=lower(trim(?)) LIMIT 1').bind(body.name).first();
  return row ? c.json(row) : jsonError('No matching seating found. Please check your details or ask the couple.',404);
});
app.post('/api/seating/search', async c => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (await limited(c.env.DB, `seat-search:${ip}`, 2000)) return jsonError('Please try again later.',429);
  const body = await c.req.json<{name?:string}>().catch(() => ({} as {name?:string}));
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 150) return jsonError('Enter your name.',400);
  const rows = await c.env.DB.prepare('SELECT seating_plan.name, seating_plan.table_number, tables.theme AS table_name FROM seating_plan LEFT JOIN tables ON tables.id = seating_plan.table_number WHERE instr(lower(seating_plan.name), lower(?)) > 0 ORDER BY seating_plan.name COLLATE NOCASE').bind(body.name.trim()).all<{name:string,table_number:string,table_name:string|null}>();
  return c.json(rows.results);
});
app.get('/api/photos', async c => { const rows = await c.env.DB.prepare("SELECT id,created_at FROM photos WHERE status='approved' ORDER BY created_at DESC LIMIT 100").all(); return c.json(rows.results); });
app.get('/api/photos/:id', async c => { const row = await c.env.DB.prepare("SELECT object_key,mime FROM photos WHERE id=? AND status='approved'").bind(c.req.param('id')).first<{object_key:string,mime:string}>(); if (!row) return jsonError('Not found',404); const obj = await c.env.PHOTOS.get(row.object_key); if (!obj) return jsonError('Not found',404); return new Response(obj.body,{headers:{'Content-Type':row.mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}); });
app.post('/api/photos', async c => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (await limited(c.env.DB, `upload:${ip}`, 10)) return jsonError('Upload limit reached. Please try again later.',429);
  if (Number(c.req.header('Content-Length') || 0) > 8_500_000) return jsonError('Photo must be under 8 MB.',413);
  const form = await c.req.formData().catch(() => null); const file = form?.get('photo');
  if (!(file instanceof File) || file.size > 8_000_000 || file.size < 12) return jsonError('Choose a JPEG, PNG or WebP under 8 MB.',400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const jpeg = bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
  const png = [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
  const webp = String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  const mime = jpeg ? 'image/jpeg' : png ? 'image/png' : webp ? 'image/webp' : '';
  if (!mime || file.type !== mime) return jsonError('That file is not a supported image.',400);
  const id=crypto.randomUUID(), key=`pending/${crypto.randomUUID()}`;
  await c.env.PHOTOS.put(key,bytes,{httpMetadata:{contentType:mime}});
  try { await c.env.DB.prepare('INSERT INTO photos (id,object_key,mime) VALUES (?,?,?)').bind(id,key,mime).run(); } catch (e) { await c.env.PHOTOS.delete(key); throw e; }
  return c.json({ok:true},201);
});
app.get('/api/admin/photos', async c => { const rows=await c.env.DB.prepare("SELECT id,created_at,status FROM photos WHERE status='pending' ORDER BY created_at DESC").all(); return c.json(rows.results); });
app.get('/api/admin/photos/:id', async c => { const row=await c.env.DB.prepare('SELECT object_key,mime FROM photos WHERE id=?').bind(c.req.param('id')).first<{object_key:string,mime:string}>(); if(!row) return jsonError('Not found',404); const obj=await c.env.PHOTOS.get(row.object_key); return obj ? new Response(obj.body,{headers:{'Content-Type':row.mime,'Cache-Control':'no-store'}}) : jsonError('Not found',404); });
app.post('/api/admin/photos/:id', async c => { const body=await c.req.json<{status:string}>(); if (!['approved','rejected'].includes(body.status)) return jsonError('Invalid status',400); await c.env.DB.prepare('UPDATE photos SET status=? WHERE id=?').bind(body.status,c.req.param('id')).run(); return c.json({ok:true}); });
app.put('/api/admin/settings', async c => { const body=await c.req.json<Record<string,string>>(); for(const [key,value] of Object.entries(body)) { if(!['stage','venue','faq'].includes(key) || typeof value !== 'string' || value.length>3000) return jsonError('Invalid setting',400); await c.env.DB.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,value).run(); } return c.json({ok:true}); });
app.post('/api/admin/guests', async c => { const body=await c.req.json<{guests:{id:string,name:string,table_id:string,token_hash:string}[]}>(); if(!Array.isArray(body.guests) || body.guests.length>500 || body.guests.some(g=>!g.id || !g.name || typeof g.table_id !== 'string' || !/^\d+$/.test(g.table_id) || !/^[a-f0-9]{64}$/.test(g.token_hash))) return jsonError('Invalid guest records',400); await c.env.DB.batch(body.guests.map(g=>c.env.DB.prepare('INSERT INTO guests (id,name,table_id,token_hash) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,table_id=excluded.table_id,token_hash=excluded.token_hash').bind(g.id,g.name,g.table_id,g.token_hash))); return c.json({ok:true}); });
export default app;


