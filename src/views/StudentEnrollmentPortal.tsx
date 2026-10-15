import React, { useState, useEffect } from 'react';
import {
  User, Mail, Globe, BookOpen, CheckCircle,
  ArrowRight, ShieldCheck, Copy, Check,
  GraduationCap, Languages, UserCheck, Lock, RefreshCw,
  Building2, Plane, ArrowRightLeft, Compass,
  Edit3, ArrowLeft, Eye
} from 'lucide-react';
import { useClass } from '../context/ClassContext';
import { normalizeNationality, DEFAULT_ENROLLMENT_FIELDS, isStandardEnrollmentField } from '../utils/math';
import SearchableSelect from '../components/SearchableSelect';
import { NATIONALITY_OPTIONS } from '../utils/nationalities';

interface CEFRLevel {
  value: string;
  code: string;
  short: string;
  title: string;
  desc: string;
  badgeBg: string;
  badgeColor: string;
}

const CEFR_LEVELS: CEFRLevel[] = [
  {
    value: 'Native / Bilingual',
    code: 'Native',
    short: 'Native',
    title: 'Native / Bilingual',
    desc: 'Mother tongue or full bilingual proficiency',
    badgeBg: 'rgba(99, 102, 241, 0.12)',
    badgeColor: '#4f46e5'
  },
  {
    value: 'Fluent (C1/C2)',
    code: 'C1/C2',
    short: 'Fluent',
    title: 'Fluent (C1/C2)',
    desc: 'Full professional working proficiency',
    badgeBg: 'rgba(13, 148, 136, 0.12)',
    badgeColor: '#0d9488'
  },
  {
    value: 'Intermediate (B1/B2)',
    code: 'B1/B2',
    short: 'Intermediate',
    title: 'Intermediate (B1/B2)',
    desc: 'Can convey main ideas in familiar topics',
    badgeBg: 'rgba(2, 132, 199, 0.12)',
    badgeColor: '#0284c7'
  },
  {
    value: 'Basic (A1/A2)',
    code: 'A1/A2',
    short: 'Basic',
    title: 'Basic (A1/A2)',
    desc: 'Elementary phrases and foundational comprehension',
    badgeBg: 'rgba(100, 116, 139, 0.12)',
    badgeColor: '#64748b'
  }
];

const GENDER_OPTIONS = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

const DEGREE_SUGGESTIONS = [
  'Computer Science',
  'Software Engineering',
  'Data Science & AI',
  'Business Administration',
  'Mechanical Engineering',
  'Economics & Finance',
  'Information Systems'
];

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'trashmail.com', 'yopmail.com', 'sharklasers.com', 'dispostable.com',
  'throwawaymail.com', 'crazymailing.com', 'fakeinbox.com', 'temp-mail.org',
  'temp-mail.io', 'getairmail.com', 'burnermail.io'
]);

const isDisposableEmail = (email: string): boolean => {
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(parts[1]);
};

interface StudentEnrollmentPortalProps {
  classId: string;
}

