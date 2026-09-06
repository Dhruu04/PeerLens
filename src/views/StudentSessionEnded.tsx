import React, { useState } from 'react';
import { ShieldCheck, LogIn, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

interface StudentSessionEndedProps {
  reason?: 'manual_exit' | 'deleted' | 'expired';
  className?: string;
  onReEnterWithLink?: (url: string) => void;
}

export const StudentSessionEnded: React.FC<StudentSessionEndedProps> = ({
  reason = 'manual_exit',
  className,
  onReEnterWithLink
}) => {
  const [invitationLink, setInvitationLink] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isDeleted = reason === 'deleted';

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = invitationLink.trim();
    if (!trimmed) {
      setErrorMsg('Please paste a valid PeerLens link.');
      return;
    }

    try {
      // Check if it is a full URL or query string
      let parsedUrl: URL;
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        parsedUrl = new URL(trimmed);
      } else if (trimmed.includes('?') || trimmed.includes('classId=') || trimmed.includes('enrollClassId=')) {
        parsedUrl = new URL(`${window.location.origin}${window.location.pathname}${trimmed.startsWith('?') ? trimmed : '?' + trimmed}`);
      } else {
        setErrorMsg('Invalid link format. Expected a link with classId or enrollment link.');
        return;
      }

      const params = parsedUrl.searchParams;
      const classId = params.get('classId');
      const studentId = params.get('studentId');
      const enrollClassId = params.get('enrollClassId') || params.get('join');

      if ((classId && studentId) || enrollClassId) {
        if (onReEnterWithLink) {
          onReEnterWithLink(parsedUrl.toString());
        } else {
          window.location.href = parsedUrl.toString();
        }
      } else {
        setErrorMsg('The link does not contain required student or classroom credentials.');
      }
    } catch {
      setErrorMsg('Could not parse the provided link. Please double check and try again.');
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
      {/* Student Portal Header */}
      <header className="app-header" style={{ padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="brand" style={{ cursor: 'default' }}>
          <img src="/PeerGrading.png" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
          <span>PeerLens</span>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <span className="badge badge-teal" style={{ gap: '0.3rem', height: '28px', padding: '0 0.6rem', fontSize: '0.72rem' }}>
            <ShieldCheck size={13} />
            <span>Student Portal</span>
          </span>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div className="card" style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: isDeleted ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-color)'
        }}>
          {/* Status Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: isDeleted ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            color: isDeleted ? 'var(--accent-rose)' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            {isDeleted ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
          </div>

          {/* Heading */}
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.6rem' }}>
            {isDeleted ? 'Student Record Removed' : 'Session Ended'}
          </h2>

          {/* Description */}
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.92rem',
            lineHeight: 1.55,
            marginBottom: '1.75rem'
          }}>
            {isDeleted ? (
              <>
                Your student record has been removed from this classroom roster by the course instructor. You have been automatically and securely logged out of the student dashboard.
              </>
            ) : (
              <>
                You have safely logged out of your student evaluation session{className ? ` for ${className}` : ''}. All submitted responses and feedback remain securely saved under double-blind encryption.
              </>
            )}
          </p>

          {/* Re-enter link form toggle */}
          {!showInput ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowInput(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.25rem',
                  fontWeight: 600,
                  fontSize: '0.88rem'
                }}
              >
                <LogIn size={15} />
                <span>Re-enter with Evaluation Link</span>
              </button>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                To re-evaluate or view your progress report, use your personal link or QR code from your instructor.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLinkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Paste Personal Evaluation Link or Join URL:
              </label>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="https://.../?classId=...&studentId=..."
                  className="form-input"
                  style={{ flex: 1, fontSize: '0.82rem', padding: '0.55rem 0.75rem' }}
                  value={invitationLink}
                  onChange={(e) => { setInvitationLink(e.target.value); setErrorMsg(''); }}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', flexShrink: 0 }}
                >
                  <span>Go</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {errorMsg && (
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={13} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => { setShowInput(false); setErrorMsg(''); }}
                style={{ alignSelf: 'center', marginTop: '0.25rem', fontSize: '0.75rem' }}
              >
                Cancel
              </button>
            </form>
          )}

          {/* Privacy & Security Notice */}
          <div style={{
            marginTop: '2rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-color)',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem'
          }}>
            <ShieldCheck size={14} style={{ color: '#10b981', flexShrink: 0 }} />
            <span>Student Session Protected • Administrator Access Restricted</span>
          </div>
        </div>
      </main>

      {/* Dynamic Footer */}
      <footer className="app-footer" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/PeerGrading.png" alt="Logo" style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'contain' }} />
          <span>PeerLens Academic Peer Assessment</span>
        </div>
        <div>
          <span>© {new Date().getFullYear()} PeerLens. Double-Blind Anonymity.</span>
        </div>
      </footer>
    </div>
  );
};

export default StudentSessionEnded;
