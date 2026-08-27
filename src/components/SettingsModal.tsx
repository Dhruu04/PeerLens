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
  X
} from 'lucide-react';
import { useClass } from '../context/ClassContext';
import type { KeyboardShortcut } from '../utils/keyboardShortcuts';
import { formatShortcutDisplay } from '../utils/keyboardShortcuts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'email' | 'cloud' | 'shortcuts';
  shortcuts: KeyboardShortcut[];
  onUpdateShortcuts: (updated: KeyboardShortcut[]) => void;
  onResetShortcuts: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'email',
  shortcuts,
  onUpdateShortcuts,
  onResetShortcuts
}) => {
  const { 
    classes, 
    firebaseConfig, 
    saveFirebaseConfig, 
    isCloudSynced,
    addToast 
  } = useClass();

  const [activeTab, setActiveTab] = useState<'email' | 'cloud' | 'shortcuts'>(initialTab);
  
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

  // Lock body & document scroll and sync state on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      setActiveTab(initialTab);
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

  // Key recording listener
  useEffect(() => {
    if (!recordingShortcutId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingShortcutId(null);
        return;
      }

      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        return;
      }

      const keyVal = e.key.toLowerCase();
      const modifiers = {
        ctrl: e.ctrlKey || e.metaKey,
        alt: e.altKey,
        shift: e.shiftKey
      };

      const updated = shortcuts.map(s => {
        if (s.id === recordingShortcutId) {
          return {
            ...s,
            key: keyVal,
            modifiers: (modifiers.ctrl || modifiers.alt || modifiers.shift) ? modifiers : undefined
          };
        }
        return s;
      });

      onUpdateShortcuts(updated);
      setRecordingShortcutId(null);
      addToast(`Shortcut for "${shortcuts.find(s => s.id === recordingShortcutId)?.label}" updated!`, 'success');
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingShortcutId, shortcuts, onUpdateShortcuts, addToast]);

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
          maxWidth: '720px',
          maxHeight: '86vh',
          backgroundColor: '#ffffff',
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
            backgroundColor: '#ffffff'
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
                Manage Brevo email delivery, Firebase sync, and keyboard bindings.
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
        <div style={{ padding: '0.4rem 1.25rem', backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            style={{
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: activeTab === 'email' ? 700 : 600,
              borderRadius: '7px',
              border: activeTab === 'email' ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
              backgroundColor: activeTab === 'email' ? '#ffffff' : 'transparent',
              color: activeTab === 'email' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'email' ? '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' : 'none',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            <Mail size={13} /> Email &amp; Delivery
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            style={{
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: activeTab === 'cloud' ? 700 : 600,
              borderRadius: '7px',
              border: activeTab === 'cloud' ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
              backgroundColor: activeTab === 'cloud' ? '#ffffff' : 'transparent',
              color: activeTab === 'cloud' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'cloud' ? '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' : 'none',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            <Cloud size={13} /> Cloud Sync
            {isCloudSynced && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            style={{
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: activeTab === 'shortcuts' ? 700 : 600,
              borderRadius: '7px',
              border: activeTab === 'shortcuts' ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
              backgroundColor: activeTab === 'shortcuts' ? '#ffffff' : 'transparent',
              color: activeTab === 'shortcuts' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'shortcuts' ? '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' : 'none',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            <Keyboard size={13} /> Keyboard Shortcuts
            <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '1px 5px', borderRadius: '8px', backgroundColor: activeTab === 'shortcuts' ? 'var(--primary-light)' : 'rgba(0,0,0,0.06)', color: activeTab === 'shortcuts' ? 'var(--primary)' : 'var(--text-secondary)' }}>{shortcuts.length}</span>
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>
          
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
          {activeTab === 'shortcuts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <b style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Customizable Keybindings</b>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Click any shortcut badge to record a new key.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onResetShortcuts();
                    addToast('Reset keyboard shortcuts to default layout.', 'info');
                  }}
                  style={{ height: '28px', gap: '0.25rem', fontSize: '0.72rem', fontWeight: 600 }}
                >
                  <RotateCcw size={12} /> Reset Defaults
                </button>
              </div>

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
              {(['Navigation', 'Tools', 'Actions', 'General'] as const).map((category) => {
                const groupShortcuts = shortcuts.filter(s => s.category === category);
                if (groupShortcuts.length === 0) return null;

                return (
                  <div key={category} style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                      {category}
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.35rem' }}>
                      {groupShortcuts.map((shortcut) => {
                        const isRecording = recordingShortcutId === shortcut.id;
                        return (
                          <div 
                            key={shortcut.id}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              padding: '0.4rem 0.55rem', 
                              backgroundColor: '#ffffff', 
                              border: `1px solid ${isRecording ? 'var(--primary)' : 'var(--border-color)'}`,
                              borderRadius: '5px',
                              gap: '0.4rem'
                            }}
                          >
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600 }}>{shortcut.label}</span>

                            <button
                              type="button"
                              onClick={() => setRecordingShortcutId(shortcut.id)}
                              style={{
                                border: '1px solid var(--border-color)',
                                backgroundColor: isRecording ? 'var(--primary)' : 'var(--bg-app)',
                                color: isRecording ? '#fff' : 'var(--primary)',
                                borderRadius: '4px',
                                padding: '0.15rem 0.45rem',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                              title="Click to remap"
                            >
                              {isRecording ? 'Listening...' : formatShortcutDisplay(shortcut.key, shortcut.modifiers)}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '0.65rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#ffffff' }}>
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
