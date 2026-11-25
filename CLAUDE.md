# NVIDIA GB200 site

One Vite + React 19 + TypeScript + Tailwind 3 single-page site, assembled from three separately built sections.

## Commands
- `npm run dev` — dev server (port 5173)
- `npm run typecheck`, `npm run lint`, `npm run build` — run all three before finishing a change

## Structure
- `src/App.tsx` — stacks the sections in order
- `src/components/hero/` — Section 1: animated hero diagram
- `src/components/intro/` — Section 1b: intro video
- `src/config/media.ts` — every externally hosted media URL (ImageKit). Add new ones here, never inline.
- `src/components/inside/` — Section 2: "Inside the Machine" episode list + the software walkthrough (`episode/SoftwareExplorer.tsx`, framer-motion diagram engine in `diagram/`). Wrapped in `.theme-inside`, which scopes its Inter/Newsreader fonts, navy background and heading styles.
- `src/components/hardware/` — Section 3 / Episode 01: interactive GB200 board explainer (TypeScript port). Board SVG is `src/assets/hardware/gb200-board.svg`; topics, hotspot geometry and colors are in `board.ts`; CSS is `hardware.css`, every rule scoped under `.hw-section`. Rendered from `InsideTheMachine` when an episode has `"view": "hardware"` in `episodes.json` (outside `.theme-inside`).
- `src/content/` — `episodes.json` catalog + per-episode `journey.json`; `src/assets/svg/` holds the episode diagrams; `src/lib/episodes.ts` loads them. New episode = SVG + journey.json + catalog entry.
- `src/components/audio/NarrationPlayer.tsx` (+ `narration.css`) — the one shared audio player (Listen/Pause, progress, mute). Sections theme it with `--narration-*` CSS variables. Remount with a new `key` per track so only one plays.
- `src/hooks/`, `src/lib/`, `src/types/` — shared by sections (`usePauseAudioOffscreen` pauses narration when a section scrolls away)
- Import with the `@/` alias (= `src/`), not deep relative paths.

