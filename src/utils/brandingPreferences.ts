// src/utils/brandingPreferences.ts
// Institutional Branding & Custom Header Preferences for PeerLens
// Allows professors to customize institution logo, course badge, term banner, and header visibility.

export type BadgeColorTheme = 'indigo' | 'emerald' | 'teal' | 'sky' | 'amber' | 'rose' | 'violet' | 'slate';
export type BadgeIconType = 'graduation' | 'book' | 'code' | 'cpu' | 'atom' | 'briefcase' | 'award' | 'compass';
export type TermIconType = 'calendar' | 'clock' | 'sparkles' | 'tag';
export type LogoShape = 'rounded' | 'square' | 'circle';

export interface InstitutionalBranding {
  institutionName: string;
  institutionLogo: string; // Base64 data:image or SVG preset
  courseBadge: string;     // e.g. "CS-301: Senior Capstone"
  termBanner: string;      // e.g. "Fall 2026"
  isCustomized: boolean;
  showInHeader: boolean;   // Togglable view/hide button state, hidden by default (false)!
  badgeColor?: BadgeColorTheme;
  badgeIcon?: BadgeIconType;
  termIcon?: TermIconType;
  logoShape?: LogoShape;
}

const STORAGE_KEY_PREFIX = 'peerlens_branding_v1_';
const GLOBAL_STORAGE_KEY = 'peerlens_branding_global_v1';
const EVENT_NAME = 'peerlens_branding_changed';

export const DEFAULT_BRANDING: InstitutionalBranding = {
  institutionName: '',
  institutionLogo: '',
  courseBadge: 'CS-301: Senior Capstone',
  termBanner: 'Fall 2026',
  isCustomized: false,
  showInHeader: false, // Hidden by default as requested!
  badgeColor: 'indigo',
  badgeIcon: 'graduation',
  termIcon: 'calendar',
  logoShape: 'rounded'
};

export const BADGE_COLOR_THEMES: Record<BadgeColorTheme, { name: string; bg: string; text: string; border: string }> = {
  indigo: { name: 'Indigo', bg: 'rgba(99, 102, 241, 0.12)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.28)' },
  emerald: { name: 'Emerald', bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.28)' },
  teal: { name: 'Teal', bg: 'rgba(20, 184, 166, 0.12)', text: '#0d9488', border: 'rgba(20, 184, 166, 0.28)' },
  sky: { name: 'Sky Blue', bg: 'rgba(14, 165, 233, 0.12)', text: '#0284c7', border: 'rgba(14, 165, 233, 0.28)' },
  amber: { name: 'Amber', bg: 'rgba(245, 158, 11, 0.12)', text: '#d97706', border: 'rgba(245, 158, 11, 0.28)' },
  rose: { name: 'Rose', bg: 'rgba(244, 63, 94, 0.12)', text: '#e11d48', border: 'rgba(244, 63, 94, 0.28)' },
  violet: { name: 'Violet', bg: 'rgba(139, 92, 246, 0.12)', text: '#7c3aed', border: 'rgba(139, 92, 246, 0.28)' },
  slate: { name: 'Slate', bg: 'rgba(100, 116, 139, 0.12)', text: '#475569', border: 'rgba(100, 116, 139, 0.28)' }
};

