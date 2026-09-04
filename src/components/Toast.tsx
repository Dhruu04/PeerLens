import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, RotateCcw } from 'lucide-react';
import { useClass } from '../context/ClassContext';
import type { ToastMessage } from '../context/ClassContext';

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isPaused, setIsPaused] = useState(false);
  const totalDuration = toast.duration || (toast.action ? 30000 : 2800);
  const [remainingMs, setRemainingMs] = useState(totalDuration);

  // Interval to update countdown and progress
  useEffect(() => {
    if (!toast.action) return;

    const interval = setInterval(() => {
      if (!isPaused) {
        setRemainingMs((prev) => {
          const next = prev - 100;
          if (next <= 0) {
            clearInterval(interval);
            onRemove(toast.id);
            return 0;
          }
          return next;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [toast.id, toast.action, isPaused, onRemove]);

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

  const progressPct = Math.max(0, Math.min(100, (remainingMs / totalDuration) * 100));
  const secondsLeft = Math.max(1, Math.ceil(remainingMs / 1000));
  const hasAction = !!toast.action;

  return (
    <div
      className={`toast toast-${toast.type} ${hasAction ? 'toast-with-action' : ''}`}
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
        {getIcon(toast.type)}
        <span
          style={{
            fontSize: '0.76rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {toast.message}
        </span>
      </div>

      {hasAction && toast.action && (
        <button
          type="button"
          className="toast-undo-btn"
          onClick={() => {
            toast.action?.onClick();
            onRemove(toast.id);
          }}
          title="Press Ctrl+Z or click to undo this action"
        >
          <RotateCcw size={11} />
          <span>{toast.action.label}</span>
          <span style={{ opacity: 0.85, fontSize: '0.64rem', fontWeight: 800 }}>({secondsLeft}s)</span>
          <kbd
            style={{
              fontSize: '0.58rem',
              padding: '0.05rem 0.25rem',
              borderRadius: '3px',
              backgroundColor: 'rgba(0,0,0,0.12)',
              marginLeft: '0.15rem',
            }}
          >
            ⌘Z
          </kbd>
        </button>
      )}

      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
          marginLeft: '0.25rem',
          borderRadius: '50%',
          flexShrink: 0,
        }}
        title="Dismiss"
      >
        <X size={11} />
      </button>

      {/* Animated 30-second progress bar for action toasts */}
      {hasAction && (
        <div
          className="toast-progress-bar"
          style={{
            width: `${progressPct}%`,
            backgroundColor: toast.type === 'warning' ? '#f59e0b' : toast.type === 'error' ? '#f43f5e' : '#6366f1',
            transition: isPaused ? 'none' : 'width 100ms linear',
          }}
        />
      )}
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useClass();

  // Global Ctrl+Z / Cmd+Z shortcut to trigger active undo action
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }

        const undoToast = [...toasts].reverse().find((t) => t.action);
        if (undoToast && undoToast.action) {
          e.preventDefault();
          undoToast.action.onClick();
          removeToast(undoToast.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
