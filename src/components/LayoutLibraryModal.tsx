import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bookmark,
  Check,
  Copy,
  Download,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  Sliders,
  Info,
  GraduationCap,
  Users,
  Presentation,
  Activity,
  Award,
  RefreshCw
} from 'lucide-react';
import { Modal } from './Modal';
import type { FeatureToggles } from '../utils/featurePreferences';
import {
  type CustomViewProfile,
  getAllLayoutProfiles,
  getCustomProfiles,
  subscribeCustomProfiles,
  saveCustomProfile,
  updateCustomProfile,
  duplicateCustomProfile,
  deleteCustomProfile,
  applyFullLayoutProfile,
  resetToDefaultLayout,
  getActiveProfileId,
  exportCustomProfilesJSON,
  exportSingleProfileJSON,
  importCustomProfilesJSON
} from '../utils/customViewProfiles';
import { getStoredLayout } from '../utils/cardLayoutPreferences';
import { getDisplayDensity } from '../utils/displayDensity';
import { MODULE_ITEMS } from '../utils/moduleRegistry';
import FeatureInfoButton from './FeatureInfoButton';

export interface LayoutLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureToggles: FeatureToggles;
  onToggleFeature?: (key: keyof FeatureToggles, value: boolean) => void;
  onApplyPreset: (preset: 'minimal' | 'standard' | 'full' | 'none') => void;
  onApplyCustomToggles?: (toggles: FeatureToggles) => void;
  shortcutsEnabled: boolean;
  onToggleShortcutsEnabled: (enabled: boolean) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const getProfileTheme = (profile: CustomViewProfile) => {
  if (profile.id === 'builtin_grading_day') {
    return {
      icon: GraduationCap,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.12)',
      badgeBg: 'rgba(99, 102, 241, 0.08)',
      badgeBorder: 'rgba(99, 102, 241, 0.25)',
      badgeColor: '#6366f1'
    };
  }
  if (profile.id === 'builtin_enrollment') {
    return {
      icon: Users,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      badgeBg: 'rgba(16, 185, 129, 0.08)',
      badgeBorder: 'rgba(16, 185, 129, 0.25)',
      badgeColor: '#10b981'
    };
  }
  if (profile.id === 'builtin_presentations') {
    return {
      icon: Presentation,
      color: '#0ea5e9',
      bg: 'rgba(14, 165, 233, 0.12)',
      badgeBg: 'rgba(14, 165, 233, 0.08)',
      badgeBorder: 'rgba(14, 165, 233, 0.25)',
      badgeColor: '#0ea5e9'
    };
  }
  if (profile.id === 'builtin_team_pulse') {
    return {
      icon: Activity,
      color: '#f43f5e',
      bg: 'rgba(244, 63, 94, 0.12)',
      badgeBg: 'rgba(244, 63, 94, 0.08)',
      badgeBorder: 'rgba(244, 63, 94, 0.25)',
      badgeColor: '#f43f5e'
    };
  }
  if (profile.id === 'builtin_audit_lms') {
    return {
      icon: Award,
      color: '#d97706',
      bg: 'rgba(245, 158, 11, 0.12)',
      badgeBg: 'rgba(245, 158, 11, 0.08)',
      badgeBorder: 'rgba(245, 158, 11, 0.25)',
      badgeColor: '#d97706'
    };
  }
  if (profile.id === 'builtin_minimal') {
    return {
      icon: Sparkles,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.12)',
      badgeBg: 'rgba(139, 92, 246, 0.08)',
      badgeBorder: 'rgba(139, 92, 246, 0.25)',
      badgeColor: '#8b5cf6'
    };
  }
  if (profile.isBuiltIn) {
    return {
      icon: Layers,
      color: 'var(--primary, #6366f1)',
      bg: 'rgba(99, 102, 241, 0.12)',
      badgeBg: 'rgba(99, 102, 241, 0.08)',
      badgeBorder: 'rgba(99, 102, 241, 0.25)',
      badgeColor: 'var(--primary, #6366f1)'
    };
  }
  return {
    icon: Bookmark,
    color: 'var(--accent-teal, #14b8a6)',
    bg: 'rgba(20, 184, 166, 0.12)',
    badgeBg: 'rgba(20, 184, 166, 0.08)',
    badgeBorder: 'rgba(20, 184, 166, 0.25)',
    badgeColor: 'var(--accent-teal, #14b8a6)'
  };
};

