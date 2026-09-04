import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Mail, 
  Cloud, 
  Keyboard, 
  Key, 
  RotateCcw, 
  Check, 
  Download, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink,
  Settings,
  X,
  Sliders,
  CheckCircle,
  Palette,
  Sun,
  Moon,
  Monitor,
  LayoutGrid,
  Award,
  Users,
  Maximize2,
  BookOpen,
  Compass,
  Search,
  User,
  Trash2,
  Edit2,
  QrCode,
  Clock,
  MessageSquare,
  CheckSquare,
  RefreshCw,
  Database,
  Activity,
  Zap,
  Plus,
  AlertCircle
} from 'lucide-react';
import { useClass } from '../context/ClassContext';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import type { KeyboardShortcut } from '../utils/keyboardShortcuts';
import { formatShortcutDisplay, AVAILABLE_SHORTCUT_ACTIONS, DEFAULT_KEYBOARD_SHORTCUTS } from '../utils/keyboardShortcuts';
import { 
  loadFeatureToggles, 
  saveFeatureToggles, 
  DEFAULT_FEATURE_TOGGLES, 
  MINIMAL_FEATURE_TOGGLES, 
  FULL_FEATURE_TOGGLES, 
  type FeatureToggles 
} from '../utils/featurePreferences';
import CustomSelect from './CustomSelect';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'email' | 'cloud' | 'shortcuts' | 'appearance' | 'modules';
  shortcuts: KeyboardShortcut[];
  onUpdateShortcuts: (updated: KeyboardShortcut[]) => void;
  onResetShortcuts: () => void;
  showChecklist?: boolean;
  onToggleChecklist?: (show: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'email',
  shortcuts,
  onUpdateShortcuts,
  onResetShortcuts,
  showChecklist = true,
  onToggleChecklist
}) => {
  const { 
    classes, 
    firebaseConfig, 
    saveFirebaseConfig, 
    isCloudSynced,
    syncWorkspaceSettingsToCloud,
    addToast 
  } = useClass();

  const {
    themeMode,
    accentColor,
    setThemeMode,
    setAccentColor,
    accentOptions
  } = useTheme();

  const [activeTab, setActiveTab] = useState<'email' | 'cloud' | 'shortcuts' | 'appearance' | 'modules'>(initialTab);
  const [featureToggles, setFeatureToggles] = useState<FeatureToggles>(loadFeatureToggles);
  const [moduleCategoryFilter, setModuleCategoryFilter] = useState<'all' | 'header' | 'hub' | 'roster' | 'rubric' | 'analytics'>('all');
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [moduleStatusFilter, setModuleStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevDocOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBodyOverflow || '';
        document.documentElement.style.overflow = prevDocOverflow || '';
      };
    }
  }, [isOpen]);
  
  // Cloud form state
  const [apiKey, setApiKey] = useState(firebaseConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(firebaseConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(firebaseConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(firebaseConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(firebaseConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(firebaseConfig?.appId || '');

  // Active Email Service Provider: 'brevo' | 'emailjs' | 'simulator'
  const [emailService, setEmailService] = useState<'brevo' | 'emailjs' | 'simulator'>(() => {
    return (localStorage.getItem('peer_email_service') as any) || 'brevo';
  });

  // Brevo API state
  const [brevoApiKey, setBrevoApiKey] = useState(() => {
    return localStorage.getItem('peer_brevo_api_key') || localStorage.getItem('peerlens_brevo_key') || '';
  });
  const [brevoSenderEmail, setBrevoSenderEmail] = useState(() => {
    return localStorage.getItem('peer_brevo_sender_email') || localStorage.getItem('peerlens_brevo_sender') || '';
  });
  const [brevoSenderName, setBrevoSenderName] = useState(() => {
    return localStorage.getItem('peer_brevo_sender_name') || localStorage.getItem('peerlens_brevo_name') || 'Course Instructor';
  });

  // EmailJS API state
  const [emailJsServiceId, setEmailJsServiceId] = useState(() => {
    return localStorage.getItem('peer_emailjs_service_id') || localStorage.getItem('peerlens_emailjs_service') || '';
  });
  const [emailJsTemplateId, setEmailJsTemplateId] = useState(() => {
    return localStorage.getItem('peer_emailjs_template_id') || localStorage.getItem('peerlens_emailjs_template') || '';
  });
  const [emailJsPublicKey, setEmailJsPublicKey] = useState(() => {
    return localStorage.getItem('peer_emailjs_user_id') || localStorage.getItem('peerlens_emailjs_public') || '';
  });

  // Keyboard shortcut editing state
  const [recordingShortcutId, setRecordingShortcutId] = useState<string | null>(null);
  const [isAddingShortcut, setIsAddingShortcut] = useState(false);
  const [newActionId, setNewActionId] = useState<string>('tab_hub');
  const [newShortcutKey, setNewShortcutKey] = useState<string>('');
  const [newModifiers, setNewModifiers] = useState<{ ctrl?: boolean; alt?: boolean; shift?: boolean }>({});
  const [isRecordingNewKey, setIsRecordingNewKey] = useState<boolean>(false);
  const [actionSearchQuery, setActionSearchQuery] = useState('');

  // Explicit shortcut editor modal/panel state (for editing any premade or custom shortcut)
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);
  const [editActionId, setEditActionId] = useState<string>('');
  const [editShortcutKey, setEditShortcutKey] = useState<string>('');
  const [editModifiers, setEditModifiers] = useState<{ ctrl?: boolean; alt?: boolean; shift?: boolean }>({});
  const [isRecordingEditKey, setIsRecordingEditKey] = useState<boolean>(false);

  // Lock body & document scroll and sync state on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      setActiveTab(initialTab);
      setFeatureToggles(loadFeatureToggles());
      // Re-hydrate stored values
      setEmailService((localStorage.getItem('peer_email_service') as any) || 'brevo');
      setBrevoApiKey(localStorage.getItem('peer_brevo_api_key') || localStorage.getItem('peerlens_brevo_key') || '');
      setBrevoSenderEmail(localStorage.getItem('peer_brevo_sender_email') || localStorage.getItem('peerlens_brevo_sender') || '');
      setBrevoSenderName(localStorage.getItem('peer_brevo_sender_name') || localStorage.getItem('peerlens_brevo_name') || 'Course Instructor');
      setEmailJsServiceId(localStorage.getItem('peer_emailjs_service_id') || localStorage.getItem('peerlens_emailjs_service') || '');
      setEmailJsTemplateId(localStorage.getItem('peer_emailjs_template_id') || localStorage.getItem('peerlens_emailjs_template') || '');
      setEmailJsPublicKey(localStorage.getItem('peer_emailjs_user_id') || localStorage.getItem('peerlens_emailjs_public') || '');
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen, initialTab]);

  const handleFeatureToggle = (key: keyof FeatureToggles) => {
    const nextVal = !featureToggles[key];
    const updated = { ...featureToggles, [key]: nextVal };
    setFeatureToggles(updated);
    saveFeatureToggles(updated);
    syncWorkspaceSettingsToCloud({ featureToggles: updated });
    addToast(`Updated module preference`, 'info');
  };

  const handleApplyFeaturePreset = (preset: FeatureToggles, name: string) => {
    setFeatureToggles(preset);
    saveFeatureToggles(preset);
    syncWorkspaceSettingsToCloud({ featureToggles: preset });
    addToast(`Applied ${name} layout`, 'success');
  };

  const handleGroupToggle = (keys: (keyof FeatureToggles)[], enable: boolean) => {
    const updated = { ...featureToggles };
    keys.forEach(k => {
      updated[k] = enable;
    });
    setFeatureToggles(updated);
    saveFeatureToggles(updated);
    syncWorkspaceSettingsToCloud({ featureToggles: updated });
    addToast(enable ? 'Enabled group elements' : 'Disabled group elements', 'info');
  };

  useEffect(() => {
    if (firebaseConfig) {
      setApiKey(firebaseConfig.apiKey);
      setAuthDomain(firebaseConfig.authDomain);
      setProjectId(firebaseConfig.projectId);
      setStorageBucket(firebaseConfig.storageBucket);
      setMessagingSenderId(firebaseConfig.messagingSenderId);
      setAppId(firebaseConfig.appId);
    }
  }, [firebaseConfig]);

  // Key recording listener (for remapping existing, recording new custom shortcuts, or editing any shortcut)
  useEffect(() => {
    if (!recordingShortcutId && !isRecordingNewKey && !isRecordingEditKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingShortcutId(null);
        setIsRecordingNewKey(false);
        setIsRecordingEditKey(false);
        return;
      }

      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        return;
      }

      const keyVal = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const modifiers = {
        ctrl: e.ctrlKey || e.metaKey,
        alt: e.altKey,
        shift: e.shiftKey
      };

      const hasMods = !!(modifiers.ctrl || modifiers.alt || modifiers.shift);

      if (isRecordingEditKey) {
        setEditShortcutKey(keyVal);
        setEditModifiers(hasMods ? modifiers : {});
        setIsRecordingEditKey(false);
        return;
      }

      if (isRecordingNewKey) {
        setNewShortcutKey(keyVal);
        setNewModifiers(hasMods ? modifiers : {});
        setIsRecordingNewKey(false);
        return;
      }

      if (recordingShortcutId) {
        const updated = shortcuts.map(s => {
          if (s.id === recordingShortcutId) {
            return {
              ...s,
              key: keyVal,
              modifiers: hasMods ? modifiers : undefined
            };
          }
          return s;
        });

        onUpdateShortcuts(updated);
        setRecordingShortcutId(null);
        addToast(`Shortcut for "${shortcuts.find(s => s.id === recordingShortcutId)?.label}" updated!`, 'success');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingShortcutId, isRecordingNewKey, isRecordingEditKey, shortcuts, onUpdateShortcuts, addToast]);

  if (!isOpen) return null;

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBrevoKey = brevoApiKey.trim();
    const cleanBrevoSender = brevoSenderEmail.trim();
    const cleanBrevoName = brevoSenderName.trim();

    const cleanServiceId = emailJsServiceId.trim();
    const cleanTemplateId = emailJsTemplateId.trim();
    const cleanPublicKey = emailJsPublicKey.trim();

    localStorage.setItem('peer_email_service', emailService);
    localStorage.setItem('peer_brevo_api_key', cleanBrevoKey);
    localStorage.setItem('peer_brevo_sender_email', cleanBrevoSender);
    localStorage.setItem('peer_brevo_sender_name', cleanBrevoName);
    localStorage.setItem('peerlens_brevo_key', cleanBrevoKey);
    localStorage.setItem('peerlens_brevo_sender', cleanBrevoSender);
    localStorage.setItem('peerlens_brevo_name', cleanBrevoName);

    localStorage.setItem('peer_emailjs_service_id', cleanServiceId);
    localStorage.setItem('peer_emailjs_template_id', cleanTemplateId);
    localStorage.setItem('peer_emailjs_user_id', cleanPublicKey);
    localStorage.setItem('peerlens_emailjs_service', cleanServiceId);
    localStorage.setItem('peerlens_emailjs_template', cleanTemplateId);
    localStorage.setItem('peerlens_emailjs_public', cleanPublicKey);

    syncWorkspaceSettingsToCloud({
      emailSettings: {
        service: emailService,
        brevoApiKey: cleanBrevoKey,
        brevoSenderEmail: cleanBrevoSender,
        brevoSenderName: cleanBrevoName,
        emailJsServiceId: cleanServiceId,
        emailJsTemplateId: cleanTemplateId,
        emailJsPublicKey: cleanPublicKey
      }
    });

    addToast('Email API credentials saved successfully!', 'success');
  };

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      addToast('API Key and Project ID are required for Firebase sync.', 'warning');
      return;
    }
    saveFirebaseConfig({
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    });
    addToast('Firebase credentials saved. Synchronizing with cloud...', 'success');
  };

  const handleDisconnectFirebase = () => {
    saveFirebaseConfig(null);
    setApiKey('');
    setAuthDomain('');
    setProjectId('');
    setStorageBucket('');
    setMessagingSenderId('');
    setAppId('');
    addToast('Disconnected from Firebase cloud sync.', 'info');
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(classes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PeerLens_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Workspace backup (.json) downloaded!', 'success');
  };

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '88vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.28)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 180ms ease'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{ 
            padding: '0.85rem 1.25rem', 
            borderBottom: '1px solid var(--border-color)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={15} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Workspace Settings
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.2 }}>
                Manage Brevo email delivery, Firebase cloud sync, themes &amp; shortcuts.
              </p>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={onClose} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text-muted)', 
              padding: '0.35rem', 
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close Settings (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Minimal Segmented Tab Strip */}
        <div style={{ padding: '0.4rem 1.25rem', backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            style={{
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontWeight: activeTab === 'modules' ? 700 : 600,
              borderRadius: '7px',
              border: activeTab === 'modules' ? '1px solid var(--border-color)' : '1px solid transparent',
              backgroundColor: activeTab === 'modules' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'modules' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'modules' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            <LayoutGrid size={13} /> Interface &amp; Modules
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            style={{
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontWeight: activeTab === 'appearance' ? 700 : 600,
              borderRadius: '7px',
              border: activeTab === 'appearance' ? '1px solid var(--border-color)' : '1px solid transparent',
              backgroundColor: activeTab === 'appearance' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'appearance' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'appearance' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            <Palette size={13} /> Theme
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            style={{
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontWeight: activeTab === 'shortcuts' ? 700 : 600,
              borderRadius: '7px',
              border: activeTab === 'shortcuts' ? '1px solid var(--border-color)' : '1px solid transparent',
              backgroundColor: activeTab === 'shortcuts' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'shortcuts' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'shortcuts' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            <Keyboard size={13} /> Shortcuts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            style={{
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontWeight: activeTab === 'email' ? 700 : 600,
              borderRadius: '7px',
              border: activeTab === 'email' ? '1px solid var(--border-color)' : '1px solid transparent',
              backgroundColor: activeTab === 'email' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'email' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'email' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            <Mail size={13} /> Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            style={{
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontWeight: activeTab === 'cloud' ? 700 : 600,
              borderRadius: '7px',
              border: activeTab === 'cloud' ? '1px solid var(--border-color)' : '1px solid transparent',
              backgroundColor: activeTab === 'cloud' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'cloud' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'cloud' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            <Cloud size={13} /> Cloud
            {isCloudSynced && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />}
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.15rem 1.35rem', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-surface)' }}>

          {/* TAB: INTERFACE & FEATURE MODULES */}
          {activeTab === 'modules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Presets Header Banner */}
              {featureToggles.showPresetsBanner !== false && (
                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem 1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <LayoutGrid size={16} className="text-primary" /> Interface Density &amp; Layout Presets
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      Customize workspace density from ultra-minimal to power-user mode, or toggle each component individually below.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleApplyFeaturePreset(MINIMAL_FEATURE_TOGGLES, 'Minimal')}
                      style={{ fontSize: '0.76rem', fontWeight: 700 }}
                    >
                      Minimal Mode
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleApplyFeaturePreset(DEFAULT_FEATURE_TOGGLES, 'Standard')}
                      style={{ fontSize: '0.76rem', fontWeight: 700 }}
                    >
                      Standard Default
                    </button>
                    <button
                      type="button"
                      className="btn btn-teal btn-sm"
                      onClick={() => handleApplyFeaturePreset(FULL_FEATURE_TOGGLES, 'Full Power')}
                      style={{ fontSize: '0.76rem', fontWeight: 700 }}
                    >
                      Show All Features
                    </button>
                  </div>
                </div>
              )}

              {/* Instructor Onboarding & Setup Checklist Card (Sent to Presets / Modules section) */}
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.9rem 1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '460px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckSquare size={15} className="text-primary" /> Instructor Onboarding &amp; Setup Checklist
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Display the 4-step progressive getting-started checklist at the top of your dashboard.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !showChecklist;
                    localStorage.setItem('peer_onboarding_dismissed', nextVal ? 'false' : 'true');
                    if (onToggleChecklist) onToggleChecklist(nextVal);
                    addToast(nextVal ? 'Onboarding Checklist enabled!' : 'Onboarding Checklist hidden.', 'info');
                  }}
                  style={{
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: showChecklist ? '1px solid #10b981' : '1px solid var(--border-color)',
                    backgroundColor: showChecklist ? 'var(--primary-light)' : 'var(--bg-surface)',
                    color: showChecklist ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  {showChecklist ? <CheckCircle size={13} /> : null}
                  {showChecklist ? 'Checklist Visible' : 'Checklist Hidden'}
                </button>
              </div>

              {/* Module Filter & Search Bar */}
              {(() => {
                const MODULE_GROUPS = [
                  {
                    id: 'header' as const,
                    title: 'Header & Top Navigation',
                    icon: Settings,
                    keys: ['showClassPicker', 'showDeleteClassButton', 'showNewClassButton', 'showSettingsButton', 'showThemeSwitcher', 'showProfilePill', 'showProjectorButton', 'showCommandSearch', 'showEmailButton', 'showGuideButton', 'showCloudStatus', 'showCustomizeViewButton'] as (keyof FeatureToggles)[],
                    items: [
                      { key: 'showClassPicker' as keyof FeatureToggles, title: 'Active Classroom Dropdown Selector', desc: 'Class dropdown on top-left to switch between active course sections.', icon: BookOpen },
                      { key: 'showDeleteClassButton' as keyof FeatureToggles, title: 'Delete Classroom Action Icon', desc: 'Trash icon next to classroom name to remove the active classroom.', icon: Trash2 },
                      { key: 'showNewClassButton' as keyof FeatureToggles, title: 'New Class (+ Class) Action Button', desc: 'Top-right button to create new classroom cohorts.', icon: Maximize2 },
                      { key: 'showSettingsButton' as keyof FeatureToggles, title: 'Workspace Settings Button', desc: 'Gear button in top-right to open settings & module configuration.', icon: Settings },
                      { key: 'showThemeSwitcher' as keyof FeatureToggles, title: 'Theme Mode Switcher', desc: 'Compact toggle button for dark, light, or system themes.', icon: Sun },
                      { key: 'showProfilePill' as keyof FeatureToggles, title: 'Admin Profile & Account Center Icon', desc: 'Top dock button to open the workspace profile selector and account center.', icon: User },
                      { key: 'showProjectorButton' as keyof FeatureToggles, title: 'Live Classroom Projector Button', desc: '1-click fullscreen projector mode button for lecture screens.', icon: Maximize2 },
                      { key: 'showCommandSearch' as keyof FeatureToggles, title: 'Quick Search & Command Palette', desc: 'Search shortcut button to quickly filter students or trigger actions.', icon: Search },
                      { key: 'showEmailButton' as keyof FeatureToggles, title: 'Classroom Email Center Button', desc: 'Dispatches secure assessment links to students via Brevo or EmailJS.', icon: Mail },
                      { key: 'showGuideButton' as keyof FeatureToggles, title: 'Academic Guidance Center Button', desc: 'Opens academic guidance instructions and interactive tours.', icon: Compass },
                      { key: 'showCloudStatus' as keyof FeatureToggles, title: 'Cloud Sync Status Indicator', desc: 'Minimal cloud connection icon button in top navigation bar.', icon: Database },
                      { key: 'showCustomizeViewButton' as keyof FeatureToggles, title: 'Customize View Button', desc: 'Minimalist sliders button in the top navigation dock to customize visible modules.', icon: Sliders }
                    ]
                  },
                  {
                    id: 'hub' as const,
                    title: 'Home Hub & Sub-Bar Navigation',
                    icon: LayoutGrid,
                    keys: ['showPresetsBanner', 'showHubOverviewBanner', 'showHubOverviewStats', 'showSectionNavBreadcrumbs', 'showClassIdBadge', 'showEnrollmentCard', 'showReviewSystemCard', 'showGradingAnalyticsCard', 'showHubCardMetrics', 'showHubQuickActions'] as (keyof FeatureToggles)[],
                    items: [
                      { key: 'showPresetsBanner' as keyof FeatureToggles, title: 'Interface Density & Layout Presets Card', desc: 'Quick preset density buttons at the top of the Interface & Modules tab.', icon: LayoutGrid },
                      { key: 'showHubOverviewBanner' as keyof FeatureToggles, title: 'Classroom Hub Overview Banner', desc: 'Displays the active classroom header, status badge, and shortcut hints.', icon: LayoutGrid },
                      { key: 'showHubOverviewStats' as keyof FeatureToggles, title: 'Live Metrics Snapshot Strip', desc: 'Live students, criteria count, and submission progress chips inside the banner.', icon: Sparkles },
                      { key: 'showSectionNavBreadcrumbs' as keyof FeatureToggles, title: 'Section Breadcrumb Trail', desc: 'Displays the "Class A / Section Name" trail in the section bar.', icon: Compass },
                      { key: 'showClassIdBadge' as keyof FeatureToggles, title: 'Classroom ID Copy Pill', desc: 'Clickable badge in the Hub header displaying class ID for student enrollment.', icon: Key },
                      { key: 'showEnrollmentCard' as keyof FeatureToggles, title: 'Hub Card: Section 1 (Enrollment & Teams)', desc: 'Large interactive section card on the Home Hub screen.', icon: Users },
                      { key: 'showReviewSystemCard' as keyof FeatureToggles, title: 'Hub Card: Section 2 (Review System)', desc: 'Large interactive section card on the Home Hub screen.', icon: Sliders },
                      { key: 'showGradingAnalyticsCard' as keyof FeatureToggles, title: 'Hub Card: Section 3 (Grading & Analytics)', desc: 'Large interactive section card on the Home Hub screen.', icon: Award },
                      { key: 'showHubCardMetrics' as keyof FeatureToggles, title: 'Hub Cards: Status & Progress Meters', desc: 'Readiness progress tracks and real-time student/rubric/submission metrics on Hub cards.', icon: Activity },
                      { key: 'showHubQuickActions' as keyof FeatureToggles, title: 'Hub Cards: Quick Action Launch Buttons', desc: 'Direct 1-click shortcut buttons (+ Add Student, QR Link, VALUE Presets, etc.) on Hub cards.', icon: Zap }
                    ]
                  },
                  {
                    id: 'roster' as const,
                    title: 'Section 1: Enrollment & Teams',
                    icon: Users,
                    keys: ['showSelfEnrollmentCard', 'showQuickActionsCard', 'showImportWizardCard', 'showAutoGroupStudio', 'showAddStudentButton', 'showExportButtons', 'showRosterSearchFilter', 'showBulkActionBar', 'showDuplicateDetector', 'showRosterTable', 'showTeamOverviewCards'] as (keyof FeatureToggles)[],
                    items: [
                      { key: 'showSelfEnrollmentCard' as keyof FeatureToggles, title: 'Self-Enrollment QR Code & Link Card', desc: 'Card showing class QR code preview and 1-click student self-enrollment URL.', icon: QrCode },
                      { key: 'showQuickActionsCard' as keyof FeatureToggles, title: 'Quick Actions & Demo 100 Sample Card', desc: 'Card with quick member creation, 100 sample student population, and Excel export.', icon: Sparkles },
                      { key: 'showImportWizardCard' as keyof FeatureToggles, title: 'Smart Roster Import Wizard Card', desc: 'Drag-and-drop dropzone card to onboard rosters from CSV, XLSX, or clipboard.', icon: Download },
                      { key: 'showAutoGroupStudio' as keyof FeatureToggles, title: 'AutoGroup Algorithmic Formation Studio', desc: 'Automated team formation studio balancing cohorts by diversity, skill, and size.', icon: Users },
                      { key: 'showAddStudentButton' as keyof FeatureToggles, title: 'Manual Add Participant Button', desc: '+ Enroll Participant button above the roster table.', icon: Users },
                      { key: 'showExportButtons' as keyof FeatureToggles, title: 'Roster Export Buttons', desc: 'Export to Excel and CSV buttons for roster backups.', icon: Download },
                      { key: 'showRosterSearchFilter' as keyof FeatureToggles, title: 'Roster Search & Team Filter Bar', desc: 'Search input and team filter dropdown above the roster table.', icon: Search },
                      { key: 'showBulkActionBar' as keyof FeatureToggles, title: 'Multi-Select Bulk Actions Toolbar', desc: 'Floating action bar when students are selected (move team, delete selected).', icon: CheckSquare },
                      { key: 'showDuplicateDetector' as keyof FeatureToggles, title: 'Duplicate Enrollment Warning Banner', desc: 'Alert banner flagging duplicate student names or emails in roster.', icon: ShieldCheck },
                      { key: 'showRosterTable' as keyof FeatureToggles, title: 'Enrolled Students Roster Table', desc: 'Main table listing all students, assigned teams, and individual actions.', icon: Users },
                      { key: 'showTeamOverviewCards' as keyof FeatureToggles, title: 'Teams & Group Breakdown Cards', desc: 'Grid of team cards displaying members per team.', icon: Users }
                    ]
                  },
                  {
                    id: 'rubric' as const,
                    title: 'Section 2: Review System',
                    icon: Sliders,
                    keys: ['showRubricHeader', 'showCustomCriterionButton', 'showRubricPresets', 'showTargetScaleCard', 'showDeadlineTimer', 'showWeightBalanceBar', 'showCriterionCards', 'showEvaluationSimulator'] as (keyof FeatureToggles)[],
                    items: [
                      { key: 'showRubricHeader' as keyof FeatureToggles, title: 'Rubric Title & Criteria Counter Header', desc: 'Header title, rubric description, and guide info button.', icon: Sliders },
                      { key: 'showCustomCriterionButton' as keyof FeatureToggles, title: 'Add Custom Criterion Button', desc: '+ Add Custom Criterion button to create individual evaluation metrics.', icon: Sliders },
                      { key: 'showRubricPresets' as keyof FeatureToggles, title: 'Standardized Rubric (IPAF) Ribbon', desc: 'Quick-apply library banner for the research-synthesized IPAF peer evaluation standard (CATME, Salas, AAC&U, WebPA).', icon: BookOpen },
                      { key: 'showTargetScaleCard' as keyof FeatureToggles, title: 'Final Grade Scaling Target Scale Card', desc: 'Sets grade scaling target (Out of 20, Out of 100, or Rubric Sum).', icon: Sliders },
                      { key: 'showDeadlineTimer' as keyof FeatureToggles, title: 'Milestone Deadline & Countdown Timer Card', desc: 'Submission cutoff date & countdown timer that locks evaluations upon expiration.', icon: Clock },
                      { key: 'showWeightBalanceBar' as keyof FeatureToggles, title: 'Rubric Weight Auto-Balance Bar', desc: 'Validation bar indicating criteria weight percentage sum and 100% balance.', icon: CheckCircle },
                      { key: 'showCriterionCards' as keyof FeatureToggles, title: 'Evaluation Rubric Criteria Cards List', desc: 'Configured rubric criteria cards with score ranges and behavioral anchors.', icon: Sliders },
                      { key: 'showEvaluationSimulator' as keyof FeatureToggles, title: 'Student Interface Experience Preview', desc: 'Interactive simulator showing how students see and submit peer evaluation sliders.', icon: Sparkles }
                    ]
                  },
                  {
                    id: 'analytics' as const,
                    title: 'Section 3: Grading & Performance Analytics',
                    icon: Award,
                    keys: ['showResultsHeaderCard', 'showExportReportButtons', 'showSubmissionReset', 'showCompetencyRadar', 'showJohariMatrix', 'showQualitativeFeedback', 'showWebPACalibration', 'showAnomalyAudit', 'showMilestonesHistory', 'showLmsExport', 'showResultsSummarySheet', 'showGradebookSearchFilter', 'showDetailedReviewMatrix', 'showTeammateAuditLog'] as (keyof FeatureToggles)[],
                    items: [
                      { key: 'showResultsHeaderCard' as keyof FeatureToggles, title: 'Real-Time Calculation Matrix Header Card', desc: 'Top title card explaining non-self peer averaging and real-time updates.', icon: Award },
                      { key: 'showExportReportButtons' as keyof FeatureToggles, title: 'Export Gradebook & Student PDF Reports Buttons', desc: 'Download class Excel gradebook and generate individual PDF report cards.', icon: Download },
                      { key: 'showSubmissionReset' as keyof FeatureToggles, title: 'Reset All Evaluations Action Button', desc: 'Danger zone button allowing instructors to wipe reviews back to pending.', icon: RefreshCw },
                      { key: 'showCompetencyRadar' as keyof FeatureToggles, title: 'Competency Spider Radar Chart', desc: 'Multi-axis radar chart showing class rubric benchmarks vs individual team averages.', icon: Sparkles },
                      { key: 'showJohariMatrix' as keyof FeatureToggles, title: 'Johari Window & Self-Awareness Alignment', desc: 'Identifies student self-awareness anomalies, over-raters, and under-raters vs team consensus.', icon: Award },
                      { key: 'showQualitativeFeedback' as keyof FeatureToggles, title: 'Qualitative Feedback Themes Card', desc: 'Automated keyword extraction across all written teammate feedback comments.', icon: MessageSquare },
                      { key: 'showWebPACalibration' as keyof FeatureToggles, title: 'WebPA Grade Calibration Card', desc: 'Base Grade mark input and Fudge weight slider for individual peer mark multipliers.', icon: Sliders },
                      { key: 'showAnomalyAudit' as keyof FeatureToggles, title: 'Statistical Anomaly & Collusion Audit Card', desc: 'Statistical conflict auditing flagging collusion, outlier ratings, and uniform grades.', icon: ShieldCheck },
                      { key: 'showMilestonesHistory' as keyof FeatureToggles, title: 'Milestone & Sprints History Card', desc: 'Archive evaluations into permanent sprint records to freeze marks over time.', icon: RefreshCw },
                      { key: 'showLmsExport' as keyof FeatureToggles, title: 'LMS Gradebook Integration & Smart Export Formats', desc: '1-click export presets for Canvas LMS, Blackboard Learn, Moodle, and Brightspace D2L.', icon: Download },
                      { key: 'showResultsSummarySheet' as keyof FeatureToggles, title: 'Results Summary Sheet & Gradebook Table', desc: 'Master gradebook table with individual student multipliers, raw scores, and actions.', icon: Award },
                      { key: 'showGradebookSearchFilter' as keyof FeatureToggles, title: 'Gradebook Search & Team Filter Bar', desc: 'Search by student name and team filter dropdown on the gradebook.', icon: Search },
                      { key: 'showDetailedReviewMatrix' as keyof FeatureToggles, title: 'Who Rated Whom: Evaluation Audit Cross-Matrix', desc: 'Cross-grid audit matrix in Team modal displaying reviewer vs recipient ratings.', icon: Sliders },
                      { key: 'showTeammateAuditLog' as keyof FeatureToggles, title: 'Teammate Evaluation Audit Log', desc: 'Written qualitative feedback comments and review records in Team modal.', icon: MessageSquare }
                    ]
                  }
                ];

                const totalItemsCount = MODULE_GROUPS.reduce((acc, g) => acc + g.items.length, 0);

                const filterCategories = [
                  { id: 'all', label: 'All Sections', count: totalItemsCount },
                  { id: 'header', label: 'Top Navigation', count: MODULE_GROUPS[0].items.length },
                  { id: 'hub', label: 'Home Hub', count: MODULE_GROUPS[1].items.length },
                  { id: 'roster', label: '1. Enrollment & Teams', count: MODULE_GROUPS[2].items.length },
                  { id: 'rubric', label: '2. Review System', count: MODULE_GROUPS[3].items.length },
                  { id: 'analytics', label: '3. Grading & Analytics', count: MODULE_GROUPS[4].items.length }
                ];

                // Filter groups based on category filter
                const activeGroups = MODULE_GROUPS.filter(g => moduleCategoryFilter === 'all' || g.id === moduleCategoryFilter);

                // Filter items inside active groups by search query and status filter
                const query = moduleSearchQuery.toLowerCase().trim();
                const filteredGroups = activeGroups.map(group => {
                  const filteredItems = group.items.filter(item => {
                    const matchesQuery = !query || 
                      item.title.toLowerCase().includes(query) || 
                      item.desc.toLowerCase().includes(query) || 
                      group.title.toLowerCase().includes(query);
                    const isEnabled = featureToggles[item.key];
                    const matchesStatus = moduleStatusFilter === 'all' || 
                      (moduleStatusFilter === 'enabled' && isEnabled) || 
                      (moduleStatusFilter === 'disabled' && !isEnabled);
                    return matchesQuery && matchesStatus;
                  });
                  return { ...group, items: filteredItems };
                }).filter(group => group.items.length > 0);

                const matchingItemsCount = filteredGroups.reduce((acc, g) => acc + g.items.length, 0);

                const renderToggleRow = (key: keyof FeatureToggles, title: string, desc: string, icon?: any) => {
                  const isEnabled = featureToggles[key];
                  const Icon = icon;
                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        gap: '1rem',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                        {Icon && (
                          <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: isEnabled ? 'var(--primary-light)' : 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                            <Icon size={13} style={{ color: isEnabled ? 'var(--primary)' : 'var(--text-muted)' }} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35, marginTop: '0.1rem' }}>{desc}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFeatureToggle(key)}
                        style={{
                          padding: '0.3rem 0.7rem',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: isEnabled ? '1px solid #10b981' : '1px solid var(--border-color)',
                          backgroundColor: isEnabled ? '#ecfdf5' : 'var(--bg-surface)',
                          color: isEnabled ? '#047857' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}
                      >
                        {isEnabled ? <CheckCircle size={13} /> : null}
                        {isEnabled ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                  );
                };

                const renderGroupHeader = (title: string, icon: any, keys: (keyof FeatureToggles)[], itemCount: number) => {
                  const Icon = icon;
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Icon size={15} className="text-primary" /> {title}
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', padding: '0.05rem 0.4rem', borderRadius: '10px' }}>
                          {itemCount}
                        </span>
                      </h4>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleGroupToggle(keys, true)}
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', height: '26px' }}
                        >
                          Enable All
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleGroupToggle(keys, false)}
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', height: '26px' }}
                        >
                          Disable All
                        </button>
                      </div>
                    </div>
                  );
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Minimalist Filter & Search Bar */}
                    <div style={{
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.65rem',
                      flexWrap: 'wrap'
                    }}>
                      {/* Left: Quick search input */}
                      <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
                        <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                          type="text"
                          placeholder="Search modules..."
                          value={moduleSearchQuery}
                          onChange={(e) => setModuleSearchQuery(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.35rem 1.8rem 0.35rem 1.9rem',
                            fontSize: '0.78rem',
                            height: '32px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            outline: 'none'
                          }}
                        />
                        {moduleSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setModuleSearchQuery('')}
                            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                            title="Clear search filter"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {/* Center: Section Selector Dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <CustomSelect
                          value={moduleCategoryFilter}
                          onChange={(val) => setModuleCategoryFilter(val as any)}
                          options={filterCategories.map(cat => ({
                            value: cat.id,
                            label: `${cat.label} (${cat.count})`
                          }))}
                          style={{ width: 'auto', minWidth: '185px' }}
                          triggerStyle={{ height: '32px', fontSize: '0.76rem', fontWeight: 600, padding: '0 0.65rem' }}
                        />
                      </div>

                      {/* Right: Visibility Segmented Switch */}
                      <div style={{ display: 'inline-flex', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: 'hidden', height: '32px', flexShrink: 0 }}>
                        {[
                          { id: 'all' as const, label: 'All' },
                          { id: 'enabled' as const, label: 'Visible' },
                          { id: 'disabled' as const, label: 'Hidden' }
                        ].map(status => (
                          <button
                            key={status.id}
                            type="button"
                            onClick={() => setModuleStatusFilter(status.id)}
                            style={{
                              padding: '0 0.65rem',
                              fontSize: '0.72rem',
                              fontWeight: moduleStatusFilter === status.id ? 800 : 500,
                              border: 'none',
                              borderRight: status.id !== 'disabled' ? '1px solid var(--border-color)' : 'none',
                              backgroundColor: moduleStatusFilter === status.id ? 'var(--primary-light)' : 'var(--bg-surface)',
                              color: moduleStatusFilter === status.id ? 'var(--primary)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              transition: 'all 120ms ease'
                            }}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>

                      {/* Minimal Counter */}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {matchingItemsCount}/{totalItemsCount}
                      </span>
                    </div>

                    {/* Filtered Group Cards */}
                    {filteredGroups.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem 1rem', backgroundColor: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: '10px' }}>
                        <Search size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 0.5rem auto' }} />
                        <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>No modules match your current filter</h5>
                        <p style={{ margin: '0.35rem 0 1rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Try adjusting your search terms or reset the section category filter.
                        </p>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setModuleCategoryFilter('all');
                            setModuleSearchQuery('');
                            setModuleStatusFilter('all');
                          }}
                        >
                          Reset All Filters
                        </button>
                      </div>
                    ) : (
                      filteredGroups.map(group => (
                        <div
                          key={group.id}
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            padding: '1rem 1.15rem'
                          }}
                        >
                          {renderGroupHeader(group.title, group.icon, group.keys, group.items.length)}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {group.items.map(item => renderToggleRow(item.key, item.title, item.desc, item.icon))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: APPEARANCE & THEMES */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Theme Mode Section */}
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.15rem' }}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sun size={15} style={{ color: 'var(--primary)' }} /> Theme Mode
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Choose between high-clarity Light mode, deep eye-friendly Dark mode, or automatic sync with your operating system.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                  {[
                    { id: 'light' as ThemeMode, name: 'Light Mode', desc: 'Crisp, high-contrast surfaces', icon: Sun },
                    { id: 'dark' as ThemeMode, name: 'Dark Mode', desc: 'Deep obsidian & slate tones', icon: Moon },
                    { id: 'system' as ThemeMode, name: 'System Auto', desc: 'Syncs with device settings', icon: Monitor }
                  ].map((item) => {
                    const isSelected = themeMode === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setThemeMode(item.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          gap: '0.35rem',
                          padding: '0.85rem 0.65rem',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                          cursor: 'pointer',
                          boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-surface-hover)', color: isSelected ? '#ffffff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={16} />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: isSelected ? 800 : 600 }}>{item.name}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Colorway Section */}
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.15rem' }}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Palette size={15} style={{ color: 'var(--primary)' }} /> Brand Accent Colorway
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Select your institutional or preferred colorway. All buttons, active indicators, chart data points, and badges dynamically calibrate to your choice.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.65rem' }}>
                  {accentOptions.map((opt) => {
                    const isSelected = accentColor === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAccentColor(opt.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.75rem 0.85rem',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${opt.previewColor} 0%, ${opt.secondaryColor} 100%)`,
                            boxShadow: isSelected ? `0 0 0 2px var(--bg-surface), 0 0 10px ${opt.previewColor}99` : 'none',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 800 : 700, color: 'var(--text-primary)' }}>
                            {opt.name}
                          </span>
                          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', lineHeight: 1.15, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {opt.description}
                          </span>
                        </div>
                        {isSelected && <Check size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* TAB 1: EMAIL & DELIVERY */}
          {activeTab === 'email' && (
            <form onSubmit={handleSaveEmailConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Active Provider Selector */}
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <b style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }}>Email Transmission Provider</b>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Choose active backend to send evaluation links</span>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${emailService === 'brevo' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setEmailService('brevo')}
                    style={{ fontSize: '0.74rem', height: '28px', padding: '0 0.65rem' }}
                  >
                    Brevo REST API
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${emailService === 'emailjs' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setEmailService('emailjs')}
                    style={{ fontSize: '0.74rem', height: '28px', padding: '0 0.65rem' }}
                  >
                    EmailJS
                  </button>
                </div>
              </div>

              {/* Brevo Settings Card */}
              <div style={{ backgroundColor: 'var(--bg-app)', border: `1.5px solid ${emailService === 'brevo' ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: '8px', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={14} className="text-teal" /> Brevo REST API Configuration
                  </span>
                  <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                    Get API Key <ExternalLink size={11} />
                  </a>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.25rem' }}>Brevo v3 API Key (xkeysib-...)</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxx"
                    value={brevoApiKey}
                    onChange={(e) => setBrevoApiKey(e.target.value)}
                    style={{ fontSize: '0.8rem', height: '34px', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.25rem' }}>Sender Verified Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="professor@university.edu"
                      value={brevoSenderEmail}
                      onChange={(e) => setBrevoSenderEmail(e.target.value)}
                      style={{ fontSize: '0.8rem', height: '34px' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.25rem' }}>Sender Display Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Prof. Dhruv Dangi"
                      value={brevoSenderName}
                      onChange={(e) => setBrevoSenderName(e.target.value)}
                      style={{ fontSize: '0.8rem', height: '34px' }}
                    />
                  </div>
                </div>
              </div>

              {/* EmailJS Settings Card */}
              <div style={{ backgroundColor: 'var(--bg-app)', border: `1.5px solid ${emailService === 'emailjs' ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: '8px', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>EmailJS Integration (Alternative)</span>
                  <a href="https://dashboard.emailjs.com" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                    EmailJS Dashboard <ExternalLink size={11} />
                  </a>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.2rem' }}>Service ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="service_xxx"
                      value={emailJsServiceId}
                      onChange={(e) => setEmailJsServiceId(e.target.value)}
                      style={{ fontSize: '0.78rem', height: '32px' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.2rem' }}>Template ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="template_xxx"
                      value={emailJsTemplateId}
                      onChange={(e) => setEmailJsTemplateId(e.target.value)}
                      style={{ fontSize: '0.78rem', height: '32px' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.2rem' }}>Public Key</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="public_key_xxx"
                      value={emailJsPublicKey}
                      onChange={(e) => setEmailJsPublicKey(e.target.value)}
                      style={{ fontSize: '0.78rem', height: '32px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ height: '36px', padding: '0 1.15rem', fontWeight: 700, fontSize: '0.8rem', gap: '0.35rem' }}>
                  <Check size={14} /> Save Email Settings
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CLOUD SYNC */}
          {activeTab === 'cloud' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Cloud Status Banner */}
              <div 
                style={{ 
                  padding: '0.85rem 1rem', 
                  borderRadius: '8px', 
                  backgroundColor: isCloudSynced ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-app)', 
                  border: `1px solid ${isCloudSynced ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isCloudSynced ? '#10b981' : 'var(--border-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isCloudSynced ? <ShieldCheck size={16} /> : <Cloud size={16} />}
                  </div>
                  <div>
                    <b style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }}>
                      {isCloudSynced ? 'Live Firebase Cloud Sync Active' : 'Local Offline Mode'}
                    </b>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {isCloudSynced 
                        ? 'All classrooms and evaluations sync automatically across all devices.' 
                        : 'Data is saved in this browser. Connect Firebase for multi-device sync.'}
                    </span>
                  </div>
                </div>

                {isCloudSynced && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleDisconnectFirebase} style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)', height: '28px', fontSize: '0.74rem' }}>
                    Disconnect Cloud
                  </button>
                )}
              </div>

              {/* Firebase Form */}
              <form onSubmit={handleSaveFirebase} style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>Firebase Firestore Credentials</span>
                  <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                    Firebase Console <ExternalLink size={11} />
                  </a>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.2rem' }}>API Key *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="AIzaSy..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      style={{ fontSize: '0.8rem', height: '34px', fontFamily: 'monospace' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.2rem' }}>Project ID *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="my-peerlens-project"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      style={{ fontSize: '0.8rem', height: '34px' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.2rem' }}>Auth Domain</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="my-peerlens.firebaseapp.com"
                      value={authDomain}
                      onChange={(e) => setAuthDomain(e.target.value)}
                      style={{ fontSize: '0.8rem', height: '34px' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.2rem' }}>App ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="1:123456789:web:abcdef"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      style={{ fontSize: '0.8rem', height: '34px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ height: '34px', padding: '0 1.15rem', fontWeight: 700, fontSize: '0.8rem', gap: '0.35rem' }}>
                    <Cloud size={14} /> Connect Firebase Sync
                  </button>
                </div>
              </form>

              {/* Data Backup Section */}
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem' }}>
                <div>
                  <b style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }}>Standalone JSON Workspace Backup</b>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Export all classrooms, student submissions, and rubrics.</span>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportJSON} style={{ height: '32px', gap: '0.35rem', fontWeight: 700, fontSize: '0.76rem' }}>
                  <Download size={13} /> Export .json
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: KEYBOARD SHORTCUTS */}
          {activeTab === 'shortcuts' && (() => {
            const activeDefaultsCount = DEFAULT_KEYBOARD_SHORTCUTS.filter(d => shortcuts.some(s => s.id === d.id)).length;
            const removedDefaultsCount = DEFAULT_KEYBOARD_SHORTCUTS.length - activeDefaultsCount;
            const customCount = shortcuts.filter(s => s.isCustom).length;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <b style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Customizable Keybindings</b>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {shortcuts.length} active shortcuts {customCount > 0 ? `(${customCount} custom) ` : ''}{removedDefaultsCount > 0 ? `• ${removedDefaultsCount} premade deleted ` : ''}• Click any key badge to quick-remap, or use Edit/Delete buttons.
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setIsAddingShortcut(prev => !prev);
                        if (!isAddingShortcut) {
                          setNewActionId('tab_hub');
                          const def = AVAILABLE_SHORTCUT_ACTIONS.find(a => a.id === 'tab_hub');
                          setNewShortcutKey(def?.suggestedKey || 'h');
                          setNewModifiers(def?.suggestedModifiers || {});
                        }
                      }}
                      style={{ height: '28px', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700 }}
                    >
                      <Plus size={13} /> {isAddingShortcut ? 'Close Form' : 'Add Custom Shortcut'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        onResetShortcuts();
                        setEditingShortcutId(null);
                        addToast('Reset keyboard shortcuts to default layout.', 'info');
                      }}
                      style={{ height: '28px', gap: '0.25rem', fontSize: '0.72rem', fontWeight: 600 }}
                    >
                      <RotateCcw size={12} /> Reset Defaults
                    </button>
                  </div>
                </div>

              {/* CARD: ADD CUSTOM SHORTCUT FORM */}
              {isAddingShortcut && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1.5px solid var(--primary)',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Sparkles size={15} style={{ color: 'var(--primary)' }} /> Add Custom Shortcut
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingShortcut(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* STEP 1: SELECT ACTION */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        1. Select Function / Action to Trigger:
                      </label>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {AVAILABLE_SHORTCUT_ACTIONS.length} system actions available
                      </span>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Search actions (e.g. excel, projector, ipaf, rubrics, students)..."
                        value={actionSearchQuery}
                        onChange={(e) => setActionSearchQuery(e.target.value)}
                        style={{ paddingLeft: '30px', height: '32px', fontSize: '0.76rem', borderRadius: '6px' }}
                      />
                    </div>

                    {/* Action Selector Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto', padding: '2px' }}>
                      {AVAILABLE_SHORTCUT_ACTIONS.filter(a => {
                        if (!actionSearchQuery.trim()) return true;
                        const q = actionSearchQuery.toLowerCase().trim();
                        return a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
                      }).map((action) => {
                        const isSelected = newActionId === action.id;
                        return (
                          <div
                            key={action.id}
                            onClick={() => {
                              setNewActionId(action.id);
                              if (action.suggestedKey && !newShortcutKey) {
                                setNewShortcutKey(action.suggestedKey);
                                setNewModifiers(action.suggestedModifiers || {});
                              }
                            }}
                            style={{
                              padding: '0.45rem 0.6rem',
                              borderRadius: '6px',
                              border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                              backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.15rem',
                              transition: 'all 0.12s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                                {action.label}
                              </span>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                {action.category}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.25 }}>
                              {action.description}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 2: ASSIGN KEY COMBINATION */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      2. Assign Shortcut Key Combination:
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {/* Record Key Button */}
                      <button
                        type="button"
                        onClick={() => setIsRecordingNewKey(true)}
                        style={{
                          height: '36px',
                          padding: '0 1rem',
                          borderRadius: '6px',
                          border: isRecordingNewKey ? '2px solid var(--primary)' : '1.5px solid var(--border-color)',
                          backgroundColor: isRecordingNewKey ? 'var(--primary)' : 'var(--bg-surface)',
                          color: isRecordingNewKey ? '#ffffff' : 'var(--text-primary)',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: isRecordingNewKey ? '0 0 12px rgba(79, 70, 229, 0.4)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Key size={14} />
                        {isRecordingNewKey 
                          ? 'Listening... Press any key combination on keyboard (or Esc)' 
                          : (newShortcutKey ? `Key: ${formatShortcutDisplay(newShortcutKey, newModifiers)}` : 'Click to Record Keystroke')}
                      </button>

                      {/* Modifier Checkboxes */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', backgroundColor: 'var(--bg-surface)', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!!newModifiers.ctrl}
                            onChange={(e) => setNewModifiers(prev => ({ ...prev, ctrl: e.target.checked }))}
                          />
                          Ctrl / ⌘
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!!newModifiers.alt}
                            onChange={(e) => setNewModifiers(prev => ({ ...prev, alt: e.target.checked }))}
                          />
                          Alt
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!!newModifiers.shift}
                            onChange={(e) => setNewModifiers(prev => ({ ...prev, shift: e.target.checked }))}
                          />
                          Shift
                        </label>
                      </div>

                      {/* Manual Key Input */}
                      <input
                        type="text"
                        placeholder="Key (e.g. k, p, 1)"
                        value={newShortcutKey}
                        onChange={(e) => setNewShortcutKey(e.target.value.trim().slice(0, 10))}
                        style={{ width: '90px', height: '36px', textAlign: 'center', fontWeight: 800, fontSize: '0.8rem', fontFamily: 'monospace', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
                      />
                    </div>

                    {/* Conflict Warning */}
                    {newShortcutKey && shortcuts.some(s => {
                      if (s.key.toLowerCase() !== newShortcutKey.toLowerCase()) return false;
                      const sCtrl = !!s.modifiers?.ctrl;
                      const sAlt = !!s.modifiers?.alt;
                      const sShift = !!s.modifiers?.shift;
                      const nCtrl = !!newModifiers.ctrl;
                      const nAlt = !!newModifiers.alt;
                      const nShift = !!newModifiers.shift;
                      return sCtrl === nCtrl && sAlt === nAlt && sShift === nShift;
                    }) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.65rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.72rem', color: '#b45309' }}>
                        <AlertCircle size={13} style={{ flexShrink: 0 }} />
                        <span>
                          Notice: Key combination is currently mapped to &quot;{shortcuts.find(s => {
                            if (s.key.toLowerCase() !== newShortcutKey.toLowerCase()) return false;
                            const sCtrl = !!s.modifiers?.ctrl;
                            const sAlt = !!s.modifiers?.alt;
                            const sShift = !!s.modifiers?.shift;
                            const nCtrl = !!newModifiers.ctrl;
                            const nAlt = !!newModifiers.alt;
                            const nShift = !!newModifiers.shift;
                            return sCtrl === nCtrl && sAlt === nAlt && sShift === nShift;
                          })?.label}&quot;. Saving will reassign it to this new action.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Form Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setIsAddingShortcut(false);
                        setIsRecordingNewKey(false);
                      }}
                      style={{ height: '30px', fontSize: '0.74rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={!newShortcutKey}
                      onClick={() => {
                        if (!newShortcutKey) {
                          addToast('Please assign a shortcut key first.', 'warning');
                          return;
                        }

                        const actionDef = AVAILABLE_SHORTCUT_ACTIONS.find(a => a.id === newActionId);
                        if (!actionDef) return;

                        const hasMods = !!(newModifiers.ctrl || newModifiers.alt || newModifiers.shift);
                        const newId = `custom_${newActionId}_${Date.now()}`;

                        // Remove any existing shortcut mapping the exact same key
                        const filtered = shortcuts.filter(s => {
                          if (s.key.toLowerCase() !== newShortcutKey.toLowerCase()) return true;
                          const sCtrl = !!s.modifiers?.ctrl;
                          const sAlt = !!s.modifiers?.alt;
                          const sShift = !!s.modifiers?.shift;
                          const nCtrl = !!newModifiers.ctrl;
                          const nAlt = !!newModifiers.alt;
                          const nShift = !!newModifiers.shift;
                          return !(sCtrl === nCtrl && sAlt === nAlt && sShift === nShift);
                        });

                        const newShortcut: KeyboardShortcut = {
                          id: newId,
                          actionId: actionDef.id,
                          label: actionDef.label,
                          category: 'Custom',
                          key: newShortcutKey,
                          modifiers: hasMods ? newModifiers : undefined,
                          description: actionDef.description,
                          isCustom: true
                        };

                        onUpdateShortcuts([...filtered, newShortcut]);
                        setIsAddingShortcut(false);
                        setNewShortcutKey('');
                        setNewModifiers({});
                        setIsRecordingNewKey(false);
                        addToast(`Assigned ${formatShortcutDisplay(newShortcutKey, newModifiers)} to "${actionDef.label}"!`, 'success');
                      }}
                      style={{ height: '30px', fontSize: '0.74rem', fontWeight: 700, opacity: !newShortcutKey ? 0.6 : 1 }}
                    >
                      <Check size={13} /> Save &amp; Enable Shortcut
                    </button>
                  </div>
                </div>
              )}

              {/* Inline Remap Recording Banner */}
              {recordingShortcutId && (
                <div style={{ padding: '0.6rem 0.85rem', backgroundColor: 'var(--primary-light)', border: '1.5px dashed var(--primary)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Key size={14} /> Press any key for &quot;{shortcuts.find(s => s.id === recordingShortcutId)?.label}&quot; (or Esc to cancel)...
                  </span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRecordingShortcutId(null)} style={{ height: '24px', fontSize: '0.7rem', padding: '0 0.5rem' }}>
                    Cancel
                  </button>
                </div>
              )}

              {/* Grouped Shortcuts */}
              {(['Custom', 'Navigation', 'Tools & Modals', 'Roster & Teams', 'Rubric & Scales', 'Grading & Analytics', 'Layout & Presets', 'General'] as const).map((category) => {
                const groupShortcuts = shortcuts.filter(s => {
                  if (category === 'Custom') return s.isCustom || s.category === 'Custom';
                  return !s.isCustom && s.category === category;
                });
                if (groupShortcuts.length === 0) return null;

                return (
                  <div key={category} style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: category === 'Custom' ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {category === 'Custom' ? 'Custom User Shortcuts' : category}
                      </span>
                      {category === 'Custom' && (
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                          User Defined
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.45rem' }}>
                      {groupShortcuts.map((shortcut) => {
                        const isRecording = recordingShortcutId === shortcut.id;
                        const isEditingThis = editingShortcutId === shortcut.id;
                        return (
                          <React.Fragment key={shortcut.id}>
                            <div 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                padding: '0.45rem 0.6rem', 
                                backgroundColor: isEditingThis ? 'var(--primary-light)' : '#ffffff', 
                                border: `1px solid ${isRecording || isEditingThis ? 'var(--primary)' : 'var(--border-color)'}`,
                                borderRadius: '6px',
                                gap: '0.4rem',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 700 }}>{shortcut.label}</span>
                                {shortcut.description && (
                                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {shortcut.description}
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                                {/* Quick Remap Badge */}
                                <button
                                  type="button"
                                  onClick={() => setRecordingShortcutId(shortcut.id)}
                                  style={{
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: isRecording ? 'var(--primary)' : 'var(--bg-app)',
                                    color: isRecording ? '#fff' : 'var(--primary)',
                                    borderRadius: '5px',
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    fontFamily: 'monospace',
                                    cursor: 'pointer'
                                  }}
                                  title="Click to remap key instantly"
                                >
                                  {isRecording ? 'Listening...' : formatShortcutDisplay(shortcut.key, shortcut.modifiers)}
                                </button>

                                {/* Edit Button for ALL shortcuts (premade or custom) */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isEditingThis) {
                                      setEditingShortcutId(null);
                                      setIsRecordingEditKey(false);
                                    } else {
                                      setEditingShortcutId(shortcut.id);
                                      setEditActionId(shortcut.actionId || shortcut.id);
                                      setEditShortcutKey(shortcut.key);
                                      setEditModifiers(shortcut.modifiers || {});
                                      setIsRecordingEditKey(false);
                                      setIsAddingShortcut(false);
                                      setRecordingShortcutId(null);
                                    }
                                  }}
                                  style={{
                                    background: isEditingThis ? 'var(--primary)' : 'transparent',
                                    border: 'none',
                                    color: isEditingThis ? '#ffffff' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '3px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Edit shortcut key, modifiers, or action"
                                >
                                  <Edit2 size={13} />
                                </button>

                                {/* Delete Button for ALL shortcuts (premade or custom) */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = shortcuts.filter(s => s.id !== shortcut.id);
                                    onUpdateShortcuts(updated);
                                    if (editingShortcutId === shortcut.id) {
                                      setEditingShortcutId(null);
                                    }
                                    addToast(`Removed shortcut for "${shortcut.label}"`, 'info');
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                                  title={shortcut.isCustom ? "Delete custom shortcut" : "Delete premade shortcut (you can restore anytime with Reset Defaults)"}
                                >
                                  <Trash2 size={13} className="text-rose" />
                                </button>
                              </div>
                            </div>

                            {/* INLINE EDIT DRAWER */}
                            {isEditingThis && (
                              <div
                                style={{
                                  gridColumn: '1 / -1',
                                  backgroundColor: 'var(--bg-app)',
                                  border: '1.5px solid var(--primary)',
                                  borderRadius: '8px',
                                  padding: '0.75rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.6rem',
                                  marginTop: '0.15rem',
                                  marginBottom: '0.35rem',
                                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.08)'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Edit2 size={13} /> Edit Shortcut: &quot;{shortcut.label}&quot;
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingShortcutId(null)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                  >
                                    <X size={13} />
                                  </button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  {/* Record Keystroke Button */}
                                  <button
                                    type="button"
                                    onClick={() => setIsRecordingEditKey(true)}
                                    style={{
                                      height: '32px',
                                      padding: '0 0.85rem',
                                      borderRadius: '6px',
                                      border: isRecordingEditKey ? '2px solid var(--primary)' : '1.5px solid var(--border-color)',
                                      backgroundColor: isRecordingEditKey ? 'var(--primary)' : 'var(--bg-surface)',
                                      color: isRecordingEditKey ? '#ffffff' : 'var(--text-primary)',
                                      fontSize: '0.76rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      boxShadow: isRecordingEditKey ? '0 0 10px rgba(79, 70, 229, 0.35)' : 'none'
                                    }}
                                  >
                                    <Key size={13} />
                                    {isRecordingEditKey 
                                      ? 'Press any key on keyboard (or Esc)...' 
                                      : (editShortcutKey ? `Key: ${formatShortcutDisplay(editShortcutKey, editModifiers)}` : 'Click to Record Key')}
                                  </button>

                                  {/* Modifier Checkboxes */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: 'var(--bg-surface)', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        checked={!!editModifiers.ctrl}
                                        onChange={(e) => setEditModifiers(prev => ({ ...prev, ctrl: e.target.checked }))}
                                      />
                                      Ctrl / ⌘
                                    </label>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        checked={!!editModifiers.alt}
                                        onChange={(e) => setEditModifiers(prev => ({ ...prev, alt: e.target.checked }))}
                                      />
                                      Alt
                                    </label>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        checked={!!editModifiers.shift}
                                        onChange={(e) => setEditModifiers(prev => ({ ...prev, shift: e.target.checked }))}
                                      />
                                      Shift
                                    </label>
                                  </div>

                                  {/* Manual Key Input */}
                                  <input
                                    type="text"
                                    placeholder="Key"
                                    value={editShortcutKey}
                                    onChange={(e) => setEditShortcutKey(e.target.value.trim().slice(0, 10))}
                                    style={{ width: '80px', height: '32px', textAlign: 'center', fontWeight: 800, fontSize: '0.76rem', fontFamily: 'monospace', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
                                  />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setEditingShortcutId(null)}
                                    style={{ height: '26px', fontSize: '0.72rem' }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    disabled={!editShortcutKey}
                                    onClick={() => {
                                      if (!editShortcutKey) {
                                        addToast('Please assign a shortcut key.', 'warning');
                                        return;
                                      }
                                      const hasMods = !!(editModifiers.ctrl || editModifiers.alt || editModifiers.shift);
                                      const actionDef = AVAILABLE_SHORTCUT_ACTIONS.find(a => a.id === editActionId);

                                      const updated = shortcuts.map(s => {
                                        if (s.id === shortcut.id) {
                                          return {
                                            ...s,
                                            key: editShortcutKey,
                                            modifiers: hasMods ? editModifiers : undefined,
                                            actionId: editActionId || s.actionId,
                                            label: actionDef ? actionDef.label : s.label,
                                            description: actionDef ? actionDef.description : s.description
                                          };
                                        }
                                        return s;
                                      });

                                      onUpdateShortcuts(updated);
                                      setEditingShortcutId(null);
                                      setIsRecordingEditKey(false);
                                      addToast(`Updated shortcut for "${shortcut.label}"!`, 'success');
                                    }}
                                    style={{ height: '26px', fontSize: '0.72rem', fontWeight: 700 }}
                                  >
                                    <Check size={12} /> Save Changes
                                  </button>
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        </div>

        {/* Footer */}
        <div style={{ padding: '0.65rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--bg-surface)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ height: '32px', padding: '0 1.15rem', fontWeight: 700, fontSize: '0.8rem' }}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettingsModal;