## Integration status
- [x] Section 1: Hero + Intro (from `sec1hero.zip`)
- [x] Section 2: Inside the Machine (from `Sec2hardandsoft.zip`). react-router and supabase dropped (unused).
- [x] Section 3: Hardware explainer (from `Sec3hardware.zip`), now Episode 01. The old placeholder episode 01 and `gb200_board.svg` were deleted. Narration URLs live in `HARDWARE_AUDIO` in `src/config/media.ts`; add a topic's URL there and it shows a player (no URL = "Audio coming soon"). Audio placement is responsive: above 650px wide the player renders inline in the topic list under the selected row; on phones (<=650px) it renders in a `.floating-audio` panel pinned to the bottom of the screen (label + Listen), via `useMediaQuery`. Only one player is ever mounted, so only one track can play; switching topics stops it, and scrolling out of the section pauses it.
- [~] Episode 02 (software/security stack): interface built (`SoftwareExplorer`), step text still placeholder. Navigation is by selection, not scrolling: tap a step on the diagram, tap a row in the list, or Previous/Next; the diagram zooms/pans to the step and can still be swiped sideways. Audio: URLs per journey step id in `SOFTWARE_AUDIO` (`src/config/media.ts`); all steps, the intro (`start`) and the Conclusion have audio. Layout: >=1024px diagram left, step card + list (player inline under selected step) right; below that, diagram pinned to top and a bottom-pinned panel (label, Previous/Next, player). Not built yet: "Play the full story" auto-advance mode.
  - The infographic is the **vertical** SVG `src/assets/svg/Software-Security-AI-Stack-Vertical.svg` (portrait 1000x1480, from the user's `SoftwarestackveriticalNov22.svg`; the only edits are structural wrapper groups so the fade engine works: `User_Input_Group`, `Layer_0N_*`, loop halves and the KV icon moved into their groups, background is a bare root `<rect>`). Journey step -> group/arrow ids are in `journey.json`. The engine's `portrait` layout (`diagramLayout.ts`/`diagramView.ts`) zooms to the selected step(s) and scrolls the frame in both directions; wide screens put the diagram in a sticky left column, phones fit its full width in the pinned top frame.
  - Step list/card styling mirrors the hardware interface: rows are `00`–`08` (Start = 00, steps 01–07, Conclusion = 08) with the number and a tint/outline in the step's colour (`color` in `journey.json`, matching its card in the infographic) when selected; "Selected step 05 / 08" card with a coloured left bar; "Software steps" list header. Narration player accent follows the step colour.
  - Zoom hold: each step zooms in on selection, then steps back to the whole stack (step still lit) once its narration passes `ZOOM_HOLD_SECONDS` (15s) or 55% of a short clip (`ZOOM_HOLD_SHORT_CLIP`); constants at the top of `SoftwareExplorer.tsx`. Driven by `NarrationPlayer`'s `onTime(seconds, duration)` and the step focus's `zoomOut` flag. Seeking back re-zooms; when a clip ends the view stays on the overview until the next step is chosen (or the clip is replayed); steps with no audio stay zoomed.
  - All 7 steps plus the Conclusion (journey id `finish`, shown last in the list, diagram zooms out to the whole stack) have audio. During the Conclusion, Steps 1 and 7 light up while the narration says "the specific safety checkpoints, marked by these two yellow shields": timing is the `CONCLUSION_CUES` list (seconds; also lights Steps 3, 4, 5 for "the computational loop") at the top of `SoftwareExplorer.tsx`, driven by `NarrationPlayer`'s `onTime` prop and the `{ kind: 'steps' }` diagram focus. Timings were derived from pauses in the audio; re-check if the clip is re-recorded.
  - Unused now (left in place, safe to delete once the scroll-driven design is confirmed dropped): `episode/EpisodeView.tsx`, `StepSection.tsx`, `OverviewSections.tsx`, `hooks/useActiveSection.ts`; `journey.json` `layers`/`overview` are no longer displayed.

## "Watch the whole story" (full playthrough)
- `src/components/story/` — `StoryProvider` (context + ONE shared `<audio>` element, so phones that allow the first tap keep allowing later clips), `StoryBar` (the fixed bottom control bar: prev/play-pause/next/Stop, progress, "Skip to software"), `storyContext.ts` (`useStory`).
- Chapters are built in `InsideTheMachine.tsx`: every hardware topic (`topics` in `board.ts`) then every software journey step (`SOFTWARE_AUDIO`); a chapter without a URL is skipped. The button sits above the episode list.
- While the story is active, `HardwareExplainer` and `SoftwareExplorer` take their selected topic/step from `useStory()` and hide their own players and bottom panels (the bar replaces them). Tapping a topic/step during the story jumps there and keeps playing. On Stop the sections keep the last chapter selected.
- Gaps: 0.7s between chapters, 1.6s plus a scroll at the hardware→software handoff. Pauses with a "Paused while you were away" notice if the viewer scrolls completely away from the narrated section (not during the story's own scrolls). If a browser blocks auto-continue, the bar shows "Tap play to continue".
- Software diagram timing (zoom hold, Conclusion cues) is fed from the story's position via the same `onNarrationTime` handler as the step's own player.
- Not built: brief/compressed version (planned), a per-episode Play button.

## Deployment
- AWS Amplify Hosting via `amplify.yml` (Node 22, `npm ci`, `npm run build`, publishes `dist`). Single page, no router, so no rewrite rule is needed. Media is hosted on ImageKit, not in the repo. When zipping the repo for GitHub, leave out `node_modules`, `dist`, `.claude` and the three source `*.zip` archives.

## Rules for adding/merging sections
- Convert plain JS/CSS to TypeScript + Tailwind, or scope its CSS to the section; never add global `*`, `html`, `body` or `:root` rules.
- Strip `<script>` tags from SVGs that are injected via `dangerouslySetInnerHTML`.
- Don't re-add `@supabase/supabase-js` unless a database is actually planned.
- Fonts: Figtree (hero/intro, body default), Inter + Newsreader (`.theme-inside` only), all loaded in `index.html`.
- Section theme colors (`layer-*`, `field`, `ink`, `line`) are CSS variables on `:root` with Tailwind aliases; only used inside `.theme-inside`.

The old `ai_hardware_board_preview_nvlink_c2c_fixed.svg` in `Sec3hardware.zip` was not imported (superseded).

The original zips in this folder are untouched source archives; do not edit them.
