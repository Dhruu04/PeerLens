// src/components/BrandingCustomizerModal.tsx
import React, { useState, useRef } from 'react';
import {
  Building2, Upload, X, Check, RotateCcw, GraduationCap, Calendar, Trash2,
  Eye, EyeOff, BookOpen, Code, Cpu, Atom, Briefcase, Award, Compass,
  Clock, Sparkles, Tag
} from 'lucide-react';
import {
  getBranding,
  saveBranding,
  resetBranding,
  BRANDING_PRESETS,
  BADGE_COLOR_THEMES,
  type InstitutionalBranding,
  type BadgeColorTheme,
  type BadgeIconType,
  type TermIconType,
  type LogoShape
} from '../utils/brandingPreferences';

interface BrandingCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId?: string;
  className?: string;
  onToast: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

const BADGE_ICONS: Array<{ id: BadgeIconType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'graduation', label: 'Cap', icon: GraduationCap },
  { id: 'book', label: 'Book', icon: BookOpen },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'cpu', label: 'Tech', icon: Cpu },
  { id: 'atom', label: 'Science', icon: Atom },
  { id: 'briefcase', label: 'Business', icon: Briefcase },
  { id: 'award', label: 'Honors', icon: Award },
  { id: 'compass', label: 'Design', icon: Compass }
];

const TERM_ICONS: Array<{ id: TermIconType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'clock', label: 'Time', icon: Clock },
  { id: 'sparkles', label: 'Special', icon: Sparkles },
  { id: 'tag', label: 'Term', icon: Tag }
];

