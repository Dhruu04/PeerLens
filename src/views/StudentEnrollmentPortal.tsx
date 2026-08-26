import React, { useState } from 'react';
import { 
  User, Mail, Globe, BookOpen, Sparkles, CheckCircle, 
  ArrowRight, ShieldCheck, Copy, Check,
  GraduationCap, Languages, UserCheck, Lock, RefreshCw
} from 'lucide-react';
import { useClass } from '../context/ClassContext';
import { normalizeNationality } from '../utils/math';
import CustomSelect from '../components/CustomSelect';
import SearchableSelect from '../components/SearchableSelect';
import { NATIONALITY_OPTIONS } from '../utils/nationalities';

const ENGLISH_PROFICIENCY_OPTIONS = [
  { value: 'Native / Bilingual', label: 'Native / Bilingual (Fluent proficiency)' },
  { value: 'Fluent (C1/C2)', label: 'Fluent / Advanced Professional (C1 / C2)' },
  { value: 'Advanced (B2)', label: 'Upper Intermediate / Advanced (B2)' },
  { value: 'Intermediate (B1)', label: 'Intermediate Working (B1)' },
  { value: 'Basic (A1/A2)', label: 'Elementary / Basic (A1 / A2)' }
];

const GENDER_OPTIONS = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
  { value: 'Other', label: 'Other' }
];

const STUDENT_TYPE_OPTIONS = [
  { value: 'Normal', label: 'Regular / Full-time Student' },
  { value: 'Erasmus', label: 'Erasmus / International Exchange' },
  { value: 'Part-time', label: 'Part-time Student' },
  { value: 'Auditing', label: 'Auditing / Guest' }
];

interface StudentEnrollmentPortalProps {
  classId: string;
}

