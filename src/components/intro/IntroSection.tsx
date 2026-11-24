import { useRef, useState } from 'react';
import { Play } from 'lucide-react';

import { INTRO_VIDEO_SRC } from '@/config/media';

export default function IntroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const play = async () => {
    const video = videoRef.current;
    if (!video) return;
    setNotice(null);
    video.muted = false;
    try {
      await video.play();
      setStarted(true);
    } catch {
      setNotice('The video could not be played. Please try again.');
    }
  };

  return (
    <section
      id="introduction"
      aria-labelledby="introduction-text"
      className="relative w-full bg-[#0a0d0a] px-6 py-28 text-white sm:px-10 sm:py-36 lg:py-44"
    >
      <div className="mx-auto max-w-[700px]">
        <p
          id="introduction-text"
          className="text-[clamp(1.5rem,3.2vw,2.25rem)] font-light leading-[1.45] tracking-[-0.01em] text-white"
        >
          We are rapidly advancing AI. But building the machinery does not mean we fully understand the
          intelligence it produces, or what it will do next.
        </p>

        <div className="relative mt-16 aspect-video w-full overflow-hidden rounded-lg border border-white/[0.08] bg-[#060806] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] sm:mt-20">
          <video
              ref={videoRef}
              src={INTRO_VIDEO_SRC}
              preload="metadata"
              playsInline
              controls={started}
              onEnded={() => setStarted(false)}
              onError={() => {
                setStarted(false);
                setNotice('The video could not be loaded. Please try again.');
              }}
              className="absolute inset-0 h-full w-full object-contain"
            />

          {!started && (
            <button
              type="button"
              onClick={play}
              aria-label="Play the introduction video"
              className="group absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(ellipse_at_center,rgba(163,230,53,0.06),transparent_65%)] focus-visible:outline-none"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-400 text-[#0a0d0a] shadow-[0_0_0_8px_rgba(163,230,53,0.12)] transition duration-300 group-hover:scale-105 group-hover:shadow-[0_0_0_14px_rgba(163,230,53,0.14)] group-focus-visible:ring-2 group-focus-visible:ring-lime-300 group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-[#060806] sm:h-20 sm:w-20">
                <Play className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8" aria-hidden="true" />
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-400">
                {notice ?? 'Watch the introduction'}
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
