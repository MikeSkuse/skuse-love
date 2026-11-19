const weddingWall = 'https://wall.skuse.pics';

type UploadResult =
  | { ok: true; status: 'pending' | 'visible' }
  | { ok: false; status: 403 | 503; error: string };

// WeddingWall publishes its guest upload key via /api/config. Fetch it server-side
// so the adapter follows key rotation without storing an admin or display key.
export async function uploadToWeddingWall(file: File, send: typeof fetch = fetch, thumbnail?: File): Promise<UploadResult> {
  try {
    const configResponse = await send(`${weddingWall}/api/config`, { signal: AbortSignal.timeout(10000) });
    if (!configResponse.ok) throw new Error('WeddingWall configuration unavailable');
    const config = await configResponse.json() as { uploadKey?: unknown; settings?: { uploadEnabled?: boolean; uploadKeyRequired?: boolean } };
    if (config.settings?.uploadEnabled === false) return { ok: false, status: 403, error: 'Photo uploads are currently disabled.' };
    if (config.settings?.uploadKeyRequired !== false && (typeof config.uploadKey !== 'string' || !config.uploadKey)) throw new Error('WeddingWall upload key unavailable');

    const form = new FormData();
    form.append('photos', file, file.name);
    if (thumbnail) form.append('thumbPhotos', thumbnail, thumbnail.name);
    const headers = new Headers();
    if (typeof config.uploadKey === 'string') headers.set('x-upload-key', config.uploadKey);
    const response = await send(`${weddingWall}/api/upload`, { method: 'POST', headers, body: form, signal: AbortSignal.timeout(30000) });
    if (response.status === 403) return { ok: false, status: 403, error: 'Photo uploads are currently disabled.' };
    if (!response.ok) throw new Error('WeddingWall upload unavailable');
    const result = await response.json() as { uploads?: { job?: { status?: string } }[] };
    const status = result.uploads?.[0]?.job?.status;
    if (result.uploads?.length !== 1 || (status !== 'pending' && status !== 'visible')) throw new Error('WeddingWall rejected the photo');
    return { ok: true, status };
  } catch {
    return { ok: false, status: 503, error: 'Could not upload the photo. Please try again later.' };
  }
}
