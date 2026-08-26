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

        {/* Shareable Link Input with Copy Button */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Direct Sharable Link</span>
            {enrolledCount > 0 && (
              <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>
                <Users size={11} style={{ marginRight: '3px' }} /> {enrolledCount} Students Enrolled
              </span>
            )}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              readOnly 
              value={enrollUrl} 
              className="form-input" 
              style={{ fontSize: '0.82rem', fontFamily: 'monospace', background: 'var(--bg-app)', color: 'var(--text-main)' }}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button 
              type="button"
              className={`btn ${copied ? 'btn-teal' : 'btn-primary'}`} 
              onClick={handleCopyLink}
              style={{ flexShrink: 0, minWidth: '110px', justifyContent: 'center' }}
            >
              {copied ? (
                <>
                  <Check size={16} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', width: '100%', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadQR}
              title="Download QR code image for lecture slides or syllabus handouts"
            >
              <Download size={15} /> Download PNG
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${presentationMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPresentationMode(!presentationMode)}
            >
              <QrCode size={15} /> {presentationMode ? 'Standard View' : 'Large Screen Mode'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a 
              href={enrollUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary btn-sm"
            >
              <ExternalLink size={15} /> Open Portal <span style={{ opacity: 0.7 }}>(Preview)</span>
            </a>
            <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
              Done
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default ClassQRCodeModal;
