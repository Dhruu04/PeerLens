// src/components/ClassroomSnapshotsModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  History, Camera, RotateCcw, Download, Trash2, X, 
  Check, AlertTriangle, Users, FileCheck, Layers, Upload, Calendar 
} from 'lucide-react';
import type { ClassData } from '../utils/math';
import { 
  getClassroomSnapshots, 
  saveClassroomSnapshot, 
  deleteClassroomSnapshot, 
  exportSnapshotToFile, 
  type ClassroomSnapshot 
} from '../utils/classroomSnapshots';

interface ClassroomSnapshotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData | null;
  onRestore: (restoredData: ClassData) => void;
  onToast: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ClassroomSnapshotsModal: React.FC<ClassroomSnapshotsModalProps> = ({
  isOpen,
  onClose,
  classData,
  onRestore,
  onToast
}) => {
  const [snapshots, setSnapshots] = useState<ClassroomSnapshot[]>([]);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotNotes, setNewSnapshotNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (classData) {
      setSnapshots(getClassroomSnapshots(classData.id));
    }
  }, [classData, isOpen]);

  if (!isOpen || !classData) return null;

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    const snap = saveClassroomSnapshot(classData, newSnapshotName, newSnapshotNotes);
    setSnapshots(getClassroomSnapshots(classData.id));
    setNewSnapshotName('');
    setNewSnapshotNotes('');
    setIsCreating(false);
    onToast(`Saved snapshot checkpoint "${snap.name}"!`, 'success');
  };

  const handleDelete = (id: string, name: string) => {
    deleteClassroomSnapshot(classData.id, id);
    setSnapshots(getClassroomSnapshots(classData.id));
    onToast(`Deleted snapshot "${name}".`, 'info');
  };

  const handleRestore = (snap: ClassroomSnapshot) => {
    onRestore(snap.data);
    setConfirmRestoreId(null);
    onToast(`Restored classroom state from "${snap.name}"!`, 'success');
    onClose();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.data && parsed.data.students) {
          // It's a snapshot export
          const snap = saveClassroomSnapshot(
            parsed.data, 
            parsed.name ? `Imported: ${parsed.name}` : `Imported ${file.name.replace('.json', '')}`
          );
          setSnapshots(getClassroomSnapshots(classData.id));
          onToast(`Imported checkpoint "${snap.name}"!`, 'success');
        } else if (parsed.students && parsed.id) {
          // Direct class JSON backup
          const snap = saveClassroomSnapshot(
            parsed, 
            `Imported Backup: ${file.name.replace('.json', '')}`
          );
          setSnapshots(getClassroomSnapshots(classData.id));
          onToast(`Imported backup as checkpoint "${snap.name}"!`, 'success');
        } else {
          onToast('Invalid JSON file format for snapshot restore.', 'error');
        }
      } catch {
        onToast('Failed to parse snapshot JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        className="modal-content card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <History size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Classroom State Snapshots &amp; Rollback
              </h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Create point-in-time checkpoints for "{classData.name}" to safely revert grading or roster changes
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Action Strip: Create Checkpoint & Import */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Saved Checkpoints ({snapshots.length})
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                Stored locally in browser for quick rollback
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportFile} 
                accept=".json" 
                style={{ display: 'none' }} 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.35rem', fontSize: '0.78rem', fontWeight: 650 }}
                title="Import JSON snapshot from file"
              >
                <Upload size={13} /> Import JSON
              </button>

              <button
                type="button"
                onClick={() => setIsCreating(!isCreating)}
                className="btn btn-primary btn-sm"
                style={{ gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700 }}
              >
                <Camera size={13} /> Take Snapshot Now
              </button>
            </div>
          </div>

          {/* Create Form Drawer */}
          {isCreating && (
            <form 
              onSubmit={handleCreateSnapshot}
              style={{
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                <Camera size={15} className="text-primary" /> Create Point-in-Time Checkpoint
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Checkpoint Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`e.g. Pre-Midterm Grading Curve (${new Date().toLocaleDateString()})`}
                    value={newSnapshotName}
                    onChange={(e) => setNewSnapshotName(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Optional Notes
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Clean roster before excused students added"
                    value={newSnapshotNotes}
                    onChange={(e) => setNewSnapshotNotes(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700 }}
                >
                  <Check size={13} /> Save Checkpoint
                </button>
              </div>
            </form>
          )}

          {/* Snapshots List */}
          {snapshots.length === 0 ? (
            <div 
              style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '12px',
                border: '1px dashed var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <History size={32} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                No Checkpoints Created Yet
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '380px' }}>
                Snapshots allow you to preserve current submissions, roster groupings, and rubric weights before making major changes.
              </p>
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.5rem', gap: '0.35rem', fontWeight: 700 }}
              >
                <Camera size={13} /> Create First Snapshot
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {snapshots.map((snap) => {
                const isConfirming = confirmRestoreId === snap.id;
                const formattedDate = new Date(snap.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={snap.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--bg-app)',
                      border: `1px solid ${isConfirming ? 'var(--primary)' : 'var(--border-color)'}`,
                      borderRadius: '12px',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                            {snap.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Calendar size={11} /> {formattedDate}
                          </span>
                        </div>
                        {snap.notes && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            {snap.notes}
                          </div>
                        )}
                      </div>

                      {/* Badges: Student, Review, Group counts */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-secondary" style={{ fontSize: '0.68rem', gap: '0.2rem' }}>
                          <Users size={10} /> {snap.studentCount} Students
                        </span>
                        <span className="badge badge-teal" style={{ fontSize: '0.68rem', gap: '0.2rem' }}>
                          <FileCheck size={10} /> {snap.reviewCount} Reviews
                        </span>
                        <span className="badge badge-primary" style={{ fontSize: '0.68rem', gap: '0.2rem' }}>
                          <Layers size={10} /> {snap.groupCount} Teams
                        </span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.45rem', borderTop: '1px solid var(--border-color)', marginTop: '0.2rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => exportSnapshotToFile(snap)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem', gap: '0.3rem' }}
                          title="Export snapshot to downloadable JSON file"
                        >
                          <Download size={12} /> Export JSON
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(snap.id, snap.name)}
                          className="btn btn-secondary btn-sm text-danger"
                          style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem', gap: '0.3rem' }}
                          title="Delete snapshot"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>

                      {/* Restore Action with Safety Confirmation */}
                      <div>
                        {isConfirming ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <AlertTriangle size={12} /> Overwrite current state?
                            </span>
                            <button
                              type="button"
                              onClick={() => setConfirmRestoreId(null)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRestore(snap)}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', fontWeight: 700, gap: '0.25rem' }}
                            >
                              <RotateCcw size={12} /> Confirm Restore
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmRestoreId(snap.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.74rem', padding: '0.25rem 0.65rem', fontWeight: 700, gap: '0.3rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                          >
                            <RotateCcw size={12} /> Rollback to This Checkpoint
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div 
          style={{
            padding: '0.9rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-app)'
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            PeerLens keeps the latest 25 snapshots per classroom.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 650 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
