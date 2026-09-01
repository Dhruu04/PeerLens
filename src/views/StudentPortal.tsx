import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Send, AlertCircle, TrendingUp, 
  ThumbsUp, Rocket, Trophy, Lightbulb, Clock, Heart, 
  Award, MessageSquare, Target, Minus, Plus, CheckCircle,
  GraduationCap, Users, Info, BarChart2, Download, Lock, BookOpen,
  Check, Star, AlertTriangle
} from 'lucide-react';
import { useClass } from '../context/ClassContext';
import { calculateStudentMetrics, getTargetScale } from '../utils/math';
import FeatureInfoButton from '../components/FeatureInfoButton';


interface StudentPortalProps {
  classId: string;
  studentId: string;
}

// Professional mapping for contribution expectation tiers
const getTierInfo = (pct: number) => {
  if (pct <= 25) {
    return {
      icon: AlertCircle,
      title: 'Needs Improvement',
      desc: 'Limited contribution or inconsistent delivery; required substantial guidance.',
      color: 'var(--accent-rose)',
      bgColor: 'var(--accent-rose-light)',
      className: 'active-rose',
      index: 0
    };
  } else if (pct <= 50) {
    return {
      icon: TrendingUp,
      title: 'Developing',
      desc: 'Met baseline requirements; opportunities exist to improve consistency and collaboration.',
      color: 'var(--accent-amber)',
      bgColor: 'var(--accent-amber-light)',
      className: 'active-amber',
      index: 1
    };
  } else if (pct <= 75) {
    return {
      icon: ThumbsUp,
      title: 'Proficient / Meets Expectations',
      desc: 'Consistently met established standards; dependable, communicative, and collaborative.',
      color: 'var(--primary)',
      bgColor: 'var(--primary-light)',
      className: 'active-indigo',
      index: 2
    };
  } else if (pct <= 90) {
    return {
      icon: Rocket,
      title: 'Exemplary / Exceeds Expectations',
      desc: 'Delivered high-quality contributions; took initiative and actively supported teammates.',
      color: 'var(--accent-teal)',
      bgColor: 'var(--accent-teal-light)',
      className: 'active-teal',
      index: 3
    };
  } else {
    return {
      icon: Trophy,
      title: 'Distinguished Leadership',
      desc: 'Exceptional technical rigor and leadership; drove significant team outcomes.',
      color: 'hsl(142, 70%, 45%)',
      bgColor: 'hsl(142, 70%, 96%)',
      className: 'active-emerald',
      index: 4
    };
  }
};

const getPraiseTagInfo = (tagText: string) => {
  // Strip historical emojis if any
  const cleanText = tagText.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
  
  if (cleanText.includes('Creative') || cleanText.includes('Problem')) return { icon: Lightbulb, color: 'hsl(45, 90%, 45%)', bg: 'hsl(45, 90%, 96%)', border: 'hsl(45, 90%, 90%)', text: 'Creative Problem Solver' };
  if (cleanText.includes('Punctual') || cleanText.includes('Reliable')) return { icon: Clock, color: 'hsl(14, 90%, 50%)', bg: 'hsl(14, 90%, 96%)', border: 'hsl(14, 90%, 90%)', text: 'Reliable & Punctual' };
  if (cleanText.includes('Supportive') || cleanText.includes('Player')) return { icon: Heart, color: 'var(--accent-rose)', bg: 'var(--accent-rose-light)', border: 'hsl(346, 84%, 90%)', text: 'Supportive Team Player' };
  if (cleanText.includes('Quality') || cleanText.includes('Deliverables')) return { icon: Award, color: 'var(--primary)', bg: 'var(--primary-light)', border: 'hsl(243, 75%, 92%)', text: 'High Quality Deliverables' };
  if (cleanText.includes('Communicat')) return { icon: MessageSquare, color: 'hsl(199, 89%, 40%)', bg: 'hsl(199, 89%, 95%)', border: 'hsl(199, 89%, 90%)', text: 'Clear Communicator' };
  return { icon: Target, color: 'var(--accent-teal)', bg: 'var(--accent-teal-light)', border: 'hsl(173, 80%, 90%)', text: 'Detail Oriented' };
};

const AVAILABLE_TAGS = [
  'Creative Problem Solver',
  'Reliable & Punctual',
  'Supportive Team Player',
  'High Quality Deliverables',
  'Clear Communicator',
  'Detail Oriented'
];

// Clean parenthesized emails and trailing spaces from student names
const cleanStudentName = (fullName: string | undefined): string => {
  if (!fullName) return '';
  return fullName.replace(/\s*\([^)]*\)/g, '').trim();
};

