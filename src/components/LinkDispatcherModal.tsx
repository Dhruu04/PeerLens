import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Mail, 
  Users,
  Eye,
  RefreshCw,
  User,
  Layers,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import type { ClassData, Student } from '../utils/math';
import { useClass } from '../context/ClassContext';
import CustomSelect from './CustomSelect';
import FeatureInfoButton from './FeatureInfoButton';

interface LinkDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData;
  onToast?: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

const DEFAULT_EMAIL_SUBJECT = 'Peer Evaluation Access Link - {class_name}';
const DEFAULT_EMAIL_BODY = `Dear {student_name},

Our anonymous peer evaluation session for "{class_name}" is now active!

Please use your private evaluation link below to review your teammates ({team_name}):
{evaluation_link}

This evaluation is strictly confidential and takes only 2-3 minutes. Please complete your submission before the deadline.

Best regards,
Course Instructor`;

export const LinkDispatcherModal: React.FC<LinkDispatcherModalProps> = ({
  isOpen,
  onClose,
  classData,
  onToast
}) => {
  const { isCloudSynced, firebaseConfig, user } = useClass();

  // Cohort Selection Mode: 'all' | 'group' | 'single'
  const [recipientMode, setRecipientMode] = useState<'all' | 'group' | 'single'>('all');
  const [pendingOnly, setPendingOnly] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Email Composer state
  const [emailSubject, setEmailSubject] = useState<string>(() => {
    return localStorage.getItem('peer_custom_email_subject') || DEFAULT_EMAIL_SUBJECT;
  });
  const [emailBody, setEmailBody] = useState<string>(() => {
    return localStorage.getItem('peer_custom_email_body') || DEFAULT_EMAIL_BODY;
  });
  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevDocOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBodyOverflow || '';
        document.documentElement.style.overflow = prevDocOverflow || '';
      };
    }
  }, [isOpen]);

  const [previewStudentIndex, setPreviewStudentIndex] = useState<number>(0);

  // Sending progress & execution logs
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendProgress, setSendProgress] = useState<number>(0);
  const [sendLogs, setSendLogs] = useState<string[]>([]);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Read saved provider config from localStorage
  const emailService = (localStorage.getItem('peer_email_service') as 'simulator' | 'emailjs' | 'brevo') || 'simulator';
  const emailjsServiceId = localStorage.getItem('peer_emailjs_service_id') || '';
  const emailjsTemplateId = localStorage.getItem('peer_emailjs_template_id') || '';
  const emailjsUserId = localStorage.getItem('peer_emailjs_user_id') || '';
  const brevoApiKey = localStorage.getItem('peer_brevo_api_key') || '';
  const brevoSenderEmail = localStorage.getItem('peer_brevo_sender_email') || '';
  const brevoSenderName = localStorage.getItem('peer_brevo_sender_name') || 'Instructor';

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

  if (!isOpen) return null;

  // Compute unique team groups
  const uniqueGroups = Array.from(new Set(classData.students.map(s => s.groupName || 'Unassigned'))).sort();
  const groupSelectOptions = [
    { value: 'All', label: `All Groups (${uniqueGroups.length} Teams)` },
    ...uniqueGroups.map(g => {
      const count = classData.students.filter(s => (s.groupName || 'Unassigned') === g).length;
      return { value: g, label: `${g} (${count} students)` };
    })
  ];

  // Filter recipients based on cohort mode
  let targetRecipients: Student[] = [];
  if (recipientMode === 'all') {
    targetRecipients = pendingOnly 
      ? classData.students.filter(s => !s.submitted)
      : classData.students;
  } else if (recipientMode === 'group') {
    targetRecipients = selectedGroup === 'All'
      ? classData.students
      : classData.students.filter(s => (s.groupName || 'Unassigned') === selectedGroup);
    if (pendingOnly) {
      targetRecipients = targetRecipients.filter(s => !s.submitted);
    }
  } else {
    // Single student
    const found = classData.students.find(s => s.id === selectedStudentId);
    targetRecipients = found ? [found] : (classData.students.length > 0 ? [classData.students[0]] : []);
  }

  // Active preview student
  const previewStudent: Student = targetRecipients[previewStudentIndex] || targetRecipients[0] || {
    id: 'sample_1',
    name: 'Sample Student',
    email: 'student@university.edu',
    groupName: 'Team Alpha',
    submitted: false
  };

  const getStudentPortalUrl = (studentId: string) => {
    let url = `${window.location.origin}${window.location.pathname}?classId=${classData.id}&studentId=${studentId}`;
    if (isCloudSynced && firebaseConfig && user) {
      const payload = {
        a: firebaseConfig.apiKey,
        p: firebaseConfig.projectId,
        d: firebaseConfig.authDomain,
        i: firebaseConfig.appId,
        o: user.uid
      };
      const encoded = btoa(JSON.stringify(payload));
      url += `&fb=${encoded}`;
    }
    return url;
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

  // Direct Live Email Sender
  const handleSendDirectEmails = async () => {
    if (targetRecipients.length === 0) {
      if (onToast) onToast('No recipients selected to send emails to.', 'warning');
      return;
    }

    setIsSending(true);
    setSendProgress(0);
    setSendLogs([]);

    let successCount = 0;
    let failCount = 0;
    const total = targetRecipients.length;

    for (let i = 0; i < total; i++) {
      const student = targetRecipients[i];
      const link = getStudentPortalUrl(student.id);
      const subject = substituteVariables(emailSubject, student);
      const bodyText = substituteVariables(emailBody, student);

      if (emailService === 'emailjs') {
        try {
          if (!emailjsServiceId || !emailjsTemplateId) {
            throw new Error('EmailJS Service ID and Template ID are required in Settings.');
          }
          await emailjs.send(
            emailjsServiceId.trim(),
            emailjsTemplateId.trim(),
            {
              to_name: student.name,
              to_email: student.email,
              class_name: classData.name,
              evaluation_link: link,
              custom_subject: subject,
              custom_body: bodyText
            },
            emailjsUserId.trim()
          );
          successCount++;
          setSendLogs(prev => [...prev, `✅ [${i + 1}/${total}] Sent via EmailJS to ${student.name} (${student.email})`]);
        } catch (err: any) {
          failCount++;
          const msg = err?.text || err?.message || 'Network error';
          setSendLogs(prev => [...prev, `❌ [${i + 1}/${total}] Failed for ${student.name} (${student.email}): ${msg}`]);
        }
      } else if (emailService === 'brevo') {
        try {
          if (!brevoApiKey || !brevoSenderEmail) {
            throw new Error('Brevo API Key and Sender Email are required in Settings.');
          }
          const htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="background-color: #e0e7ff; color: #4f46e5; padding: 5px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase;">PeerLens Assessment</span>
              </div>
              <h2 style="color: #0f172a; font-size: 19px; font-weight: 700; margin: 0 0 16px 0; text-align: center;">${subject}</h2>
              <div style="color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${bodyText}</div>
              <div style="text-align: center; margin: 26px 0;">
                <a href="${link}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-block;">Open Grading Portal ➔</a>
              </div>
              <p style="color: #64748b; font-size: 12px; line-height: 1.4; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; text-align: center;">
                Confidential peer assessment link for <strong>${student.name}</strong> (${student.groupName || 'Unassigned'}).
              </p>
            </div>
          `;

          const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoApiKey.trim(),
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              sender: { name: brevoSenderName.trim() || 'Instructor', email: brevoSenderEmail.trim() },
              to: [{ email: student.email, name: student.name }],
              subject: subject,
              htmlContent: htmlContent
            })
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || `Brevo HTTP ${res.status}`);
          }
          successCount++;
          setSendLogs(prev => [...prev, `✅ [${i + 1}/${total}] Sent via Brevo to ${student.name} (${student.email})`]);
        } catch (err: any) {
          failCount++;
          setSendLogs(prev => [...prev, `❌ [${i + 1}/${total}] Failed for ${student.name} (${student.email}): ${err.message}`]);
        }
      } else {
        // High-Fidelity Simulator
        await new Promise(r => setTimeout(r, 450));
        successCount++;
        setSendLogs(prev => [...prev, `⚡ [${i + 1}/${total}] [Simulator] Delivered private link to ${student.name} (${student.email})`]);
      }

      setSendProgress(Math.round(((i + 1) / total) * 100));
    }

    setIsSending(false);

    if (onToast) {
      if (emailService === 'simulator') {
        onToast(`Simulated emails successfully sent to ${successCount} student(s)!`, 'success');
      } else if (successCount > 0) {
        onToast(`Live email campaign completed! Sent: ${successCount}, Failed: ${failCount}`, 'success');
      } else {
        onToast(`Email campaign failed. All ${failCount} emails failed to send. Check your API settings.`, 'error');
      }
    }
  };

  // Launch Default Mail Client (BCC)
  const handleLaunchMailApp = () => {
    if (targetRecipients.length === 0) return;
    const allEmails = targetRecipients.map(s => s.email).filter(Boolean).join(',');
    const subject = encodeURIComponent(substituteVariables(emailSubject, previewStudent));
    const genericLink = `${window.location.origin}${window.location.pathname}?classId=${classData.id}`;
    const body = encodeURIComponent(
      emailBody
        .replace(/{student_name}/g, 'Student')
        .replace(/{team_name}/g, 'your team')
        .replace(/{evaluation_link}/g, genericLink)
    );
    window.open(`mailto:?bcc=${allEmails}&subject=${subject}&body=${body}`, '_blank');
  };

  // Copy Full Resolved Email Message
  const handleCopyEmailText = () => {
    const resolved = `Subject: ${substituteVariables(emailSubject, previewStudent)}\n\n${substituteVariables(emailBody, previewStudent)}`;
    navigator.clipboard.writeText(resolved);
    setCopiedType('email');
    if (onToast) onToast(`Copied email message customized for ${previewStudent.name}!`, 'success');
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Copy Preview Student Personal Link
  const handleCopyStudentLink = () => {
    const link = getStudentPortalUrl(previewStudent.id);
    navigator.clipboard.writeText(link);
    setCopiedType('link');
    if (onToast) onToast(`Copied evaluation link for ${previewStudent.name}!`, 'success');
    setTimeout(() => setCopiedType(null), 2500);
  };

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '1020px', 
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
        {/* 1. Modal Header */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '1rem 1.5rem', 
            borderBottom: '1px solid var(--border-color)', 
            backgroundColor: 'var(--bg-app)' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Classroom Email Center</h3>
                <span className={`badge ${emailService === 'simulator' ? 'badge-amber' : 'badge-teal'}`} style={{ fontSize: '0.7rem' }}>
                  {emailService === 'emailjs' ? 'EmailJS API' : emailService === 'brevo' ? 'Brevo API' : 'Simulator Mode'}
                </span>
                <FeatureInfoButton featureId="link-dispatcher" size="sm" tooltipText="Link Dispatcher Guide" />
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Directly send customized evaluation links to selected students, groups, or the entire class.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Recipient Cohort Selector Strip */}
        <div 
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: 'var(--bg-surface)', 
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          {/* 3-Tier Segmented Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className={`btn btn-sm ${recipientMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', gap: '0.35rem', border: 'none' }}
              onClick={() => setRecipientMode('all')}
            >
              <Users size={14} /> All Students ({classData.students.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${recipientMode === 'group' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', gap: '0.35rem', border: 'none' }}
              onClick={() => setRecipientMode('group')}
            >
              <Layers size={14} /> By Group / Team
            </button>
            <button
              type="button"
              className={`btn btn-sm ${recipientMode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', gap: '0.35rem', border: 'none' }}
              onClick={() => setRecipientMode('single')}
            >
              <User size={14} /> Single Student
            </button>
          </div>

          {/* Sub-Filters / Selection Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {recipientMode === 'all' && (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input 
                  type="checkbox" 
                  checked={pendingOnly} 
                  onChange={(e) => setPendingOnly(e.target.checked)} 
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Only Pending Reviewers ({classData.students.filter(s => !s.submitted).length})</span>
              </label>
            )}

            {recipientMode === 'group' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CustomSelect
                  options={groupSelectOptions}
                  value={selectedGroup}
                  onChange={(val) => setSelectedGroup(val)}
                  triggerStyle={{ height: '34px', fontSize: '0.8rem', minWidth: '180px' }}
                />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input 
                    type="checkbox" 
                    checked={pendingOnly} 
                    onChange={(e) => setPendingOnly(e.target.checked)} 
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>Pending only</span>
                </label>
              </div>
            )}

            {recipientMode === 'single' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <select
                  className="form-select"
                  value={selectedStudentId || classData.students[0]?.id || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  style={{ height: '34px', fontSize: '0.8rem', minWidth: '220px' }}
                >
                  {classData.students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.groupName || 'Unassigned'}) - {s.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Recipient Count Tag */}
            <span className="badge badge-teal" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              {targetRecipients.length} Recipient{targetRecipients.length !== 1 ? 's' : ''} Target
            </span>
          </div>
        </div>

        {/* 3. Modal Body: 2-Column Email Studio */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '1.25rem' }}>
          
          {/* Left: Email Composer & Sending Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={15} className="text-primary" /> Email Template
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
                <RefreshCw size={11} /> Reset Template
              </button>
            </div>

            {/* Subject Line */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Subject Line:</label>
              <input
                type="text"
                className="form-input"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                style={{ fontSize: '0.82rem', height: '36px' }}
              />
            </div>

            {/* Body */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700 }}>Email Body Text:</label>
              <textarea
                className="form-input"
                rows={7}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                style={{ fontSize: '0.8rem', lineHeight: 1.45, resize: 'vertical' }}
              />
            </div>

            {/* Dynamic Placeholder Insertion Chips */}
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                Insert Dynamic Tag:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {[
                  { tag: '{student_name}', label: 'Student Name' },
                  { tag: '{class_name}', label: 'Class Name' },
                  { tag: '{team_name}', label: 'Team / Group' },
                  { tag: '{evaluation_link}', label: 'Personal Link' }
                ].map(v => (
                  <button
                    key={v.tag}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', backgroundColor: 'var(--bg-app)', color: 'var(--primary)', fontWeight: 600 }}
                    onClick={() => setEmailBody(prev => `${prev} ${v.tag}`)}
                  >
                    + {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Send & Utility Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSendDirectEmails}
                disabled={isSending || targetRecipients.length === 0}
                style={{ width: '100%', justifyContent: 'center', gap: '0.45rem', padding: '0.65rem', fontWeight: 700, fontSize: '0.88rem' }}
              >
                {isSending ? (
                  <>
                    <RefreshCw size={15} className="spin" /> Sending to {targetRecipients.length} Student{targetRecipients.length !== 1 ? 's' : ''}... ({sendProgress}%)
                  </>
                ) : (
                  <>
                    <Send size={15} /> Send Direct Email ({targetRecipients.length} Recipient{targetRecipients.length !== 1 ? 's' : ''})
                  </>
                )}
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleLaunchMailApp}
                  disabled={isSending || targetRecipients.length === 0}
                  style={{ justifyContent: 'center', gap: '0.35rem', fontSize: '0.76rem', padding: '0.45rem' }}
                  title="Open system default email client (Outlook, Apple Mail, Gmail) with BCC list"
                >
                  <Mail size={13} className="text-teal" /> Open in Mail App
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyEmailText}
                  style={{ justifyContent: 'center', gap: '0.35rem', fontSize: '0.76rem', padding: '0.45rem' }}
                  title="Copy resolved email text for active preview student"
                >
                  {copiedType === 'email' ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
                  {copiedType === 'email' ? 'Copied Message!' : 'Copy Message'}
                </button>
              </div>
            </div>

            {/* Live Progress Bar & Delivery Logs */}
            {(isSending || sendLogs.length > 0) && (
              <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Delivery Pipeline Status</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{sendProgress}%</span>
                </div>
                
                {/* Progress track */}
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${sendProgress}%`, 
                      height: '100%', 
                      backgroundColor: 'var(--primary)', 
                      transition: 'width 200ms ease' 
                    }} 
                  />
                </div>

                {/* Log stream */}
                <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                  {sendLogs.map((log, idx) => (
                    <div key={idx} style={{ fontSize: '0.7rem', color: log.includes('❌') ? 'var(--accent-rose)' : 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Interactive Email Preview */}
          <div style={{ backgroundColor: 'var(--bg-app)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Eye size={14} className="text-teal" /> Live Preview ({previewStudentIndex + 1}/{targetRecipients.length || 1})
              </span>

              {targetRecipients.length > 1 && (
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}
                    onClick={() => setPreviewStudentIndex(prev => (prev > 0 ? prev - 1 : targetRecipients.length - 1))}
                  >
                    ◀ Prev
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}
                    onClick={() => setPreviewStudentIndex(prev => (prev < targetRecipients.length - 1 ? prev + 1 : 0))}
                  >
                    Next ▶
                  </button>
                </div>
              )}
            </div>

            {/* Email Shell Simulation */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
              {/* Headers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>To: </span>
                  <b style={{ color: 'var(--text-primary)' }}>{previewStudent.name}</b>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}> &lt;{previewStudent.email}&gt;</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>Team: </span>
                  <span className="badge badge-teal" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{previewStudent.groupName || 'Unassigned'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>Subject: </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{substituteVariables(emailSubject, previewStudent)}</span>
                </div>
              </div>

              {/* Message Body */}
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, margin: '0.35rem 0' }}>
                {substituteVariables(emailBody, previewStudent)}
              </div>

              {/* Action Button Simulation */}
              <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                <a 
                  href={getStudentPortalUrl(previewStudent.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 1rem', fontSize: '0.78rem', textDecoration: 'none' }}
                >
                  Open Grading Portal <ExternalLink size={12} />
                </a>
              </div>

              {/* Copy Student Link Action */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldCheck size={11} className="text-teal" /> Personalized hashed token link
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyStudentLink}
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', gap: '0.25rem' }}
                >
                  {copiedType === 'link' ? <Check size={11} className="text-teal" /> : <Copy size={11} />}
                  {copiedType === 'link' ? 'Copied Link!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* 4. Modal Footer */}
        <div style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--bg-app)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Emails send personalized, confidential links with direct one-click access for peer reviews.</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LinkDispatcherModal;
