// src/components/CardLayoutControls.tsx
import React, { useState, useEffect } from 'react';
import { Star, ChevronUp, ChevronDown } from 'lucide-react';
import { 
  isCardPinned, 
  togglePinCard, 
  moveCard, 
  subscribeCardLayout,
  getEffectiveSectionCardOrder,
  type DashboardSection 
} from '../utils/cardLayoutPreferences';

interface CardLayoutControlsProps {
  cardId: string;
  section: DashboardSection;
  isEditMode?: boolean;
  onToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  style?: React.CSSProperties;
}

export const CardLayoutControls: React.FC<CardLayoutControlsProps> = ({
  cardId,
  section,
  isEditMode = false,
  onToast,
  style
}) => {
  const [pinned, setPinned] = useState<boolean>(() => isCardPinned(cardId));
  const [isStarHovered, setIsStarHovered] = useState(false);
  const [isUpHovered, setIsUpHovered] = useState(false);
  const [isDownHovered, setIsDownHovered] = useState(false);

  // Sync state whenever card layout changes in storage or across components
  useEffect(() => {
    setPinned(isCardPinned(cardId));
    return subscribeCardLayout(() => {
      setPinned(isCardPinned(cardId));
    });
  }, [cardId]);

  // Hide completely when edit mode is not active
  if (!isEditMode) {
    return null;
  }

  const handleTogglePin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newPinned = togglePinCard(cardId);
    setPinned(newPinned);
    if (onToast) {
      onToast(newPinned ? 'Card pinned to top priority!' : 'Card unpinned from priority.', 'info');
    }
  };

  const handleMove = (e: React.MouseEvent, direction: 'up' | 'down') => {
    e.preventDefault();
    e.stopPropagation();
    moveCard(section, cardId, direction);
    if (onToast) {
      onToast(`Moved card ${direction}.`, 'info');
    }
  };

  const orderList = getEffectiveSectionCardOrder(section);
  const cardIndex = orderList.indexOf(cardId);
  const isFirst = cardIndex === 0;
  const isLast = cardIndex >= 0 && cardIndex === orderList.length - 1;

  return (
    <div
      className="card-layout-controls"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        userSelect: 'none',
        ...style
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Pin / Star Priority Button */}
      <button
        type="button"
        onClick={handleTogglePin}
        onMouseEnter={() => setIsStarHovered(true)}
        onMouseLeave={() => setIsStarHovered(false)}
        title={pinned ? 'Unpin from priority top' : 'Star & pin card to section top priority'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.28rem',
          padding: pinned ? '0.15rem 0.5rem' : '0.15rem 0.45rem',
          fontSize: '0.68rem',
          fontWeight: 700,
          borderRadius: '9999px',
          border: pinned
            ? '1px solid rgba(245, 158, 11, 0.55)'
            : isStarHovered
            ? '1px solid rgba(245, 158, 11, 0.4)'
            : '1px solid var(--border-color)',
          backgroundColor: pinned
            ? 'rgba(245, 158, 11, 0.15)'
            : isStarHovered
            ? 'rgba(245, 158, 11, 0.08)'
            : 'var(--bg-app)',
          color: pinned || isStarHovered ? '#f59e0b' : 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: pinned ? '0 0 6px rgba(245, 158, 11, 0.25)' : 'none'
        }}
      >
        <Star
          size={12}
          fill={pinned ? '#f59e0b' : isStarHovered ? 'rgba(245, 158, 11, 0.3)' : 'none'}
          stroke={pinned || isStarHovered ? '#f59e0b' : 'currentColor'}
          strokeWidth={pinned ? 1 : 1.75}
        />
        <span>{pinned ? 'Pinned' : 'Pin'}</span>
      </button>

      {/* Edit Mode Reordering Arrows */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '0.15rem' }}>
        <button
          type="button"
          onClick={(e) => handleMove(e, 'up')}
          onMouseEnter={() => setIsUpHovered(true)}
          onMouseLeave={() => setIsUpHovered(false)}
          disabled={isFirst}
          title={isFirst ? 'Already at top' : 'Move Card Up'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            border: !isFirst && isUpHovered ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            backgroundColor: !isFirst && isUpHovered ? 'var(--bg-surface)' : 'var(--bg-app)',
            color: isFirst ? 'var(--text-muted)' : isUpHovered ? 'var(--primary)' : 'var(--text-secondary)',
            cursor: isFirst ? 'not-allowed' : 'pointer',
            opacity: isFirst ? 0.4 : 1,
            padding: 0,
            transition: 'all 0.12s ease'
          }}
        >
          <ChevronUp size={13} />
        </button>
        <button
          type="button"
          onClick={(e) => handleMove(e, 'down')}
          onMouseEnter={() => setIsDownHovered(true)}
          onMouseLeave={() => setIsDownHovered(false)}
          disabled={isLast}
          title={isLast ? 'Already at bottom' : 'Move Card Down'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            border: !isLast && isDownHovered ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            backgroundColor: !isLast && isDownHovered ? 'var(--bg-surface)' : 'var(--bg-app)',
            color: isLast ? 'var(--text-muted)' : isDownHovered ? 'var(--primary)' : 'var(--text-secondary)',
            cursor: isLast ? 'not-allowed' : 'pointer',
            opacity: isLast ? 0.4 : 1,
            padding: 0,
            transition: 'all 0.12s ease'
          }}
        >
          <ChevronDown size={13} />
        </button>
      </div>
    </div>
  );
};

export default CardLayoutControls;
