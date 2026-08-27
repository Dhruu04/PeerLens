import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, Check, Download, ExternalLink, Sparkles, Smartphone, Users } from 'lucide-react';
import Modal from './Modal';

interface ClassQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  enrollUrl: string;
  enrolledCount?: number;
}

export const ClassQRCodeModal: React.FC<ClassQRCodeModalProps> = ({
  isOpen,
  onClose,
  classNameTitle,
  enrollUrl,
  enrolledCount = 0
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [presentationMode, setPresentationMode] = useState<boolean>(false);

  useEffect(() => {
    if (enrollUrl) {
      QRCode.toDataURL(enrollUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('Failed to generate QR code data URL:', err);
        });
    }
  }, [enrollUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(enrollUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `PeerLens_Enrollment_${classNameTitle.replace(/\s+/g, '_')}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Student Self-Enrollment: ${classNameTitle}`} maxWidth={presentationMode ? '820px' : '580px'}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem' }}>
        
        {/* Header Info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
            <Sparkles size={14} /> Instant Classroom Onboarding
          </div>
          <h3 style={{ margin: 0, fontSize: presentationMode ? '1.5rem' : '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Scan to Join <span style={{ color: 'var(--primary)' }}>{classNameTitle}</span>
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '440px' }}>
            Have students scan this QR code on their mobile devices or click the link below to enter their details and join the class roster.
          </p>
        </div>

        {/* QR Display Card */}
        <div 
          style={{
            position: 'relative',
            padding: presentationMode ? '2rem' : '1.25rem',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 36px -8px rgba(79, 70, 229, 0.18), 0 4px 12px rgba(0,0,0,0.06)',
            border: '2px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'all 0.3s ease'
          }}
        >
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt="Class Enrollment QR Code" 
              style={{
                width: presentationMode ? '340px' : '230px',
                height: presentationMode ? '340px' : '230px',
                borderRadius: '12px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          ) : (
            <div style={{ width: '230px', height: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              Generating QR Code...
            </div>
          )}

          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <Smartphone size={14} className="text-teal" /> Point camera to open student registration portal
          </div>
        </div>

        {/* Direct Sharable Link Input */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Direct Shareable Link</span>
            {enrolledCount > 0 && (
              <span className="badge badge-teal" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                <Users size={11} style={{ marginRight: '3px' }} /> {enrolledCount} Enrolled
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <input 
              type="text" 
              readOnly 
              value={enrollUrl} 
              className="form-input" 
              style={{ fontSize: '0.8rem', fontFamily: 'monospace', height: '36px', background: 'var(--bg-app)', color: 'var(--text-main)' }}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button 
              type="button"
              className={`btn ${copied ? 'btn-teal' : 'btn-primary'}`} 
              onClick={handleCopyLink}
              style={{ flexShrink: 0, height: '36px', padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 600, gap: '0.35rem' }}
            >
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
        </div>

        {/* Minimalized Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadQR}
              title="Download QR code image"
              style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.65rem', gap: '0.35rem' }}
            >
              <Download size={13} /> Download
            </button>
            <a 
              href={enrollUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary btn-sm"
              style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.65rem', gap: '0.35rem', textDecoration: 'none' }}
            >
              <ExternalLink size={13} /> Preview
            </a>
            <button 
              type="button" 
              className={`btn btn-sm ${presentationMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPresentationMode(!presentationMode)}
              style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.65rem', gap: '0.35rem' }}
            >
              <QrCode size={13} /> {presentationMode ? 'Standard' : 'Enlarge'}
            </button>
          </div>

          <button 
            type="button" 
            className="btn btn-primary btn-sm" 
            onClick={onClose}
            style={{ height: '32px', fontSize: '0.78rem', padding: '0 1rem', fontWeight: 700 }}
          >
            Done
          </button>
        </div>

      </div>
    </Modal>
  );
};

export default ClassQRCodeModal;
