import { useCallback, useEffect, useRef, useState } from 'react';
import { cartoonify, type CropView } from '../avatar/cartoonify';

type Stage = 'source' | 'camera' | 'crop' | 'preview';

interface AvatarStudioProps {
  /** e.g. "Photo for Gus — the King" */
  title: string;
  onDone: (dataUrl: string) => void;
  onCancel: () => void;
}

const VIEWPORT = 320; // on-screen crop viewport, px

/**
 * Guided flow: pick a photo (upload or camera) -> pan/zoom a square crop ->
 * preview the cartoonified avatar -> accept. Everything stays in the browser.
 */
export default function AvatarStudio({ title, onDone, onCancel }: AvatarStudioProps) {
  const [stage, setStage] = useState<Stage>('source');
  const [image, setImage] = useState<HTMLImageElement | HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // ----- source: file upload -----

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      setImage(img);
      setStage('crop');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setCameraError("Couldn't read that image file.");
    };
    img.src = url;
  }

  // ----- source: camera -----

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (stage !== 'camera') return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1024 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        if (!cancelled) {
          setCameraError('Camera unavailable (check permissions, or use upload instead).');
          setStage('source');
        }
      }
    })();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stage, stopCamera]);

  function captureFrame() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    // Mirror so the capture matches the selfie preview.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    stopCamera();
    setImage(canvas);
    setStage('crop');
  }

  // ----- crop: pan / zoom -----

  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1); // 1 = crop square covers min(image dims)
  const [offset, setOffset] = useState({ x: 0.5, y: 0.5 }); // crop centre, image fraction
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  const imgW = image instanceof HTMLImageElement ? image.naturalWidth : (image?.width ?? 0);
  const imgH = image instanceof HTMLImageElement ? image.naturalHeight : (image?.height ?? 0);

  const cropView = useCallback((): CropView => {
    const base = Math.min(imgW, imgH);
    const size = base / zoom;
    const cx = offset.x * imgW;
    const cy = offset.y * imgH;
    const sx = Math.min(Math.max(cx - size / 2, 0), imgW - size);
    const sy = Math.min(Math.max(cy - size / 2, 0), imgH - size);
    return { sx, sy, size };
  }, [imgW, imgH, zoom, offset]);

  useEffect(() => {
    if (stage !== 'crop' || !image) return;
    const canvas = cropCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const v = cropView();
    ctx.clearRect(0, 0, VIEWPORT, VIEWPORT);
    ctx.drawImage(image, v.sx, v.sy, v.size, v.size, 0, 0, VIEWPORT, VIEWPORT);
    // Circle guide.
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(VIEWPORT / 2, VIEWPORT / 2, VIEWPORT / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [stage, image, cropView]);

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const v = cropView();
    // Convert viewport pixels dragged into image-fraction movement.
    const perPx = v.size / VIEWPORT;
    setOffset({
      x: Math.min(1, Math.max(0, drag.ox - ((e.clientX - drag.startX) * perPx) / imgW)),
      y: Math.min(1, Math.max(0, drag.oy - ((e.clientY - drag.startY) * perPx) / imgH)),
    });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function makeAvatar() {
    if (!image) return;
    setResult(cartoonify(image, cropView()));
    setStage('preview');
  }

  // ----- render -----

  return (
    <div className="modal-backdrop">
      <div className="modal avatar-studio" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>

        {stage === 'source' && (
          <div className="studio-source">
            {cameraError && <p className="studio-error">{cameraError}</p>}
            <label className="btn file-btn">
              📁 Upload a photo
              <input type="file" accept="image/*" onChange={onFile} hidden />
            </label>
            <button
              className="btn"
              onClick={() => {
                setCameraError(null);
                setStage('camera');
              }}
            >
              📷 Use the camera
            </button>
            <button className="btn btn-quiet" onClick={onCancel}>
              Cancel
            </button>
          </div>
        )}

        {stage === 'camera' && (
          <div className="studio-camera">
            <video ref={videoRef} playsInline muted className="camera-preview" />
            <div className="studio-actions">
              <button className="btn" onClick={captureFrame}>
                📸 Take photo
              </button>
              <button className="btn btn-quiet" onClick={() => setStage('source')}>
                Back
              </button>
            </div>
          </div>
        )}

        {stage === 'crop' && image && (
          <div className="studio-crop">
            <p className="studio-hint">Drag to position your face inside the circle.</p>
            <canvas
              ref={cropCanvasRef}
              width={VIEWPORT}
              height={VIEWPORT}
              className="crop-canvas"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            <label className="zoom-row">
              Zoom
              <input
                type="range"
                min={1}
                max={4}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
            <div className="studio-actions">
              <button className="btn" onClick={makeAvatar}>
                ✨ Cartoonify
              </button>
              <button className="btn btn-quiet" onClick={() => setStage('source')}>
                Back
              </button>
            </div>
          </div>
        )}

        {stage === 'preview' && result && (
          <div className="studio-preview">
            <img src={result} alt="cartoon avatar preview" className="avatar-preview" />
            <div className="studio-actions">
              <button className="btn" onClick={() => onDone(result)}>
                ✅ Use this avatar
              </button>
              <button className="btn btn-quiet" onClick={() => setStage('crop')}>
                Adjust crop
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
