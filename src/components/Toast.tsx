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
        return <CheckCircle2 size={18} className="text-teal" />;
      case 'error':
        return <XCircle size={18} className="text-rose" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber" />;
      default:
        return <Info size={18} className="text-indigo" />;
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            {getIcon(t.type)}
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t.message}</span>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: '2px'
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
export default ToastContainer;