// Curated SVG Preset Logos for instant 1-click branding (zero emojis, pure modern vectors)
export const BRANDING_PRESETS = [
  {
    id: 'shield_crest',
    name: 'Academic Crest',
    category: 'University',
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%234f46e5"/><path d="M50 20 L75 32 V52 C75 68 50 82 50 82 C50 82 25 68 25 52 V32 Z" fill="white" opacity="0.95"/><path d="M50 28 L68 37 V50 C68 62 50 73 50 73 C50 73 32 62 32 50 V37 Z" fill="%234f46e5"/><polygon points="50,38 53,46 62,46 55,51 58,59 50,54 42,59 45,51 38,46 47,46" fill="white"/></svg>`
  },
  {
    id: 'tech_atom',
    name: 'Tech & Engineering',
    category: 'STEM',
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%230f766e"/><circle cx="50" cy="50" r="10" fill="white"/><ellipse cx="50" cy="50" rx="35" ry="14" fill="none" stroke="white" stroke-width="4" transform="rotate(30 50 50)"/><ellipse cx="50" cy="50" rx="35" ry="14" fill="none" stroke="white" stroke-width="4" transform="rotate(-30 50 50)"/><ellipse cx="50" cy="50" rx="35" ry="14" fill="none" stroke="white" stroke-width="4" transform="rotate(90 50 50)"/></svg>`
  },
  {
    id: 'torch_learning',
    name: 'Torch of Knowledge',
    category: 'Liberal Arts',
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23d97706"/><path d="M44 55 L40 85 H60 L56 55 Z" fill="white"/><path d="M50 18 C40 32 60 38 45 52 C58 50 62 38 58 32 C65 24 55 18 50 18 Z" fill="white"/><circle cx="50" cy="42" r="6" fill="%23d97706"/></svg>`
  },
  {
    id: 'global_globe',
    name: 'Global Academy',
    category: 'International',
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%232563eb"/><circle cx="50" cy="50" r="30" fill="none" stroke="white" stroke-width="5"/><ellipse cx="50" cy="50" rx="14" ry="30" fill="none" stroke="white" stroke-width="4"/><line x1="20" y1="50" x2="80" y2="50" stroke="white" stroke-width="4"/><line x1="24" y1="36" x2="76" y2="36" stroke="white" stroke-width="3"/><line x1="24" y1="64" x2="76" y2="64" stroke="white" stroke-width="3"/></svg>`
  },
  {
    id: 'business_pillar',
    name: 'Business & Management',
    category: 'Commerce',
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23047857"/><polygon points="20,32 50,16 80,32" fill="white"/><rect x="22" y="32" width="56" height="6" fill="white"/><rect x="27" y="40" width="8" height="34" fill="white"/><rect x="46" y="40" width="8" height="34" fill="white"/><rect x="65" y="40" width="8" height="34" fill="white"/><rect x="20" y="76" width="60" height="8" rx="2" fill="white"/></svg>`
  },
  {
    id: 'law_scales',
    name: 'Law & Governance',
    category: 'Social Sciences',
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%237c3aed"/><line x1="50" y1="20" x2="50" y2="80" stroke="white" stroke-width="5"/><line x1="25" y1="35" x2="75" y2="35" stroke="white" stroke-width="4"/><path d="M25 35 L15 55 H35 Z" fill="none" stroke="white" stroke-width="3"/><path d="M75 35 L65 55 H85 Z" fill="none" stroke="white" stroke-width="3"/><rect x="35" y="78" width="30" height="6" rx="2" fill="white"/></svg>`
  }
];

export function getBranding(classId?: string): InstitutionalBranding {
  try {
    // 1. Try class-specific
    if (classId) {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${classId}`);
      if (saved) {
        return { ...DEFAULT_BRANDING, ...JSON.parse(saved) };
      }
    }
    // 2. Try global
    const globalSaved = localStorage.getItem(GLOBAL_STORAGE_KEY);
    if (globalSaved) {
      return { ...DEFAULT_BRANDING, ...JSON.parse(globalSaved) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_BRANDING;
}

export const loadBrandingPreferences = getBranding;

export function saveBranding(branding: Partial<InstitutionalBranding>, classId?: string): void {
  try {
    const current = getBranding(classId);
    const updated: InstitutionalBranding = {
      ...current,
      ...branding,
      isCustomized: true
    };
    if (classId) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${classId}`, JSON.stringify(updated));
    }
    // Also save as global default for other classes
    localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { classId, branding: updated } }));
  } catch {
    // ignore
  }
}

export function resetBranding(classId?: string): void {
  try {
    if (classId) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${classId}`);
    }
    localStorage.removeItem(GLOBAL_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { classId, branding: DEFAULT_BRANDING } }));
  } catch {
    // ignore
  }
}

export function subscribeBranding(callback: (branding: InstitutionalBranding) => void, classId?: string): () => void {
  const handler = () => {
    callback(getBranding(classId));
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}
