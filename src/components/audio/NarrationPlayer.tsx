import './narration.css';
import { useLayoutEffect, useRef, useState, type ChangeEvent, type SyntheticEvent } from 'react';

function formatTime(seconds: number) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** One narration track: Listen/Pause, progress, time and mute. Remount with a new `key` per track. */
export default function NarrationPlayer({
  audioUrl,
  onTime,
}: {
  audioUrl: string;
  /** Called with the playback position (seconds) as it advances, for syncing the diagram to the narration. */
  onTime?: (seconds: number, duration: number) => void;
}) {
  return audioUrl
    ? <Narration key={audioUrl} audioUrl={audioUrl} onTime={onTime} />
    : <p className="topic-audio-unavailable">Audio coming soon</p>;
}

function Narration({
  audioUrl,
  onTime,
}: {
  audioUrl: string;
  onTime?: (seconds: number, duration: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  // After a clip ends the player rewinds to 0 for replay; that rewind must not look like "back to the start" to onTime.
  const endedRef = useRef(false);
  const onTimeRef = useRef(onTime);
  useLayoutEffect(() => {
    onTimeRef.current = onTime;
  });
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = audioUrl;

    return () => {
      onTimeRef.current?.(0, 0);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, [audioUrl]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }

    setError('');
    if (audio.error) audio.load();

    try {
      // Call play directly from the user gesture for mobile browsers.
      await audio.play();
    } catch (playError) {
      if (audioRef.current === audio && (playError as Error).name !== 'AbortError') {
        setPlaying(false);
        setError(audio.error ? 'Audio could not load.' : 'Audio could not play.');
      }
    }
  }

  function updateDuration(event: SyntheticEvent<HTMLAudioElement>) {
    const seconds = event.currentTarget.duration;
    setDuration(Number.isFinite(seconds) && seconds > 0 ? seconds : 0);
  }

  function seek(event: ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    endedRef.current = false;
    audio.currentTime = event.currentTarget.valueAsNumber;
    setPosition(audio.currentTime);
  }

  return (
    <div className="topic-audio" role="group" aria-label="Topic narration">
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={updateDuration}
        onDurationChange={updateDuration}
        onTimeUpdate={(event) => {
          setPosition(event.currentTarget.currentTime);
          if (!endedRef.current) onTime?.(event.currentTarget.currentTime, event.currentTarget.duration);
        }}
        onPlay={() => {
          endedRef.current = false;
          setPlaying(true);
        }}
        onPause={() => setPlaying(false)}
        onSeeked={(event) => {
          if (!endedRef.current) onTime?.(event.currentTarget.currentTime, event.currentTarget.duration);
        }}
        onEnded={(event) => {
          endedRef.current = true;
          onTime?.(event.currentTarget.duration, event.currentTarget.duration);
          event.currentTarget.currentTime = 0;
          setPosition(0);
          setPlaying(false);
        }}
        onError={() => {
          setPlaying(false);
          setPosition(0);
          setDuration(0);
          setError('Audio could not load.');
        }}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
      />
      <div className="topic-audio-row">
        <button className="topic-audio-play" type="button" onClick={togglePlayback}>
          {playing ? 'Pause' : 'Listen'}
        </button>
        <input
          className="topic-audio-progress"
          type="range"
          aria-label="Narration position"
          aria-valuetext={duration ? `${formatTime(position)} of ${formatTime(duration)}` : undefined}
          min={0}
          max={duration}
          step="any"
          value={Math.min(position, duration)}
          onChange={seek}
          disabled={!duration || Boolean(error)}
        />
        <span className="topic-audio-time">
          {formatTime(position)} / {duration ? formatTime(duration) : '–:––'}
        </span>
        <button
          className="topic-audio-volume"
          type="button"
          aria-label={muted ? 'Unmute narration' : 'Mute narration'}
          onClick={() => {
            if (audioRef.current) audioRef.current.muted = !audioRef.current.muted;
          }}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9h4l5-4v14l-5-4H3z" />
            <path d={muted ? 'm16 9 5 6m0-6-5 6' : 'M16 9a4.25 4.25 0 0 1 0 6m3-8a7.1 7.1 0 0 1 0 10'} />
          </svg>
        </button>
      </div>
      <p className="topic-audio-error" role="status">{error}</p>
    </div>
  );
}
