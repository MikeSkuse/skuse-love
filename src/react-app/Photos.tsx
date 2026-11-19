import { useEffect, useRef, useState } from 'react';

type Photo = { id: string };
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

function ActionIcon({ type }: { type: 'camera' | 'upload' }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{type === 'camera' ? <><path d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3.5"/></> : <><path d="M12 16V3m-5 5 5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></>}</svg>;
}

async function makeThumbnail(file: File): Promise<File | null> {
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 560 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.78));
    return blob && blob.size <= 500_000 ? new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' }) : null;
  } catch { return null; }
  finally { bitmap?.close(); }
}

export default function Photos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [galleryFailed, setGalleryFailed] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequest = useRef(0);

  async function loadPhotos() {
    try {
      const response = await fetch('/api/photos');
      if (!response.ok) throw new Error();
      setPhotos(await response.json());
      setGalleryFailed(false);
    } catch { setGalleryFailed(true); }
  }
  useEffect(() => { void loadPhotos(); }, []);
  useEffect(() => () => { cameraRequest.current++; streamRef.current?.getTracks().forEach(track => track.stop()); }, []);
  useEffect(() => {
    if (videoRef.current && cameraStream && !captured) { videoRef.current.srcObject = cameraStream; void videoRef.current.play().catch(() => setCameraError('Could not start the camera preview.')); }
  }, [cameraStream, captured]);
  useEffect(() => {
    if (!captured) { setPreview(''); return; }
    const url = URL.createObjectURL(captured);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [captured]);

  function stopCamera() {
    cameraRequest.current++;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setCameraStream(null);
  }
  function closeCamera() { stopCamera(); setCameraOpen(false); setCaptured(null); setCameraError(''); }
  async function startCamera() {
    stopCamera();
    const request = cameraRequest.current;
    setCameraOpen(true); setCaptured(null); setCameraError(''); setMessage('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if (request !== cameraRequest.current) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      setCameraStream(stream);
    } catch { if (request === cameraRequest.current) { stopCamera(); setCameraError('Camera unavailable. Check camera permission or use Add Photos.'); } }
  }
  async function capture() {
    const request = cameraRequest.current;
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) { setCameraError('The camera is not ready yet. Please try again.'); return; }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) { setCameraError('Could not capture the photo. Please try again.'); return; }
    context.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (request !== cameraRequest.current) return;
    if (!blob) { setCameraError('Could not capture the photo. Please try again.'); return; }
    if (blob.size > 8_000_000) { setCameraError('This photo is over 8 MB. Please try again or use Add Photos.'); return; }
    setCaptured(new File([blob], `wedding-photo-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    stopCamera();
  }
  function chooseFiles(selected: FileList | null) {
    if (!selected?.length) return;
    const next = Array.from(selected);
    if (next.length > 10 || next.some(file => !allowedTypes.includes(file.type) || file.size > 8_000_000 || file.size < 12)) {
      setMessage('Choose up to 10 JPEG, PNG or WebP photos, each under 8 MB.'); return;
    }
    setFiles(next); setMessage('');
  }
  async function upload() {
    if (!files.length || busy) return;
    setBusy(true); setMessage('');
    const failed: File[] = [];
    let pending = 0, visible = 0;
    for (const file of files) {
      try {
        const body = new FormData(); body.append('photo', file);
        const thumbnail = await makeThumbnail(file);
        if (thumbnail) body.append('thumbnail', thumbnail);
        const response = await fetch('/api/photos', { method: 'POST', body });
        const result = await response.json();
        if (!response.ok) { failed.push(file); continue; }
        if (result.status === 'visible') visible++; else pending++;
      } catch { failed.push(file); }
    }
    setFiles(failed);
    const successes = visible + pending;
    setMessage([successes ? `${successes} ${successes === 1 ? 'photo' : 'photos'} uploaded${pending ? ' (some may need approval)' : ''}.` : '', failed.length ? `${failed.length} could not be uploaded. Please try again.` : ''].filter(Boolean).join(' '));
    if (visible) void loadPhotos();
    setBusy(false);
  }
  return <section className="photos-page">
    <header className="page-header"><span className="eyebrow">MIKE &amp; ANNA</span><h1>Wedding photos</h1><div className="ornament" aria-hidden="true">✦ <span>✧</span> ✦</div></header>
    <p className="intro">Share the day through your eyes.</p>
    <div className="photo-actions">
      <button type="button" className="photo-action camera-action" onClick={() => void startCamera()} disabled={busy}><ActionIcon type="camera"/><span>Take Photo</span></button>
      <button type="button" className="photo-action add-action" onClick={() => inputRef.current?.click()} disabled={busy}><ActionIcon type="upload"/><span>Add Photos</span></button>
      <input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => { chooseFiles(e.target.files); e.target.value = ''; }}/>
    </div>
    {files.length > 0 && <div className="photo-selection"><p>{files.length === 1 ? files[0].name : `${files.length} photos selected`}</p><button type="button" onClick={() => void upload()} disabled={busy}><ActionIcon type="upload"/>{busy ? 'Uploading…' : `Upload ${files.length === 1 ? 'photo' : 'photos'}`}</button></div>}
    {message && <p className="photo-message" role="status">{message}</p>}
    <p className="photo-hint">JPEG, PNG or WebP · up to 8 MB each · photos may be reviewed</p>
    <div className="gallery-heading"><h2>Captured with love</h2><span>✧</span></div>
    {photos.length ? <div className="gallery">{photos.map(photo => <img key={photo.id} src={`/api/photos/${photo.id}`} alt="A guest's wedding photograph" loading="lazy"/>)}</div> : <div className="empty photo-empty"><div><ActionIcon type="camera"/></div><h2>{galleryFailed ? 'Photos are unavailable right now' : 'The story starts here'}</h2><p>{galleryFailed ? 'Please try again when you have a connection.' : 'Shared photos will appear here.'}</p></div>}
    {cameraOpen && <div className="camera-overlay" role="dialog" aria-modal="true" aria-label="Take a photo"><div className="camera-bar"><strong>Take a photo</strong><button type="button" onClick={closeCamera} aria-label="Close camera">×</button></div><div className="camera-frame">{captured && preview ? <img src={preview} alt="Your captured photo"/> : <video ref={videoRef} autoPlay playsInline muted/>}{cameraError && <p role="alert">{cameraError}</p>}</div><div className="camera-controls">{captured ? <><button type="button" onClick={() => void startCamera()}>Retake</button><button type="button" onClick={() => { setFiles([captured]); setMessage(''); closeCamera(); }}>Use photo</button></> : <button type="button" className="camera-shutter" onClick={() => void capture()} aria-label="Capture photo"><ActionIcon type="camera"/></button>}</div></div>}
  </section>;
}
