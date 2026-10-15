import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Copy, Check, Download, ExternalLink,
  Smartphone, Sliders, Maximize2, Minimize2
} from 'lucide-react';
import Modal from './Modal';

interface ClassQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  enrollUrl: string;
  enrolledCount?: number;
  onOpenEnrollmentBuilder?: () => void;
}

export const ClassQRCodeModal: React.FC<ClassQRCodeModalProps> = ({
  isOpen,
  onClose,
  classNameTitle,
  enrollUrl,
  enrolledCount = 0,
  onOpenEnrollmentBuilder
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [presentationMode, setPresentationMode] = useState<boolean>(false);

  useEffect(() => {
    if (enrollUrl) {
      QRCode.toDataURL(enrollUrl, {
        width: 800,
        margin: 2,
        color: {
          dark: '#000000',
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
    setTimeout(() => setCopied(false), 2000);
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

  const qrSize = presentationMode ? 380 : 260;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Join Classroom: ${classNameTitle}`}
      maxWidth={presentationMode ? '780px' : '520px'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.15rem' }}>
        
        {/* Subtle Class Title & Enrolled Info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          <h3 style={{
            margin: 0,
            fontSize: presentationMode ? '1.5rem' : '1.2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em'
          }}>
            Scan to Join <span style={{ color: 'var(--primary)' }}>{classNameTitle}</span>
          </h3>
          <p style={{
            margin: 0,
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            {enrolledCount > 0 ? `${enrolledCount} students already enrolled • ` : ''}Scan with phone camera to join
          </p>
        </div>

        {/* High-Visibility QR Code Frame */}
        <div
          style={{
            position: 'relative',
            padding: presentationMode ? '1.5rem' : '1.1rem',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'all 200ms ease'
          }}
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Class Enrollment QR Code"
              style={{
                width: `${qrSize}px`,
                height: `${qrSize}px`,
                borderRadius: '8px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          ) : (
            <div style={{
              width: `${qrSize}px`,
              height: `${qrSize}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.82rem'
            }}>
              Generating QR Code...
            </div>
          )}

          <div style={{
            marginTop: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            fontWeight: 500
          }}>
            <Smartphone size={13} style={{ color: 'var(--text-secondary)' }} />
            <span>Point camera to open registration form</span>
          </div>
        </div>

        {/* Minimal Direct Shareable Link */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '0.35rem 0.5rem 0.35rem 0.85rem'
        }}>
          <input
            type="text"
            readOnly
            value={enrollUrl}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '0.78rem',
              fontFamily: 'monospace',
              color: 'var(--text-secondary)',
              outline: 'none'
            }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            title={copied ? 'Link Copied!' : 'Copy Shareable Link'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '7px',
              border: 'none',
              backgroundColor: copied ? '#10b981' : 'var(--primary)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 120ms ease',
              flexShrink: 0
            }}
          >
            {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
          </button>
        </div>

        {/* Minimal Icon-Only Bottom Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '0.85rem',
          marginTop: '0.2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Download QR Image */}
            <button
              type="button"
              onClick={handleDownloadQR}
              title="Download QR Code (PNG)"
              aria-label="Download QR Code (PNG)"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 120ms ease'
              }}
            >
              <Download size={16} />
            </button>

            {/* Preview Student Registration Form */}
            <a
              href={`${enrollUrl}${enrollUrl.includes('?') ? '&' : '?'}preview=true`}
              target="_blank"
              rel="noopener noreferrer"
              title="Preview Student Registration Form"
              aria-label="Preview Student Registration Form"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                transition: 'all 120ms ease'
              }}
            >
              <ExternalLink size={16} />
            </a>

            {/* Edit Questions Builder */}
            {onOpenEnrollmentBuilder && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEnrollmentBuilder();
                }}
                title="Edit Questions & Form Fields"
                aria-label="Edit Questions & Form Fields"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 120ms ease'
                }}
              >
                <Sliders size={16} />
              </button>
            )}

            {/* Enlarge / Projector Toggle */}
            <button
              type="button"
              onClick={() => setPresentationMode(!presentationMode)}
              title={presentationMode ? 'Switch to Compact View' : 'Enlarge for Projector'}
              aria-label={presentationMode ? 'Switch to Compact View' : 'Enlarge for Projector'}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: presentationMode ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-app)',
                color: presentationMode ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 120ms ease'
              }}
            >
              {presentationMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>

          {/* Done / Close Icon Button */}
          <button
            type="button"
            onClick={onClose}
            title="Done / Close"
            aria-label="Done / Close"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 120ms ease',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
            }}
          >
            <Check size={18} strokeWidth={2.5} />
          </button>
        </div>

      </div>
    </Modal>
  );
};

export default ClassQRCodeModal;