export const BrandingCustomizerModal: React.FC<BrandingCustomizerModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
  onToast
}) => {
  const [branding, setBranding] = useState<InstitutionalBranding>(() => getBranding(classId));
  const [activeTab, setActiveTab] = useState<'identity' | 'badge' | 'term'>('identity');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onToast('Image must be under 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setBranding(prev => ({ ...prev, institutionLogo: base64 }));
      onToast('Logo uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    saveBranding(branding, classId);
    onToast(branding.showInHeader ? 'Branding saved and visible in header!' : 'Branding saved (hidden from header).', 'success');
    onClose();
  };

  const handleReset = () => {
    resetBranding(classId);
    setBranding(getBranding(classId));
    onToast('Branding reset to system default (hidden).', 'info');
  };

  const currentColorTheme = BADGE_COLOR_THEMES[branding.badgeColor || 'indigo'] || BADGE_COLOR_THEMES.indigo;

  // Selected Badge Icon Component
  const SelectedBadgeIcon = BADGE_ICONS.find(i => i.id === branding.badgeIcon)?.icon || GraduationCap;
  // Selected Term Icon Component
  const SelectedTermIcon = TERM_ICONS.find(i => i.id === branding.termIcon)?.icon || Calendar;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 45px -8px rgba(0, 0, 0, 0.38)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================================
            HEADER: Minimal Title + Minimal Header View/Hide Toggle
            ========================================================================= */}
        <div
          style={{
            padding: '0.85rem 1.15rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-app)',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Building2 size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Institutional Branding
              </h3>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Customize institution logo, course badge, and term banner.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {/* Small Minimal View/Hide Toggle Button (Hidden by default) */}
            <button
              type="button"
              onClick={() => setBranding(prev => ({ ...prev, showInHeader: !prev.showInHeader }))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                fontSize: '0.69rem',
                fontWeight: 750,
                border: branding.showInHeader ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-color)',
                backgroundColor: branding.showInHeader ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)',
                color: branding.showInHeader ? 'var(--accent-teal, #10b981)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 120ms ease'
              }}
              title={branding.showInHeader ? 'Currently visible in top header (Click to hide)' : 'Currently hidden from top header (Click to show)'}
            >
              {branding.showInHeader ? <Eye size={12} strokeWidth={2.5} /> : <EyeOff size={12} />}
              <span>{branding.showInHeader ? 'Visible' : 'Hidden'}</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              style={{ width: '28px', height: '28px', padding: 0 }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* =========================================================================
            BODY: Live Header Preview + Segmented Tabs + Inputs
            ========================================================================= */}
        <div style={{ padding: '0.95rem 1.15rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Live Preview Strip */}
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '9px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.65rem',
              flexWrap: 'wrap'
            }}
          >
            {/* Left: Rendered Header Sample */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
              {/* Logo with Shape */}
              {branding.institutionLogo ? (
                <img
                  src={branding.institutionLogo}
                  alt="Logo"
                  style={{
                    width: '26px',
                    height: '26px',
                    objectFit: 'contain',
                    borderRadius: branding.logoShape === 'circle' ? '50%' : (branding.logoShape === 'square' ? '2px' : '6px')
                  }}
                />
              ) : (
                <img
                  src="/PeerGrading.png"
                  alt="Default"
                  style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '5px' }}
                />
              )}

              {/* Title */}
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {branding.institutionName || 'PeerLens'}
              </span>

              {/* Course Badge */}
              {branding.courseBadge && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 750,
                    padding: '0.12rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: currentColorTheme.bg,
                    color: currentColorTheme.text,
                    border: `1px solid ${currentColorTheme.border}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <SelectedBadgeIcon size={11} />
                  <span>{branding.courseBadge}</span>
                </span>
              )}

              {/* Term Banner */}
              {branding.termBanner && (
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 650,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <SelectedTermIcon size={10} />
                  <span>{branding.termBanner}</span>
                </span>
              )}
            </div>

            {/* Right: Preview State Pill */}
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 700,
                color: branding.showInHeader ? 'var(--accent-teal)' : 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                opacity: 0.9
              }}
            >
              {branding.showInHeader ? <Eye size={11} /> : <EyeOff size={11} />}
              {branding.showInHeader ? 'Header Visible' : 'Header Hidden'}
            </span>
          </div>

          {/* Segmented Section Switcher */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-app)',
              padding: '2px',
              borderRadius: '7px',
              border: '1px solid var(--border-color)',
              gap: '2px',
              width: '100%'
            }}
          >
            {[
              { id: 'identity' as const, label: 'Identity & Logo' },
              { id: 'badge' as const, label: 'Course Badge' },
              { id: 'term' as const, label: 'Term Banner' }
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    border: 'none',
                    padding: '0.28rem 0.5rem',
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 750 : 600,
                    borderRadius: '5px',
                    backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                    color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                    boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 120ms ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* =========================================================================
              TAB 1: IDENTITY & LOGO
              ========================================================================= */}
          {activeTab === 'identity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Institution Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Institution / Department Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={branding.institutionName}
                  onChange={(e) => setBranding(prev => ({ ...prev, institutionName: e.target.value }))}
                  placeholder="e.g. Stanford University, MIT, Dept of Computer Science..."
                  style={{ width: '100%', fontSize: '0.78rem', height: '32px' }}
                />
              </div>

              {/* Logo Upload & Shape */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Logo Image &amp; Shape
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ gap: '0.3rem', height: '28px', fontSize: '0.72rem' }}
                  >
                    <Upload size={12} className="text-primary" />
                    <span>Upload Logo</span>
                  </button>

                  {branding.institutionLogo && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setBranding(prev => ({ ...prev, institutionLogo: '' }))}
                      style={{ gap: '0.25rem', height: '28px', fontSize: '0.7rem', color: 'var(--accent-rose, #ef4444)' }}
                    >
                      <Trash2 size={11} />
                      <span>Clear</span>
                    </button>
                  )}

                  {/* Logo Shape Segmented */}
                  <div style={{ display: 'inline-flex', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: 'hidden', height: '28px', marginLeft: 'auto' }}>
                    {(['rounded', 'square', 'circle'] as LogoShape[]).map((shape) => (
                      <button
                        key={shape}
                        type="button"
                        onClick={() => setBranding(prev => ({ ...prev, logoShape: shape }))}
                        style={{
                          border: 'none',
                          padding: '0 0.5rem',
                          fontSize: '0.68rem',
                          fontWeight: (branding.logoShape || 'rounded') === shape ? 750 : 600,
                          backgroundColor: (branding.logoShape || 'rounded') === shape ? 'var(--bg-app)' : 'var(--bg-surface)',
                          color: (branding.logoShape || 'rounded') === shape ? 'var(--primary)' : 'var(--text-muted)',
                          textTransform: 'capitalize',
                          cursor: 'pointer'
                        }}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preset SVG Emblems */}
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Or pick a curated vector emblem:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.35rem' }}>
                  {BRANDING_PRESETS.map((preset) => {
                    const isSelected = branding.institutionLogo === preset.svgData;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setBranding(prev => ({ ...prev, institutionLogo: preset.svgData }))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.45rem',
                          fontSize: '0.69rem',
                          fontWeight: isSelected ? 750 : 600,
                          borderRadius: '6px',
                          border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-app)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                          cursor: 'pointer',
                          transition: 'all 120ms ease'
                        }}
                      >
                        <img src={preset.svgData} alt={preset.name} style={{ width: '18px', height: '18px', borderRadius: '3px' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: COURSE BADGE
              ========================================================================= */}
          {activeTab === 'badge' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Badge Text */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Course Badge Text
                  </label>
                  {className && (
                    <button
                      type="button"
                      onClick={() => setBranding(prev => ({ ...prev, courseBadge: className }))}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.68rem', fontWeight: 750, cursor: 'pointer' }}
                    >
                      Use Active Class Name
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={branding.courseBadge}
                  onChange={(e) => setBranding(prev => ({ ...prev, courseBadge: e.target.value }))}
                  placeholder="e.g. CS-301: Senior Capstone, BIO-204..."
                  style={{ width: '100%', fontSize: '0.78rem', height: '32px' }}
                />
              </div>

              {/* Badge Accent Color Theme */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Badge Color Palette
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {(Object.keys(BADGE_COLOR_THEMES) as BadgeColorTheme[]).map((col) => {
                    const theme = BADGE_COLOR_THEMES[col];
                    const isSelected = (branding.badgeColor || 'indigo') === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setBranding(prev => ({ ...prev, badgeColor: col }))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          border: isSelected ? `1.5px solid ${theme.text}` : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? theme.bg : 'var(--bg-app)',
                          color: isSelected ? theme.text : 'var(--text-secondary)',
                          fontSize: '0.68rem',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          transition: 'all 120ms ease'
                        }}
                      >
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: theme.text }} />
                        <span>{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Badge Icon Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Badge Icon
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {BADGE_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = (branding.badgeIcon || 'graduation') === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setBranding(prev => ({ ...prev, badgeIcon: item.id }))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.18rem 0.45rem',
                          borderRadius: '6px',
                          border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-app)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: '0.68rem',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer'
                        }}
                      >
                        <IconComp size={11} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: TERM BANNER
              ========================================================================= */}
          {activeTab === 'term' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Term Text */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Academic Term / Semester Banner
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={branding.termBanner}
                  onChange={(e) => setBranding(prev => ({ ...prev, termBanner: e.target.value }))}
                  placeholder="e.g. Fall 2026, Spring 2027, Term 1..."
                  style={{ width: '100%', fontSize: '0.78rem', height: '32px' }}
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Quick 1-click presets:
                </span>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {['Fall 2026', 'Spring 2027', 'Summer 2026', 'Academic Year 2026–27', 'Term 1', 'Quarter 2'].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setBranding(prev => ({ ...prev, termBanner: term }))}
                      style={{
                        fontSize: '0.67rem',
                        fontWeight: branding.termBanner === term ? 750 : 600,
                        padding: '0.12rem 0.45rem',
                        borderRadius: '5px',
                        border: branding.termBanner === term ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        backgroundColor: branding.termBanner === term ? 'var(--primary-light)' : 'var(--bg-app)',
                        color: branding.termBanner === term ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Term Icon Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Term Icon
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {TERM_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = (branding.termIcon || 'calendar') === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setBranding(prev => ({ ...prev, termIcon: item.id }))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.18rem 0.45rem',
                          borderRadius: '6px',
                          border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-app)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: '0.68rem',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer'
                        }}
                      >
                        <IconComp size={11} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            FOOTER: Reset to Default + Cancel + Apply
            ========================================================================= */}
        <div
          style={{
            padding: '0.75rem 1.15rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-app)'
          }}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleReset}
            style={{ gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}
          >
            <RotateCcw size={12} />
            <span>Reset to Default</span>
          </button>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.65rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              style={{ gap: '0.3rem', fontWeight: 750, fontSize: '0.72rem', height: '28px', padding: '0 0.8rem' }}
            >
              <Check size={13} />
              <span>Apply Branding</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingCustomizerModal;