export const LayoutLibraryModal: React.FC<LayoutLibraryModalProps> = ({
  isOpen,
  onClose,
  featureToggles,
  onToggleFeature,
  onApplyPreset,
  onApplyCustomToggles,
  shortcutsEnabled,
  onToggleShortcutsEnabled,
  onToast
}) => {
  // Profiles state
  const [customProfiles, setCustomProfiles] = useState<CustomViewProfile[]>(() => getCustomProfiles());
  const [activeProfileId, setActiveId] = useState<string>(() => getActiveProfileId());

  // Listen for custom profile updates
  useEffect(() => {
    return subscribeCustomProfiles((list) => {
      setCustomProfiles(list);
    });
  }, []);

  // Filter & Search states
  const [filterTab, setFilterTab] = useState<'all' | 'curated' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create / Save Layout drawer state
  const [isCreating, setIsCreating] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutDesc, setNewLayoutDesc] = useState('');

  // Confirmation state for reset
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Hidden file input ref for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // All combined profiles (curated + custom)
  const allProfiles = useMemo(() => {
    return getAllLayoutProfiles();
  }, [customProfiles]);

  const curatedCount = useMemo(() => {
    return allProfiles.filter(p => p.isBuiltIn).length;
  }, [allProfiles]);

  // Current live statistics of active workspace
  const activeMetrics = useMemo(() => {
    const total = MODULE_ITEMS.length;
    const vis = MODULE_ITEMS.filter(m => !!featureToggles[m.key]).length;
    const layout = getStoredLayout();
    const pinnedCount = (layout.pinned || []).length;
    const density = getDisplayDensity();
    return {
      visibleCount: vis,
      totalCount: total,
      percentage: Math.round((vis / total) * 100),
      pinnedCount,
      density
    };
  }, [featureToggles]);

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allProfiles.filter(p => {
      // 1. Tab filter
      if (filterTab === 'curated' && !p.isBuiltIn) return false;
      if (filterTab === 'custom' && p.isBuiltIn) return false;

      // 2. Search query filter
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.badge && p.badge.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    });
  }, [allProfiles, filterTab, searchQuery]);

  // Apply layout handler
  const handleApply = (profile: CustomViewProfile) => {
    applyFullLayoutProfile(profile, {
      onToggleFeature,
      onApplyPreset,
      onApplyCustomToggles,
      onToggleShortcutsEnabled,
      onToast
    });
    setActiveId(profile.id);
  };

  // Reset to default layout handler
  const handleReset = () => {
    resetToDefaultLayout({
      onToggleFeature,
      onApplyPreset,
      onApplyCustomToggles,
      onToggleShortcutsEnabled,
      onToast
    });
    setActiveId('builtin_balanced');
    setShowResetConfirm(false);
  };

  // Save new layout handler
  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLayoutName.trim();
    if (!name) {
      onToast('Please enter a name for your custom layout.', 'warning');
      return;
    }

    const currentCardLayout = getStoredLayout();
    const currentDensity = getDisplayDensity();

    const created = saveCustomProfile(name, featureToggles, shortcutsEnabled, {
      description: newLayoutDesc.trim(),
      cardLayout: currentCardLayout,
      displayDensity: currentDensity,
      category: 'custom'
    });

    if (created) {
      setActiveId(created.id);
      setIsCreating(false);
      setNewLayoutName('');
      setNewLayoutDesc('');
      setFilterTab('custom');
      onToast(`Saved layout "${name}" to your library!`, 'success');
    }
  };

  // Overwrite existing custom layout with current settings
  const handleOverwrite = (profile: CustomViewProfile) => {
    if (profile.isBuiltIn) return;
    const currentCardLayout = getStoredLayout();
    const currentDensity = getDisplayDensity();

    const updated = updateCustomProfile(profile.id, {
      toggles: { ...featureToggles },
      cardLayout: currentCardLayout,
      displayDensity: currentDensity,
      shortcutsEnabled
    });

    if (updated) {
      setActiveId(profile.id);
      onToast(`Updated layout "${profile.name}" with current workspace view!`, 'success');
    }
  };

  // Duplicate layout
  const handleDuplicate = (profile: CustomViewProfile) => {
    const copy = duplicateCustomProfile(profile.id);
    if (copy) {
      setFilterTab('custom');
      onToast(`Duplicated into "${copy.name}". You can now customize it freely!`, 'info');
    }
  };

  // Delete layout
  const handleDelete = (profile: CustomViewProfile) => {
    deleteCustomProfile(profile.id);
    onToast(`Deleted layout "${profile.name}".`, 'info');
  };

  // Export single profile
  const handleExportSingle = (profile: CustomViewProfile) => {
    const json = exportSingleProfileJSON(profile.id);
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peerlens_layout_${profile.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onToast(`Exported "${profile.name}" JSON!`, 'success');
  };

  // Export all custom profiles
  const handleExportAll = () => {
    const json = exportCustomProfilesJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peerlens_all_layouts_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onToast('Exported all custom layouts!', 'success');
  };

  // Import JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const result = importCustomProfilesJSON(text);
        if (result.imported > 0) {
          setFilterTab('custom');
          onToast(`Successfully imported ${result.imported} layout(s)!`, 'success');
        } else {
          onToast('Failed to import: file does not contain valid PeerLens layout profiles.', 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="860px"
      zIndex={100060}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', padding: '0.15rem' }}>
        {/* =========================================================================
            1. MINIMAL HEADER & COMPACT ACTIONS BAR
            ========================================================================= */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--primary, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Layers size={16} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Workspace Layouts
              </h2>
              <FeatureInfoButton featureId="density-presets" size="sm" tooltipText="Layout Presets & Custom Views Guide" />
            </div>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Switch teaching views or manage your personal workspace layouts.
            </p>
          </div>

          {/* Clean Action Cluster: Save Button + Subtle Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            {/* Hidden JSON Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: 'none' }}
            />

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: '0.72rem', fontWeight: 650, height: '28px', padding: '0 0.55rem', gap: '0.3rem' }}
              title="Import layout profiles from a .json backup"
            >
              <Upload size={12} />
              <span>Import</span>
            </button>

            {customProfiles.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleExportAll}
                style={{ fontSize: '0.72rem', fontWeight: 650, height: '28px', padding: '0 0.55rem', gap: '0.3rem' }}
                title="Export all custom layouts as JSON backup"
              >
                <Download size={12} />
                <span>Export</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowResetConfirm(true)}
              style={{
                fontSize: '0.72rem',
                fontWeight: 650,
                height: '28px',
                padding: '0 0.55rem',
                gap: '0.3rem',
                color: 'var(--accent-amber, #d97706)'
              }}
              title="Reset workspace to default layout"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsCreating(prev => !prev)}
              style={{
                fontSize: '0.72rem',
                fontWeight: 750,
                height: '28px',
                padding: '0 0.75rem',
                gap: '0.3rem',
                boxShadow: '0 2px 6px var(--primary-glow, rgba(99, 102, 241, 0.25))'
              }}
            >
              <Plus size={13} />
              <span>Save Current View</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. RESET CONFIRMATION ALERT (Sleek Inline)
            ========================================================================= */}
        {showResetConfirm && (
          <div
            style={{
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem' }}>
              <RotateCcw size={14} style={{ color: 'var(--accent-amber, #d97706)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 650 }}>
                Reset workspace to default layout? Cards and recommended modules will be restored. Data is unaffected.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowResetConfirm(false)}
                style={{ fontSize: '0.7rem', height: '24px', padding: '0 0.55rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleReset}
                style={{
                  fontSize: '0.7rem',
                  height: '24px',
                  padding: '0 0.7rem',
                  backgroundColor: 'var(--accent-amber, #d97706)',
                  borderColor: 'var(--accent-amber, #d97706)'
                }}
              >
                Reset Layout
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. INLINE SAVE VIEW DRAWER (Compact & Focused)
            ========================================================================= */}
        {isCreating && (
          <form
            onSubmit={handleSaveNew}
            style={{
              padding: '0.75rem 0.95rem',
              backgroundColor: 'var(--bg-app)',
              borderRadius: '10px',
              border: '1px solid var(--primary)',
              boxShadow: '0 4px 16px var(--primary-glow, rgba(99, 102, 241, 0.12))',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                <Sparkles size={13} className="text-primary" />
                <span>Save Current Workspace as Layout</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.15rem' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Two-Column Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.55rem' }}>
              <div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Layout Name (e.g. Midterm Grading, Week 1 Kickoff)..."
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  autoFocus
                  required
                  style={{ height: '30px', fontSize: '0.76rem', width: '100%', borderRadius: '6px' }}
                />
              </div>

              <div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Short note or description (optional)..."
                  value={newLayoutDesc}
                  onChange={(e) => setNewLayoutDesc(e.target.value)}
                  style={{ height: '30px', fontSize: '0.76rem', width: '100%', borderRadius: '6px' }}
                />
              </div>
            </div>

            {/* Live Indicator Pills + Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.35rem', borderTop: '1px solid var(--border-color)', fontSize: '0.68rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}>
                  <Check size={10} /> {activeMetrics.visibleCount}/{activeMetrics.totalCount} Modules ({activeMetrics.percentage}%)
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', fontWeight: 700 }}>
                  <Check size={10} /> Placements &amp; {activeMetrics.pinnedCount} Pinned
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-teal)', fontWeight: 700, textTransform: 'capitalize' }}>
                  <Check size={10} /> {activeMetrics.density} Density
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsCreating(false)}
                  style={{ fontSize: '0.7rem', height: '25px', padding: '0 0.55rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.7rem', height: '25px', padding: '0 0.75rem', fontWeight: 750 }}
                >
                  Save Layout
                </button>
              </div>
            </div>
          </form>
        )}

        {/* =========================================================================
            4. SEARCH & TAB SELECTOR (Clean & Minimal)
            ========================================================================= */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Segmented Filter Pills */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-app)',
              padding: '2px',
              borderRadius: '7px',
              border: '1px solid var(--border-color)',
              gap: '2px'
            }}
          >
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              style={{
                border: 'none',
                padding: '0.25rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: filterTab === 'all' ? 750 : 600,
                borderRadius: '5px',
                backgroundColor: filterTab === 'all' ? 'var(--bg-surface)' : 'transparent',
                color: filterTab === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: filterTab === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 120ms ease'
              }}
            >
              All ({allProfiles.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('curated')}
              style={{
                border: 'none',
                padding: '0.25rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: filterTab === 'curated' ? 750 : 600,
                borderRadius: '5px',
                backgroundColor: filterTab === 'curated' ? 'var(--bg-surface)' : 'transparent',
                color: filterTab === 'curated' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: filterTab === 'curated' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 120ms ease'
              }}
            >
              Teaching Presets ({curatedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('custom')}
              style={{
                border: 'none',
                padding: '0.25rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: filterTab === 'custom' ? 750 : 600,
                borderRadius: '5px',
                backgroundColor: filterTab === 'custom' ? 'var(--bg-surface)' : 'transparent',
                color: filterTab === 'custom' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: filterTab === 'custom' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 120ms ease'
              }}
            >
              My Saved ({customProfiles.length})
            </button>
          </div>

          {/* Compact Search Box */}
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '280px' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Filter layouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '1.9rem', paddingRight: searchQuery ? '1.8rem' : '0.65rem', height: '28px', fontSize: '0.74rem', width: '100%', borderRadius: '6px' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.15rem' }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            5. STREAMLINED LAYOUT LIST (Compact, Clean, Organized)
            ========================================================================= */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            maxHeight: '54vh',
            overflowY: 'auto',
            paddingRight: '0.2rem'
          }}
        >
          {filteredProfiles.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '10px',
                border: '1px dashed var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <Bookmark size={24} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
              <div style={{ fontSize: '0.86rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                {searchQuery ? 'No layouts match your filter' : 'No custom layouts saved yet'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', maxWidth: '340px' }}>
                {searchQuery
                  ? 'Try searching with a different term, or switch to All Layouts.'
                  : 'Customize your modules and cards on the dashboard, then click "Save Current View" above.'}
              </div>
              {!searchQuery && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsCreating(true)}
                  style={{ marginTop: '0.35rem', fontSize: '0.72rem', fontWeight: 700, height: '26px' }}
                >
                  <Plus size={12} /> Save Current View
                </button>
              )}
            </div>
          ) : (
            filteredProfiles.map((profile) => {
              const isActive = activeProfileId === profile.id;
              const visCount = MODULE_ITEMS.filter(m => !!profile.toggles[m.key]).length;
              const totalCount = MODULE_ITEMS.length;
              const percentage = Math.round((visCount / totalCount) * 100);
              const pinnedCount = profile.cardLayout?.pinned?.length || 0;
              const density = profile.displayDensity || 'balanced';
              const theme = getProfileTheme(profile);
              const ProfileIcon = theme.icon;

              return (
                <div
                  key={profile.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '8px',
                    border: isActive
                      ? '1px solid var(--primary)'
                      : '1px solid var(--border-color)',
                    borderLeft: isActive
                      ? '3.5px solid var(--primary)'
                      : '1px solid var(--border-color)',
                    padding: '0.55rem 0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    boxShadow: isActive
                      ? '0 2px 10px var(--primary-glow, rgba(99, 102, 241, 0.12))'
                      : 'none',
                    transition: 'all 120ms ease'
                  }}
                >
                  {/* Left: Workflow Icon + Metadata */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '7px',
                        backgroundColor: theme.bg,
                        color: theme.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <ProfileIcon size={16} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      {/* Title & Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 750,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {profile.name}
                        </span>

                        <span
                          style={{
                            fontSize: '0.6rem',
                            fontWeight: 750,
                            padding: '0.08rem 0.38rem',
                            borderRadius: '9999px',
                            backgroundColor: theme.badgeBg,
                            color: theme.badgeColor,
                            border: `1px solid ${theme.badgeBorder}`,
                            letterSpacing: '0.01em'
                          }}
                        >
                          {profile.badge || (profile.isBuiltIn ? 'Curated' : 'Custom')}
                        </span>

                        <span
                          style={{
                            fontSize: '0.6rem',
                            fontWeight: 650,
                            padding: '0.08rem 0.35rem',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-app)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                            textTransform: 'capitalize'
                          }}
                        >
                          {density}
                        </span>

                        {isActive && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              color: 'var(--accent-teal, #10b981)',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              padding: '0.08rem 0.4rem',
                              borderRadius: '9999px',
                              border: '1px solid rgba(16, 185, 129, 0.25)'
                            }}
                          >
                            <Check size={9} strokeWidth={3} /> Active
                          </span>
                        )}
                      </div>

                      {/* Description (1-line clean clamp) */}
                      <div
                        style={{
                          fontSize: '0.71rem',
                          color: 'var(--text-secondary)',
                          margin: '0.12rem 0',
                          lineHeight: 1.3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {profile.description || 'Custom user-saved layout with configured modules and card priorities.'}
                      </div>

                      {/* Micro Specs */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                        <span>{visCount}/{totalCount} modules ({percentage}%)</span>
                        <span>•</span>
                        <span>{pinnedCount} pinned</span>
                        {profile.createdAt && !profile.isBuiltIn && (
                          <>
                            <span>•</span>
                            <span>{new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                    {/* Apply Button */}
                    <button
                      type="button"
                      className={isActive ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                      onClick={() => handleApply(profile)}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 750,
                        height: '26px',
                        padding: '0 0.65rem',
                        gap: '0.25rem',
                        backgroundColor: isActive ? 'var(--bg-app)' : undefined
                      }}
                    >
                      {isActive ? <Check size={11} /> : <Sliders size={11} />}
                      <span>{isActive ? 'Applied' : 'Apply'}</span>
                    </button>

                    {/* Overwrite with Current (for custom layouts) */}
                    {!profile.isBuiltIn && (
                      <button
                        type="button"
                        onClick={() => handleOverwrite(profile)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '5px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 120ms ease'
                        }}
                        title="Update this layout with your current dashboard setup"
                      >
                        <RefreshCw size={11} />
                      </button>
                    )}

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => handleDuplicate(profile)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '5px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 120ms ease'
                      }}
                      title={profile.isBuiltIn ? 'Duplicate to Customize' : 'Duplicate Layout'}
                    >
                      <Copy size={11} />
                    </button>

                    {/* Export Single */}
                    <button
                      type="button"
                      onClick={() => handleExportSingle(profile)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '5px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 120ms ease'
                      }}
                      title="Export layout JSON"
                    >
                      <Download size={11} />
                    </button>

                    {/* Delete (custom only) */}
                    {!profile.isBuiltIn && (
                      <button
                        type="button"
                        onClick={() => handleDelete(profile)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '5px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--accent-rose, #ef4444)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 120ms ease'
                        }}
                        title="Delete custom layout"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* =========================================================================
            6. SUBTLE FOOTER
            ========================================================================= */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.45rem', fontSize: '0.69rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Info size={11} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>Card orders, active modules, and display density restore together on apply.</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ fontSize: '0.72rem', height: '26px', padding: '0 0.75rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LayoutLibraryModal;
