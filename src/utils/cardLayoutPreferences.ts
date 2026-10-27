// src/utils/cardLayoutPreferences.ts
// Card Reordering & Pinned Priority Cards Engine for Sections 1, 2, and 3
// Allows professors to star/pin cards to the top and reorder them within each section.

export type DashboardSection = 'section1' | 'section2' | 'section3';

export interface CardMeta {
  id: string;
  title: string;
  defaultIndex: number;
}

export const SECTION1_DEFAULT_CARDS: CardMeta[] = [
  { id: 'showSelfEnrollmentCard', title: 'Live QR & Self-Enrollment', defaultIndex: 0 },
  { id: 'showQuickActionsCard', title: 'Quick Roster Management', defaultIndex: 1 },
  { id: 'showImportWizardCard', title: 'CSV / Excel Import Studio', defaultIndex: 2 },
  { id: 'showAutoGroupStudio', title: 'AutoGroup Studio (Balance & Diversity)', defaultIndex: 3 },
  { id: 'showTeamKickoffAndRoles', title: 'Team Kickoff, Icebreakers & Roles', defaultIndex: 4 },
  { id: 'showRosterTable', title: 'Student Roster & QuickLook HUD', defaultIndex: 5 },
  { id: 'showTeamOverviewCards', title: 'Team Cohorts Overview', defaultIndex: 6 }
];

export const SECTION2_DEFAULT_CARDS: CardMeta[] = [
  { id: 'showCriterionCards', title: 'Evaluation Rubric & Scales Studio', defaultIndex: 0 },
  { id: 'showEvaluationFormControls', title: 'Student Form Controls & Custom Questions', defaultIndex: 1 },
  { id: 'showTeamHealthPulse', title: 'Team Health Pulse Check-ins', defaultIndex: 2 },
  { id: 'showLivePresentationScoring', title: 'Live Presentation Scoring Cockpit', defaultIndex: 3 }
];

export const SECTION3_DEFAULT_CARDS: CardMeta[] = [
  { id: 'showResultsHeaderCard', title: 'Results Summary & Action Controls', defaultIndex: 0 },
  { id: 'showResultsSummarySheet', title: 'Results Summary Sheet & Gradebook', defaultIndex: 1 },
  { id: 'showLmsExport', title: 'Who-Rated-Whom Matrix & LMS Export', defaultIndex: 2 }
];

const STORAGE_KEY = 'peerlens_card_layout_v2';
const EVENT_NAME = 'peerlens_card_layout_changed';

export interface StoredCardLayout {
  section1: string[];
  section2: string[];
  section3: string[];
  pinned: string[];
}

function getDefaultLayout(): StoredCardLayout {
  return {
    section1: SECTION1_DEFAULT_CARDS.map(c => c.id),
    section2: SECTION2_DEFAULT_CARDS.map(c => c.id),
    section3: SECTION3_DEFAULT_CARDS.map(c => c.id),
    pinned: []
  };
}

export function getStoredLayout(): StoredCardLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultLayout();
    const parsed = JSON.parse(raw);
    return {
      section1: Array.isArray(parsed.section1) ? parsed.section1 : SECTION1_DEFAULT_CARDS.map(c => c.id),
      section2: Array.isArray(parsed.section2) ? parsed.section2 : SECTION2_DEFAULT_CARDS.map(c => c.id),
      section3: Array.isArray(parsed.section3) ? parsed.section3 : SECTION3_DEFAULT_CARDS.map(c => c.id),
      pinned: Array.isArray(parsed.pinned) ? parsed.pinned : []
    };
  } catch {
    return getDefaultLayout();
  }
}

function saveStoredLayout(layout: StoredCardLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: layout }));
}

/**
 * Returns the cards for a section in effective visual order.
 * Pinned cards float to the top; remaining cards follow in their user-ordered sequence.
 */
export function getEffectiveSectionCardOrder(section: DashboardSection): string[] {
  const layout = getStoredLayout();
  const rawList = layout[section] || [];
  const defaultList = section === 'section1'
    ? SECTION1_DEFAULT_CARDS.map(c => c.id)
    : section === 'section2'
    ? SECTION2_DEFAULT_CARDS.map(c => c.id)
    : SECTION3_DEFAULT_CARDS.map(c => c.id);

  // Ensure all known cards are included
  const combined = [...rawList];
  defaultList.forEach(id => {
    if (!combined.includes(id)) combined.push(id);
  });

  const pinnedSet = new Set(layout.pinned || []);
  // Maintain pinned cards in priority order based on layout.pinned
  const pinnedCards: string[] = [];
  (layout.pinned || []).forEach(id => {
    if (combined.includes(id) && !pinnedCards.includes(id)) {
      pinnedCards.push(id);
    }
  });
  const unpinnedCards = combined.filter(id => !pinnedSet.has(id));

  return [...pinnedCards, ...unpinnedCards];
}

