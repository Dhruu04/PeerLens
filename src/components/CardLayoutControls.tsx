// src/components/CardLayoutControls.tsx
import React from 'react';
import { Star, ChevronUp, ChevronDown } from 'lucide-react';
import { 
  isCardPinned, 
  togglePinCard, 
  moveCard, 
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
  const pinned = isCardPinned(cardId);

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPinned = togglePinCard(cardId);
    if (onToast) {
      onToast(newPinned ? 'Card pinned to top priority!' : 'Card unpinned from priority.', 'info');
    }
  };

  const handleMove = (e: React.MouseEvent, direction: 'up' | 'down') => {
    e.stopPropagation();
    moveCard(section, cardId, direction);
    if (onToast) {
      onToast(`Moved card ${direction}.`, 'info');
    }
  };

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
      {/* Pin / Star Button */}
      <button
        type="button"
        onClick={handleTogglePin}
        title={pinned ? 'Unpin from priority top' : 'Star & pin to section top priority'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: pinned ? '0.12rem 0.45rem' : '0.12rem 0.35rem',
          fontSize: '0.68rem',
          fontWeight: 700,
          borderRadius: '9999px',
          border: pinned ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid transparent',
          backgroundColor: pinned ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
          color: pinned ? '#f59e0b' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          if (!pinned) {
            e.currentTarget.style.color = '#f59e0b';
            e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.08)';
          }
        }}
        onMouseLeave={(e) => {
          if (!pinned) {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <Star
          size={12}
          fill={pinned ? '#f59e0b' : 'none'}
          stroke={pinned ? '#f59e0b' : 'currentColor'}
          strokeWidth={pinned ? 1 : 1.75}
        />
        {pinned && <span>Pinned Priority</span>}
      </button>

      {/* Edit Mode Reordering Arrows */}
      {isEditMode && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '0.2rem' }}>
          <button
            type="button"
            onClick={(e) => handleMove(e, 'up')}
            title="Move Card Up"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.backgroundColor = 'var(--bg-app)';
            }}
          >
            <ChevronUp size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => handleMove(e, 'down')}
            title="Move Card Down"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.backgroundColor = 'var(--bg-app)';
            }}
          >
            <ChevronDown size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CardLayoutControls;
