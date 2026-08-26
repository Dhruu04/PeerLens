import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Download, 
  Search, 
  ExternalLink, 
  Mail, 
  MessageSquare, 
  Users,
  Edit3,
  Eye,
  RefreshCw
} from 'lucide-react';
import type { ClassData, Student } from '../utils/math';

interface LinkDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData;
  onToast?: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

const DEFAULT_EMAIL_SUBJECT = 'Peer Evaluation Access Link - {class_name}';
const DEFAULT_EMAIL_BODY = `Dear {student_name},

Our peer evaluation session for "{class_name}" is now active! 

Please use your confidential link below to submit evaluations for your teammates ({team_name}):
{evaluation_link}

This evaluation is anonymous and takes only 2-3 minutes. Please complete your submission before the deadline.

Best regards,
Course Instructor`;

const DEFAULT_WHATSAPP_MSG = `*Peer Evaluation Live: {class_name}*

Hi everyone! Our peer evaluation window is open. Please check your email or visit your personal link to evaluate your teammates ({team_name}):
{evaluation_link}

Evaluations take 2-3 minutes. Thank you!`;

export const LinkDispatcherModal: React.FC<LinkDispatcherModalProps> = ({
  isOpen,
  onClose,
  classData,
  onToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedBulkType, setCopiedBulkType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'email_template' | 'whatsapp'>('roster');

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

  // Editable Broadcast Templates state
  const [emailSubject, setEmailSubject] = useState<string>(DEFAULT_EMAIL_SUBJECT);
  const [emailBody, setEmailBody] = useState<string>(DEFAULT_EMAIL_BODY);
  const [whatsappMsg, setWhatsappMsg] = useState<string>(DEFAULT_WHATSAPP_MSG);
  const [previewStudentId, setPreviewStudentId] = useState<string>(classData.students[0]?.id || '');

  if (!isOpen) return null;

  const getStudentPortalUrl = (studentId: string) => {
    const params = new URLSearchParams(window.location.search);
    const fbParam = params.get('fb');
    let url = `${window.location.origin}${window.location.pathname}?classId=${classData.id}&studentId=${studentId}`;
    if (fbParam) {
      url += `&fb=${fbParam}`;
    }
    return url;
  };

  const filteredStudents = classData.students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.groupName && s.groupName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedPreviewStudent = classData.students.find(s => s.id === previewStudentId) || classData.students[0] || {
    id: 'sample_1',
    name: 'Sample Student',
    email: 'student@university.edu',
    groupName: 'Team 1',
    submitted: false
  };

  const substituteVariables = (text: string, student: Student) => {
    return text
      .replace(/{student_name}/g, student.name)
      .replace(/{class_name}/g, classData.name)
      .replace(/{team_name}/g, student.groupName || 'Unassigned')
      .replace(/{evaluation_link}/g, getStudentPortalUrl(student.id))
      .replace(/{student_email}/g, student.email)
      .replace(/{student_id}/g, student.id);
  };

  const handleCopySingle = (student: Student) => {
    const url = getStudentPortalUrl(student.id);
    navigator.clipboard.writeText(url);
    setCopiedId(student.id);
    if (onToast) onToast(`Copied evaluation link for ${student.name}`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCSV = () => {
    const header = 'Student ID,Full Name,Email,Group,Personal Evaluation Link';
    const rows = classData.students.map(s => 
      `"${s.id}","${s.name}","${s.email}","${s.groupName || 'Unassigned'}","${getStudentPortalUrl(s.id)}"`
    );
    const content = [header, ...rows].join('\n');
    navigator.clipboard.writeText(content);
    setCopiedBulkType('csv');
    if (onToast) onToast('Copied full student roster links table (CSV format) to clipboard!', 'success');
    setTimeout(() => setCopiedBulkType(null), 2500);
  };

  const handleDownloadCSV = () => {
    const header = 'Student ID,Full Name,Email,Group,Personal Evaluation Link';
    const rows = classData.students.map(s => 
      `"${s.id}","${s.name}","${s.email}","${s.groupName || 'Unassigned'}","${getStudentPortalUrl(s.id)}"`
    );
    const content = [header, ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${classData.name.replace(/\s+/g, '_')}_student_evaluation_links.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (onToast) onToast('Downloaded evaluation links CSV spreadsheet!', 'success');
  };

  const handleCopyResolvedEmail = () => {
    const resolved = `Subject: ${substituteVariables(emailSubject, selectedPreviewStudent)}\n\n${substituteVariables(emailBody, selectedPreviewStudent)}`;
    navigator.clipboard.writeText(resolved);
    setCopiedBulkType('email');
    if (onToast) onToast(`Copied email message customized for ${selectedPreviewStudent.name}!`, 'success');
    setTimeout(() => setCopiedBulkType(null), 2500);
  };

  const handleCopyResolvedWhatsApp = () => {
    const resolved = substituteVariables(whatsappMsg, selectedPreviewStudent);
    navigator.clipboard.writeText(resolved);
    setCopiedBulkType('whatsapp');
    if (onToast) onToast('Copied WhatsApp broadcast message to clipboard!', 'success');
    setTimeout(() => setCopiedBulkType(null), 2500);
  };

  const handleLaunchMailtoBCC = () => {
    const allEmails = classData.students.map(s => s.email).filter(Boolean).join(',');
    const subject = encodeURIComponent(substituteVariables(emailSubject, { ...selectedPreviewStudent, name: 'Student' }));
    const genericLink = `${window.location.origin}${window.location.pathname}?classId=${classData.id}`;
    const body = encodeURIComponent(emailBody.replace(/{student_name}/g, 'Student').replace(/{evaluation_link}/g, genericLink));
    window.open(`mailto:?bcc=${allEmails}&subject=${subject}&body=${body}`, '_blank');
  };

  const insertVariableIntoEmail = (tag: string) => {
    setEmailBody(prev => `${prev} ${tag}`);
  };

  const insertVariableIntoWhatsApp = (tag: string) => {
    setWhatsappMsg(prev => `${prev} ${tag}`);
  };

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '960px', 
          width: '95vw', 
          maxHeight: '92vh', 
          height: '92vh', 
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
        {/* Modal Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '1rem 1.5rem', 
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-app)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Fast Link Dispatcher &amp; Broadcast Hub</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Customize templates and distribute personal evaluation links to {classData.students.length} students
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', padding: '0 1.5rem' }}>
          <button
            type="button"
            style={{ 
              padding: '0.75rem 1rem', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              borderBottom: activeTab === 'roster' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'roster' ? 'var(--primary)' : 'var(--text-secondary)',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            onClick={() => setActiveTab('roster')}
          >
            <Users size={15} /> Student Links Sheet ({classData.students.length})
          </button>

          <button
            type="button"
            style={{ 
              padding: '0.75rem 1rem', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              borderBottom: activeTab === 'email_template' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'email_template' ? 'var(--primary)' : 'var(--text-secondary)',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            onClick={() => setActiveTab('email_template')}
          >
            <Mail size={15} /> Editable Email Announcement
          </button>

          <button
            type="button"
            style={{ 
              padding: '0.75rem 1rem', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              borderBottom: activeTab === 'whatsapp' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'whatsapp' ? 'var(--primary)' : 'var(--text-secondary)',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            onClick={() => setActiveTab('whatsapp')}
          >
            <MessageSquare size={15} /> Editable WhatsApp / Chat Broadcast
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          
          {/* TAB 1: ROSTER LINKS SPREADSHEET */}
          {activeTab === 'roster' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Quick Actions Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by student name, email, or team..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '32px', height: '38px', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyCSV}
                    style={{ gap: '0.35rem', height: '38px' }}
                  >
                    {copiedBulkType === 'csv' ? <Check size={14} className="text-teal" /> : <Copy size={14} />}
                    {copiedBulkType === 'csv' ? 'Copied CSV!' : 'Copy All (CSV)'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleDownloadCSV}
                    style={{ gap: '0.35rem', height: '38px' }}
                  >
                    <Download size={14} /> Download CSV Spreadsheet
                  </button>
                </div>
              </div>

              {/* Students Links Table */}
              <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table className="custom-table" style={{ whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Team</th>
                      <th>State</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <b>{s.name}</b>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {s.email}
                        </td>
                        <td>
                          <span className="badge badge-teal">{s.groupName || 'Unassigned'}</span>
                        </td>
                        <td>
                          {s.submitted ? (
                            <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>Completed</span>
                          ) : (
                            <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>Pending</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleCopySingle(s)}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
                              title="Copy personal evaluation link"
                            >
                              {copiedId === s.id ? <Check size={12} className="text-teal" /> : <Copy size={12} />}
                              {copiedId === s.id ? 'Copied' : 'Copy Link'}
                            </button>

                            <a
                              href={getStudentPortalUrl(s.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              title="Open student grading portal in new tab"
                            >
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: EDITABLE EMAIL TEMPLATE */}
          {activeTab === 'email_template' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.25rem' }}>
              {/* Left: Interactive Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Edit3 size={15} className="text-primary" /> Live Email Editor
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', gap: '0.25rem' }}
                    onClick={() => {
                      setEmailSubject(DEFAULT_EMAIL_SUBJECT);
                      setEmailBody(DEFAULT_EMAIL_BODY);
                    }}
                  >
                    <RefreshCw size={11} /> Reset Default
                  </button>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Subject Line:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Email Body:</label>
                  <textarea
                    className="form-input"
                    rows={8}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    style={{ fontSize: '0.82rem', lineHeight: 1.45, resize: 'vertical' }}
                  />
                </div>

                {/* Insertable Dynamic Placeholders */}
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    Click to insert variables:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {[
                      { tag: '{student_name}', label: 'Student Name' },
                      { tag: '{class_name}', label: 'Class Name' },
                      { tag: '{team_name}', label: 'Team Name' },
                      { tag: '{evaluation_link}', label: 'Personal Link' }
                    ].map(v => (
                      <button
                        key={v.tag}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', backgroundColor: 'var(--bg-app)', color: 'var(--primary)' }}
                        onClick={() => insertVariableIntoEmail(v.tag)}
                      >
                        + {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleCopyResolvedEmail}
                    style={{ flex: 1, justifyContent: 'center', gap: '0.4rem', padding: '0.55rem' }}
                  >
                    {copiedBulkType === 'email' ? <Check size={14} /> : <Copy size={14} />}
                    {copiedBulkType === 'email' ? 'Copied Message!' : 'Copy Sample Message'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleLaunchMailtoBCC}
                    style={{ justifyContent: 'center', gap: '0.4rem', padding: '0.55rem' }}
                    title="Open your default email client with all student emails BCC'd"
                  >
                    <Mail size={14} /> Launch in Mail App
                  </button>
                </div>
              </div>

              {/* Right: Live Sample Preview */}
              <div style={{ backgroundColor: 'var(--bg-app)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Eye size={14} className="text-teal" /> Live Preview
                  </span>
                  <select
                    className="form-select"
                    value={previewStudentId}
                    onChange={(e) => setPreviewStudentId(e.target.value)}
                    style={{ fontSize: '0.72rem', padding: '0.15rem 1.5rem 0.15rem 0.5rem', height: '28px', maxWidth: '170px' }}
                  >
                    {classData.students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ backgroundColor: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Subject: </span>
                    <b style={{ color: 'var(--text-primary)' }}>{substituteVariables(emailSubject, selectedPreviewStudent)}</b>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.2rem 0' }} />
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.45, fontSize: '0.78rem' }}>
                    {substituteVariables(emailBody, selectedPreviewStudent)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EDITABLE WHATSAPP BROADCAST */}
          {activeTab === 'whatsapp' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.25rem' }}>
              {/* Left: Interactive Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Edit3 size={15} className="text-teal" /> WhatsApp Broadcast Editor
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', gap: '0.25rem' }}
                    onClick={() => setWhatsappMsg(DEFAULT_WHATSAPP_MSG)}
                  >
                    <RefreshCw size={11} /> Reset Default
                  </button>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Chat Message Body:</label>
                  <textarea
                    className="form-input"
                    rows={8}
                    value={whatsappMsg}
                    onChange={(e) => setWhatsappMsg(e.target.value)}
                    style={{ fontSize: '0.82rem', lineHeight: 1.45, resize: 'vertical' }}
                  />
                </div>

                {/* Insertable Dynamic Placeholders */}
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    Click to insert variables:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {[
                      { tag: '{class_name}', label: 'Class Name' },
                      { tag: '{team_name}', label: 'Team Name' },
                      { tag: '{evaluation_link}', label: 'Link' }
                    ].map(v => (
                      <button
                        key={v.tag}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', backgroundColor: 'var(--bg-app)', color: 'var(--accent-teal)' }}
                        onClick={() => insertVariableIntoWhatsApp(v.tag)}
                      >
                        + {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-teal btn-sm"
                    onClick={handleCopyResolvedWhatsApp}
                    style={{ flex: 1, justifyContent: 'center', gap: '0.4rem', padding: '0.55rem' }}
                  >
                    {copiedBulkType === 'whatsapp' ? <Check size={14} /> : <Copy size={14} />}
                    {copiedBulkType === 'whatsapp' ? 'Copied Message!' : 'Copy Chat Message'}
                  </button>
                </div>
              </div>

              {/* Right: WhatsApp Style Preview */}
              <div style={{ backgroundColor: '#e5ddd5', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid #d1d5db' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MessageSquare size={14} color="#059669" /> Chat Bubble Preview
                </span>

                <div style={{ backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: '8px 8px 8px 0px', boxShadow: '0 1px 2px rgba(0,0,0,0.15)', fontSize: '0.8rem', color: '#111827', flex: 1, overflowY: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, lineHeight: 1.45 }}>
                    {substituteVariables(whatsappMsg, selectedPreviewStudent)}
                  </pre>
                  <span style={{ fontSize: '0.68rem', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem', marginTop: '0.35rem' }}>
                    12:00 PM • <Check size={11} color="#059669" /> Delivered
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--bg-app)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Links contain hashed student tokens for secure authentication.</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LinkDispatcherModal;