export const StudentEnrollmentPortal: React.FC<StudentEnrollmentPortalProps> = ({ classId }) => {
  const { classes, enrollStudent, addToast } = useClass();

  const targetClass = classes.find((c) => c.id === classId) || null;

  // Form state - All fields are strictly mandatory
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: 'Female',
    englishProficiency: 'Fluent (C1/C2)',
    degree: '',
    // International & Geographic status
    isInternational: false,
    nationality: '',
    currentCountry: '',
    // Exchange status
    isExchange: false,
    university: '',
    originalUniversity: '',
    originalCountry: '',
    currentUniversity: ''
  });

  const [loading, setLoading] = useState(false);
  const [enrolledStudentId, setEnrolledStudentId] = useState<string | null>(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  const existingStudent = targetClass && enrolledStudentId
    ? targetClass.students.find(s => s.id === enrolledStudentId)
    : null;

  // Sync custom field values from class definition or existing student
  useEffect(() => {
    if (targetClass?.enrollmentFormFields) {
      setCustomFieldValues(prev => {
        const next = { ...prev };
        targetClass.enrollmentFormFields?.forEach(f => {
          if (next[f.id] === undefined) {
            const studentVal = existingStudent?.customFields?.[f.id] ?? existingStudent?.customFields?.[f.label];
            if (studentVal !== undefined) {
              next[f.id] = studentVal;
            } else if (f.defaultValue !== undefined) {
              next[f.id] = f.defaultValue;
            } else if (f.type === 'boolean') {
              next[f.id] = false;
            } else {
              next[f.id] = '';
            }
          }
        });
        return next;
      });
    }
  }, [targetClass?.enrollmentFormFields, existingStudent]);

  // Check if viewing in preview or form-edit mode
  const isPreviewMode = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('preview') === 'true'
    || new URLSearchParams(window.location.search).get('edit') === 'true'
    || new URLSearchParams(window.location.search).get('view') === 'form'
  );

  // Restore enrolled student identity from local device storage
  useEffect(() => {
    // If instructor or user is explicitly previewing the form, do not auto-redirect away
    if (isPreviewMode) return;

    try {
      const stored = localStorage.getItem(`peer_enrolled_student_${classId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const matched = targetClass?.students.find(
          s => s.id === parsed.id || s.email.toLowerCase() === (parsed.email || '').toLowerCase()
        );
        if (matched) {
          setEnrolledStudentId(matched.id);
          try {
            localStorage.setItem('peer_active_student_session', JSON.stringify({ classId, studentId: matched.id }));
          } catch (e) {}
          // Immediately route to personal student dashboard
          const targetUrl = `${window.location.origin}${window.location.pathname}?classId=${classId}&studentId=${matched.id}`;
          window.history.replaceState(null, '', targetUrl);
          window.dispatchEvent(new Event('popstate'));
          return;
        } else if (targetClass) {
          // Student was removed or deleted from roster; purge stale token
          localStorage.removeItem(`peer_enrolled_student_${classId}`);
          setEnrolledStudentId(null);
        }
      }
    } catch (e) {
      console.warn('Failed to load local enrollment token', e);
    }
  }, [classId, targetClass, isPreviewMode]);

  // Resolve active form fields configured by instructor (or fall back to standard defaults)
  const activeFormFields = React.useMemo(() => {
    return (targetClass?.enrollmentFormFields && targetClass.enrollmentFormFields.length > 0)
      ? targetClass.enrollmentFormFields
      : DEFAULT_ENROLLMENT_FIELDS;
  }, [targetClass?.enrollmentFormFields]);

  const nameField = activeFormFields.find(f => f.id === 'name');
  const emailField = activeFormFields.find(f => f.id === 'email');
  const genderField = activeFormFields.find(f => f.id === 'gender');
  const nationalityField = activeFormFields.find(f => f.id === 'nationality');
  const currentCountryField = activeFormFields.find(f => f.id === 'currentCountry');
  const degreeField = activeFormFields.find(f => f.id === 'degree');
  const universityField = activeFormFields.find(f => f.id === 'university');
  const englishField = activeFormFields.find(f => f.id === 'englishProficiency');
  const internationalField = activeFormFields.find(f => f.id === 'isInternational');
  const exchangeField = activeFormFields.find(f => f.id === 'isExchange');

  const customQuestions = React.useMemo(() => {
    return activeFormFields.filter(f => !isStandardEnrollmentField(f.id));
  }, [activeFormFields]);

  // Real-time check if name and email match an existing student in class roster
  const matchedExistingStudent = React.useMemo(() => {
    if (isEditingInfo || enrolledStudentId || !targetClass || !formData.email.includes('@')) {
      return null;
    }
    const normName = formData.name.trim().toLowerCase().replace(/\s+/g, ' ');
    const normEmail = formData.email.trim().toLowerCase();
    if (!normName || !normEmail) return null;

    return targetClass.students.find(s => {
      const sEmail = (s.email || '').trim().toLowerCase();
      const sName = (s.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
      return sEmail === normEmail || (sName === normName && sEmail === normEmail);
    }) || null;
  }, [formData.name, formData.email, isEditingInfo, enrolledStudentId, targetClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nameField && nameField.required && !formData.name.trim()) {
      addToast(`Please enter your ${nameField.label.toLowerCase()}.`, 'warning');
      return;
    }

    if (emailField) {
      if (!formData.email.trim() || !formData.email.includes('@')) {
        addToast(`Please provide a valid ${emailField.label.toLowerCase()}.`, 'warning');
        return;
      }
      if (isDisposableEmail(formData.email)) {
        addToast('Disposable / burner email addresses are not permitted. Please use your academic or standard email.', 'warning');
        return;
      }
    }

    if (genderField && genderField.required && !formData.gender.trim()) {
      addToast(`Please select your ${genderField.label.toLowerCase()}.`, 'warning');
      return;
    }

    if (nationalityField && nationalityField.required && !formData.nationality.trim()) {
      addToast(`Please select your ${nationalityField.label.toLowerCase()}.`, 'warning');
      return;
    }

    if (currentCountryField && currentCountryField.required && !formData.currentCountry.trim()) {
      addToast(`Please select your ${currentCountryField.label.toLowerCase()}.`, 'warning');
      return;
    }

    if (degreeField && degreeField.required && !formData.degree.trim()) {
      addToast(`Please enter your ${degreeField.label.toLowerCase()}.`, 'warning');
      return;
    }

    if (universityField && universityField.required) {
      if (formData.isExchange) {
        if (!formData.originalCountry.trim()) {
          addToast('Please select your original (home) country.', 'warning');
          return;
        }
        if (!formData.originalUniversity.trim()) {
          addToast('Please enter your original (home) university in English.', 'warning');
          return;
        }
        if (!formData.currentUniversity.trim()) {
          addToast('Please enter your current (host) university in English.', 'warning');
          return;
        }
      } else {
        if (!formData.university.trim()) {
          addToast(`Please enter your ${universityField.label.toLowerCase()}.`, 'warning');
          return;
        }
      }
    }

    if (englishField && englishField.required && !formData.englishProficiency.trim()) {
      addToast(`Please select your ${englishField.label.toLowerCase()}.`, 'warning');
      return;
    }

    // Validate custom questions dynamically configured by instructor
    for (const field of customQuestions) {
      const val = customFieldValues[field.id];
      if (field.type === 'number') {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          const num = Number(val);
          if (isNaN(num) || !isFinite(num)) {
            addToast(`Please enter a valid numeric value for "${field.label}".`, 'warning');
            return;
          }
        } else if (field.required) {
          addToast(`Please provide a numeric answer for the required question: "${field.label}".`, 'warning');
          return;
        }
      } else if (field.type === 'boolean') {
        if (field.required && !val) {
          addToast(`Please check / confirm the required item: "${field.checkboxLabel || field.label}".`, 'warning');
          return;
        }
      } else if (field.required) {
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          addToast(`Please answer the required question: "${field.label}".`, 'warning');
          return;
        }
      }
    }

    // Normalized name and email for robust whitespace & case-insensitive matching
    const normName = formData.name.trim().toLowerCase().replace(/\s+/g, ' ');
    const normEmail = formData.email.trim().toLowerCase();

    // Cross-device duplicate check: If not in explicit edit mode, check if a matching student is already registered
    if (!isEditingInfo && targetClass) {
      const matchByEmailOrName = targetClass.students.find(s => {
        const sEmail = (s.email || '').trim().toLowerCase();
        const sName = (s.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
        return sEmail === normEmail || (sName === normName && sEmail === normEmail);
      });

      if (matchByEmailOrName) {
        setEnrolledStudentId(matchByEmailOrName.id);
        setFormData({
          name: matchByEmailOrName.name || '',
          email: matchByEmailOrName.email || '',
          gender: matchByEmailOrName.gender || 'Female',
          englishProficiency: matchByEmailOrName.englishProficiency || 'Fluent (C1/C2)',
          degree: matchByEmailOrName.degree || '',
          isInternational: !!matchByEmailOrName.isInternational,
          nationality: matchByEmailOrName.nationality || '',
          currentCountry: matchByEmailOrName.currentCountry || matchByEmailOrName.nationality || '',
          isExchange: !!matchByEmailOrName.isExchange,
          university: matchByEmailOrName.university || '',
          originalUniversity: matchByEmailOrName.originalUniversity || '',
          originalCountry: matchByEmailOrName.originalCountry || '',
          currentUniversity: matchByEmailOrName.currentUniversity || matchByEmailOrName.university || ''
        });
        if (matchByEmailOrName.customFields) {
          setCustomFieldValues(matchByEmailOrName.customFields);
        }
        setIsEditingInfo(false);
        try {
          localStorage.setItem(`peer_enrolled_student_${classId}`, JSON.stringify({ id: matchByEmailOrName.id, email: matchByEmailOrName.email }));
          localStorage.setItem('peer_active_student_session', JSON.stringify({ classId, studentId: matchByEmailOrName.id }));
        } catch (e) { }
        addToast(`Welcome back, ${matchByEmailOrName.name}! Entering your student dashboard...`, 'success');
        const targetUrl = `${window.location.origin}${window.location.pathname}?classId=${classId}&studentId=${matchByEmailOrName.id}`;
        window.history.pushState(null, '', targetUrl);
        window.dispatchEvent(new Event('popstate'));
        return;
      }
    }

    setLoading(true);

    try {
      // Use existing student ID if updating, otherwise generate clean auto ID
      const autoStudentId = enrolledStudentId || ('std_' + Math.floor(100000 + Math.random() * 900000));

      const effectiveUni = formData.isExchange
        ? formData.currentUniversity.trim()
        : formData.university.trim();

      const studentPayload = {
        id: autoStudentId,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        groupName: existingStudent?.groupName || 'Unassigned',
        university: effectiveUni,
        degree: formData.degree.trim(),
        studentType: formData.isExchange ? 'Erasmus' : (formData.isInternational ? 'International' : 'Normal'),
        gender: formData.gender,
        nationality: normalizeNationality(formData.nationality) || undefined,
        englishProficiency: formData.englishProficiency,
        isInternational: formData.isInternational,
        isExchange: formData.isExchange,
        currentCountry: formData.isInternational
          ? (normalizeNationality(formData.currentCountry) || undefined)
          : (normalizeNationality(formData.currentCountry || formData.nationality) || undefined),
        originalCountry: formData.isExchange ? normalizeNationality(formData.originalCountry) : normalizeNationality(formData.nationality),
        originalUniversity: formData.isExchange ? formData.originalUniversity.trim() : formData.university.trim(),
        currentUniversity: formData.isExchange ? formData.currentUniversity.trim() : formData.university.trim(),
        customFields: (() => {
          const compiled: Record<string, string | number | boolean> = {};
          activeFormFields.forEach(field => {
            const raw = customFieldValues[field.id];
            if (raw !== undefined && raw !== null && raw !== '') {
              if (field.type === 'number') {
                const num = Number(raw);
                const parsed = isNaN(num) ? raw : num;
                compiled[field.id] = parsed;
                compiled[field.label] = parsed;
              } else if (field.type === 'boolean') {
                const boolVal = Boolean(raw);
                compiled[field.id] = boolVal;
                compiled[field.label] = boolVal;
              } else {
                // Text or dropdown: string value (preserves numbers, alphanumeric, or text as entered)
                compiled[field.id] = String(raw).trim();
                compiled[field.label] = String(raw).trim();
              }
            } else if (field.type === 'boolean') {
              compiled[field.id] = false;
              compiled[field.label] = false;
            }
          });
          // Also preserve any additional values in customFieldValues
          Object.entries(customFieldValues).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '' && compiled[k] === undefined) {
              compiled[k] = v;
            }
          });
          return compiled;
        })()
      };

      const res = await enrollStudent(classId, studentPayload);

      if (res.success) {
        setEnrolledStudentId(res.studentId);
        setIsEditingInfo(false);
        try {
          localStorage.setItem(`peer_enrolled_student_${classId}`, JSON.stringify({ id: res.studentId, email: studentPayload.email }));
          localStorage.setItem('peer_active_student_session', JSON.stringify({ classId, studentId: res.studentId }));
        } catch (e) { }
        addToast(isEditingInfo ? 'Registration details updated!' : 'Registration successful! Entering your dashboard...', 'success');
        const targetUrl = `${window.location.origin}${window.location.pathname}?classId=${classId}&studentId=${res.studentId}`;
        window.history.pushState(null, '', targetUrl);
        window.dispatchEvent(new Event('popstate'));
      } else {
        addToast(res.message || 'Enrollment failed. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      const errMsg = err instanceof Error ? err.message : 'An error occurred during enrollment.';
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate evaluation portal URL for the enrolled student
  const getStudentPortalUrl = () => {
    if (!enrolledStudentId) return '';
    const params = new URLSearchParams(window.location.search);
    const fbParam = params.get('fb');
    let url = `${window.location.origin}${window.location.pathname}?classId=${classId}&studentId=${enrolledStudentId}`;
    if (fbParam) {
      url += `&fb=${fbParam}`;
    }
    return url;
  };

  const handleCopyEvaluationLink = () => {
    const url = getStudentPortalUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      addToast('Personal evaluation link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="student-enrollment-wrapper" style={{ minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '1.5rem 1rem 4rem' }}>

      {/* Centered Main Layout Container */}
      <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Hero Card Banner - Minimal & Clean */}
        <div
          style={{
            padding: '1.25rem 1.4rem',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {targetClass ? targetClass.name : 'Classroom Enrollment'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Class Join Page
          </p>
        </div>

        {/* Preview Mode Banner */}
        {isPreviewMode && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.15rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(13, 148, 136, 0.1)',
            border: '1.5px solid var(--accent-teal)',
            color: 'var(--accent-teal)',
            marginBottom: '0.5rem',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <Eye size={18} />
              <div>
                <strong style={{ fontSize: '0.88rem', display: 'block' }}>Form Preview &amp; Test Mode</strong>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  Viewing active student enrollment form for {targetClass?.name} (9 Baseline + {targetClass?.enrollmentFormFields?.length || 0} Custom Extensions)
                </span>
              </div>
            </div>
            <span className="badge badge-teal" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
              Live Preview Active
            </span>
          </div>
        )}

        {/* --- STATE 1: ALREADY ENROLLED / ACTIVE REGISTRATION OVERVIEW --- */}
        {enrolledStudentId && !isEditingInfo && !isPreviewMode ? (
          <div
            className="card"
            style={{
              padding: '2rem 1.75rem',
              borderRadius: '16px',
              border: '1.5px solid var(--accent-teal)',
              boxShadow: 'var(--shadow-premium)',
              animation: 'fadeIn 300ms ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(20, 184, 166, 0.12)',
                  color: 'var(--accent-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  boxShadow: '0 4px 16px rgba(20, 184, 166, 0.15)'
                }}
              >
                <CheckCircle size={36} />
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent-teal)', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                <ShieldCheck size={12} /> Enrollment Verified &amp; Active
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>
                Welcome, {existingStudent?.name || formData.name}!
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                You are registered in <b>{targetClass?.name || 'this classroom'}</b>.
              </p>
            </div>

            {/* Student Registration Summary Card */}
            <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Registered Profile Details
                </span>
                <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>
                  {existingStudent?.studentType || (formData.isExchange ? 'Erasmus' : formData.isInternational ? 'International' : 'Domestic')}
                </span>
              </div>

              <div className="student-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Email Address</span>
                  <strong style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{existingStudent?.email || formData.email}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Assigned Group</span>
                  <strong style={{ color: (existingStudent?.groupName && existingStudent.groupName !== 'Unassigned') ? 'var(--accent-teal)' : '#d97706' }}>
                    {existingStudent?.groupName && existingStudent.groupName !== 'Unassigned' ? existingStudent.groupName : 'Pending Team Assignment'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>University</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{existingStudent?.university || formData.university || formData.currentUniversity || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Nationality / Origin</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{existingStudent?.nationality || formData.nationality || 'N/A'}</strong>
                </div>
                {targetClass?.enrollmentFormFields?.filter(f => !isStandardEnrollmentField(f.id)).map(field => {
                  const val = existingStudent?.customFields?.[field.id] ?? existingStudent?.customFields?.[field.label] ?? customFieldValues[field.id];
                  if (val === undefined || val === null || val === '') return null;
                  return (
                    <div key={field.id}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>{field.label}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {field.type === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Status Info */}
            <div
              style={{
                backgroundColor: 'var(--accent-amber-light)',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                border: '1px solid var(--border-color)'
              }}
            >
              <UserCheck size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b style={{ display: 'block', marginBottom: '2px' }}>Team Status &amp; Peer Evaluation</b>
                {existingStudent?.groupName && existingStudent.groupName !== 'Unassigned'
                  ? `You are assigned to ${existingStudent.groupName}. You can now proceed to evaluate your teammates.`
                  : 'Your professor is currently organizing classroom groups. Once teams are finalized, your teammates will appear in your evaluation portal.'}
              </div>
            </div>

            {/* Primary & Secondary Action CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <a
                href={getStudentPortalUrl()}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem',
                  fontSize: '0.96rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  minHeight: '46px',
                  borderRadius: '10px'
                }}
              >
                Proceed to Peer Evaluation Portal <ArrowRight size={18} />
              </a>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditingInfo(true)}
                  style={{
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.7rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    minHeight: '40px',
                    borderRadius: '8px'
                  }}
                  title="Correct or update your student information"
                >
                  <Edit3 size={15} /> Edit My Information
                </button>

                <button
                  type="button"
                  className={`btn ${copiedLink ? 'btn-teal' : 'btn-secondary'}`}
                  onClick={handleCopyEvaluationLink}
                  style={{
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.7rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    minHeight: '40px',
                    borderRadius: '8px'
                  }}
                >
                  {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                  {copiedLink ? 'Link Copied!' : 'Copy Portal URL'}
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0.25rem 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <Lock size={12} /> Your device is recognized. Bookmark this page or your personal access URL.
            </p>
          </div>
        ) : (
          /* --- STATE 2: REGISTRATION & EDITING FORM --- */
          <form
            onSubmit={handleSubmit}
            className="card"
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            {isEditingInfo && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(99, 102, 241, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                  <Edit3 size={15} /> Editing Registration Profile
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.5rem', gap: '0.25rem' }}
                >
                  <ArrowLeft size={12} /> Cancel
                </button>
              </div>
            )}

            {/* --- SECTION 1: IDENTITY & CONTACT --- */}
            {(nameField || emailField || genderField) && (
              <div
                className="card"
                style={{
                  padding: '1.4rem',
                  borderRadius: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.1rem',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 900 }}>
                      1
                    </div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Identity &amp; Contact
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose)', fontWeight: 700 }}>
                    * Required
                  </span>
                </div>

                {/* Full Name */}
                {nameField && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
                      <User size={14} className="text-primary" /> {nameField.label} {nameField.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                    </label>
                    <input
                      type="text"
                      required={nameField.required}
                      placeholder={nameField.placeholder || 'e.g. Alex Morgan'}
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      style={{ minHeight: '44px', fontSize: '15px', borderRadius: '8px' }}
                      autoComplete="name"
                    />
                  </div>
                )}

                {/* Institutional Email */}
                {emailField && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
                      <Mail size={14} className="text-primary" /> {emailField.label} {emailField.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                    </label>
                    <input
                      type="email"
                      required={emailField.required}
                      placeholder={emailField.placeholder || 'e.g. alex.morgan@university.edu'}
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      style={{ minHeight: '44px', fontSize: '15px', borderRadius: '8px' }}
                      autoComplete="email"
                    />
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      {emailField.description || 'Used for anonymous authentication & peer review notifications.'}
                    </span>

                    {/* Real-time Inline Alert when Name & Email Match an Already Enrolled Student */}
                    {matchedExistingStudent && (
                      <div
                        style={{
                          backgroundColor: 'var(--accent-amber-light)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '1rem',
                          marginTop: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.65rem',
                          animation: 'fadeIn 250ms ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', border: '1px solid var(--border-color)' }}>
                            <UserCheck size={16} />
                          </div>
                          <div>
                            <strong style={{ color: 'var(--accent-amber)', fontSize: '0.88rem', display: 'block' }}>
                              Registered Profile Found for this Name &amp; Email
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'block', marginTop: '2px' }}>
                              An enrolled profile for <b>{matchedExistingStudent.name}</b> ({matchedExistingStudent.email}) already exists in this course.
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => {
                              setEnrolledStudentId(matchedExistingStudent.id);
                              setFormData({
                                name: matchedExistingStudent.name || '',
                                email: matchedExistingStudent.email || '',
                                gender: matchedExistingStudent.gender || 'Female',
                                englishProficiency: matchedExistingStudent.englishProficiency || 'Fluent (C1/C2)',
                                degree: matchedExistingStudent.degree || '',
                                isInternational: !!matchedExistingStudent.isInternational,
                                nationality: matchedExistingStudent.nationality || '',
                                currentCountry: matchedExistingStudent.currentCountry || matchedExistingStudent.nationality || '',
                                isExchange: !!matchedExistingStudent.isExchange,
                                university: matchedExistingStudent.university || '',
                                originalUniversity: matchedExistingStudent.originalUniversity || '',
                                originalCountry: matchedExistingStudent.originalCountry || '',
                                currentUniversity: matchedExistingStudent.currentUniversity || matchedExistingStudent.university || ''
                              });
                              setIsEditingInfo(false);
                              try {
                                localStorage.setItem(`peer_enrolled_student_${classId}`, JSON.stringify({ id: matchedExistingStudent.id, email: matchedExistingStudent.email }));
                              } catch (e) { }
                              addToast(`Loaded profile for ${matchedExistingStudent.name}!`, 'success');
                            }}
                            style={{
                              backgroundColor: '#f59e0b',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              padding: '0.45rem 0.85rem',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <CheckCircle size={14} /> Continue with this Profile (Skip Form)
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, email: '' }));
                            }}
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.45rem 0.75rem',
                              borderRadius: '8px'
                            }}
                          >
                            Use a Different Email
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Gender Selection */}
                {genderField && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', marginBottom: '0.4rem' }}>
                      <User size={14} className="text-indigo" /> {genderField.label} {genderField.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                    </label>
                    <div className="gender-segmented-bar">
                      {(genderField.options && genderField.options.length > 0 ? genderField.options : GENDER_OPTIONS.map(g => g.value)).map((gVal) => {
                        const isSelected = formData.gender === gVal;
                        return (
                          <button
                            key={gVal}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, gender: gVal }))}
                            className={`gender-btn-item ${isSelected ? 'active' : ''}`}
                          >
                            {gVal}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- SECTION 2: GEOGRAPHIC & STUDENT STATUS --- */}
            {(internationalField || exchangeField || nationalityField || currentCountryField) && (
              <div
                className="card"
                style={{
                  padding: '1.4rem',
                  borderRadius: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.1rem',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--accent-teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 900 }}>
                      2
                    </div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Geographic &amp; Student Status
                    </h3>
                  </div>
                </div>

                {/* Status Toggle Cards */}
                {(internationalField || exchangeField) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                    {/* International Student Card */}
                    {internationalField && (
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          backgroundColor: formData.isInternational ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-app)',
                          border: `1.5px solid ${formData.isInternational ? 'var(--primary)' : 'var(--border-color)'}`,
                          cursor: 'pointer',
                          transition: 'all 150ms ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.isInternational}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            isInternational: e.target.checked,
                            currentCountry: (e.target.checked && prev.currentCountry === prev.nationality) ? '' : prev.currentCountry
                          }))}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <div>
                          <b style={{ fontSize: '0.86rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Globe size={14} className="text-primary" /> {internationalField.label}
                          </b>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {internationalField.checkboxLabel || 'Studying abroad from home country'}
                          </span>
                        </div>
                      </label>
                    )}

                    {/* Exchange Student Card */}
                    {exchangeField && (
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          backgroundColor: formData.isExchange ? 'rgba(20, 184, 166, 0.08)' : 'var(--bg-app)',
                          border: `1.5px solid ${formData.isExchange ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                          cursor: 'pointer',
                          transition: 'all 150ms ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.isExchange}
                          onChange={(e) => setFormData(prev => ({ ...prev, isExchange: e.target.checked }))}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--accent-teal)', cursor: 'pointer' }}
                        />
                        <div>
                          <b style={{ fontSize: '0.86rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Plane size={14} className="text-teal" /> {exchangeField.label}
                          </b>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {exchangeField.checkboxLabel || 'Visiting / semester exchange student'}
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                )}

                {/* Nationality / Country of Origin */}
                {nationalityField && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
                      <Globe size={14} className="text-teal" /> {nationalityField.label} {nationalityField.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                    </label>
                    <SearchableSelect
                      value={formData.nationality}
                      onChange={(val) => {
                        setFormData(prev => ({
                          ...prev,
                          nationality: val,
                          currentCountry: (!prev.currentCountry && !prev.isInternational) ? val : prev.currentCountry,
                          originalCountry: prev.originalCountry || val
                        }));
                      }}
                      options={NATIONALITY_OPTIONS}
                      placeholder="Select your nationality / passport country (e.g. India)..."
                      searchPlaceholder="Search 195+ countries..."
                    />
                  </div>
                )}

                {/* Current Country where they reside */}
                {currentCountryField && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
                      <Compass size={14} className="text-indigo" /> {currentCountryField.label} {currentCountryField.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                    </label>
                    <SearchableSelect
                      value={formData.currentCountry}
                      onChange={(val) => setFormData(prev => ({ ...prev, currentCountry: val }))}
                      options={NATIONALITY_OPTIONS}
                      placeholder="Select current residing / host country (e.g. Italy)..."
                      searchPlaceholder="Search 195+ countries..."
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                      {currentCountryField.description || (formData.isInternational
                        ? 'Select the country where you currently live or study abroad (e.g. Italy).'
                        : 'If you reside in your home country, select the same country as your nationality.')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* --- SECTION 3: ACADEMIC BACKGROUND & LANGUAGE --- */}
            {(englishField || degreeField || universityField) && (
              <div
                className="card"
                style={{
                  padding: '1.4rem',
                  borderRadius: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.1rem',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 900 }}>
                      3
                    </div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Academic Background &amp; Language
                    </h3>
                  </div>
                </div>

                {/* CEFR English Proficiency Level */}
                {englishField && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', marginBottom: '0.4rem' }}>
                      <Languages size={14} className="text-primary" /> {englishField.label} {englishField.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.55rem' }}>
                      {(englishField.options && englishField.options.length > 0 ? englishField.options.map(opt => ({
                        value: opt,
                        code: opt.split(' ')[0] || opt,
                        title: opt,
                        desc: opt
                      })) : CEFR_LEVELS).map((lvl) => {
                        const isSelected = formData.englishProficiency === lvl.value;
                        return (
                          <button
                            key={lvl.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, englishProficiency: lvl.value }))}
                            style={{
                              padding: '0.65rem 0.75rem',
                              borderRadius: '8px',
                              backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-app)',
                              border: `1.5px solid ${isSelected ? '#2563eb' : 'var(--border-color)'}`,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 150ms ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isSelected ? '#2563eb' : 'var(--text-primary)' }}>
                                {lvl.code}
                              </span>
                              {isSelected && <Check size={13} style={{ color: '#2563eb' }} />}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1.25 }}>
                              {lvl.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Degree / Major */}
              {degreeField && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', marginBottom: '0.3rem' }}>
                    <BookOpen size={14} className="text-teal" /> {degreeField.label} {degreeField.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    required={degreeField.required}
                    placeholder={degreeField.placeholder || "e.g. Computer Science, Mechanical Engineering, MBA"}
                    className="form-input"
                    value={formData.degree}
                    onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
                    style={{ minHeight: '42px', fontSize: '14px', borderRadius: '8px', marginBottom: '0.4rem' }}
                  />

                  {/* Degree Quick Suggestion Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {DEGREE_SUGGESTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, degree: item }))}
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: formData.degree === item ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-app)',
                          color: formData.degree === item ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* University Details: Regular vs Exchange */}
              {universityField && (
                formData.isExchange ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.85rem' }}>
                    {/* Exchange Institutions Banner */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        fontSize: '0.82rem',
                        color: 'var(--accent-teal)',
                        backgroundColor: 'rgba(20, 184, 166, 0.08)',
                        border: '1px solid rgba(20, 184, 166, 0.25)',
                        padding: '0.65rem 0.95rem',
                        borderRadius: '10px',
                        fontWeight: 700
                      }}
                    >
                      <Plane size={16} style={{ flexShrink: 0 }} />
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        Exchange / Erasmus Academic Journey (Home <ArrowRight size={13} style={{ display: 'inline' }} /> Host)
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {/* Home Institution Card */}
                      <div
                        style={{
                          padding: '1.1rem 1.15rem',
                          backgroundColor: 'var(--bg-app)',
                          borderRadius: '12px',
                          border: '1.5px solid var(--border-color)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', fontWeight: 800, color: 'var(--primary)' }}>
                          <Building2 size={16} /> 1. Home Institution (Original / Sending University)
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                              Home University Name (in English) {universityField.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                            </label>
                            <input
                              type="text"
                              required={universityField.required}
                              placeholder="e.g. Sorbonne University, TU Munich"
                              className="form-input"
                              value={formData.originalUniversity}
                              onChange={(e) => setFormData(prev => ({ ...prev, originalUniversity: e.target.value }))}
                              style={{ minHeight: '42px', fontSize: '14px', borderRadius: '8px' }}
                            />
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                              Home Country {universityField.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                            </label>
                            <SearchableSelect
                              value={formData.originalCountry}
                              onChange={(val) => setFormData(prev => ({ ...prev, originalCountry: val }))}
                              options={NATIONALITY_OPTIONS}
                              placeholder="Select home country..."
                              searchPlaceholder="Search countries..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Visual Connector / Transition Pill */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '-0.35rem 0' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--bg-surface)',
                            padding: '0.2rem 0.65rem',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <ArrowRightLeft size={11} className="text-teal" /> Visiting / Exchange At
                        </span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
                      </div>

                      {/* Host Institution Card */}
                      <div
                        style={{
                          padding: '1.1rem 1.15rem',
                          backgroundColor: 'var(--bg-app)',
                          borderRadius: '12px',
                          border: '1.5px solid var(--border-color)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', fontWeight: 800, color: 'var(--accent-teal)' }}>
                          <GraduationCap size={16} /> 2. Host Institution (Current / Destination University)
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                              Host University Name (in English) {universityField.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                            </label>
                            <input
                              type="text"
                              required={universityField.required}
                              placeholder="e.g. Stanford University, Oxford University"
                              className="form-input"
                              value={formData.currentUniversity}
                              onChange={(e) => setFormData(prev => ({ ...prev, currentUniversity: e.target.value }))}
                              style={{ minHeight: '42px', fontSize: '14px', borderRadius: '8px' }}
                            />
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                              Host Country {universityField.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                            </label>
                            <SearchableSelect
                              value={formData.currentCountry}
                              onChange={(val) => setFormData(prev => ({ ...prev, currentCountry: val }))}
                              options={NATIONALITY_OPTIONS}
                              placeholder="Select host country..."
                              searchPlaceholder="Search countries..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Regular Student University Input */
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
                      <GraduationCap size={14} className="text-indigo" /> {universityField.label} {universityField.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                    </label>
                    <input
                      type="text"
                      required={universityField.required}
                      placeholder={universityField.placeholder || "e.g. Stanford University, TU Munich"}
                      className="form-input"
                      value={formData.university}
                      onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                      style={{ minHeight: '42px', fontSize: '14px', borderRadius: '8px' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      {universityField.description || 'Please write the English or official international name of your university.'}
                    </span>
                  </div>
                )
              )}
            </div>
            )}

            {/* --- SECTION 4: COURSE QUESTIONNAIRE & PREFERENCES --- */}
            {customQuestions.length > 0 && (
              <div
                className="card"
                style={{
                  padding: '1.4rem',
                  borderRadius: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.15rem',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#8b5cf6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 900 }}>
                    4
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Course Questionnaire &amp; Preferences
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Requested by your instructor for course preparation
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {customQuestions.map((field, idx) => {
                    const value = customFieldValues[field.id];

                    if (field.type === 'boolean') {
                      const isChecked = !!value;
                      return (
                        <div
                          key={field.id}
                          onClick={() => setCustomFieldValues(prev => ({ ...prev, [field.id]: !isChecked }))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.85rem',
                            padding: '0.85rem 1rem',
                            borderRadius: '10px',
                            border: `1.5px solid ${isChecked ? '#8b5cf6' : 'var(--border-color)'}`,
                            backgroundColor: isChecked ? 'rgba(139, 92, 246, 0.06)' : 'var(--bg-app)',
                            cursor: 'pointer',
                            transition: 'all 120ms ease',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '5px',
                            border: `2px solid ${isChecked ? '#8b5cf6' : 'var(--text-muted)'}`,
                            backgroundColor: isChecked ? '#8b5cf6' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            flexShrink: 0
                          }}>
                            {isChecked && <Check size={14} strokeWidth={3} />}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Q{idx + 1}.</span>
                              {field.checkboxLabel || field.label} {field.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                            </div>
                            {field.description && (
                              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                {field.description}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={field.id} className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: 700, margin: '0 0 0.35rem 0', display: 'block', fontSize: '0.84rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Q{idx + 1}.</span> {field.label} {field.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                        </label>

                        {field.description && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                            {field.description}
                          </span>
                        )}

                        {/* Strictly Numeric Input */}
                        {field.type === 'number' && (
                          <input
                            type="text"
                            inputMode="decimal"
                            required={field.required}
                            placeholder={field.placeholder || 'Enter number (e.g. 0, 1.5, 3)...'}
                            className="form-input"
                            value={value !== undefined ? value : ''}
                            onKeyDown={(e) => {
                              if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) return;
                              if (e.key === '.' && !String(value || '').includes('.')) return;
                              if (e.key === '-' && !String(value || '').includes('-')) return;
                              if (!/^[0-9]$/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/[^0-9.-]/g, '');
                              setCustomFieldValues(prev => ({ ...prev, [field.id]: cleaned }));
                            }}
                            style={{ minHeight: '42px', fontSize: '14.5px', borderRadius: '8px' }}
                          />
                        )}

                        {/* Dropdown Choice Input */}
                        {field.type === 'dropdown' && (
                          <select
                            required={field.required}
                            className="form-input"
                            value={value || ''}
                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                            style={{ minHeight: '42px', fontSize: '14.5px', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            <option value="">{field.placeholder || `-- Select ${field.label} --`}</option>
                            {(field.options || []).map((opt, optIdx) => (
                              <option key={optIdx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Freeform Text Input */}
                        {field.type === 'text' && (
                          <input
                            type="text"
                            required={field.required}
                            placeholder={field.placeholder || `Enter response...`}
                            className="form-input"
                            value={value !== undefined ? value : ''}
                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                            style={{ minHeight: '42px', fontSize: '14.5px', borderRadius: '8px' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Registration Button */}
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="submit"
                className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
                disabled={loading}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  fontSize: '1.02rem',
                  fontWeight: 900,
                  minHeight: '52px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 25px rgba(99, 102, 241, 0.25)',
                  letterSpacing: '0.01em'
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spin" /> {isEditingInfo ? 'Updating Profile...' : 'Submitting Registration...'}
                  </>
                ) : (
                  <>
                    {isEditingInfo ? <CheckCircle size={20} /> : <UserCheck size={20} />}
                    {isEditingInfo ? 'Save & Update Student Profile' : 'Complete Registration & Join Course'}
                  </>
                )}
              </button>
            </div>

            {/* Privacy & Double-Blind Guarantee Note */}
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Lock size={16} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
              <span>
                All peer evaluation responses and demographic balancing records are strictly encrypted with double-blind anonymity.
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentEnrollmentPortal;
