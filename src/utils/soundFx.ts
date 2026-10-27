/**
 * Pure Web Audio API synthetic micro-sound engine.
 * 100% client-side, zero external audio asset dependencies, ultra-low latency.
 * Designed to be subtle, soft, tactile, and non-intrusive.
 */

const SOUND_STORAGE_KEY = 'peer_sound_enabled';

// Listeners for sound state updates across components
type SoundListener = (enabled: boolean) => void;
const soundListeners = new Set<SoundListener>();

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Checks whether tactile sounds are enabled in user preferences.
 */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
}

/**
 * Toggles tactile sound enabled state and notifies all subscribers.
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
  soundListeners.forEach(listener => listener(enabled));
  if (enabled) {
    playSoftClick();
  }
}

/**
 * Toggles sound state and returns new value.
 */
export function toggleSound(): boolean {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  return next;
}

/**
 * Subscribes a callback to sound enable/disable state changes.
 */
export function subscribeSound(listener: SoundListener): () => void {
  soundListeners.add(listener);
  return () => {
    soundListeners.delete(listener);
  };
}

/**
 * Plays a very subtle tactile click (e.g. for expanding/collapsing sections, toggling views).
 * Envelope: ~14ms, soft low-pass filtered click.
 */
export function playSoftClick(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.014);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.014);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.015);
  } catch {
    // Gracefully handle browser autoplay blocks
  }
}

/**
 * Plays a gentle organic pop (e.g. for assigning a student to a team or dragging/dropping).
 * Envelope: ~38ms, warm pitch drop from 380Hz down to 180Hz.
 */
export function playPop(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(170, now + 0.038);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Graceful silence on error
  }
}

/**
 * Plays a crisp, cheerful harmonic chime (e.g. on export completion, saving grading scales, or applying groups).
 * Envelope: ~280ms, gentle two-tone harmonic resonance (A5 880Hz + E6 1320Hz).
 */
export function playChime(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 880, vol: 0.05, duration: 0.26 },  // A5 fundamental
      { freq: 1318.5, vol: 0.04, duration: 0.28 }, // E6 harmonic fifth
      { freq: 1760, vol: 0.02, duration: 0.22 }   // A6 gentle shimmer
    ];

    notes.forEach(({ freq, vol, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.01);
    });
  } catch {
    // Graceful silence on error
  }
}
