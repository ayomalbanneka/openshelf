'use client';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Loader2 } from 'lucide-react';

interface AudioPlayerProps {
  url: string;
  title: string;
}

const fmt = (s: number) => {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export function AudioPlayer({ url, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      setDuration(audio.duration);
      setLoading(false);
    };
    const onTime = () => setCurrent(audio.currentTime);
    const onEnded = () => setPlaying(false);
    const onError = () => {
      setError(true);
      setLoading(false);
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setError(true));
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * duration;
    setCurrent(audio.currentTime);
  };

  const skip = (secs: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + secs));
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    setMuted(v === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !muted;
    setMuted(next);
    audioRef.current.muted = next;
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        backgroundColor: 'hsl(var(--background))',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Title */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#eff6ff' }}
        >
          <Volume2 className="w-5 h-5" style={{ color: '#2563eb' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
            {title}
          </p>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Audio resource
          </p>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-center py-2" style={{ color: '#dc2626' }}>
          Could not load audio. Please download the file instead.
        </p>
      ) : (
        <>
          {/* Progress bar */}
          <div className="flex flex-col gap-1.5">
            <div
              ref={progressRef}
              onClick={seek}
              className="w-full h-2 rounded-full cursor-pointer overflow-hidden"
              style={{ backgroundColor: 'hsl(var(--muted))' }}
            >
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{ width: `${pct}%`, backgroundColor: '#2563eb' }}
              />
            </div>
            <div
              className="flex justify-between text-[10px]"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              <span>{fmt(current)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Skip back */}
            <button
              onClick={() => skip(-10)}
              className="p-2 rounded-xl transition-colors"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              title="Back 10s"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Play/pause */}
            <button
              onClick={togglePlay}
              disabled={loading && !error}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-60"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : playing ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Skip forward */}
            <button
              onClick={() => skip(10)}
              className="p-2 rounded-xl transition-colors"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              title="Forward 10s"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <div className="flex-1" />

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              {muted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={handleVolume}
              className="w-20 accent-blue-600"
            />
          </div>
        </>
      )}
    </div>
  );
}
