import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, Sparkles, BookOpen, Lightbulb, Compass, Award, Calculator } from 'lucide-react';
import { FEATURE_INFO_REGISTRY, type FeatureInfoItem } from '../data/featureDescriptions';

interface FeatureInfoButtonProps {
  featureId?: string;
  customInfo?: Partial<FeatureInfoItem>;
  placement?: 'inline' | 'top-right' | 'card-corner';
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
  buttonClassName?: string;
  tooltipText?: string;
}

/** Minimalist, ultra-crisp vector Info glyph */
const MinimalInfoGlyph: React.FC<{ size?: number }> = ({ size = 13 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block', flexShrink: 0 }}
  >
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
    <circle cx="8" cy="4.75" r="0.9" fill="currentColor" />
    <path d="M8 7.25V11.5M6.8 11.5H9.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const FeatureInfoButton: React.FC<FeatureInfoButtonProps> = ({
  featureId,
  customInfo,
  placement = 'inline',
  size = 'sm',
  style,
  buttonClassName = '',
  tooltipText = 'Feature Guide & How to Use'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Retrieve info from registry or custom fallback
  const registeredInfo = featureId ? FEATURE_INFO_REGISTRY[featureId] : null;
  const info: FeatureInfoItem = {
    id: featureId || customInfo?.id || 'feature-info',
    title: customInfo?.title || registeredInfo?.title || 'Feature Information',
    category: customInfo?.category || registeredInfo?.category || 'Algorithm',
    summary: customInfo?.summary || registeredInfo?.summary || 'Learn how to get the most out of this tool.',
    whatItDoes: customInfo?.whatItDoes || registeredInfo?.whatItDoes || 'Provides actionable insights and streamlined workflow management.',
    whatToDo: customInfo?.whatToDo || registeredInfo?.whatToDo || [
      'Interact with the controls shown in this section.',
      'Review real-time calculations and updates.',
      'Export or save results when finished.'
    ],
    whatYouGet: customInfo?.whatYouGet || registeredInfo?.whatYouGet || [
      'Automated, error-free results.',
      'Clear, defensible academic metrics.'
    ],
    formula: customInfo?.formula || registeredInfo?.formula,
    proTip: customInfo?.proTip || registeredInfo?.proTip
  };

  // Strict universal scroll locking (body, html, touchAction)
  useEffect(() => {
    if (isOpen) {
      const origBodyOverflow = document.body.style.overflow;
      const origDocOverflow = document.documentElement.style.overflow;
      const origTouchAction = document.body.style.touchAction;
      const origPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = origBodyOverflow;
        document.documentElement.style.overflow = origDocOverflow;
        document.body.style.touchAction = origTouchAction;
        document.body.style.paddingRight = origPaddingRight;
      };
    }
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const btnDiameter = size === 'sm' ? 20 : 24;
  const iconPixel = size === 'sm' ? 12 : 14;

  const placementStyle: React.CSSProperties = placement === 'top-right' || placement === 'card-corner'
    ? {
        position: 'absolute',
        top: '0.75rem',
        right: '0.75rem',
        zIndex: 10
      }
    : {
        display: 'inline-flex',
        verticalAlign: 'middle',
        marginLeft: '0.4rem',
        flexShrink: 0
      };

  // Dynamically resolve target element for portal (supports Fullscreen element, body, or active container)
  const getPortalTarget = (): HTMLElement => {
    if (typeof document === 'undefined') return null as unknown as HTMLElement;
    return (document.fullscreenElement as HTMLElement) || document.body;
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`feature-info-trigger-btn ${buttonClassName}`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(true);
        }}
        title={tooltipText}
        aria-label={`Guide: ${info.title}`}
        style={{
          ...placementStyle,
          width: `${btnDiameter}px`,
          height: `${btnDiameter}px`,
          minWidth: `${btnDiameter}px`,
          minHeight: `${btnDiameter}px`,
          borderRadius: '50%',
          border: '1px solid var(--border-color, rgba(148, 163, 184, 0.4))',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          color: 'var(--text-secondary, #64748b)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          userSelect: 'none',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
          ...style
        }}
      >
        <MinimalInfoGlyph size={iconPixel} />
      </button>

      {/* Info Dialog Portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="modal-overlay" 
          style={{ 
            animation: 'fadeIn 160ms ease', 
            zIndex: 999999, 
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            position: 'fixed',
            inset: 0
          }} 
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div 
            ref={modalRef}
            className="modal-content" 
            style={{ 
              maxWidth: '560px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              border: '1px solid var(--border-color, #e2e8f0)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              animation: 'scaleIn 180ms cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              style={{ 
                padding: '1.25rem 1.4rem', 
                borderBottom: '1px solid var(--border-color, #e2e8f0)', 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-app, #f8fafc)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '10px', 
                    backgroundColor: 'rgba(99, 102, 241, 0.12)', 
                    color: 'var(--primary, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Sparkles size={19} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.01em' }}>
                      {info.title}
                    </h3>
                    <span 
                      className="badge badge-primary" 
                      style={{ 
                        fontSize: '0.68rem', 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '20px',
                        fontWeight: 700 
                      }}
                    >
                      {info.category}
                    </span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                    {info.summary}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 120ms ease'
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* Section 1: What It Does & Why It Matters */}
              <div 
                style={{ 
                  backgroundColor: 'var(--bg-app, #f8fafc)', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color, #e2e8f0)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <BookOpen size={14} className="text-primary" /> What It Does &amp; Why It Matters
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.55 }}>
                  {info.whatItDoes}
                </p>
              </div>

              {/* Section 2: What To Do (Actionable Step-by-Step) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Compass size={14} className="text-teal" /> What To Do (Step-by-Step)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {info.whatToDo.map((step, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '0.65rem', 
                        fontSize: '0.84rem', 
                        color: 'var(--text-secondary, #475569)',
                        lineHeight: 1.45 
                      }}
                    >
                      <div 
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '50%', 
                          backgroundColor: 'rgba(20, 184, 166, 0.12)', 
                          color: 'var(--accent-teal, #14b8a6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          flexShrink: 0,
                          marginTop: '1px'
                        }}
                      >
                        {idx + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: What You Get From It */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Award size={14} className="text-indigo" /> What You Get (Outcomes &amp; Insights)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {info.whatYouGet.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '0.55rem', 
                        fontSize: '0.83rem', 
                        color: 'var(--text-secondary, #475569)',
                        lineHeight: 1.45 
                      }}
                    >
                      <span style={{ color: 'var(--primary, #6366f1)', fontWeight: 800, fontSize: '0.9rem', lineHeight: '1.2' }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Formula Breakdown (If present) */}
              {info.formula && (
                <div 
                  style={{ 
                    backgroundColor: 'rgba(99, 102, 241, 0.05)', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary, #6366f1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <Calculator size={13} /> Mathematical Formula
                  </div>
                  <code style={{ fontSize: '0.82rem', color: 'var(--text-primary, #0f172a)', fontFamily: 'ui-monospace, monospace', fontWeight: 700, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {info.formula}
                  </code>
                </div>
              )}

              {/* Section 5: Pro-Tip & Best Practice */}
              {info.proTip && (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.65rem', 
                    padding: '0.85rem 1rem', 
                    borderRadius: '10px', 
                    backgroundColor: 'rgba(245, 158, 11, 0.08)', 
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary, #0f172a)',
                    lineHeight: 1.5
                  }}
                >
                  <Lightbulb size={16} className="text-amber" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <b style={{ color: 'var(--accent-amber, #d97706)', display: 'inline' }}>Pro Tip: </b>
                    <span>{info.proTip}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div 
              style={{ 
                padding: '0.9rem 1.4rem', 
                borderTop: '1px solid var(--border-color, #e2e8f0)', 
                display: 'flex', 
                justifyContent: 'flex-end',
                backgroundColor: 'var(--bg-app, #f8fafc)',
                borderRadius: '0 0 16px 16px'
              }}
            >
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                style={{
                  padding: '0.45rem 1.25rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <CheckCircle size={14} /> Got it
              </button>
            </div>
          </div>
        </div>,
        getPortalTarget()
      )}
    </>
  );
};

export default FeatureInfoButton;
