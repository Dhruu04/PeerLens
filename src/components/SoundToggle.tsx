import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, toggleSound, subscribeSound } from '../utils/soundFx';

interface SoundToggleProps {
  compact?: boolean;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ compact = false }) => {
  const [enabled, setEnabled] = useState<boolean>(() => isSoundEnabled());

  useEffect(() => {
    const unsubscribe = subscribeSound((newState) => {
      setEnabled(newState);
    });
    return unsubscribe;
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSound();
  };

  return (
    <div
      className="sound-toggle-wrapper"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0
      }}
    >
      <button
        type="button"
        className="dock-btn theme-toggle-btn"
        onClick={handleToggle}
        title={enabled ? 'Tactile Sounds: On (Click to mute)' : 'Tactile Sounds: Muted (Click to enable)'}
        aria-label={enabled ? 'Mute tactile micro-sounds' : 'Enable tactile micro-sounds'}
        style={{
          height: compact ? '28px' : '32px',
          padding: compact ? '0 0.5rem' : '0 0.65rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.35rem',
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid var(--border-color)',
          backgroundColor: enabled ? 'var(--bg-surface)' : 'var(--bg-app)',
          color: enabled ? 'var(--primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        {enabled ? (
          <Volume2 size={compact ? 13 : 15} style={{ color: 'var(--primary)' }} />
        ) : (
          <VolumeX size={compact ? 13 : 15} style={{ color: 'var(--text-muted)' }} />
        )}
        {!compact && (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {enabled ? 'Audio' : 'Muted'}
          </span>
        )}
      </button>
    </div>
  );
};
