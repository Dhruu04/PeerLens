import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Download, 
  Printer, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  CheckCircle2,
  Eye,
  ExternalLink,
  Award,
  MessageSquare,
  ShieldCheck,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import type { ClassData } from '../utils/math';
import { calculateStudentMetrics, calculateStudentWebPAScore, getTeammates, getTargetScale } from '../utils/math';
import { 
  getStudentReportPDFBlobUrl, 
  downloadStudentReportPDF, 
  generateStudentReportPDF,
  downloadClassDossierPDF 
} from '../utils/pdfReport';
import FeatureInfoButton from './FeatureInfoButton';
import CustomSelect from './CustomSelect';
import { AnimatedNumber } from './AnimatedNumber';

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
  const [viewMode, setViewMode] = useState<'document' | 'pdf'>('document');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');
  const [isExportingMaster, setIsExportingMaster] = useState<boolean>(false);
  const activeBlobUrlRef = useRef<string>('');

  // Read stored grading configuration
  const storedBase = localStorage.getItem('peer_base_grade');
  const storedFudge = localStorage.getItem('peer_fudge_weight');
  const baseGrade = storedBase ? Number(storedBase) : (classData ? getTargetScale(classData) : 31);
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

  // Keyboard navigation: ArrowLeft/ArrowRight to switch students
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Selected student object
  const currentStudent = useMemo(() => {
    return classData.students.find(s => s.id === selectedStudentId) || classData.students[0] || null;
  }, [selectedStudentId, classData.students]);

  const currentIndex = useMemo(() => {
    return classData.students.findIndex(s => s.id === selectedStudentId);
  }, [selectedStudentId, classData.students]);

  // Safely manage Blob URL for PDF preview mode
  useEffect(() => {
    if (!isOpen || !currentStudent) return;

    // Only generate Blob URL if in PDF mode or pre-generating
    let url = '';
    try {
      url = getStudentReportPDFBlobUrl(currentStudent, classData, { baseGrade, fudgeWeight });
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
      activeBlobUrlRef.current = url;
      setPdfBlobUrl(url);
    } catch (err) {
      console.error('Failed to create PDF Blob URL:', err);
    }

    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = '';
      }
    };
  }, [isOpen, currentStudent, classData, baseGrade, fudgeWeight]);

  if (!isOpen || !currentStudent) return null;

  // Teammates & peer reviews
  const teammates = getTeammates(currentStudent.id, currentStudent.groupName, classData.students);
  const peerReviews = classData.reviews.filter(
    (r) => r.recipientId === currentStudent.id && teammates.includes(r.reviewerId)
  );

  // Metrics for quick summary ribbon and report card
  const metrics = calculateStudentMetrics(currentStudent, classData);
  const studentTeamBase = classData.teamBaseGrades?.[currentStudent.groupName] ?? baseGrade;
  const webpa = calculateStudentWebPAScore(currentStudent.id, currentStudent.groupName, classData, studentTeamBase, fudgeWeight);

  // Praise tags summary
  const praiseTagCounts: Record<string, number> = {};
  peerReviews.forEach(r => {
    if (r.praiseTags && Array.isArray(r.praiseTags)) {
      r.praiseTags.forEach(t => {
        praiseTagCounts[t] = (praiseTagCounts[t] || 0) + 1;
      });
    }
  });
  const praiseKeys = Object.keys(praiseTagCounts);

  // Qualitative feedback lists
  const strengthsList = peerReviews.map(r => r.strengthsText?.trim()).filter(Boolean) as string[];
  const growthList = peerReviews.map(r => r.growthText?.trim()).filter(Boolean) as string[];

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

  const handleOpenInNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    } else {
      const url = getStudentReportPDFBlobUrl(currentStudent, classData, { baseGrade, fudgeWeight });
      window.open(url, '_blank');
    }
  };

  const handlePrint = () => {
    if (viewMode === 'document') {
      window.print();
    } else {
      try {
        const doc = generateStudentReportPDF(currentStudent, classData, { baseGrade, fudgeWeight });
        doc.autoPrint();
        const url = URL.createObjectURL(doc.output('blob'));
        window.open(url, '_blank');
      } catch (err) {
        console.error(err);
        window.print();
      }
    }
  };

  const handleDownloadMasterDossier = () => {
    setIsExportingMaster(true);
    if (onToast) onToast(`Generating Master Classroom Dossier (${classData.students.length} students)...`, 'info');

    setTimeout(() => {
      try {
        downloadClassDossierPDF(classData, { baseGrade, fudgeWeight });
        if (onToast) onToast(`Successfully downloaded Master Classroom Dossier PDF!`, 'success');
      } catch (err) {
        console.error(err);
        if (onToast) onToast('Failed to generate Master Classroom Dossier', 'error');
      } finally {
        setIsExportingMaster(false);
      }
    }, 100);
  };

  const participationRate = teammates.length > 0 ? Math.round((metrics.reviewsReceived / teammates.length) * 100) : 0;

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-student-report-card, #printable-student-report-card * {
              visibility: visible !important;
            }
            #printable-student-report-card {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 1.2cm !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
              color: black !important;
            }
            .modal-overlay, .modal-content {
              background: transparent !important;
              position: static !important;
              overflow: visible !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .hide-on-print {
              display: none !important;
            }
          }
        `
      }} />

      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '1120px', 
          width: '95vw', 
          maxHeight: '94vh', 
          height: '94vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0, 
          overflow: 'hidden', 
          borderRadius: '16px', 
          backgroundColor: 'var(--bg-surface)', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)' 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- TOP TOOLBAR & CONTROLS --- */}
        <div 
          className="hide-on-print"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0.8rem 1.25rem', 
            borderBottom: '1px solid var(--border-color)', 
            backgroundColor: 'var(--bg-app)', 
            flexWrap: 'wrap', 
            gap: '0.75rem',
            zIndex: 10
          }}
        >
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
                title="Previous Student (Left Arrow)"
              >
                <ChevronLeft size={16} />
              </button>

              <CustomSelect
                value={selectedStudentId}
                onChange={(val) => setSelectedStudentId(val)}
                options={classData.students.map((s, idx) => ({
                  value: s.id,
                  label: `${idx + 1}. ${s.name} (${s.groupName || 'Unassigned'})`
                }))}
                triggerStyle={{
                  height: '34px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  padding: '0 0.65rem',
                  minWidth: '220px'
                }}
                dropdownMinWidth="260px"
                dropdownStyle={{ zIndex: 10010 }}
                title="Select student report"
              />

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleNext}
                disabled={currentIndex >= classData.students.length - 1}
                style={{ padding: '0.3rem 0.5rem', height: '34px' }}
                title="Next Student (Right Arrow)"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* View Mode Switcher Toggle */}
            <div style={{ 
              display: 'inline-flex', 
              padding: '2px', 
              borderRadius: '8px', 
              backgroundColor: 'var(--bg-surface)', 
              border: '1px solid var(--border-color)' 
            }}>
              <button
                type="button"
                onClick={() => setViewMode('document')}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'document' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'document' ? '#fff' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.15s ease'
                }}
                title="View interactive high-fidelity report card"
              >
                <FileText size={12} /> Interactive Card
              </button>
              <button
                type="button"
                onClick={() => setViewMode('pdf')}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'pdf' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'pdf' ? '#fff' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.15s ease'
                }}
                title="View raw PDF binary preview"
              >
                <Eye size={12} /> PDF Preview
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
              onClick={handleDownloadMasterDossier}
              disabled={isExportingMaster}
              style={{ gap: '0.35rem', padding: '0.4rem 0.75rem' }}
              title="Download Master Multi-Page PDF Dossier for all students"
            >
              <Sparkles size={14} /> {isExportingMaster ? 'Generating Dossier...' : 'Export Class Dossier'}
            </button>

            <FeatureInfoButton featureId="student-report" size="sm" tooltipText="Student 360° Report Card Guide" />

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
        <div 
          className="hide-on-print"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '0.75rem', 
            padding: '0.6rem 1.25rem', 
            backgroundColor: 'var(--bg-surface)', 
            borderBottom: '1px solid var(--border-color)', 
            fontSize: '0.8rem',
            zIndex: 5
          }}
        >
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
              <AnimatedNumber value={webpa.ratio} decimals={2} suffix="x" />
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Calibrated Grade:</span>
            {webpa.isInsufficient ? (
              <span
                style={{ fontWeight: 800, color: 'var(--accent-rose, #e11d48)', cursor: 'help', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                title={`Real Score: ${webpa.adjustedGrade.toFixed(1)} / ${webpa.teamBaseGrade} (Below minimum passing threshold of ${webpa.minScore} pts set by professor)`}
              >
                <AlertTriangle size={13} /> Insufficient
              </span>
            ) : (
              <span
                style={{ fontWeight: 800, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                title={webpa.isCapped ? `Capped at professor maximum of ${webpa.maxScore} pts (raw calculation: ${webpa.rawAdjustedGrade.toFixed(1)})` : undefined}
              >
                <AnimatedNumber value={webpa.adjustedGrade} decimals={1} /> / {webpa.teamBaseGrade}
                {webpa.isCapped && (
                  <span className="badge badge-purple" style={{ fontSize: '0.62rem', padding: '0.05rem 0.3rem' }}>
                    Max Cap
                  </span>
                )}
              </span>
            )}
            <FeatureInfoButton featureId="webpa-calibration" size="sm" tooltipText="How WebPA grade is calculated" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Reviews:</span>
            <span style={{ fontWeight: 700 }}>
              {metrics.reviewsReceived} Received ({participationRate}%)
            </span>
          </div>
        </div>

        {/* --- MAIN PREVIEW CONTAINER --- */}
        <div style={{ 
          flex: 1, 
          backgroundColor: '#475569', 
          overflowY: 'auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {viewMode === 'document' ? (
            /* --- 1. INTERACTIVE HIGH-FIDELITY VECTOR REPORT CARD --- */
            <div style={{ padding: '1.5rem 1rem', width: '100%', boxSizing: 'border-box' }}>
              <div 
                id="printable-student-report-card"
                style={{
                  maxWidth: '840px',
                  margin: '0 auto',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  borderRadius: '12px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
                  padding: '2.5rem 2.75rem',
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                  boxSizing: 'border-box'
                }}
              >
                {/* Header Banner */}
                <div style={{
                  padding: '1.1rem 1.4rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e40af', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <BookOpen size={20} />
                      PeerLens — Individual Peer Assessment Report
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                      {classData.name || 'Classroom Assessment'} • Assessment Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    backgroundColor: '#0d9488',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    <ShieldCheck size={13} /> OFFICIAL RECORD
                  </div>
                </div>

                {/* Student Profile & Demographics Card */}
                <div style={{
                  padding: '1.2rem 1.4rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderTop: '3px solid #2563eb',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                      {currentStudent.name}
                    </h2>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.25rem' }}>
                      Student ID: <b>{currentStudent.id}</b> • Email: <b>{currentStudent.email}</b>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
                      {[
                        currentStudent.university ? `University: ${currentStudent.university}` : '',
                        currentStudent.degree ? `Degree: ${currentStudent.degree}` : '',
                        currentStudent.studentType && currentStudent.studentType !== 'Normal' ? `Type: ${currentStudent.studentType}` : ''
                      ].filter(Boolean).join(' • ') || 'Academic Program: Enrolled Student'}
                    </div>
                    {(currentStudent.nationality || currentStudent.englishProficiency) && (
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.2rem' }}>
                        {[
                          currentStudent.nationality ? `Nationality: ${currentStudent.nationality}` : '',
                          currentStudent.englishProficiency ? `English: ${currentStudent.englishProficiency}` : ''
                        ].filter(Boolean).join(' • ')}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.45rem', flexShrink: 0 }}>
                    <span style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      backgroundColor: '#f0fdfa',
                      color: '#0d9488',
                      border: '1px solid #ccfbf1',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}>
                      Team: {currentStudent.groupName || 'Unassigned'}
                    </span>
                    <span style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      backgroundColor: currentStudent.submitted ? '#ecfdf5' : '#fffbeb',
                      color: currentStudent.submitted ? '#059669' : '#d97706',
                      border: `1px solid ${currentStudent.submitted ? '#a7f3d0' : '#fde68a'}`,
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {currentStudent.submitted ? 'Submission: Completed' : 'Submission: Pending'}
                    </span>
                  </div>
                </div>

                {/* 3 Performance Metric Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  marginBottom: '1.65rem'
                }}>
                  {/* Card 1: WebPA Ratio */}
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>WebPA Peer Ratio</div>
                    <div style={{ 
                      fontSize: '1.65rem', 
                      fontWeight: 800, 
                      color: webpa.ratio >= 1.0 ? '#0d9488' : '#e11d48',
                      marginTop: '0.2rem',
                      lineHeight: 1.1
                    }}>
                      <AnimatedNumber value={webpa.ratio} decimals={2} suffix="x" />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem' }}>
                      {webpa.ratio >= 1.0 ? 'At/Above Teammate Average' : 'Below Teammate Average'}
                    </div>
                  </div>

                  {/* Card 2: Calibrated Grade */}
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      Calibrated Grade (Base {webpa.teamBaseGrade})
                    </div>
                    {webpa.isInsufficient ? (
                      <div
                        style={{ 
                          fontSize: '1.45rem', 
                          fontWeight: 800, 
                          color: '#e11d48',
                          marginTop: '0.2rem',
                          lineHeight: 1.1,
                          cursor: 'help',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                        title={`Real Score: ${webpa.adjustedGrade.toFixed(1)} / ${webpa.teamBaseGrade} (Below minimum passing threshold of ${webpa.minScore} pts set by professor)`}
                      >
                        <AlertTriangle size={20} color="#e11d48" /> Insufficient
                      </div>
                    ) : (
                      <div
                        style={{ 
                          fontSize: '1.65rem', 
                          fontWeight: 800, 
                          color: '#2563eb',
                          marginTop: '0.2rem',
                          lineHeight: 1.1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          flexWrap: 'wrap'
                        }}
                        title={webpa.isCapped ? `Capped at max ${webpa.maxScore} pts (raw: ${webpa.rawAdjustedGrade.toFixed(1)})` : undefined}
                      >
                        <span><AnimatedNumber value={webpa.adjustedGrade} decimals={1} /> <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>/ {webpa.teamBaseGrade}</span></span>
                        {webpa.isCapped && (
                          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', backgroundColor: '#f3e8ff', color: '#7e22ce', borderRadius: '4px', fontWeight: 800 }}>
                            Max Cap
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem' }}>
                      {webpa.isInsufficient
                        ? `Real Score: ${webpa.adjustedGrade.toFixed(1)} / ${webpa.teamBaseGrade} (Min required: ${webpa.minScore} pts)`
                        : webpa.isCapped
                          ? `Raw calculation ${webpa.rawAdjustedGrade.toFixed(1)} capped at ${webpa.maxScore} max`
                          : `Fudge Weighting: ${Math.round(fudgeWeight * 100)}%`}
                    </div>
                  </div>

                  {/* Card 3: Reviews Received */}
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Peer Reviews Received</div>
                    <div style={{ 
                      fontSize: '1.65rem', 
                      fontWeight: 800, 
                      color: '#0f172a',
                      marginTop: '0.2rem',
                      lineHeight: 1.1
                    }}>
                      {metrics.reviewsReceived} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>/ {teammates.length}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem' }}>
                      {participationRate}% Group Evaluation Rate
                    </div>
                  </div>
                </div>

                {/* Rubric Criteria Evaluation Breakdown Table */}
                <div style={{ marginBottom: '1.65rem' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award size={16} className="text-primary" /> Rubric Criteria Evaluation Breakdown
                  </div>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#1e293b' }}>
                          <th style={{ padding: '0.55rem 0.85rem', fontWeight: 700 }}>Rubric Criterion</th>
                          <th style={{ padding: '0.55rem 0.65rem', fontWeight: 700, textAlign: 'center' }}>Max Scale</th>
                          <th style={{ padding: '0.55rem 0.65rem', fontWeight: 700, textAlign: 'center' }}>Peer Average</th>
                          <th style={{ padding: '0.55rem 0.85rem', fontWeight: 700 }}>Consensus (StdDev)</th>
                          <th style={{ padding: '0.55rem 0.85rem', fontWeight: 700, textAlign: 'right' }}>Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classData.fields.map((field, idx) => {
                          const avg = metrics.fieldAverages[field.id];
                          const stdDev = metrics.fieldStdDevs[field.id];
                          const max = field.max || 5;
                          const pct = avg !== null ? Math.round((avg / max) * 100) : 0;
                          const consensus = stdDev !== null ? (stdDev <= 0.5 ? 'High Agreement' : stdDev <= 1.0 ? 'Moderate' : 'Diverse Views') : 'N/A';

                          return (
                            <tr key={field.id} style={{ borderBottom: idx < classData.fields.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                              <td style={{ padding: '0.6rem 0.85rem', fontWeight: 600, color: '#334155' }}>{field.name}</td>
                              <td style={{ padding: '0.6rem 0.65rem', textAlign: 'center', color: '#64748b' }}>{max} pts</td>
                              <td style={{ padding: '0.6rem 0.65rem', textAlign: 'center', fontWeight: 800, color: '#2563eb' }}>
                                {avg !== null ? `${avg.toFixed(2)} / ${max}` : '—'}
                              </td>
                              <td style={{ padding: '0.6rem 0.85rem', color: '#64748b' }}>
                                {stdDev !== null ? `± ${stdDev.toFixed(2)} (${consensus})` : '—'}
                              </td>
                              <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <div style={{ width: '60px', height: '7px', borderRadius: '999px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct >= 80 ? '#0d9488' : pct >= 50 ? '#2563eb' : '#f59e0b', borderRadius: '999px' }} />
                                  </div>
                                  <span style={{ fontWeight: 700, width: '34px', textAlign: 'right' }}>{avg !== null ? `${pct}%` : 'N/A'}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Commendations & Praise Tags */}
                <div style={{ marginBottom: '1.65rem' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award size={16} style={{ color: '#0d9488' }} /> Peer Commendations &amp; Strengths Awarded
                  </div>
                  {praiseKeys.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      {praiseKeys.map(tag => (
                        <span 
                          key={tag}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            backgroundColor: '#f0fdfa',
                            border: '1px solid #ccfbf1',
                            color: '#0d9488',
                            fontSize: '0.76rem',
                            fontWeight: 700
                          }}
                        >
                          {tag} ({praiseTagCounts[tag]})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                      No specific praise tags recorded for this evaluation cycle.
                    </div>
                  )}
                </div>

                {/* Qualitative Feedback Cards */}
                <div style={{ marginBottom: '1.85rem' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MessageSquare size={16} className="text-primary" /> Anonymized Teammate Written Feedback
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Strengths Box */}
                    <div style={{
                      padding: '1rem 1.15rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0d9488', marginBottom: '0.5rem' }}>
                        Key Strengths &amp; Contributions
                      </div>
                      {strengthsList.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          {strengthsList.slice(0, 4).map((c, i) => (
                            <div key={i} style={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.45, fontStyle: 'italic' }}>
                              • "{c}"
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          No written strength comments submitted.
                        </div>
                      )}
                    </div>

                    {/* Growth Box */}
                    <div style={{
                      padding: '1rem 1.15rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#e11d48', marginBottom: '0.5rem' }}>
                        Areas for Improvement &amp; Future Collaboration
                      </div>
                      {growthList.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          {growthList.slice(0, 4).map((c, i) => (
                            <div key={i} style={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.45, fontStyle: 'italic' }}>
                              • "{c}"
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          No constructive growth comments submitted.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Methodology & Verification Signoff */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.45, flex: 1 }}>
                    <b>Methodology Note:</b> Calibrated using {webpa.methodName}. Normalized under Loughborough WebPA standards to eliminate evaluator leniency or harshness bias. Scores reflect individual contribution relative to the team baseline.
                  </div>
                  <div style={{ width: '180px', flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>Instructor Verification:</div>
                    <div style={{ borderBottom: '1px solid #cbd5e1', height: '24px', width: '100%', marginBottom: '4px' }} />
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontStyle: 'italic' }}>Authorized Signature &amp; Stamp</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* --- 2. RAW VECTOR PDF EMBEDDED OBJECT --- */
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {pdfBlobUrl ? (
                <object
                  data={pdfBlobUrl}
                  type="application/pdf"
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                >
                  <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#ffffff', maxWidth: '540px', margin: 'auto' }}>
                    <FileText size={48} style={{ color: '#94a3b8', margin: '0 auto 1.25rem' }} />
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 800 }}>
                      Browser PDF Preview Notice
                    </h4>
                    <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                      Your browser's security settings or PDF viewer plugin is set to download files rather than previewing them inline. You can switch to our full Interactive Document view, open the PDF directly in a new tab, or download it.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setViewMode('document')}
                        style={{ gap: '0.35rem', fontWeight: 700 }}
                      >
                        <FileText size={14} /> Switch to Interactive Card
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleOpenInNewTab}
                        style={{ gap: '0.35rem' }}
                      >
                        <ExternalLink size={14} /> Open in New Tab
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleDownloadCurrent}
                        style={{ gap: '0.35rem' }}
                      >
                        <Download size={14} /> Download PDF File
                      </button>
                    </div>
                  </div>
                </object>
              ) : (
                <div style={{ color: '#fff', textAlign: 'center', padding: '3rem' }}>
                  <p style={{ fontWeight: 700, margin: '0 0 0.5rem 0' }}>PDF is being prepared...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- FOOTER STATUS BAR --- */}
        <div 
          className="hide-on-print"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0.55rem 1.25rem', 
            backgroundColor: 'var(--bg-app)', 
            borderTop: '1px solid var(--border-color)', 
            fontSize: '0.75rem', 
            color: 'var(--text-secondary)' 
          }}
        >
          <span>
            Viewing student <b>{currentIndex + 1}</b> of <b>{classData.students.length}</b> • Format: <b>Official Vector A4 Portrait</b>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle2 size={13} className="text-teal" /> Peer Score Adjustment &amp; Anonymized Teammate Reviews Included
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};
