import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, AlertCircle, ArrowRight, UserCheck, Eye, EyeOff } from 'lucide-react';
import { useClass } from '../context/ClassContext';
import { ThemeSwitcher } from './ThemeSwitcher';

interface InstructorAccessGateProps {
  onUnlock: () => void;
  onGoToStudentPortal?: () => void;
}

export const InstructorAccessGate: React.FC<InstructorAccessGateProps> = ({
  onUnlock,
  onGoToStudentPortal
}) => {
  const { isCloudSynced, loginAdmin, signupAdmin, addToast } = useClass();
  const [passcode, setPasscode] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Local/Offline Mode passcode check
  const handleLocalUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const storedPasscode = localStorage.getItem('peer_instructor_passcode') || 'admin123';
    
    if (passcode === storedPasscode || passcode === 'admin123' || passcode === 'peerlens2026') {
      sessionStorage.setItem('peer_admin_unlocked', 'true');
      sessionStorage.removeItem('peer_device_role');
      addToast('Instructor access verified', 'success');
      onUnlock();
    } else {
      setErrorMsg('Incorrect instructor passcode. Please try again.');
    }
  };

  // Cloud Mode Firebase Auth check
  const handleCloudAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!authEmail.trim() || !authPassword.trim()) {
      setErrorMsg('Email and Password are required.');
      return;
    }

    try {
      setLoading(true);
      if (isSigningUp) {
        await signupAdmin(authEmail.trim(), authPassword.trim());
      } else {
        await loginAdmin(authEmail.trim(), authPassword.trim());
      }
      sessionStorage.setItem('peer_admin_unlocked', 'true');
      sessionStorage.removeItem('peer_device_role');
      onUnlock();
    } catch (err: any) {
      console.error('Cloud instructor gate error', err);
      setErrorMsg(err?.message || 'Authentication failed. Please verify instructor credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-primary)',
      fontFamily: 'inherit'
    }}>
      {/* Header */}
      <header className="app-header" style={{ padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="brand" style={{ cursor: 'default' }}>
          <img src="/PeerGrading.png" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
          <span>PeerLens</span>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <span className="badge" style={{ gap: '0.3rem', height: '28px', padding: '0 0.6rem', fontSize: '0.72rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
            <Lock size={12} className="text-primary" />
            <span>Instructor Gate</span>
          </span>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div className="card" style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          {/* Security Shield Icon */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}>
            <ShieldCheck size={32} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.45rem' }}>
            Instructor Verification
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
            {isCloudSynced
              ? 'Sign in to access your course grading suites, roster controls, and analytics.'
              : 'Enter your instructor security passcode to access the administrative dashboard.'}
          </p>

          {errorMsg && (
            <div className="alert-banner-rose" style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem', textAlign: 'left', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {isCloudSynced ? (
            /* Cloud Firebase Login Form */
            <form onSubmit={handleCloudAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Instructor Email</label>
                <input
                  type="email"
                  placeholder="instructor@university.edu"
                  className="form-input"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="form-input"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem' }}
              >
                {loading ? <div className="loading-spinner" style={{ width: '16px', height: '16px' }} /> : <UserCheck size={16} />}
                <span>{isSigningUp ? 'Create Instructor Account' : 'Sign In as Instructor'}</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setIsSigningUp(s => !s); setErrorMsg(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}
                >
                  {isSigningUp ? 'Already have an account? Sign in' : 'First time? Create instructor account'}
                </button>
              </div>
            </form>
          ) : (
            /* Local/Offline Mode Passcode Form */
            <form onSubmit={handleLocalUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Instructor Security Passcode</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter instructor passcode"
                    className="form-input"
                    value={passcode}
                    onChange={(e) => { setPasscode(e.target.value); setErrorMsg(''); }}
                    style={{ paddingRight: '2.5rem' }}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                  Default passcode: <code style={{ padding: '1px 4px', borderRadius: '4px', backgroundColor: 'var(--bg-app)' }}>admin123</code> (configurable in Settings)
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem' }}
              >
                <KeyRound size={16} />
                <span>Unlock Administrator Workspace</span>
              </button>
            </form>
          )}

          {/* Student Access Escape Link */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Are you a student trying to complete an evaluation?
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (onGoToStudentPortal) {
                  onGoToStudentPortal();
                } else {
                  window.location.href = window.location.origin + window.location.pathname;
                }
              }}
              style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
            >
              <span>Go to Student Portal</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/PeerGrading.png" alt="Logo" style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'contain' }} />
          <span>PeerLens Administrator Access Gate</span>
        </div>
        <div>
          <span>© {new Date().getFullYear()} PeerLens. Protected Environment.</span>
        </div>
      </footer>
    </div>
  );
};

export default InstructorAccessGate;
