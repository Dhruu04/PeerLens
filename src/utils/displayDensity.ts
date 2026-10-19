// src/utils/displayDensity.ts
// Display Density Engine for PeerLens
// Compact: Dense tables & condensed rows for reviewing 100+ students on a laptop
// Balanced: Standard modern aesthetic
// Spacious: High-visibility typography and larger touch targets for iPads & presentation podiums

export type DisplayDensity = 'compact' | 'balanced' | 'spacious';

const STORAGE_KEY = 'peerlens_display_density_v1';
const EVENT_NAME = 'peerlens_density_changed';

export function getDisplayDensity(): DisplayDensity {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'compact' || saved === 'balanced' || saved === 'spacious') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'balanced';
}

export function setDisplayDensity(density: DisplayDensity): void {
  try {
    localStorage.setItem(STORAGE_KEY, density);
  } catch {
    // ignore
  }
  applyDisplayDensity(density);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { density } }));
}

export function applyDisplayDensity(density: DisplayDensity): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-density', density);
    document.body.classList.remove('density-compact', 'density-balanced', 'density-spacious');
    document.body.classList.add(`density-${density}`);
  }
}

export const DENSITY_DETAILS: Record<DisplayDensity, { label: string; sublabel: string; description: string }> = {
  compact: {
    label: 'Compact',
    sublabel: 'Dense tables & cards',
    description: 'High information density — viewing 2.5x more students on screen without scrolling.'
  },
  balanced: {
    label: 'Balanced',
    sublabel: 'Standard modern aesthetic',
    description: 'Optimal desktop aesthetic with balanced readability and whitespace.'
  },
  spacious: {
    label: 'Spacious',
    sublabel: 'Touch & podium mode',
    description: 'High-visibility typography & large touch targets for tablets and lecture podiums.'
  }
};

export function initDisplayDensity(): DisplayDensity {
  const density = getDisplayDensity();
  applyDisplayDensity(density);
  return density;
}

export function subscribeDisplayDensity(callback: (density: DisplayDensity) => void): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<{ density: DisplayDensity }>;
    if (customEvent.detail && customEvent.detail.density) {
      callback(customEvent.detail.density);
    } else {
      callback(getDisplayDensity());
    }
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      callback(getDisplayDensity());
    }
  });
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
  };
}

// Auto-initialize immediately on module evaluation in browser
if (typeof document !== 'undefined') {
  try {
    initDisplayDensity();
  } catch {}
}
