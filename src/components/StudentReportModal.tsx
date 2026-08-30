import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Download, 
  Printer, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  CheckCircle2
} from 'lucide-react';
import type { ClassData } from '../utils/math';
import { calculateStudentMetrics, calculateStudentWebPAScore } from '../utils/math';
import { 
  getStudentReportPDFDataUri, 
  downloadStudentReportPDF, 
  generateStudentReportPDF 
} from '../utils/pdfReport';
import FeatureInfoButton from './FeatureInfoButton';

interface StudentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
  classData: ClassData;
  onToast?: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const StudentReportModal: React.FC<StudentReportModalProps> = ({
  isOpen,
  onClose,
  initialStudentId,
  classData,
  onToast
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [pdfDataUri, setPdfDataUri] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isBatchDownloading, setIsBatchDownloading] = useState<boolean>(false);

  // Read stored grading configuration
  const storedBase = localStorage.getItem('peer_base_grade');
  const storedFudge = localStorage.getItem('peer_fudge_weight');
  const baseGrade = storedBase ? Number(storedBase) : 100;
  const fudgeWeight = storedFudge ? Number(storedFudge) : 0.5;

  // Initialize selected student
  useEffect(() => {
    if (initialStudentId && classData.students.some(s => s.id === initialStudentId)) {
      setSelectedStudentId(initialStudentId);
    } else if (classData.students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(classData.students[0].id);
    }
  }, [initialStudentId, classData.students]);

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || '';
      };
    }
  }, [isOpen]);

  // Selected student object
  const currentStudent = useMemo(() => {
    return classData.students.find(s => s.id === selectedStudentId) || classData.students[0] || null;
  }, [selectedStudentId, classData.students]);

  const currentIndex = useMemo(() => {
    return classData.students.findIndex(s => s.id === selectedStudentId);
  }, [selectedStudentId, classData.students]);

  // Generate live PDF Data URI when selected student changes
  useEffect(() => {
    if (!isOpen || !currentStudent) return;

    setIsGenerating(true);
    try {
      const uri = getStudentReportPDFDataUri(currentStudent, classData, { baseGrade, fudgeWeight });
      setPdfDataUri(uri);
    } catch (err) {
      console.error('Failed to generate PDF Data URI:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [isOpen, currentStudent, classData, baseGrade, fudgeWeight]);

  if (!isOpen || !currentStudent) return null;

  // Metrics for quick summary ribbon
  const metrics = calculateStudentMetrics(currentStudent, classData);
  const webpa = calculateStudentWebPAScore(currentStudent.id, currentStudent.groupName, classData, baseGrade, fudgeWeight);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSelectedStudentId(classData.students[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < classData.students.length - 1) {
      setSelectedStudentId(classData.students[currentIndex + 1].id);
    }
  };

  const handleDownloadCurrent = () => {
    try {
      downloadStudentReportPDF(currentStudent, classData, { baseGrade, fudgeWeight });
      if (onToast) onToast(`Downloaded PDF Report for ${currentStudent.name}`, 'success');
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Failed to download PDF report', 'error');
    }
  };

  const handlePrint = () => {
    try {
      const doc = generateStudentReportPDF(currentStudent, classData, { baseGrade, fudgeWeight });
      doc.autoPrint();
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Failed to initiate print job', 'error');
    }
  };

  const handleBatchDownloadAll = async () => {
    setIsBatchDownloading(true);
    if (onToast) onToast(`Starting batch download for ${classData.students.length} students...`, 'info');

    try {
      for (let i = 0; i < classData.students.length; i++) {
        const student = classData.students[i];
        downloadStudentReportPDF(student, classData, { baseGrade, fudgeWeight });
        // Delay slightly between file triggers to prevent browser throttling
        await new Promise(res => setTimeout(res, 350));
      }
      if (onToast) onToast(`Successfully downloaded all ${classData.students.length} student report cards!`, 'success');
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Failed during batch PDF generation', 'error');
    } finally {
      setIsBatchDownloading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '1060px', 
          width: '95vw', 
          maxHeight: '94vh', 
          height: '94vh', 
          display: 'flex', 
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-surface)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- TOP TOOLBAR & CONTROLS --- */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0.85rem 1.25rem', 
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-app)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Left: Title & Quick Student Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={20} className="text-primary" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Student Report Card</h3>
            </div>

            {/* Student Dropdown Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handlePrevious}
                disabled={currentIndex <= 0}
                style={{ padding: '0.3rem 0.5rem', height: '34px' }}
                title="Previous Student"
              >
                <ChevronLeft size={16} />
              </button>

              <select
                className="form-select"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                style={{ 
                  fontSize: '0.82rem', 
                  padding: '0.35rem 2rem 0.35rem 0.75rem', 
                  height: '34px', 
                  minWidth: '220px',
                  fontWeight: 600
                }}
              >
                {classData.students.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    {idx + 1}. {s.name} ({s.groupName || 'Unassigned'})
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleNext}
                disabled={currentIndex >= classData.students.length - 1}
                style={{ padding: '0.3rem 0.5rem', height: '34px' }}
                title="Next Student"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right: Actions (Download, Print, Batch, Close) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleDownloadCurrent}
              style={{ gap: '0.35rem', fontWeight: 700, padding: '0.4rem 0.85rem' }}
            >
              <Download size={14} /> Download PDF
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ gap: '0.35rem', padding: '0.4rem 0.75rem' }}
              title="Print official report card"
            >
              <Printer size={14} /> Print
            </button>

            <button
              type="button"
              className="btn btn-teal btn-sm"
              onClick={handleBatchDownloadAll}
              disabled={isBatchDownloading}
              style={{ gap: '0.35rem', padding: '0.4rem 0.75rem' }}
              title="Download all student reports sequentially"
            >
              <Sparkles size={14} /> {isBatchDownloading ? 'Exporting...' : 'Export All Class'}
            </button>

            <FeatureInfoButton featureId="radar-analytics" size="sm" tooltipText="Student Report & Radar Guide" />

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.35rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* --- METRICS SUMMARY RIBBON --- */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '0.75rem', 
          padding: '0.65rem 1.25rem', 
          backgroundColor: 'var(--bg-surface)', 
          borderBottom: '1px solid var(--border-color)',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Student ID:</span>
            <code style={{ fontWeight: 700 }}>{currentStudent.id}</code>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Team:</span>
            <span className="badge badge-teal" style={{ fontWeight: 700 }}>{currentStudent.groupName || 'Unassigned'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>WebPA Multiplier:</span>
            <span style={{ fontWeight: 800, color: webpa.ratio >= 1.0 ? 'var(--accent-teal)' : 'var(--accent-rose)' }}>
              {webpa.ratio.toFixed(2)}x
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Calibrated Grade:</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
              {webpa.adjustedGrade.toFixed(1)} / {baseGrade}
            </span>
            <FeatureInfoButton featureId="webpa-calibration" size="sm" tooltipText="How WebPA grade is calculated" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Reviews:</span>
            <span style={{ fontWeight: 700 }}>
              {metrics.reviewsReceived} Received
            </span>
          </div>
        </div>

        {/* --- MAIN LIVE PDF PREVIEW AREA --- */}
        <div style={{ 
          flex: 1, 
          backgroundColor: '#525659', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          overflow: 'hidden',
          position: 'relative'
        }}>
          {isGenerating ? (
            <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Rendering PDF Report Card...</span>
            </div>
          ) : pdfDataUri ? (
            <iframe
              title={`Report Card - ${currentStudent.name}`}
              src={pdfDataUri}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block'
              }}
            />
          ) : (
            <div style={{ color: '#fff', textAlign: 'center', padding: '2rem' }}>
              <p style={{ fontWeight: 700, margin: '0 0 0.5rem 0' }}>Preview Unavailable</p>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={handleDownloadCurrent}
              >
                <Download size={14} /> Download PDF Directly
              </button>
            </div>
          )}
        </div>

        {/* --- FOOTER STATUS BAR --- */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0.5rem 1.25rem', 
          backgroundColor: 'var(--bg-app)', 
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          <span>
            Viewing student <b>{currentIndex + 1}</b> of <b>{classData.students.length}</b> • PDF format: <b>Vector A4 Portrait</b>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle2 size={12} className="text-teal" /> WebPA Calibration &amp; Anonymized Teammate Reviews Included
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};
