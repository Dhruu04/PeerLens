import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useClass } from '../context/ClassContext';
import type { ToastMessage } from '../context/ClassContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useClass();

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={13} className="text-teal" style={{ flexShrink: 0 }} />;
      case 'error':
        return <XCircle size={13} className="text-rose" style={{ flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={13} className="text-amber" style={{ flexShrink: 0 }} />;
      default:
        return <Info size={13} className="text-indigo" style={{ flexShrink: 0 }} />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
            {getIcon(t.type)}
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.message}
            </span>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              marginLeft: '0.25rem',
              borderRadius: '50%'
            }}
            title="Dismiss"
          >
            <X size={11} />
          </button>
        </div>
      ))}
    </div>
  );
};
export default ToastContainer;
