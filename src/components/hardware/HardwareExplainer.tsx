import { Fragment, useRef, useState, type CSSProperties } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePauseAudioOffscreen } from '@/hooks/usePauseAudioOffscreen';
import NarrationPlayer from '@/components/audio/NarrationPlayer';
import { boardMarkup, topics, viewBox } from './board';
import './hardware.css';

const number = (index: number) => String(index).padStart(2, '0');

export default function HardwareExplainer({ id, episodeNumber }: { id?: string; episodeNumber?: number }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Phones get a pinned bottom panel; wider screens keep the player under the selected row in the list.
  const isPhone = useMediaQuery('(max-width: 650px)');
  const sectionRef = useRef<HTMLElement>(null);

  // Never leave narration playing once the explainer has scrolled out of view.
  usePauseAudioOffscreen(sectionRef);

  const selected = topics[selectedIndex];
  const isIntroduction = selected.id === 'intro';

  function moveSelection(direction: number) {
    setSelectedIndex((index) => (index + direction + topics.length) % topics.length);
  }

  return (
    <section id={id} ref={sectionRef} className="hw-section" aria-label="NVIDIA GB200 Explained">
      <div className="hw-explainer">
        <header className="page-header">
          {episodeNumber !== undefined && (
            <div className="episode-label">Episode {String(episodeNumber).padStart(2, '0')}</div>
          )}
          <h2>
            NVIDIA GB200 <span>Explained</span>
          </h2>
          <p>
            {isIntroduction
              ? 'Explore how the GB200 gets power, boots up, and moves data between its processors and memory. Choose Next or pick a topic to begin.'
              : 'Select a component on the board or in the topic list.'}
          </p>
        </header>

        <div className="explorer-grid">
          <section
            className="selection panel"
            aria-label="Current topic and navigation"
            style={{ '--selection-color': selected.color } as CSSProperties}
          >
            <div className="current-topic" aria-live="polite" aria-atomic="true">
              <p className="eyebrow">
                Selected topic{' '}
                <span>
                  {number(selectedIndex)} / {topics.length - 1}
                </span>
              </p>
              <h2>{selected.name}</h2>
            </div>
            <div className="step-controls">
              <button type="button" onClick={() => moveSelection(-1)}>
                <span aria-hidden="true">←</span> Previous
              </button>
              <button type="button" onClick={() => moveSelection(1)}>
                Next <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>

          <section
            className="board-panel panel"
            id="hardware-board-view"
            aria-labelledby="hardware-board-heading"
          >
            <header className="board-header">
              <h2 id="hardware-board-heading">GB200 board</h2>
              <span className="board-view-label">Top view</span>
            </header>
            <div className="board-stage">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={viewBox}
                role="group"
                aria-label={isIntroduction ? 'GB200 board overview' : 'Interactive GB200 board'}
                className="hardware-board"
              >
                <g
                  className="board-artwork"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: boardMarkup }}
                />
                {!isIntroduction &&
                  topics.map((topic, index) => {
                    if (!topic.regions.length) return null;
                    const isSelected = index === selectedIndex;
                    const select = () => setSelectedIndex(index);

                    return (
                      <g
                        key={topic.id}
                        className="hotspot"
                        role="button"
                        tabIndex={0}
                        aria-label={topic.name}
                        aria-pressed={isSelected}
                        style={{ '--topic-color': topic.color } as CSSProperties}
                        onClick={select}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            select();
                          }
                        }}
                      >
                        {topic.regions.map((region, regionIndex) => (
                          <rect key={regionIndex} className="hotspot-region" {...region} />
                        ))}
                        {topic.paths?.map((path) => (
                          <Fragment key={path}>
                            <path className="hotspot-path-hit" d={path} />
                            <path className="hotspot-path" d={path} />
                          </Fragment>
                        ))}
                      </g>
                    );
                  })}
              </svg>
            </div>
          </section>

          <nav className="topics panel" aria-labelledby="hardware-topics-heading">
            <header className="topics-header">
              <h2 id="hardware-topics-heading">Hardware topics</h2>
              <a className="board-jump" href="#hardware-board-view">
                Board ↑
              </a>
            </header>
            <ol>
              {topics.map((topic, index) => (
                <li key={topic.id}>
                  <button
                    type="button"
                    aria-pressed={index === selectedIndex}
                    onClick={() => setSelectedIndex(index)}
                    style={{ '--topic-color': topic.color } as CSSProperties}
                  >
                    <span className="topic-number" aria-hidden="true">
                      {number(index)}
                    </span>
                    <span>{topic.name}</span>
                    <span className="topic-dot" aria-hidden="true" />
                  </button>
                  {index === selectedIndex && !isPhone && (
                    <div className="topic-audio-slot">
                      <NarrationPlayer key={topic.id} audioUrl={topic.audioUrl} />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {isPhone && (
          <div className="floating-audio" role="region" aria-label="Topic narration">
            <p className="floating-audio-label">
              <span className="topic-number">{number(selectedIndex)}</span> {selected.name}
            </p>
            <NarrationPlayer key={selected.id} audioUrl={selected.audioUrl} />
          </div>
        )}
      </div>
    </section>
  );
}
