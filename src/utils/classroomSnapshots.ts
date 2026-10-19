// src/utils/classroomSnapshots.ts
// Classroom Snapshots & Checkpoints Engine
// Allows professors to save named snapshot checkpoints (e.g. "Pre-review", "Midterm final", "Adjusted grades")
// and rollback with 1-click or export/import JSON backups.

import type { ClassData } from './math';

export interface ClassroomSnapshot {
  id: string;
  classId: string;
  name: string;
  notes?: string;
  createdAt: number;
  studentCount: number;
  reviewCount: number;
  groupCount: number;
  data: ClassData;
}

const STORAGE_PREFIX = 'peerlens_snapshots_v1_';
const EVENT_NAME = 'peerlens_snapshots_changed';

export function getClassroomSnapshots(classId?: string): ClassroomSnapshot[] {
  if (!classId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${classId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveClassroomSnapshot(
  classData: ClassData, 
  name?: string, 
  notes?: string
): ClassroomSnapshot {
  const current = getClassroomSnapshots(classData.id);
  const groups = new Set(classData.students.map(s => s.groupName).filter(Boolean));
  
  const snapshot: ClassroomSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    classId: classData.id,
    name: name?.trim() || `Snapshot ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    notes: notes?.trim(),
    createdAt: Date.now(),
    studentCount: classData.students.length,
    reviewCount: classData.reviews.length,
    groupCount: groups.size,
    data: JSON.parse(JSON.stringify(classData))
  };

  const updated = [snapshot, ...current].slice(0, 25); // Keep latest 25 snapshots
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${classData.id}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { classId: classData.id, snapshots: updated } }));
  } catch {
    // ignore
  }

  return snapshot;
}

export function deleteClassroomSnapshot(classId: string, snapshotId: string): void {
  const current = getClassroomSnapshots(classId);
  const updated = current.filter(s => s.id !== snapshotId);
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${classId}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { classId, snapshots: updated } }));
  } catch {
    // ignore
  }
}

export function exportSnapshotToFile(snapshot: ClassroomSnapshot): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  const filename = `${snapshot.data.name.replace(/[^a-z0-9]/gi, '_')}_${snapshot.name.replace(/[^a-z0-9]/gi, '_')}.json`;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
}