export const StudentEnrollmentPortal: React.FC<StudentEnrollmentPortalProps> = ({ classId }) => {
  const { classes, enrollStudent, addToast, isCloudSynced } = useClass();

  const targetClass = classes.find((c) => c.id === classId) || null;

  // Form state - Mandatory fields: name, email, nationality, gender, englishProficiency
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    degree: '',
    studentType: 'Normal',
    gender: 'Female',
    nationality: '',
    englishProficiency: 'Fluent (C1/C2)'
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
      addToast('Please provide a valid university or personal email address.', 'warning');
      return;
    }

    if (!formData.nationality.trim()) {
      addToast('Please select your nationality.', 'warning');
      return;
    }

    if (!formData.gender.trim()) {
      addToast('Please select your gender.', 'warning');
      return;
    }

    if (!formData.englishProficiency.trim()) {
      addToast('Please select your English proficiency level.', 'warning');
      return;
    }

    setLoading(true);

    try {
      // Auto-assign clean student ID behind the scenes
      const autoStudentId = 'std_' + Math.floor(100000 + Math.random() * 900000);

      const res = await enrollStudent(classId, {
        id: autoStudentId,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        groupName: 'Unassigned', // Professor will assign teams/groups
        university: formData.university.trim() || undefined,
        degree: formData.degree.trim() || undefined,
        studentType: formData.studentType,
        gender: formData.gender,
        nationality: normalizeNationality(formData.nationality) || undefined,
        englishProficiency: formData.englishProficiency
      });

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
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '1rem 0.75rem 3rem' }}>
      
      {/* Mobile-optimized Container */}
      <div style={{ width: '100%', maxWidth: '580px', margin: '0 auto' }}>

        {/* Top Header Card */}
        <div 
          className="card" 
          style={{ 
            marginBottom: '1rem', 
            padding: '1.25rem 1.25rem', 
            borderRadius: 'var(--radius-lg)', 
            background: 'linear-gradient(145deg, var(--bg-surface), var(--primary-light))', 
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
              <Sparkles size={12} /> Student Self-Registration
            </span>
            {isCloudSynced && (
              <span className="badge badge-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}>
                <ShieldCheck size={12} /> Cloud Synchronized
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0.25rem 0 0.4rem', color: 'var(--text-primary)', lineHeight: 1.25 }}>
            {targetClass ? targetClass.name : 'Classroom Registration'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Fill out your details below to register for this course's peer evaluation activities.
          </p>
        </div>

        {/* Successful Enrollment Screen */}
        {enrolledStudentId ? (
          <div 
            className="card" 
            style={{ 
              padding: '1.75rem 1.25rem', 
              borderRadius: 'var(--radius-lg)', 
              textAlign: 'center', 
              border: '1px solid var(--accent-teal)', 
              boxShadow: 'var(--shadow-premium)',
              animation: 'fadeIn 300ms ease'
            }}
          >
            <div 
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--teal-light, rgba(20, 184, 166, 0.15))', 
                color: 'var(--accent-teal)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1rem' 
              }}
            >
              <CheckCircle size={36} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Registration Completed!
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.45 }}>
              Welcome, <b>{formData.name}</b>! Your profile has been recorded in <b>{targetClass?.name || 'the class'}</b>.
            </p>

            {/* Notice about team assignment */}
            <div 
              style={{ 
                backgroundColor: 'var(--bg-app)', 
                padding: '0.85rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: '1.5rem', 
                fontSize: '0.82rem', 
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                textAlign: 'left'
              }}
            >
              <UserCheck size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>Team Assignment</b>
                Your professor will assign teams for peer evaluation activities. Once assigned, you can evaluate your teammates.
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a 
                href={getStudentPortalUrl()} 
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  padding: '0.85rem', 
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  minHeight: '48px'
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
                  padding: '0.75rem', 
                  fontSize: '0.88rem',
                  minHeight: '44px'
                }}
              >
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                {copiedLink ? 'Personal URL Copied!' : 'Copy My Personal Access URL'}
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.25rem', marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <Lock size={12} /> Bookmark your personal access link or keep it safe.
            </p>
          </div>
        ) : (
          /* Enrollment Form */
          <form 
            onSubmit={handleSubmit} 
            className="card" 
            style={{ 
              padding: '1.35rem 1.25rem', 
              borderRadius: 'var(--radius-lg)', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.15rem', 
              boxShadow: 'var(--shadow-premium)' 
            }}
          >
            {/* Full Name */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                <User size={14} className="text-primary" /> Full Name <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Alex Morgan" 
                className="form-input" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                style={{ minHeight: '44px', fontSize: '16px' }}
                autoComplete="name"
              />
            </div>

            {/* University Email */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                <Mail size={14} className="text-primary" /> University / Institutional Email <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input 
                type="email" 
                required 
                placeholder="e.g. alex.morgan@university.edu" 
                className="form-input" 
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                style={{ minHeight: '44px', fontSize: '16px' }}
                autoComplete="email"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Used for your anonymous authentication &amp; milestone notifications.
              </span>
            </div>

            {/* Nationality (Searchable Dropdown) & Gender */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                  <Globe size={14} className="text-teal" /> Nationality <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <SearchableSelect
                  value={formData.nationality}
                  onChange={(val) => setFormData(prev => ({ ...prev, nationality: val }))}
                  options={NATIONALITY_OPTIONS}
                  placeholder="Select nationality / country..."
                  searchPlaceholder="Search 195+ countries..."
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                  <User size={14} className="text-indigo" /> Gender <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <CustomSelect
                  value={formData.gender}
                  onChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
                  options={GENDER_OPTIONS}
                />
              </div>
            </div>

            {/* English Proficiency Level */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                <Languages size={14} className="text-primary" /> English Proficiency Level <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <CustomSelect
                value={formData.englishProficiency}
                onChange={(val) => setFormData(prev => ({ ...prev, englishProficiency: val }))}
                options={ENGLISH_PROFICIENCY_OPTIONS}
              />
            </div>

            {/* University & Degree */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                  <GraduationCap size={14} className="text-indigo" /> University / College <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.75rem' }}>(Optional)</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Stanford University" 
                  className="form-input" 
                  value={formData.university}
                  onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                  style={{ minHeight: '44px', fontSize: '16px' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                  <BookOpen size={14} className="text-teal" /> Degree / Major <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.75rem' }}>(Optional)</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Computer Science" 
                  className="form-input" 
                  value={formData.degree}
                  onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
                  style={{ minHeight: '44px', fontSize: '16px' }}
                />
              </div>
            </div>

            {/* Student Type */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                <UserCheck size={14} className="text-teal" /> Student Status
              </label>
              <CustomSelect
                value={formData.studentType}
                onChange={(val) => setFormData(prev => ({ ...prev, studentType: val }))}
                options={STUDENT_TYPE_OPTIONS}
              />
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
                disabled={loading}
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  padding: '0.85rem', 
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  minHeight: '48px',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spin" /> Submitting Registration...
                  </>
                ) : (
                  <>
                    <UserCheck size={18} /> Complete Registration &amp; Join
                  </>
                )}
              </button>
            </div>

            {/* Privacy & Anonymity guarantee badge */}
            <div 
              style={{ 
                padding: '0.65rem 0.85rem', 
                borderRadius: 'var(--radius-sm)', 
                backgroundColor: 'var(--bg-app)', 
                border: '1px solid var(--border-color)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}
            >
              <Lock size={14} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
              <span>
                All peer evaluation responses are 100% anonymous &amp; double-blind.
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentEnrollmentPortal;
