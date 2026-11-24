// All externally hosted media (ImageKit) lives here so URLs are changed in one place.
const IMAGEKIT_BASE = 'https://ik.imagekit.io/a7tech/NVIDIA%20GB200%20AUDIO%20Hardware%20Topics%20Nov%2017%20';

export const INTRO_VIDEO_SRC = `${IMAGEKIT_BASE}/IntrovideostartofsequenceNnov18Small.mp4`;

// Narration for the hardware explainer, keyed by topic id (see src/components/hardware/board.ts).
// All 10 topics now have narration. A topic with no URL would show "Audio coming soon".
const HARDWARE_AUDIO_BASE = `${IMAGEKIT_BASE}`;
export const HARDWARE_AUDIO: Record<string, string> = {
  intro: 'https://ik.imagekit.io/a7tech/00%20Introduction.mp3',
  power: `${HARDWARE_AUDIO_BASE}/01%20Power%20connectors.mp3?updatedAt=1794956080417`,
  firmware: `${HARDWARE_AUDIO_BASE}/Item%2002%20Firmwarebootinitializaton.mp3`,
  mcio: `${HARDWARE_AUDIO_BASE}/Item%2003%20HighspeedMCIO.mp3`,
  grace: `${HARDWARE_AUDIO_BASE}/Item%2004%20Grace%20CPU.mp3`,
  lpddr: `${HARDWARE_AUDIO_BASE}/Item%2005%20LPDDR5X.mp3`,
  c2c: `${HARDWARE_AUDIO_BASE}/Item%2006%20NvlinkC2C.mp3`,
  gpu: `${HARDWARE_AUDIO_BASE}/Item%2007%20BlackwellGPUs.mp3`,
  hbm: `${HARDWARE_AUDIO_BASE}/Item%2008%20HBM3e%20memory.mp3`,
  nvlink: `${HARDWARE_AUDIO_BASE}/Item%2009%20NVLINK.mp3`,
};

// Narration for the software architecture walkthrough, keyed by journey step id
// (see src/content/episodes/software-security-ai-stack/journey.json). Steps without a URL show "Audio coming soon".
export const SOFTWARE_AUDIO: Record<string, string> = {
  start: 'https://ik.imagekit.io/a7tech/SoftwarestackAudio/00%20Intro%20Software.mp3',
  'safety-guardrails': 'https://ik.imagekit.io/a7tech/SoftwarestackAudio/1.%20Safety%20Guardrails%20&%20Moderation.mp3',
  'planning-retrieval-tokenization':
    'https://ik.imagekit.io/a7tech/SoftwarestackAudio/2.%20Planning,%20Retrieval%20&%20Tokenization.mp3',
  'scheduler-batcher': 'https://ik.imagekit.io/a7tech/SoftwarestackAudio/3.%20Schedular%20and%20Batcher.mp3',
  'kv-cache-manager': 'https://ik.imagekit.io/a7tech/SoftwarestackAudio/4.%20KV%20Cache%20Manager.mp3',
  'model-execution': 'https://ik.imagekit.io/a7tech/SoftwarestackAudio/5.%20Model%20Execution%20.mp3',
  'output-processing': 'https://ik.imagekit.io/a7tech/SoftwarestackAudio/6.%20Output%20Processing.mp3',
  'output-safety-delivery': 'https://ik.imagekit.io/a7tech/SoftwarestackAudio/7.%20Output%20Safety&Delivery.mp3',
  // The "finish" step is shown as the Conclusion.
  finish: 'https://ik.imagekit.io/a7tech/SoftwarestackAudio/Conclusion.mp3',
};