/**
 * Returns an integer CSS order for a card within its section container.
 * 1-indexed to stay positive.
 */
export function getCardVisualOrder(section: DashboardSection, cardId: string): number {
  const orderList = getEffectiveSectionCardOrder(section);
  const idx = orderList.indexOf(cardId);
  return idx >= 0 ? idx + 1 : 99;
}

/**
 * In Section 1, the top 3 cards (Self-Enrollment, Quick Actions, Import Studio)
 * are housed in a top grid row. This helper computes the effective order for that row.
 */
export function getSection1TopRowOrder(): number {
  const o1 = getCardVisualOrder('section1', 'showSelfEnrollmentCard');
  const o2 = getCardVisualOrder('section1', 'showQuickActionsCard');
  const o3 = getCardVisualOrder('section1', 'showImportWizardCard');
  return Math.min(o1, o2, o3);
}

export function isCardPinned(cardId: string): boolean {
  const layout = getStoredLayout();
  return (layout.pinned || []).includes(cardId);
}

export function togglePinCard(cardId: string): boolean {
  const layout = getStoredLayout();
  const isPinned = (layout.pinned || []).includes(cardId);
  if (isPinned) {
    layout.pinned = (layout.pinned || []).filter(id => id !== cardId);
  } else {
    // Put newly pinned card at top of priority list
    layout.pinned = [cardId, ...(layout.pinned || []).filter(id => id !== cardId)];
  }
  saveStoredLayout(layout);
  return !isPinned;
}

export function moveCard(section: DashboardSection, cardId: string, direction: 'up' | 'down'): void {
  const layout = getStoredLayout();
  const currentList = [...getEffectiveSectionCardOrder(section)];
  const idx = currentList.indexOf(cardId);
  if (idx < 0) return;

  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= currentList.length) return;

  const targetId = currentList[targetIdx];

  // Swap elements
  currentList[idx] = targetId;
  currentList[targetIdx] = cardId;

  // Sync pinned list if moving across pinned boundary
  const isCardPinnedNow = (layout.pinned || []).includes(cardId);
  const isTargetPinned = (layout.pinned || []).includes(targetId);

  if (isCardPinnedNow && isTargetPinned) {
    const pIdx = (layout.pinned || []).indexOf(cardId);
    const pTargetIdx = (layout.pinned || []).indexOf(targetId);
    if (pIdx >= 0 && pTargetIdx >= 0) {
      layout.pinned[pIdx] = targetId;
      layout.pinned[pTargetIdx] = cardId;
    }
  } else if (isCardPinnedNow && !isTargetPinned && direction === 'down') {
    layout.pinned = (layout.pinned || []).filter(id => id !== cardId);
  } else if (!isCardPinnedNow && isTargetPinned && direction === 'up') {
    layout.pinned = [...(layout.pinned || []), cardId];
  }

  layout[section] = currentList;
  saveStoredLayout(layout);
}

export function resetSectionCardOrder(section: DashboardSection): void {
  const layout = getStoredLayout();
  const defaultList = section === 'section1'
    ? SECTION1_DEFAULT_CARDS.map(c => c.id)
    : section === 'section2'
    ? SECTION2_DEFAULT_CARDS.map(c => c.id)
    : SECTION3_DEFAULT_CARDS.map(c => c.id);

  layout[section] = defaultList;
  // unpin cards belonging to this section
  layout.pinned = (layout.pinned || []).filter(id => !defaultList.includes(id));
  saveStoredLayout(layout);
}

/**
 * Resets all sections (section1, section2, section3) back to default card orders
 * and unpins all priority cards across the entire application.
 */
export function resetAllCardLayouts(): StoredCardLayout {
  const defaultLayout = getDefaultLayout();
  saveStoredLayout(defaultLayout);
  return defaultLayout;
}

/**
 * Applies a custom card arrangement and pinned card list across all sections.
 */
export function applyCardLayout(layout: {
  section1?: string[];
  section2?: string[];
  section3?: string[];
  pinned?: string[];
}): StoredCardLayout {
  const current = getStoredLayout();
  const next: StoredCardLayout = {
    section1: layout.section1 && Array.isArray(layout.section1) ? [...layout.section1] : current.section1,
    section2: layout.section2 && Array.isArray(layout.section2) ? [...layout.section2] : current.section2,
    section3: layout.section3 && Array.isArray(layout.section3) ? [...layout.section3] : current.section3,
    pinned: layout.pinned && Array.isArray(layout.pinned) ? [...layout.pinned] : []
  };
  saveStoredLayout(next);
  return next;
}

export function subscribeCardLayout(callback: (layout: StoredCardLayout) => void): () => void {
  const handler = () => {
    callback(getStoredLayout());
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) callback(getStoredLayout());
  });
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
  };
}
