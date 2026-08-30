import React, { useState } from 'react';
import { 
  User, Mail, Globe, BookOpen, Sparkles, CheckCircle, 
  ArrowRight, ShieldCheck, Copy, Check,
  GraduationCap, Languages, UserCheck, Lock, RefreshCw,
  Building2, Plane, Info, ArrowRightLeft, Compass
} from 'lucide-react';
import { useClass } from '../context/ClassContext';
import { normalizeNationality } from '../utils/math';
import SearchableSelect from '../components/SearchableSelect';
import { NATIONALITY_OPTIONS } from '../utils/nationalities';
import FeatureInfoButton from '../components/FeatureInfoButton';

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
    code: 'C2+',
    short: 'Native',
    title: 'Native / Bilingual',
    desc: 'Mother tongue or full bilingual mastery',
    badgeBg: 'rgba(99, 102, 241, 0.12)',
    badgeColor: '#4f46e5'
  },
  {
    value: 'Fluent (C1/C2)',
    code: 'C1/C2',
    short: 'Fluent',
    title: 'Fluent / Advanced Professional',
    desc: 'Effortless academic and professional discussions',
    badgeBg: 'rgba(13, 148, 136, 0.12)',
    badgeColor: '#0d9488'
  },
  {
    value: 'Advanced (B2)',
    code: 'B2',
    short: 'Advanced',
    title: 'Upper Intermediate (B2)',
    desc: 'Comfortable technical and team communication',
    badgeBg: 'rgba(2, 132, 199, 0.12)',
    badgeColor: '#0284c7'
  },
  {
    value: 'Intermediate (B1)',
    code: 'B1',
    short: 'Working',
    title: 'Intermediate Working (B1)',
    desc: 'Can convey main ideas in familiar topics',
    badgeBg: 'rgba(217, 119, 6, 0.12)',
    badgeColor: '#d97706'
  },
  {
    value: 'Basic (A1/A2)',
    code: 'A1/A2',
    short: 'Basic',
    title: 'Elementary / Basic (A1/A2)',
    desc: 'Basic phrases and foundational comprehension',
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

interface StudentEnrollmentPortalProps {
  classId: string;
}

export const StudentEnrollmentPortal: React.FC<StudentEnrollmentPortalProps> = ({ classId }) => {
  const { classes, enrollStudent, addToast, isCloudSynced } = useClass();

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
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addToast('Please enter your full name.', 'warning');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      addToast('Please provide a valid university email address.', 'warning');
      return;
    }

    if (!formData.gender.trim()) {
      addToast('Please select your gender.', 'warning');
      return;
    }

    if (!formData.nationality.trim()) {
      addToast('Please select your nationality / country of origin.', 'warning');
      return;
    }

    if (!formData.currentCountry.trim()) {
      addToast('Please select the country where you currently reside or study.', 'warning');
      return;
    }

    if (!formData.degree.trim()) {
      addToast('Please enter your Degree / Major field of study in English.', 'warning');
      return;
    }

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
        addToast('Please enter your university / college institution name in English.', 'warning');
        return;
      }
    }

    if (!formData.englishProficiency.trim()) {
      addToast('Please select your English proficiency level.', 'warning');
      return;
    }

    setLoading(true);

    try {
      // Auto-assign clean student ID behind the scenes
      const autoStudentId = 'std_' + Math.floor(100000 + Math.random() * 900000);

      const effectiveUni = formData.isExchange 
        ? formData.currentUniversity.trim() 
        : formData.university.trim();

      const studentPayload = {
        id: autoStudentId,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        groupName: 'Unassigned',
        university: effectiveUni,
        degree: formData.degree.trim(),
        studentType: formData.isExchange ? 'Erasmus' : (formData.isInternational ? 'International' : 'Normal'),
        gender: formData.gender,
        nationality: normalizeNationality(formData.nationality) || undefined,
        englishProficiency: formData.englishProficiency,
        isInternational: formData.isInternational,
        isExchange: formData.isExchange,
        currentCountry: normalizeNationality(formData.currentCountry) || undefined,
        originalCountry: formData.isExchange ? normalizeNationality(formData.originalCountry) : normalizeNationality(formData.nationality),
        originalUniversity: formData.isExchange ? formData.originalUniversity.trim() : formData.university.trim(),
        currentUniversity: formData.isExchange ? formData.currentUniversity.trim() : formData.university.trim()
      };

      const res = await enrollStudent(classId, studentPayload);

      if (res.success) {
        setEnrolledStudentId(res.studentId);
        addToast('Successfully registered in class activities!', 'success');
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
      addToast('Personal grading link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '1.5rem 1rem 4rem' }}>
      
      {/* Centered Main Layout Container */}
      <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Hero Card Banner */}
        <div 
          style={{ 
            padding: '1.5rem', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.08) 100%)', 
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '20px' }}>
                <Sparkles size={13} /> Student Self-Registration
              </span>
              <FeatureInfoButton featureId="student-enrollment-portal" size="sm" tooltipText="Learn about Self-Registration" />
            </div>
            {isCloudSynced && (
              <span className="badge badge-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', borderRadius: '20px' }}>
                <ShieldCheck size={13} /> Cloud Synchronized
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, margin: '0.25rem 0 0.4rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {targetClass ? targetClass.name : 'Classroom Enrollment'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Please fill out your student profile below. This information is used for intelligent, balanced group formations and anonymous peer evaluations.
          </p>
        </div>

        {/* Successful Enrollment Confirmation Screen */}
        {enrolledStudentId ? (
          <div 
            className="card" 
            style={{ 
              padding: '2.5rem 1.75rem', 
              borderRadius: '16px', 
              textAlign: 'center', 
              border: '1.5px solid var(--accent-teal)', 
              boxShadow: 'var(--shadow-premium)',
              animation: 'fadeIn 300ms ease'
            }}
          >
            <div 
              style={{ 
                width: '72px', 
                height: '72px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(20, 184, 166, 0.15)', 
                color: 'var(--accent-teal)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.25rem',
                boxShadow: '0 8px 20px rgba(20, 184, 166, 0.2)'
              }}
            >
              <CheckCircle size={40} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Registration Completed!
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              Welcome, <b>{formData.name}</b>! Your profile has been recorded in <b>{targetClass?.name || 'the course'}</b>.
            </p>

            {/* Team Assignment Notice */}
            <div 
              style={{ 
                backgroundColor: 'var(--bg-app)', 
                padding: '1rem 1.15rem', 
                borderRadius: '12px', 
                marginBottom: '1.5rem', 
                fontSize: '0.86rem', 
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                textAlign: 'left',
                border: '1px solid var(--border-color)'
              }}
            >
              <UserCheck size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>Next Step: Team Assignment</b>
                Your professor will assign course teams for peer assessment. Once assigned, you can evaluate your teammates directly.
              </div>
            </div>

            {/* Action CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a 
                href={getStudentPortalUrl()} 
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  padding: '0.9rem', 
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  minHeight: '48px',
                  borderRadius: '10px'
                }}
              >
                Enter Evaluation Portal <ArrowRight size={18} />
              </a>

              <button 
                type="button" 
                className={`btn ${copiedLink ? 'btn-teal' : 'btn-secondary'}`}
                onClick={handleCopyEvaluationLink}
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  padding: '0.8rem', 
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  minHeight: '44px',
                  borderRadius: '10px'
                }}
              >
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                {copiedLink ? 'Personal URL Copied!' : 'Copy My Personal Access URL'}
              </button>
            </div>

            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '1.35rem', marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <Lock size={12} /> Bookmark your personal access link or keep it safe.
            </p>
          </div>
        ) : (
          /* Enrollment Form with Structured Sections */
          <form 
            onSubmit={handleSubmit} 
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* --- SECTION 1: IDENTITY & CONTACT --- */}
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
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
                  <User size={14} className="text-primary" /> Full Name <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Alex Morgan" 
                  className="form-input" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{ minHeight: '44px', fontSize: '15px', borderRadius: '8px' }}
                  autoComplete="name"
                />
              </div>

              {/* Institutional Email */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
                  <Mail size={14} className="text-primary" /> Institutional / University Email <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input 
                  type="email" 
                  required 
                  placeholder="e.g. alex.morgan@university.edu" 
                  className="form-input" 
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  style={{ minHeight: '44px', fontSize: '15px', borderRadius: '8px' }}
                  autoComplete="email"
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Used for anonymous authentication &amp; peer review notifications.
                </span>
              </div>

              {/* Gender Selection - Minimal & Professional Responsive Segmented Control */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', marginBottom: '0.4rem' }}>
                  <User size={14} className="text-indigo" /> Gender <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <div className="gender-segmented-bar">
                  {GENDER_OPTIONS.map((g) => {
                    const isSelected = formData.gender === g.value;
                    return (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, gender: g.value }))}
                        className={`gender-btn-item ${isSelected ? 'active' : ''}`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* --- SECTION 2: GEOGRAPHIC & STUDENT STATUS --- */}
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
                <FeatureInfoButton featureId="auto-group-studio" size="sm" tooltipText="Why Geographic Status is collected" />
              </div>

              {/* Status Toggle Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
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
                    onChange={(e) => setFormData(prev => ({ ...prev, isInternational: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <div>
                    <b style={{ fontSize: '0.86rem', color: 'var(--text-primary)', display: 'block' }}>International Student</b>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Studying outside home country</span>
                  </div>
                </label>

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
                      <Plane size={14} className="text-teal" /> Exchange / Erasmus
                    </b>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Visiting / semester exchange</span>
                  </div>
                </label>
              </div>

              {/* Nationality / Country of Origin */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
                  <Globe size={14} className="text-teal" /> Nationality / Passport Country of Origin <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <SearchableSelect
                  value={formData.nationality}
                  onChange={(val) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      nationality: val,
                      // Only default currentCountry if empty and NOT international
                      currentCountry: (!prev.currentCountry && !prev.isInternational) ? val : prev.currentCountry,
                      originalCountry: prev.originalCountry || val
                    }));
                  }}
                  options={NATIONALITY_OPTIONS}
                  placeholder="Select your nationality / passport country (e.g. India)..."
                  searchPlaceholder="Search 195+ countries..."
                />
              </div>

              {/* Current Country where they reside */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
                  <Compass size={14} className="text-indigo" /> Current Country of Residence / Study <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <SearchableSelect
                  value={formData.currentCountry}
                  onChange={(val) => setFormData(prev => ({ ...prev, currentCountry: val }))}
                  options={NATIONALITY_OPTIONS}
                  placeholder="Select current residing / host country (e.g. Italy)..."
                  searchPlaceholder="Search 195+ countries..."
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                  {formData.isInternational 
                    ? 'Select the country where you currently live or study abroad (e.g. Italy).' 
                    : 'If you reside in your home country, select the same country as your nationality.'}
                </span>
              </div>
            </div>

            {/* --- SECTION 3: ACADEMIC BACKGROUND (IN ENGLISH) --- */}
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
                    Academic Background &amp; Institution
                  </h3>
                </div>
              </div>

              {/* English Instruction Banner */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.55rem', 
                  padding: '0.7rem 0.95rem', 
                  backgroundColor: 'rgba(99, 102, 241, 0.08)', 
                  border: '1px solid rgba(99, 102, 241, 0.25)', 
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  color: 'var(--primary)',
                  fontWeight: 700
                }}
              >
                <Info size={16} style={{ flexShrink: 0 }} />
                <span>Please fill in your <b>Degree / Major</b> and <b>University name(s) in English</b>.</span>
              </div>

              {/* Degree / Major */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
                  <BookOpen size={14} className="text-teal" /> Degree / Major Field of Study (in English) <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Computer Science, MSc Data Analytics, Economics" 
                  className="form-input" 
                  value={formData.degree}
                  onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
                  style={{ minHeight: '44px', fontSize: '15px', borderRadius: '8px' }}
                />
                
                {/* Degree Quick Suggestion Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem' }}>
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

              {/* University Details: Regular vs Exchange */}
              {formData.isExchange ? (
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
                    <span>Exchange / Erasmus Academic Journey (Home ➔ Host)</span>
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
                            Home University Name (in English) <span style={{ color: 'var(--accent-rose)' }}>*</span>
                          </label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Sorbonne University, TU Munich" 
                            className="form-input" 
                            value={formData.originalUniversity}
                            onChange={(e) => setFormData(prev => ({ ...prev, originalUniversity: e.target.value }))}
                            style={{ minHeight: '42px', fontSize: '14px', borderRadius: '8px' }}
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            Home Country <span style={{ color: 'var(--accent-rose)' }}>*</span>
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
                            Host University Name (in English) <span style={{ color: 'var(--accent-rose)' }}>*</span>
                          </label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Stanford University, Oxford University" 
                            className="form-input" 
                            value={formData.currentUniversity}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentUniversity: e.target.value }))}
                            style={{ minHeight: '42px', fontSize: '14px', borderRadius: '8px' }}
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            Host Country <span style={{ color: 'var(--accent-rose)' }}>*</span>
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
                    <GraduationCap size={14} className="text-indigo" /> University / College Institution (in English) <span style={{ color: 'var(--accent-rose)' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Stanford University, University of Toronto, TU Munich" 
                    className="form-input" 
                    value={formData.university}
                    onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                    style={{ minHeight: '44px', fontSize: '15px', borderRadius: '8px' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Please write the English or official international name of your university.
                  </span>
                </div>
              )}
            </div>

            {/* --- SECTION 4: ENGLISH LANGUAGE PROFICIENCY (CEFR) --- */}
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
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 900 }}>
                    4
                  </div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    English Language Proficiency
                  </h3>
                </div>
                <FeatureInfoButton featureId="auto-group-studio" size="sm" tooltipText="How CEFR Language Balancing works" />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', marginBottom: '0.45rem' }}>
                  <Languages size={14} className="text-primary" /> CEFR English Level <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                
                {/* Responsive CEFR Selector Bar */}
                <div className="cefr-selector-bar">
                  {CEFR_LEVELS.map((lvl) => {
                    const isSelected = formData.englishProficiency === lvl.value;
                    return (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, englishProficiency: lvl.value }))}
                        className={`cefr-btn-item ${isSelected ? 'active' : ''}`}
                        title={`${lvl.title} (${lvl.code})`}
                      >
                        <span className="cefr-code">
                          {lvl.code}
                        </span>
                        <span className="cefr-sub">
                          {lvl.short}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Minimal Selected Level Explanation */}
                {(() => {
                  const selectedLvl = CEFR_LEVELS.find(l => l.value === formData.englishProficiency) || CEFR_LEVELS[1];
                  return (
                    <div 
                      style={{ 
                        marginTop: '0.55rem', 
                        padding: '0.5rem 0.75rem', 
                        backgroundColor: 'var(--bg-app)', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)',
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {selectedLvl.title} ({selectedLvl.code})
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {selectedLvl.desc}
                      </span>
                    </div>
                  );
                })()}

                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  Used to balance language proficiency across collaborative group activities.
                </span>
              </div>
            </div>

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
                    <RefreshCw size={18} className="spin" /> Submitting Registration...
                  </>
                ) : (
                  <>
                    <UserCheck size={20} /> Complete Registration &amp; Join Course
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
