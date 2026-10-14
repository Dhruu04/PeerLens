/**
 * Global Background Scroll Lock Manager
 * Ensures that whenever any secondary window, modal overlay, or dialog is active,
 * background page scrolling (on document.body and document.documentElement) is strictly disabled.
 */

export function isAnySecondaryWindowOpen(): boolean {
  if (typeof document === 'undefined') return false;
  return !!document.querySelector(
    '.modal-overlay, [role="dialog"], .interactive-tour-overlay, [data-modal-open="true"]'
  );
}

export function syncBackgroundScrollLock(): void {
  if (typeof document === 'undefined') return;

  const hasSecondaryWindow = isAnySecondaryWindowOpen();
  
  if (hasSecondaryWindow) {
    if (!document.body.classList.contains('modal-open')) {
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  } else {
    if (document.body.classList.contains('modal-open')) {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }
}

/**
 * Initializes global mutation observer and touch/wheel trap for background scrolling
 */
export function initGlobalScrollLock(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  // Initial check
  syncBackgroundScrollLock();

  // MutationObserver to automatically detect when modals are mounted/unmounted via Portals
  const observer = new MutationObserver(() => {
    syncBackgroundScrollLock();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'role']
  });

  // Prevent background wheel scrolling when mouse is over backdrop overlay
  const handleWheel = (e: WheelEvent) => {
    if (!isAnySecondaryWindowOpen()) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    
    // If wheel event happened directly on the backdrop overlay itself
    if (target.classList.contains('modal-overlay') || target.classList.contains('interactive-tour-overlay')) {
      e.preventDefault();
    }
  };

  window.addEventListener('wheel', handleWheel, { passive: false });

  return () => {
    observer.disconnect();
    window.removeEventListener('wheel', handleWheel);
    syncBackgroundScrollLock();
  };
}
