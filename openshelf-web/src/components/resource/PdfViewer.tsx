'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface PdfViewerProps {
  url: string;
  onClose: () => void;
}

declare global {
  interface Window {
    pdfjsLib: {
      getDocument: (src: string) => { promise: Promise<PdfDoc> };
      GlobalWorkerOptions: { workerSrc: string };
    };
  }
}

interface PdfDoc {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
}

interface PdfPage {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (ctx: {
    canvasContext: CanvasRenderingContext2D;
    viewport: ReturnType<PdfPage['getViewport']>;
  }) => { promise: Promise<void> };
}

export function PdfViewer({ url, onClose }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [full, setFull] = useState(false);
  const [status, setStatus] = useState<'loading' | 'rendering' | 'ready' | 'error'>('loading');
  const [errMsg, setErrMsg] = useState('');
  const renderRef = useRef<number>(0);

  // Load PDF.js from CDN
  useEffect(() => {
    if (window.pdfjsLib) {
      loadDoc();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      loadDoc();
    };
    script.onerror = () => {
      setStatus('error');
      setErrMsg('Failed to load PDF viewer. Please download the file instead.');
    };
    document.head.appendChild(script);
  }, [url]);

  const loadDoc = async () => {
    setStatus('loading');
    try {
      const pdfDoc = await window.pdfjsLib.getDocument(url).promise;
      setDoc(pdfDoc);
      setPages(pdfDoc.numPages);
      setPage(1);
    } catch {
      setStatus('error');
      setErrMsg('Could not load PDF. The file may be inaccessible.');
    }
  };

  // Render current page whenever page/scale/doc changes
  useEffect(() => {
    if (!doc || !canvasRef.current) return;
    const taskId = ++renderRef.current;

    setStatus('rendering');
    (async () => {
      try {
        const pdfPage = await doc.getPage(page);
        if (taskId !== renderRef.current) return; // stale render

        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await pdfPage.render({ canvasContext: ctx, viewport }).promise;
        if (taskId !== renderRef.current) return;
        setStatus('ready');
      } catch {
        if (taskId !== renderRef.current) return;
        setStatus('error');
        setErrMsg('Failed to render page.');
      }
    })();
  }, [doc, page, scale]);

  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const nextPage = () => setPage((p) => Math.min(pages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.2));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.2));

  return (
    <div
      className={`flex flex-col rounded-2xl overflow-hidden ${full ? 'fixed inset-4 z-50' : ''}`}
      style={{
        backgroundColor: 'hsl(var(--background))',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        height: full ? undefined : '70vh',
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 shrink-0"
        style={{
          borderBottom: '1px solid hsl(var(--border))',
          backgroundColor: 'hsl(var(--muted))',
        }}
      >
        {/* Page nav */}
        <button
          onClick={prevPage}
          disabled={page <= 1 || status !== 'ready'}
          className="p-1.5 rounded-lg disabled:opacity-40 transition-colors hover:bg-white/60"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span
          className="text-xs font-medium min-w-20 text-center"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          {status === 'loading' ? '…' : `${page} / ${pages}`}
        </span>

        <button
          onClick={nextPage}
          disabled={page >= pages || status !== 'ready'}
          className="p-1.5 rounded-lg disabled:opacity-40 transition-colors hover:bg-white/60"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {/* Zoom controls */}
        <button
          onClick={zoomOut}
          disabled={scale <= 0.5}
          className="p-1.5 rounded-lg disabled:opacity-40 transition-colors hover:bg-white/60"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span
          className="text-xs font-medium w-12 text-center"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          disabled={scale >= 3}
          className="p-1.5 rounded-lg disabled:opacity-40 transition-colors hover:bg-white/60"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Fullscreen toggle */}
        <button
          onClick={() => setFull((f) => !f)}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/60 ml-1"
        >
          {full ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="text-xs font-medium px-3 py-1.5 rounded-lg ml-1"
          style={{ backgroundColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
        >
          Close
        </button>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-start justify-center p-4"
        style={{ backgroundColor: '#525659' }}
      >
        {status === 'error' ? (
          <div className="flex flex-col items-center gap-3 mt-16 text-center px-8">
            <AlertCircle className="w-10 h-10" style={{ color: '#ef4444' }} />
            <p className="text-sm" style={{ color: '#e5e7eb' }}>
              {errMsg}
            </p>
          </div>
        ) : (
          <div className="relative">
            {(status === 'loading' || status === 'rendering') && (
              <div
                className="absolute inset-0 flex items-center justify-center z-10"
                style={{ backgroundColor: 'rgba(82,86,89,0.7)' }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#93c5fd' }} />
                  <p className="text-xs" style={{ color: '#e5e7eb' }}>
                    {status === 'loading' ? 'Loading PDF…' : `Rendering page ${page}…`}
                  </p>
                </div>
              </div>
            )}
            <canvas
              ref={canvasRef}
              style={{
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                display: 'block',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