export const StudentPortal: React.FC<StudentPortalProps> = ({ classId, studentId }) => {
  const { classes, submitPeerReviews, addToast } = useClass();

  // Find class and student
  const activeClass = classes.find((c) => c.id === classId);
  const student = activeClass?.students.find((s) => s.id === studentId);

  // Compile teammates
  const teammates = activeClass && student
    ? activeClass.students.filter((s) => s.groupName === student.groupName && s.id !== student.id)
    : [];

  // State to hold evaluation scores: teammateId/selfId -> { fieldId -> score }
  const [evaluations, setEvaluations] = useState<Record<string, Record<string, number>>>(() => {
    const initial: Record<string, Record<string, number>> = {};
    if (activeClass && teammates.length > 0 && student) {
      // Teammates evaluations
      teammates.forEach((t) => {
        initial[t.id] = {};
        activeClass.fields.forEach((f) => {
          initial[t.id][f.id] = Math.round((f.min + f.max) / 2);
        });
      });
      // Self evaluation scores
      initial[student.id] = {};
      activeClass.fields.forEach((f) => {
        initial[student.id][f.id] = Math.round((f.min + f.max) / 2);
      });
    }
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [praiseTags, setPraiseTags] = useState<Record<string, string[]>>({});
  
  // Qualitative feedback text blocks
  const [strengthsText, setStrengthsText] = useState<Record<string, string>>({});
  const [growthText, setGrowthText] = useState<Record<string, string>>({});

  // Countdown timer clock
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [selfTouched, setSelfTouched] = useState(false);
  const [lastDraftSaved, setLastDraftSaved] = useState<number | null>(null);

  const draftKey = `peer_draft_${classId}_${studentId}`;

  // Restore unsaved draft on load
  useEffect(() => {
    if (!student || student.submitted || isSubmitted) return;
    try {
      const stored = localStorage.getItem(draftKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.evaluations) setEvaluations(parsed.evaluations);
        if (parsed.praiseTags) setPraiseTags(parsed.praiseTags);
        if (parsed.strengthsText) setStrengthsText(parsed.strengthsText);
        if (parsed.growthText) setGrowthText(parsed.growthText);
        if (parsed.selfTouched) setSelfTouched(parsed.selfTouched);
        if (parsed.savedAt) setLastDraftSaved(parsed.savedAt);
      }
    } catch (e) {
      console.warn('Failed to restore draft', e);
    }
  }, [draftKey, student?.submitted, isSubmitted]);

  // Real-time debounce auto-save to localStorage
  useEffect(() => {
    if (!student || student.submitted || isSubmitted) return;
    const timer = setTimeout(() => {
      try {
        const now = Date.now();
        localStorage.setItem(draftKey, JSON.stringify({
          evaluations,
          praiseTags,
          strengthsText,
          growthText,
          selfTouched,
          savedAt: now
        }));
        setLastDraftSaved(now);
      } catch (e) {
        console.warn('Failed to auto-save draft', e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [evaluations, praiseTags, strengthsText, growthText, selfTouched, draftKey, student?.submitted, isSubmitted]);

  useEffect(() => {
    if (!activeClass || !activeClass.deadline) return;

    const updateTimer = () => {
      const diff = new Date(activeClass.deadline!).getTime() - new Date().getTime();
      setTimeLeft(diff > 0 ? diff : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeClass]);

  const isLocked = activeClass && activeClass.deadline && new Date(activeClass.deadline) <= new Date();
  const showLockoutScreen = isLocked && student && !student.submitted && !isSubmitted;

  // Synchronize dynamic browser document tab titles based on active student status/view
  useEffect(() => {
    if (!activeClass || !student) {
      document.title = 'Access Denied - PeerLens';
      return;
    }
    if (showLockoutScreen) {
      document.title = 'Evaluation Window Closed - PeerLens';
      return;
    }
    if (student.submitted || isSubmitted) {
      document.title = `My Evaluation Report | ${cleanStudentName(student.name)} - PeerLens`;
      return;
    }
    document.title = `Peer Evaluation | ${activeClass.name} - PeerLens`;
  }, [activeClass, student, showLockoutScreen, isSubmitted]);

  // If class or student is invalid, show elegant error card
  if (!activeClass || !student) {
    return (
      <div className="tab-pane" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1.5rem' }}>
        <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} className="text-rose" style={{ margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Invalid Credentials</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            The secure grading portal link you entered is incorrect or expired. Please contact your instructor to receive your personal grading credentials.
          </p>
        </div>
      </div>
    );
  }

  // Enforce Lockout Screen if timer expired
  if (showLockoutScreen) {
    return (
      <div className="tab-pane" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1.5rem' }}>
        <div className="card" style={{ maxWidth: '520px', width: '100%', textAlign: 'center', padding: '3rem 2.5rem', borderLeft: '4px solid var(--accent-rose)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--accent-rose-light)', color: 'var(--accent-rose)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Lock size={30} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Submission Period Closed</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '2rem' }}>
            The closing deadline for this evaluation round (<b>{new Date(activeClass.deadline!).toLocaleString()}</b>) has been reached. 
            All submissions are now locked and closed. If you need an extension, please contact your instructor.
          </p>
          <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', textAlign: 'left' }}>
            <Info size={16} className="text-rose" style={{ flexShrink: 0 }} />
            <span><b>Access restricted:</b> Form editing was locked on final deadline trigger.</span>
          </div>
        </div>
      </div>
    );
  }

  // If student already completed evaluations, render dashboard or waiting screen
  if (student.submitted || isSubmitted) {
    const {
      fieldAverages,
      fieldStdDevs,
      overallPercentage,
      reviewsReceived,
      expectedReviewsCount,
      gradeProgress
    } = calculateStudentMetrics(student, activeClass);

    const maxRubricScore = getTargetScale(activeClass);

    if (reviewsReceived === 0) {
      return (
        <div className="tab-pane" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1.5rem' }}>
          <div className="card-premium" style={{ maxWidth: '540px', width: '100%', textAlign: 'center', padding: '3.5rem 2.5rem' }}>
            <div 
              style={{ 
                width: '72px', 
                height: '72px', 
                backgroundColor: 'var(--accent-teal-light)', 
                color: 'var(--accent-teal)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem auto',
                boxShadow: '0 0 0 8px hsl(173, 80%, 97%)'
              }}
            >
              <ShieldCheck size={36} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Evaluation Submitted Successfully
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Thank you, <b>{cleanStudentName(student.name)}</b>! Your peer evaluations for <b>{activeClass.name}</b> have been recorded successfully.
            </p>

            {/* Geographic & Institutional Context Badges */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
              {student.university && (
                <span className="badge badge-primary" style={{ gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
                  <GraduationCap size={13} /> {student.university}
                </span>
              )}
              {student.degree && (
                <span className="badge badge-teal" style={{ gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
                  <BookOpen size={13} /> {student.degree}
                </span>
              )}
              {student.studentType === 'Erasmus' ? (
                <span className="badge" style={{ gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '6px', background: 'linear-gradient(135deg, #FF007F, #7F00FF)', color: '#fff', border: 'none', fontWeight: 'bold' }}>
                  Erasmus
                </span>
              ) : (
                <span className="badge" style={{ gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '6px', backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                  Normal
                </span>
              )}
              <span className="badge" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', gap: '0.3rem', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
                <Users size={13} /> Group: {student.groupName}
              </span>
            </div>

            {/* Teammate Submissions Progress bar */}
            <div style={{ borderTop: '1px solid var(--border-color)', margin: '1.5rem 0', paddingTop: '1.5rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                <span style={{ letterSpacing: '0.05em' }}>TEAM COMPLETION PROGRESS</span>
                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{reviewsReceived} / {expectedReviewsCount}</span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${gradeProgress}%`, 
                    backgroundColor: 'var(--primary)', 
                    borderRadius: '9999px', 
                    transition: 'width 0.4s ease' 
                  }} 
                />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Your analytical feedback report will unlock automatically as soon as your team members submit their evaluations.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', textAlign: 'left', lineHeight: 1.4 }}>
              <ShieldCheck size={18} className="text-teal" style={{ flexShrink: 0 }} /> 
              <span><b>Absolute Anonymity:</b> Teammates only see computed aggregates. Individual score selections are completely hidden.</span>
            </div>
          </div>
        </div>
      );
    }

    // reviewsReceived > 0: Render Gorgeous Performance Analytics Dashboard!
    const peerReviews = activeClass.reviews.filter(
      (r) => r.recipientId === student.id && teammates.some((t) => t.id === r.reviewerId)
    );

    // Compile praise tags count
    const receivedPraiseTagCounts: Record<string, number> = {};
    peerReviews.forEach((review) => {
      if (review.praiseTags) {
        review.praiseTags.forEach((tag) => {
          receivedPraiseTagCounts[tag] = (receivedPraiseTagCounts[tag] || 0) + 1;
        });
      }
    });

    // Compile self scores for side-by-side calibration mapping
    const selfReview = activeClass.reviews.find((r) => r.reviewerId === student.id && r.recipientId === student.id);
    const selfScores = selfReview ? selfReview.scores : {};

    // Milestone history compilation
    const milestoneHistory = (() => {
      const milestones = activeClass.milestones || [];
      const history = milestones.map((m) => {
        const mReviews = m.reviews.filter((r) => r.recipientId === student.id && teammates.some((t) => t.id === r.reviewerId));
        let sum = 0, max = 0;
        mReviews.forEach((r) => {
          activeClass.fields.forEach((f) => {
            if (r.scores[f.id] !== undefined) {
              sum += r.scores[f.id];
              max += f.max;
            }
          });
        });
        const pct = max > 0 ? Number(((sum / max) * 100).toFixed(1)) : null;
        return { name: m.name, pct };
      }).filter((x) => x.pct !== null) as { name: string; pct: number }[];

      if (overallPercentage !== null) {
        history.push({ name: 'Current Cycle', pct: overallPercentage });
      }
      return history;
    })();

    // Anonymized written comments extraction
    const strengthsComments = peerReviews.map((r) => r.strengthsText).filter(Boolean) as string[];
    const growthComments = peerReviews.map((r) => r.growthText).filter(Boolean) as string[];

    const shuffledStrengths = strengthsComments;
    const shuffledGrowth = growthComments;

    // Dynamic gamified achievements badges hub calculations
    const badges = (() => {
      const list = [];
      const reliabilityAvg = fieldAverages['f_reliability'] ?? 0;
      const collaborationAvg = fieldAverages['f_collaboration'] ?? 0;
      const qualityAvg = fieldAverages['f_quality'] ?? 0;

      // 1. Dependable Anchor
      const hasAnchor = (reliabilityAvg >= 8.5) || (overallPercentage !== null && overallPercentage >= 85);
      list.push({
        id: 'anchor',
        title: 'Dependable Anchor',
        desc: 'Highly reliable and consistent contributor.',
        icon: ShieldCheck,
        unlocked: hasAnchor,
        color: 'var(--primary)',
        bg: 'var(--primary-light)'
      });

      // 2. Creative Catalyst
      const creativeCount = receivedPraiseTagCounts['Creative Ideas'] || 0;
      list.push({
        id: 'creative',
        title: 'Creative Catalyst',
        desc: 'Supplied outstanding creative strategies.',
        icon: Lightbulb,
        unlocked: creativeCount >= 1,
        color: 'hsl(45, 90%, 45%)',
        bg: 'hsl(45, 90%, 96%)'
      });

      // 3. Super Supportive
      const supportiveCount = receivedPraiseTagCounts['Super Supportive'] || 0;
      list.push({
        id: 'supportive',
        title: 'Super Supportive',
        desc: 'Assisted team members and raised team morale.',
        icon: Heart,
        unlocked: supportiveCount >= 1,
        color: 'var(--accent-rose)',
        bg: 'var(--accent-rose-light)'
      });

      // 4. Quality Driver
      const qualityCount = receivedPraiseTagCounts['High Quality Work'] || 0;
      list.push({
        id: 'quality',
        title: 'Quality Driver',
        desc: 'Completed project milestones with premium quality.',
        icon: Award,
        unlocked: qualityCount >= 1 || (qualityAvg >= 8.5),
        color: 'hsl(142, 70%, 45%)',
        bg: 'hsl(142, 70%, 96%)'
      });

      // 5. Great Communicator
      const commCount = receivedPraiseTagCounts['Great Communicator'] || 0;
      list.push({
        id: 'communicator',
        title: 'Great Communicator',
        desc: 'Helped align group standing with robust communication.',
        icon: MessageSquare,
        unlocked: commCount >= 1 || (collaborationAvg >= 8.5),
        color: 'hsl(199, 89%, 40%)',
        bg: 'hsl(199, 89%, 95%)'
      });

      // 6. Stellar Drive
      const isStellar = overallPercentage !== null && overallPercentage >= 90;
      list.push({
        id: 'stellar',
        title: 'Stellar Leader',
        desc: 'Obtained exceptional overall teammate averages.',
        icon: Trophy,
        unlocked: isStellar,
        color: 'var(--accent-amber)',
        bg: 'var(--accent-amber-light)'
      });

      return list;
    })();

    const activeTier = getTierInfo(overallPercentage ?? 0);
    const TierIcon = activeTier.icon;

    const getConsensusInfo = (stdDev: number | null) => {
      if (stdDev === null) {
        return {
          label: 'Awaiting Submissions',
          color: 'var(--text-muted)',
          bgColor: 'var(--bg-app)',
          desc: 'More reviews are needed to measure teammate consensus.',
          icon: Info
        };
      }
      if (stdDev < 1.0) {
        return {
          label: 'High Agreement',
          color: 'var(--accent-teal)',
          bgColor: 'var(--accent-teal-light)',
          desc: 'Teammates graded your contributions very consistently.',
          icon: CheckCircle
        };
      }
      if (stdDev <= 2.0) {
        return {
          label: 'Normal Consensus',
          color: 'var(--primary)',
          bgColor: 'var(--primary-light)',
          desc: 'Teammates show consistent average alignment.',
          icon: Users
        };
      }
      return {
        label: 'Diverse Views',
        color: 'var(--accent-amber)',
        bgColor: 'var(--accent-amber-light)',
        desc: 'Teammates hold diverse perspectives on this metric.',
        icon: Info
      };
    };

    const strokeDashoffset = 314.16 - (314.16 * (overallPercentage ?? 0)) / 100;

    return (
      <div className="main-content tab-pane" style={{ maxWidth: '960px', padding: '2rem 1.5rem' }}>
        
        {/* Style block for print layout calibration */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; color: black !important; }
            .app-header, .app-footer, .hide-on-print, button { display: none !important; }
            .main-content { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
            .card, .card-premium { border: 1px solid #cbd5e1 !important; box-shadow: none !important; background: white !important; page-break-inside: avoid; margin-bottom: 1.5rem !important; }
          }
        ` }} />

        {/* Profile Card / Dashboard Banner */}
        <div className="card-premium" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'visible' }}>
          <div style={{ position: 'absolute', top: '-1.5rem', right: '-1.5rem', width: '160px', height: '160px', backgroundColor: 'var(--primary-light)', borderRadius: '50%', opacity: 0.4, zIndex: 0 }} />
          
          <div style={{ zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <span className="badge badge-teal" style={{ gap: '0.25rem', padding: '0.35rem 0.75rem', borderRadius: '6px' }}>
                  <ShieldCheck size={12} /> Analytics Unlocked
                </span>
                <span className="badge badge-primary" style={{ gap: '0.25rem', padding: '0.35rem 0.75rem', borderRadius: '6px' }}>
                  <BarChart2 size={12} /> Performance Report
                </span>
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                My Evaluation Report
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                Peer Assessment Results for: <b>{cleanStudentName(student.name)}</b>
              </p>
            </div>
            
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              <button 
                className="btn btn-secondary hide-on-print"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: 'var(--border-color)', fontWeight: 600 }}
                onClick={() => window.print()}
              >
                <Download size={14} /> Download PDF Portfolio
              </button>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>REPORT COMPILATION</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 800, fontSize: '0.95rem' }}>
                  <Users size={16} /> {reviewsReceived} of {expectedReviewsCount} Reviews Received
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.5rem', paddingTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', zIndex: 1 }}>
            {student.university && (
              <span className="badge" style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <GraduationCap size={14} className="text-indigo" /> {student.university}
              </span>
            )}
            {student.degree && (
              <span className="badge" style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <BookOpen size={14} className="text-teal" /> {student.degree}
              </span>
            )}
            {student.studentType === 'Erasmus' ? (
              <span className="badge" style={{ background: 'linear-gradient(135deg, #FF007F, #7F00FF)', border: 'none', color: '#fff', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold' }}>
                Erasmus
              </span>
            ) : (
              <span className="badge" style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                Normal
              </span>
            )}
            <span className="badge" style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
              <Users size={14} className="text-amber" /> Group: {student.groupName}
            </span>
          </div>
        </div>

        {/* Analytics Breakdown Columns */}
        <div className="analytics-grid">
          
          {/* Left Column (Percentage score & RPG card) */}
          <div className="analytics-col-left">
            
            {/* Average score dial & tier */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Overall Teammate Rating</h3>
              
              {/* Concentric Circle SVG */}
              <div style={{ position: 'relative', width: '150px', height: '150px', marginBottom: '1.5rem' }}>
                <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
                  <circle 
                    cx="75" 
                    cy="75" 
                    r="50" 
                    stroke="var(--border-color)" 
                    strokeWidth="10" 
                    fill="transparent" 
                  />
                  <circle 
                    cx="75" 
                    cy="75" 
                    r="50" 
                    stroke={activeTier.color} 
                    strokeWidth="10" 
                    fill="transparent" 
                    strokeDasharray="314.16" 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                  />
                </svg>
                 <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', alignContent: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {overallPercentage}%
                  </span>
                  {overallPercentage !== null && (
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-teal)', marginTop: '0.2rem' }}>
                      {((overallPercentage / 100) * maxRubricScore).toFixed(1)} / {maxRubricScore}
                    </span>
                  )}
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem', letterSpacing: '0.025em' }}>
                    Peer Average
                  </span>
                </div>
              </div>

              {/* RPG contribution card */}
              <div 
                className={`gamified-card ${activeTier.className}`} 
                style={{ 
                  width: '100%', 
                  cursor: 'default', 
                  transform: 'none', 
                  boxShadow: 'none', 
                  padding: '1.25rem 1rem',
                  borderWidth: '2px'
                }}
              >
                <div className="gamified-card-icon" style={{ backgroundColor: activeTier.color, color: '#fff', width: '32px', height: '32px', padding: '6px' }}>
                  <TierIcon size={18} />
                </div>
                <span className="gamified-card-title" style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                  {activeTier.title}
                </span>
                <p className="gamified-card-desc" style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                  {activeTier.desc}
                </p>
              </div>
            </div>

            {/* Praise cloud card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={18} className="text-teal" /> Peer Recognition
              </h3>
              
              {Object.keys(receivedPraiseTagCounts).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 1rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-app)' }}>
                  <Info size={18} className="text-muted" style={{ margin: '0 auto 0.5rem auto' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    No specific praise tags selected by teammates.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {Object.entries(receivedPraiseTagCounts).map(([tagText, count]) => {
                    const tagInfo = getPraiseTagInfo(tagText);
                    const TagIcon = tagInfo.icon;
                    
                    return (
                      <div
                        key={tagText}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: tagInfo.bg,
                          color: tagInfo.color,
                          border: `1px solid ${tagInfo.border}`,
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <TagIcon size={12} />
                        <span>{tagInfo.text}</span>
                        <span style={{ 
                          marginLeft: '0.2rem', 
                          backgroundColor: tagInfo.color, 
                          color: '#fff', 
                          borderRadius: '50%', 
                          width: '18px', 
                          height: '18px', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '0.65rem',
                          fontWeight: 800 
                        }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gamified Achievements Badges Card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Trophy size={18} className="text-amber" /> Achievement Badges
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {badges.map((b) => {
                  const Icon = b.icon;
                  return (
                    <div 
                      key={b.id} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        textAlign: 'center',
                        padding: '0.75rem 0.5rem', 
                        borderRadius: '8px', 
                        border: `1px solid ${b.unlocked ? b.color + '30' : 'var(--border-color)'}`,
                        backgroundColor: b.unlocked ? b.bg : 'var(--bg-app)',
                        opacity: b.unlocked ? 1 : 0.4,
                        filter: b.unlocked ? 'none' : 'grayscale(100%)',
                        boxShadow: b.unlocked ? '0 4px 6px rgba(0,0,0,0.02)' : 'none',
                        transition: 'all 200ms ease'
                      }}
                      title={b.unlocked ? b.desc : `Locked: ${b.desc}`}
                    >
                      <div 
                        style={{ 
                          backgroundColor: b.unlocked ? b.color : 'var(--text-muted)', 
                          color: '#fff', 
                          borderRadius: '50%', 
                          width: '32px', 
                          height: '32px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          marginBottom: '0.4rem'
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', lineHeight: 1.1 }}>
                        {b.title}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'block', lineHeight: 1.1 }}>
                        {b.unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column (Detailed scales breakdown) */}
          <div className="analytics-col-right">
            
            {/* Side-by-Side Calibration Graph Card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BarChart2 size={18} className="text-teal" /> Self vs. Peer Comparison
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                Compare your scores **side-by-side**: the <span style={{ color: 'var(--primary)', fontWeight: 700 }}>blue bars</span> represent the average ratings given to you by your teammates, while the <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>teal bars</span> represent your own self-evaluations. Use this comparison to calibrate your self-perception and reconcile alignment gaps!
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {activeClass.fields.map(field => {
                  const fieldAvg = fieldAverages[field.id] ?? field.min;
                  const selfVal = selfScores[field.id] ?? field.min;
                  
                  const peerPct = ((fieldAvg - field.min) / (field.max - field.min || 1)) * 100;
                  const selfPct = ((selfVal - field.min) / (field.max - field.min || 1)) * 100;

                  return (
                    <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{field.name}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', backgroundColor: 'var(--bg-app)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        
                        {/* Teammate Average Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '90px', flexShrink: 0 }}>Teammates:</span>
                          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${peerPct}%`, backgroundColor: 'var(--primary)', borderRadius: '9999px' }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', width: '40px', textAlign: 'right' }}>{fieldAvg.toFixed(1)}</span>
                        </div>

                        {/* Self-Rating Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '90px', flexShrink: 0 }}>Self Rating:</span>
                          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${selfPct}%`, backgroundColor: 'var(--accent-teal)', borderRadius: '9999px' }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-teal)', width: '40px', textAlign: 'right' }}>{selfVal.toFixed(1)}</span>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rubrics details */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BarChart2 size={20} className="text-indigo" /> Rubric Performance Details
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>PEER SCORES</span>
            </div>

            {activeClass.fields.map((field) => {
              const fieldAvg = fieldAverages[field.id];
              const fieldStdDev = fieldStdDevs[field.id];
              const pct = fieldAvg !== null ? ((fieldAvg - field.min) / (field.max - field.min || 1)) * 100 : 0;
              
              const consensus = getConsensusInfo(fieldStdDev);
              const ConsensusIcon = consensus.icon;
              
              const barColor = fieldAvg !== null ? getTierInfo(pct).color : 'var(--text-muted)';

              return (
                <div key={field.id} className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {field.name}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Scale: {field.min} to {field.max} • Weight: {field.weight}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: barColor }}>
                        {fieldAvg !== null ? `${fieldAvg} / ${field.max}` : 'N/A'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {fieldAvg !== null ? `${Math.round(pct)}% success` : 'No reviews'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1rem' }}>
                    {fieldAvg !== null && (
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${pct}%`, 
                          backgroundColor: barColor, 
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease'
                        }} 
                      />
                    )}
                  </div>

                  {/* Agreement indicator */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '0.65rem 0.85rem', 
                    backgroundColor: 'var(--bg-app)', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Info size={13} className="text-muted" /> Teammate Agreement
                    </span>
                    
                    <span 
                      className="badge" 
                      style={{ 
                        backgroundColor: consensus.bgColor, 
                        color: consensus.color, 
                        gap: '0.25rem', 
                        padding: '0.25rem 0.5rem', 
                        fontSize: '0.72rem',
                        border: `1px solid ${consensus.color}25`
                      }}
                      title={consensus.desc}
                    >
                      <ConsensusIcon size={12} /> {consensus.label}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Historical Milestone Growth Card */}
            {milestoneHistory.length >= 2 && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp size={18} className="text-indigo" /> Milestone Performance Growth
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Track your overall teammate grading averages chronologically over archived class sprints.
                </p>

                {/* SVG Milestone Growth line chart */}
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <svg viewBox="0 0 500 150" style={{ width: '100%', minWidth: '400px', height: '150px', display: 'block' }}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    <line x1="0" y1="30" x2="500" y2="30" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />

                    {(() => {
                      const width = 500;
                      const height = 150;
                      const paddingLeft = 40;
                      const paddingRight = 40;
                      const paddingTop = 30;
                      const paddingBottom = 30;
                      
                      const chartWidth = width - paddingLeft - paddingRight;
                      const chartHeight = height - paddingTop - paddingBottom;
                      const len = milestoneHistory.length;

                      const points = milestoneHistory.map((m, idx) => {
                        const x = paddingLeft + (idx * (chartWidth / (len - 1 || 1)));
                        const y = paddingTop + (chartHeight - (m.pct / 100) * chartHeight);
                        return { x, y, name: m.name, pct: m.pct };
                      });

                      const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
                      const fillPoints = `${points[0].x},${height - paddingBottom} ` + polylinePoints + ` ${points[len-1].x},${height - paddingBottom}`;

                      return (
                        <>
                          <polygon points={fillPoints} fill="url(#growthGrad)" />
                          <polyline points={polylinePoints} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                          {points.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="var(--primary)" strokeWidth="3" />
                              <circle cx={p.x} cy={p.y} r="8" fill="var(--primary)" opacity="0.15" />
                              
                              <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--text-primary)">
                                {p.pct.toFixed(1)}%
                              </text>
                              <text x={p.x} y={height - 10} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--text-muted)">
                                {p.name}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            )}

            {/* Security banner */}
            <div 
              className="card" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                backgroundColor: 'var(--primary-light)', 
                borderColor: 'var(--primary)',
                padding: '1.25rem' 
              }}
            >
              <ShieldCheck size={20} className="text-primary" style={{ flexShrink: 0 }} />
              <div>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.15rem' }}>
                  Absolute Anonymity Ensured
                </h5>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Individual teammate ratings, names, and profiles are completely hidden. Your report only displays self-excluded team averages to ensure open and helpful peer reviews.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Shuffled Anonymous Teammate Comments Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {/* Strengths Comments */}
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-teal)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MessageSquare size={20} className="text-teal" /> Teammate Strengths & Praise Feedback
            </h3>
            {shuffledStrengths.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px dashed var(--border-color)', padding: '1.5rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Teammates did not submit written strengths praise comments in this round.
              </div>
            ) : (
              <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {shuffledStrengths.map((c, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{c}"
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Growth Comments */}
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-rose)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={20} className="text-rose" /> Opportunities for Growth & Improvement
            </h3>
            {shuffledGrowth.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px dashed var(--border-color)', padding: '1.5rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Teammates did not submit constructive improvement comments in this round.
              </div>
            ) : (
              <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {shuffledGrowth.map((c, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{c}"
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.6rem', textAlign: 'center' }}>
          * Teammate written reviews are shuffled randomly to prevent linking commentary to particular reviewers.
        </p>

      </div>
    );
  }

  const handleSliderChange = (teammateId: string, fieldId: string, value: number) => {
    if (teammateId === student.id) {
      setSelfTouched(true);
    }
    setEvaluations((prev) => ({
      ...prev,
      [teammateId]: {
        ...prev[teammateId],
        [fieldId]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Map evaluations state to Review array structure expected by the context
      const reviewPayload = Object.entries(evaluations).map(([recipientId, scores]) => ({
        recipientId,
        scores,
        praiseTags: praiseTags[recipientId] || [],
        strengthsText: strengthsText[recipientId] || '',
        growthText: growthText[recipientId] || ''
      }));

      // Submit feedback via our context engine
      await submitPeerReviews(activeClass.id, student.id, reviewPayload);
      localStorage.removeItem(draftKey);
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      addToast('Failed to submit peer evaluations. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress progression timeline variables
  const completedTeammatesCount = teammates.filter(t => {
    return (strengthsText[t.id] || '').trim().length > 0 ||
           (growthText[t.id] || '').trim().length > 0 ||
           (praiseTags[t.id] || []).length > 0;
  }).length;
  
  const totalCompleted = completedTeammatesCount + (selfTouched ? 1 : 0);
  const totalTarget = teammates.length + 1;
  const progressPct = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 100;  return (
    <div className="main-content tab-pane student-portal-wrapper" style={{ maxWidth: '800px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Integrated Sticky Top Header & Tracker — 100% Mobile Optimized */}
      {teammates.length > 0 && (
        <div 
          className="progression-timeline-container" 
          style={{ 
            position: 'sticky',
            top: 0,
            zIndex: 90,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            padding: '0.45rem 0.75rem',
            margin: '0 0 1rem 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.06)',
            borderRadius: '12px'
          }}
        >
          {/* Row 1: Student Metadata & Progress Percentage */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem', flexWrap: 'nowrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.12rem 0.45rem', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Group {student.groupName}
              </span>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cleanStudentName(student.name)}
              </span>
              {lastDraftSaved && (
                <span 
                  className="badge badge-teal" 
                  style={{ 
                    fontSize: '0.6rem', 
                    padding: '0.08rem 0.3rem', 
                    gap: '0.15rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                  title="Your rating changes and text are automatically saved locally"
                >
                  <Check size={8} /> Saved
                </span>
              )}

              {timeLeft !== null && (
                <span 
                  style={{ 
                    fontSize: '0.6rem', 
                    fontWeight: 700, 
                    color: timeLeft < 3600000 ? 'var(--accent-rose)' : 'var(--accent-amber)',
                    backgroundColor: timeLeft < 3600000 ? 'var(--accent-rose-light)' : 'var(--accent-amber-light)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.15rem',
                    padding: '0.08rem 0.3rem',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                  title="Time remaining"
                >
                  <Clock size={9} />
                  {(() => {
                    const s = Math.floor(timeLeft / 1000);
                    const mins = Math.floor(s / 60);
                    const hrs = Math.floor(mins / 60);
                    const days = Math.floor(hrs / 24);
                    if (days > 0) return `${days}d`;
                    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
                    return `${mins}m`;
                  })()}
                </span>
              )}
            </div>

            {/* Progress badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <div style={{ width: '45px', height: '5px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-teal) 0%, hsl(142, 70%, 45%) 100%)', borderRadius: '9999px', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-teal)', backgroundColor: 'var(--accent-teal-light)', padding: '0.08rem 0.35rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                {progressPct}%
              </span>
            </div>
          </div>

          {/* Row 2: Swipeable Horizontal Teammates List */}
          <div
            className="progression-nodes-list"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              overflowX: 'auto',
              flexWrap: 'nowrap',
              width: '100%',
              paddingBottom: '2px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none'
            }}
          >
            {teammates.map((t, idx) => {
              const isDone = (strengthsText[t.id] || '').trim().length > 0 ||
                             (growthText[t.id] || '').trim().length > 0 ||
                             (praiseTags[t.id] || []).length > 0;
              
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`progression-node-bubble ${isDone ? 'completed' : ''}`}
                  style={{ 
                    padding: '0.18rem 0.5rem', 
                    fontSize: '0.68rem', 
                    borderRadius: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    backgroundColor: isDone ? 'var(--accent-teal-light)' : 'var(--bg-surface)',
                    color: isDone ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    transition: 'all 150ms ease'
                  }}
                  onClick={() => {
                    const el = document.getElementById(`card-peer-${t.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  title={`Evaluate ${cleanStudentName(t.name)}`}
                >
                  <div 
                    className="progression-node-badge"
                    style={{
                      width: '13px',
                      height: '13px',
                      fontSize: '0.55rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      fontWeight: 800,
                      backgroundColor: isDone ? 'var(--accent-teal)' : 'var(--border-color)',
                      color: isDone ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    {isDone ? <Check size={8} /> : idx + 1}
                  </div>
                  <span style={{ fontWeight: 600 }}>{cleanStudentName(t.name).split(' ')[0]}</span>
                </button>
              );
            })}

            <button
              key="self-node"
              type="button"
              className={`progression-node-bubble ${selfTouched ? 'completed' : ''}`}
              style={{ 
                padding: '0.18rem 0.5rem', 
                fontSize: '0.68rem', 
                borderRadius: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                backgroundColor: selfTouched ? 'var(--accent-teal-light)' : 'var(--bg-surface)',
                color: selfTouched ? 'var(--accent-teal)' : 'var(--text-secondary)',
                transition: 'all 150ms ease'
              }}
              onClick={() => {
                const el = document.getElementById('card-self-calibration');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              title="Self Evaluation"
            >
              <div 
                className="progression-node-badge"
                style={{
                  width: '13px',
                  height: '13px',
                  fontSize: '0.55rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  fontWeight: 800,
                  backgroundColor: selfTouched ? 'var(--accent-teal)' : 'var(--border-color)',
                  color: selfTouched ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {selfTouched ? <Check size={8} /> : <Star size={8} />}
              </div>
              <span style={{ fontWeight: 600 }}>Self</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Banner for Solo Groups (Fallback) */}
      {teammates.length === 0 && (
        <div style={{ padding: '0.5rem 0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            <span>{activeClass.name}</span>
          </div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
            Peer Evaluation
          </h1>
        </div>
      )}

      {teammates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <AlertCircle size={36} className="text-amber" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Solo Group Detected</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '0.82rem' }}>
            You are currently the only member assigned to the team <b>{student.groupName}</b>. Peer evaluations require at least 2 team members.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Peer Evaluator Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {teammates.map((peer, idx) => (
              <div key={peer.id} id={`card-peer-${peer.id}`} className="card" style={{ borderLeft: '4px solid var(--primary)', position: 'relative', padding: '1rem 0.85rem', scrollMarginTop: '80px' }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem' }}>
                      {idx + 1}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{cleanStudentName(peer.name)}</h3>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Teammate ID: {peer.id}</span>
                    </div>
                  </div>
                  <FeatureInfoButton featureId="student-grading-matrix" size="sm" tooltipText="How Peer Grading Works" />
                </div>

                {/* Rubric Sliders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {activeClass.fields.map((field) => {
                    const currentVal = evaluations[peer.id]?.[field.id] ?? Math.round((field.min + field.max) / 2);
                    const pct = ((currentVal - field.min) / (field.max - field.min || 1)) * 100;
                    const tier = getTierInfo(pct);
                    
                    const range = field.max - field.min;
                    const isNarrowRange = range <= 15;
                    const scoreNodes = [];
                    for (let val = field.min; val <= field.max; val++) {
                      scoreNodes.push(val);
                    }

                    const TierIcon = tier.icon;
                    return (
                      <div key={field.id} className="grading-slider-container" style={{ margin: 0 }}>
                        <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                              {field.name}
                            </span>
                            {field.description && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.15rem', lineHeight: 1.3 }}>
                                {field.description}
                              </span>
                            )}
                          </div>
                          <span className="slider-value-bubble" style={{ backgroundColor: tier.color, fontSize: '0.78rem', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 800, flexShrink: 0, color: '#fff' }}>
                            {currentVal} / {field.max}
                          </span>
                        </div>

                        {/* Consolidated Single Scale: Unified Numeric Selector with Dynamic Expectation Feedback */}
                        <div className="score-fine-tuner" style={{ marginTop: '0.2rem' }}>
                          {/* Quick Expectation Tier Snapping Buttons — Swipeable on small screens */}
                          <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem', overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: '2px' }}>
                            {[
                              { label: 'Exemplary (100%)', pct: 1.0, color: 'var(--accent-teal)', icon: Trophy },
                              { label: 'Proficient (75%)', pct: 0.75, color: 'var(--primary)', icon: ThumbsUp },
                              { label: 'Developing (50%)', pct: 0.5, color: 'var(--accent-amber)', icon: TrendingUp },
                              { label: 'Needs Work (25%)', pct: 0.25, color: 'var(--accent-rose)', icon: AlertCircle }
                            ].map((t) => {
                              const targetVal = Math.round(field.min + t.pct * (field.max - field.min));
                              const isCurrent = currentVal === targetVal;
                              const TierIcon = t.icon;
                              return (
                                <button
                                  key={t.label}
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleSliderChange(peer.id, field.id, targetVal)}
                                  style={{
                                    fontSize: '0.68rem',
                                    padding: '0.15rem 0.5rem',
                                    height: '24px',
                                    borderRadius: '12px',
                                    fontWeight: isCurrent ? 800 : 500,
                                    backgroundColor: isCurrent ? `${t.color}18` : 'var(--bg-surface)',
                                    borderColor: isCurrent ? t.color : 'var(--border-color)',
                                    color: isCurrent ? t.color : 'var(--text-secondary)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                  }}
                                >
                                  <TierIcon size={10} />
                                  <span>{t.label}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Dynamic Qualitative Tier Indicator */}
                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.6rem', 
                              padding: '0.5rem 0.65rem', 
                              borderRadius: '8px', 
                              backgroundColor: tier.bgColor, 
                              color: tier.color,
                              border: `1px solid ${tier.color}25`,
                              marginBottom: '0.75rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: tier.color, color: '#fff', width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0 }}>
                              <TierIcon size={12} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <strong style={{ fontSize: '0.78rem', display: 'block', color: 'var(--text-primary)', lineHeight: 1.2 }}>{tier.title}</strong>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', lineHeight: 1.25, marginTop: '2px' }}>{tier.desc}</span>
                            </div>
                          </div>

                          {isNarrowRange ? (
                            <div className="score-nodes-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'center' }}>
                              {scoreNodes.map((nodeVal) => {
                                const isActive = currentVal === nodeVal;
                                return (
                                  <button
                                    key={nodeVal}
                                    type="button"
                                    className={`score-node-btn ${isActive ? 'active' : ''}`}
                                    style={isActive ? { backgroundColor: tier.color, borderColor: tier.color, color: '#fff' } : {}}
                                    onClick={() => handleSliderChange(peer.id, field.id, nodeVal)}
                                  >
                                    {nodeVal}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="score-stepper" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                <button
                                  type="button"
                                  className="score-stepper-btn"
                                  disabled={currentVal <= field.min}
                                  onClick={() => handleSliderChange(peer.id, field.id, Math.max(field.min, currentVal - 1))}
                                  style={{ width: '32px', height: '32px', minWidth: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                                >
                                  <Minus size={13} />
                                </button>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '38px' }}>
                                  <span style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.1 }}>{currentVal}</span>
                                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                    {Math.round(pct)}%
                                  </span>
                                </div>
                                
                                <button
                                  type="button"
                                  className="score-stepper-btn"
                                  disabled={currentVal >= field.max}
                                  onClick={() => handleSliderChange(peer.id, field.id, Math.min(field.max, currentVal + 1))}
                                  style={{ width: '32px', height: '32px', minWidth: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                                >
                                  <Plus size={13} />
                                </button>
                              </div>

                              <div style={{ flex: 1, minWidth: '80px' }}>
                                <input
                                  type="range"
                                  className="custom-slider"
                                  min={field.min}
                                  max={field.max}
                                  value={currentVal}
                                  style={{
                                    width: '100%',
                                    background: `linear-gradient(to right, ${tier.color} 0%, ${tier.color} ${pct}%, var(--border-color) ${pct}%, var(--border-color) 100%)`
                                  }}
                                  onChange={(e) => handleSliderChange(peer.id, field.id, Number(e.target.value))}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Positive praise tag selector */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Award size={14} className="text-teal" /> Strengths &amp; Praise Tags <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)' }}>(Anonymous)</span>
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {AVAILABLE_TAGS.map(tag => {
                      const selectedList = praiseTags[peer.id] || [];
                      const isSelected = selectedList.includes(tag);
                      const tagInfo = getPraiseTagInfo(tag);
                      const TagIcon = tagInfo.icon;
                      
                      return (
                        <button
                          key={tag}
                          type="button"
                          className="btn btn-sm"
                          style={{
                            borderRadius: '16px',
                            fontSize: '0.74rem',
                            padding: '0.35rem 0.65rem',
                            minHeight: '32px',
                            border: `1px solid ${isSelected ? tagInfo.color : 'var(--border-color)'}`,
                            backgroundColor: isSelected ? tagInfo.bg : 'var(--bg-surface)',
                            color: isSelected ? tagInfo.color : 'var(--text-secondary)',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            touchAction: 'manipulation',
                            transition: 'all 150ms ease',
                            boxShadow: isSelected ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none'
                          }}
                          onClick={() => {
                            const list = praiseTags[peer.id] || [];
                            const next = list.includes(tag)
                              ? list.filter(item => item !== tag)
                              : [...list, tag];
                            setPraiseTags(prev => ({ ...prev, [peer.id]: next }));
                          }}
                        >
                          <TagIcon size={12} /> {tagInfo.text} {isSelected && <Check size={11} style={{ marginLeft: '2px' }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Qualitative Written Comments */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                    <MessageSquare size={14} className="text-primary" /> Written Constructive Feedback <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)' }}>(Anonymous)</span>
                  </span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 600 }}>What are this teammate's primary strengths?</label>
                      <textarea
                        className="form-input"
                        placeholder="e.g. Completed documentation accurately, communicated proactively in standups..."
                        rows={2}
                        style={{ resize: 'vertical', fontSize: '15px', lineHeight: 1.4, padding: '0.55rem 0.65rem', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
                        maxLength={500}
                        value={strengthsText[peer.id] || ''}
                        onChange={(e) => setStrengthsText(prev => ({ ...prev, [peer.id]: e.target.value }))}
                      />
                    </div>
                    
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 600 }}>What is one constructive suggestion for their improvement?</label>
                      <textarea
                        className="form-input"
                        placeholder="e.g. Could participate more actively in brainstorming, or submit code milestones earlier..."
                        rows={2}
                        style={{ resize: 'vertical', fontSize: '15px', lineHeight: 1.4, padding: '0.55rem 0.65rem', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
                        maxLength={500}
                        value={growthText[peer.id] || ''}
                        onChange={(e) => setGrowthText(prev => ({ ...prev, [peer.id]: e.target.value }))}
                      />
                    </div>
                  </div>
                  <details style={{ fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '0.15rem' }}>
                    <summary style={{ outline: 'none', fontWeight: 700, color: 'var(--accent-amber)', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <AlertTriangle size={12} className="text-amber" /> <span>Anonymity Guidelines (Tap to view)</span>
                    </summary>
                    <p style={{ marginTop: '0.35rem', lineHeight: 1.4, padding: '0.45rem', backgroundColor: 'var(--accent-amber-light)', borderRadius: '4px', border: '1px solid hsla(35, 92%, 47%, 0.15)' }}>
                      Maintain strictly constructive, gender-neutral peer vocabulary to preserve complete anonymity.
                    </p>
                  </details>
                </div>

              </div>
            ))}
          </div>

          {/* SELF-EVALUATION CALIBRATION CARD */}
          <div id="card-self-calibration" className="card" style={{ borderLeft: '4px solid var(--accent-teal)', backgroundColor: 'var(--bg-surface)', padding: '1rem 0.85rem', scrollMarginTop: '80px' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-teal-light)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  <Star size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Self-Evaluation Calibration</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Objective self-reflection of your contributions</span>
                </div>
              </div>
              <FeatureInfoButton featureId="webpa-scoring" size="sm" tooltipText="Why Self-Calibration Matters" />
            </div>

            <details style={{ backgroundColor: 'var(--primary-light)', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--primary)', fontSize: '0.76rem', color: 'hsl(243, 75%, 25%)', marginBottom: '1rem', cursor: 'pointer' }}>
              <summary style={{ fontWeight: 700, outline: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', userSelect: 'none' }}>
                <Lightbulb size={13} className="text-primary" /> <span>Why evaluate myself? (Tap to expand)</span>
              </summary>
              <p style={{ marginTop: '0.35rem', color: 'var(--text-secondary)', lineHeight: 1.4, fontSize: '0.74rem' }}>
                Your scores will be compared side-by-side with anonymous peer feedback to calibrate self-perception. <i>Classmates never see your self-ratings.</i>
              </p>
            </details>

            {/* Rubric Sliders for Self */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {activeClass.fields.map((field) => {
                const currentVal = evaluations[student.id]?.[field.id] ?? Math.round((field.min + field.max) / 2);
                const pct = ((currentVal - field.min) / (field.max - field.min || 1)) * 100;
                const tier = getTierInfo(pct);
                const range = field.max - field.min;
                const isNarrowRange = range <= 15;
                const scoreNodes = [];
                for (let val = field.min; val <= field.max; val++) {
                  scoreNodes.push(val);
                }

                const TierIcon = tier.icon;
                return (
                  <div key={field.id} className="grading-slider-container" style={{ margin: 0 }}>
                    <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                          Self-Rating: {field.name}
                        </span>
                        {field.description && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.15rem', lineHeight: 1.3 }}>
                            {field.description}
                          </span>
                        )}
                      </div>
                      <span className="slider-value-bubble" style={{ backgroundColor: 'var(--accent-teal)', color: '#fff', fontSize: '0.78rem', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 800, flexShrink: 0 }}>
                        {currentVal} / {field.max}
                      </span>
                    </div>

                    {/* Consolidated Single Scale: Unified Numeric Selector with Dynamic Expectation Feedback */}
                    <div className="score-fine-tuner" style={{ marginTop: '0.2rem' }}>
                      {/* Quick Expectation Tier Snapping Buttons */}
                      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem', overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: '2px' }}>
                        {[
                          { label: 'Exemplary (100%)', pct: 1.0, color: 'var(--accent-teal)', icon: Trophy },
                          { label: 'Proficient (75%)', pct: 0.75, color: 'var(--primary)', icon: ThumbsUp },
                          { label: 'Developing (50%)', pct: 0.5, color: 'var(--accent-amber)', icon: TrendingUp },
                          { label: 'Needs Work (25%)', pct: 0.25, color: 'var(--accent-rose)', icon: AlertCircle }
                        ].map((t) => {
                          const targetVal = Math.round(field.min + t.pct * (field.max - field.min));
                          const isCurrent = currentVal === targetVal;
                          const TierIcon = t.icon;
                          return (
                            <button
                              key={t.label}
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleSliderChange(student.id, field.id, targetVal)}
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.15rem 0.5rem',
                                height: '24px',
                                borderRadius: '12px',
                                fontWeight: isCurrent ? 800 : 500,
                                backgroundColor: isCurrent ? `${t.color}18` : 'var(--bg-surface)',
                                borderColor: isCurrent ? t.color : 'var(--border-color)',
                                color: isCurrent ? t.color : 'var(--text-secondary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                            >
                              <TierIcon size={10} />
                              <span>{t.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Dynamic Qualitative Tier Indicator */}
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.6rem', 
                          padding: '0.5rem 0.65rem', 
                          borderRadius: '8px', 
                          backgroundColor: tier.bgColor, 
                          color: tier.color,
                          border: `1px solid ${tier.color}25`,
                          marginBottom: '0.75rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: tier.color, color: '#fff', width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0 }}>
                          <TierIcon size={12} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong style={{ fontSize: '0.78rem', display: 'block', color: 'var(--text-primary)', lineHeight: 1.2 }}>{tier.title}</strong>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', lineHeight: 1.25, marginTop: '2px' }}>{tier.desc}</span>
                        </div>
                      </div>

                      {isNarrowRange ? (
                        <div className="score-nodes-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'center' }}>
                          {scoreNodes.map((nodeVal) => {
                            const isActive = currentVal === nodeVal;
                            return (
                              <button
                                key={nodeVal}
                                type="button"
                                className={`score-node-btn ${isActive ? 'active' : ''}`}
                                style={isActive ? { backgroundColor: 'var(--accent-teal)', borderColor: 'var(--accent-teal)', color: '#fff' } : {}}
                                onClick={() => handleSliderChange(student.id, field.id, nodeVal)}
                              >
                                {nodeVal}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="score-stepper" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                            <button
                              type="button"
                              className="score-stepper-btn"
                              disabled={currentVal <= field.min}
                              onClick={() => handleSliderChange(student.id, field.id, Math.max(field.min, currentVal - 1))}
                              style={{ width: '32px', height: '32px', minWidth: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                            >
                              <Minus size={13} />
                            </button>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '38px' }}>
                              <span style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.1 }}>{currentVal}</span>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                {Math.round(pct)}%
                              </span>
                            </div>
                            
                            <button
                              type="button"
                              className="score-stepper-btn"
                              disabled={currentVal >= field.max}
                              onClick={() => handleSliderChange(student.id, field.id, Math.min(field.max, currentVal + 1))}
                              style={{ width: '32px', height: '32px', minWidth: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <div style={{ flex: 1, minWidth: '80px' }}>
                            <input
                              type="range"
                              className="custom-slider"
                              min={field.min}
                              max={field.max}
                              value={currentVal}
                              style={{
                                width: '100%',
                                background: `linear-gradient(to right, var(--accent-teal) 0%, var(--accent-teal) ${pct}%, var(--border-color) ${pct}%, var(--border-color) 100%)`
                              }}
                              onChange={(e) => handleSliderChange(student.id, field.id, Number(e.target.value))}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submission Panel — 100% Mobile Full-Width Responsive */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary)', padding: '1rem' }}>
            <div>
              <h4 style={{ fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.25rem 0', fontSize: '0.92rem' }}>
                <ShieldCheck size={16} /> Review Anonymity Assurance
              </h4>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                Once submitted, your peer reviews are encrypted, locked, and aggregated into anonymous averages.
              </p>
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${isSubmitting ? 'btn-disabled' : ''}`}
              disabled={isSubmitting}
              style={{ width: '100%', height: '44px', fontSize: '0.92rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '10px', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)' }}
            >
              {isSubmitting ? 'Submitting Evaluations...' : 'Submit Anonymous Feedback'} <Send size={15} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
export default StudentPortal;
