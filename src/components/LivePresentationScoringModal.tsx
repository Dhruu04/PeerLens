import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Presentation,
  QrCode,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Award,
  CheckCircle2,
  Sparkles,
  Users,
  Download,
  BarChart3,
  Copy,
  Check,
  Plus,
  Trash2,
  MessageSquare,
  Tv,
  RefreshCw,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import QRCode from 'qrcode';
import type { ClassData, PresentationCriterion, PresentationScoreSubmission, PresentationDaySession } from '../utils/math';
import { DEFAULT_PRESENTATION_CRITERIA } from '../utils/math';

interface LivePresentationScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData;
  onUpdateSession?: (session: PresentationDaySession) => void;
}

export const LivePresentationScoringModal: React.FC<LivePresentationScoringModalProps> = ({
  isOpen,
  onClose,
  classData,
  onUpdateSession
}) => {
  // Extract unique team names
  const teamNames = useMemo(() => {
    const names = Array.from(new Set(classData.students.map(s => s.groupName).filter(Boolean)));
    return names.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [classData.students]);

  const [activeTeam, setActiveTeam] = useState<string>(teamNames[0] || 'Team 1');
  const [criteria, setCriteria] = useState<PresentationCriterion[]>(
    classData.presentationSession?.criteria || DEFAULT_PRESENTATION_CRITERIA
  );
  const [submissions, setSubmissions] = useState<PresentationScoreSubmission[]>(
    classData.presentationSession?.submissions || []
  );
  const [timerDuration, setTimerDuration] = useState<number>(300); // 5 minutes
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(300);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isVotingOpen, setIsVotingOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'cockpit' | 'audience_sim' | 'leaderboard' | 'criteria'>('cockpit');

  // QR Code State
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Audience Simulation Form State
  const [simStudentName, setSimStudentName] = useState<string>('Alex Johnson');
  const [simScores, setSimScores] = useState<Record<string, number>>({});
  const [simFeedback, setSimFeedback] = useState<string>('');
  const [simSuccessMsg, setSimSuccessMsg] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize initial active team
  useEffect(() => {
    if (teamNames.length > 0 && !teamNames.includes(activeTeam)) {
      setActiveTeam(teamNames[0]);
    }
  }, [teamNames, activeTeam]);

  // Generate QR Code URL
  useEffect(() => {
    const liveVotingUrl = `${window.location.origin}${window.location.pathname}?mode=presentation_vote&classId=${classData.id}&team=${encodeURIComponent(activeTeam)}`;
    QRCode.toDataURL(liveVotingUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate presentation QR', err));
  }, [classData.id, activeTeam]);

  // Timer Tick Handler
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Initialize simulation scores when criteria change
  useEffect(() => {
    const initScores: Record<string, number> = {};
    criteria.forEach(c => {
      initScores[c.id] = 4;
    });
    setSimScores(initScores);
  }, [criteria]);

  // Filter submissions for the active presenting team
  const activeSubmissions = useMemo(() => {
    return submissions.filter(s => s.teamName === activeTeam);
  }, [submissions, activeTeam]);

  // Calculate Average Criteria Scores for Active Team
  const criteriaStats = useMemo(() => {
    const stats: Record<string, { avg: number; count: number; max: number }> = {};
    criteria.forEach(c => {
      const validScores = activeSubmissions
        .map(s => s.scores[c.id])
        .filter((val): val is number => typeof val === 'number');
      const sum = validScores.reduce((a, b) => a + b, 0);
      const avg = validScores.length > 0 ? sum / validScores.length : 0;
      stats[c.id] = { avg, count: validScores.length, max: c.maxScore || 5 };
    });
    return stats;
  }, [criteria, activeSubmissions]);

  // Calculate Overall Weighted Score for Active Team (out of 100)
  const overallTeamScore = useMemo(() => {
    if (activeSubmissions.length === 0) return 0;
    const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 25), 0) || 100;
    let weightedSum = 0;
    criteria.forEach(c => {
      const stat = criteriaStats[c.id];
      if (stat && stat.max > 0) {
        const normalized = (stat.avg / stat.max) * 100;
        weightedSum += (normalized * (c.weight || 25)) / totalWeight;
      }
    });
    return Math.round(weightedSum * 10) / 10;
  }, [criteria, criteriaStats, activeSubmissions]);

  // Leaderboard Calculation across all teams
  const leaderboard = useMemo(() => {
    return teamNames.map(tName => {
      const teamSubs = submissions.filter(s => s.teamName === tName);
      if (teamSubs.length === 0) {
        return { teamName: tName, voteCount: 0, overallScore: 0, criteriaScores: {} as Record<string, number> };
      }
      const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 25), 0) || 100;
      let weightedSum = 0;
      const cScores: Record<string, number> = {};
      criteria.forEach(c => {
        const scores = teamSubs.map(s => s.scores[c.id]).filter((v): v is number => typeof v === 'number');
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        cScores[c.id] = Math.round(avg * 10) / 10;
        if (c.maxScore > 0) {
          const norm = (avg / c.maxScore) * 100;
          weightedSum += (norm * (c.weight || 25)) / totalWeight;
        }
      });
      return {
        teamName: tName,
        voteCount: teamSubs.length,
        overallScore: Math.round(weightedSum * 10) / 10,
        criteriaScores: cScores
      };
    }).sort((a, b) => b.overallScore - a.overallScore);
  }, [teamNames, submissions, criteria]);

  // Save session updates
  const handleSaveAndSync = () => {
    if (onUpdateSession) {
      onUpdateSession({
        activeTeamName: activeTeam,
        criteria,
        submissions,
        timerDurationSeconds: timerDuration,
        isOpenForVoting: isVotingOpen
      });
    }
  };

  // Simulate Random Audience Submissions
  const handleSimulateAudienceVotes = (count: number = 10) => {
    const sampleComments = [
      'Great pacing and exceptionally clear problem statement.',
      'Slide visuals were clean, but could have explained methodology in more depth.',
      'Strong defense during the Q&A session. Handled critical questions with poise.',
      'Very engaging presentation! Loved the live architecture demo.',
      'Visual layout was structured and easy to follow.',
      'Good teamwork; all members spoke and contributed equally.'
    ];

    const newSubs: PresentationScoreSubmission[] = [];
    for (let i = 0; i < count; i++) {
      const scores: Record<string, number> = {};
      criteria.forEach(c => {
        // Generate realistic scores between 3 and 5
        const randScore = Math.floor(Math.random() * 3) + 3;
        scores[c.id] = Math.min(c.maxScore || 5, randScore);
      });
      newSubs.push({
        id: `sim_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        teamName: activeTeam,
        voterName: `Audience Member ${Math.floor(Math.random() * 80) + 1}`,
        scores,
        constructiveFeedback: sampleComments[Math.floor(Math.random() * sampleComments.length)],
        timestamp: Date.now() - Math.floor(Math.random() * 60000)
      });
    }

    const updated = [...submissions, ...newSubs];
    setSubmissions(updated);
    if (onUpdateSession) {
      onUpdateSession({
        activeTeamName: activeTeam,
        criteria,
        submissions: updated,
        timerDurationSeconds: timerDuration,
        isOpenForVoting: isVotingOpen
      });
    }
  };

  // Submit single audience score from simulator
  const handleSingleAudienceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSub: PresentationScoreSubmission = {
      id: `vote_${Date.now()}`,
      teamName: activeTeam,
      voterName: simStudentName.trim() || 'Audience Member',
      scores: { ...simScores },
      constructiveFeedback: simFeedback.trim() || undefined,
      timestamp: Date.now()
    };
    const updated = [...submissions, newSub];
    setSubmissions(updated);
    setSimFeedback('');
    setSimSuccessMsg(`Feedback recorded for ${activeTeam}!`);
    setTimeout(() => setSimSuccessMsg(''), 3000);
    if (onUpdateSession) {
      onUpdateSession({
        activeTeamName: activeTeam,
        criteria,
        submissions: updated,
        timerDurationSeconds: timerDuration,
        isOpenForVoting: isVotingOpen
      });
    }
  };

  // Reset Submissions for Current Team
  const handleClearCurrentTeamVotes = () => {
    if (window.confirm(`Clear all ${activeSubmissions.length} audience ratings for ${activeTeam}?`)) {
      const filtered = submissions.filter(s => s.teamName !== activeTeam);
      setSubmissions(filtered);
      if (onUpdateSession) {
        onUpdateSession({
          activeTeamName: activeTeam,
          criteria,
          submissions: filtered,
          timerDurationSeconds: timerDuration,
          isOpenForVoting: isVotingOpen
        });
      }
    }
  };

  // Format Timer Display
  const formatTimer = (seconds: number) => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    return `${isNegative ? '-' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy Link Handler
  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?mode=presentation_vote&classId=${classData.id}&team=${encodeURIComponent(activeTeam)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Export CSV Report
  const handleExportCSV = () => {
    const rows: string[][] = [
      ['Live Presentation Day Scoring Report', classData.name],
      ['Generated At', new Date().toLocaleString()],
      [],
      ['Team Leaderboard'],
      ['Rank', 'Team Name', 'Votes Received', 'Overall Score (%)', ...criteria.map(c => `${c.name} (${c.maxScore} max)`)]
    ];

    leaderboard.forEach((item, idx) => {
      rows.push([
        `#${idx + 1}`,
        item.teamName,
        item.voteCount.toString(),
        `${item.overallScore}%`,
        ...criteria.map(c => (item.criteriaScores[c.id] !== undefined ? item.criteriaScores[c.id].toString() : '-'))
      ]);
    });

    rows.push([], ['Detailed Audience Submissions']);
    rows.push(['Timestamp', 'Team', 'Voter', ...criteria.map(c => c.name), 'Constructive Feedback']);

    submissions.forEach(sub => {
      rows.push([
        new Date(sub.timestamp).toLocaleTimeString(),
        sub.teamName,
        sub.voterName || 'Anonymous',
        ...criteria.map(c => (sub.scores[c.id] !== undefined ? sub.scores[c.id].toString() : '-')),
        sub.constructiveFeedback ? `"${sub.constructiveFeedback.replace(/"/g, '""')}"` : ''
      ]);
    });

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${classData.name.replace(/\s+/g, '_')}_Presentation_Scores.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar */}
        <div
          style={{
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-app)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--accent-teal-light, rgba(13, 148, 136, 0.12))',
                color: 'var(--accent-teal, #0d9488)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(13, 148, 136, 0.2)'
              }}
            >
              <Presentation size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Live Presentation Day Scoring Cockpit
                </h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '20px',
                    backgroundColor: isVotingOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: isVotingOpen ? '#10b981' : '#ef4444',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isVotingOpen ? '#10b981' : '#ef4444' }} />
                  {isVotingOpen ? 'Live Voting Active' : 'Voting Paused'}
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Audience scans QR to evaluate presentations across 4 criteria in real time.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportCSV}
              style={{ gap: '0.35rem', fontWeight: 700 }}
              title="Export all presentation scores to CSV"
            >
              <Download size={13} /> Export CSV
            </button>
            <button
              type="button"
              className="btn btn-icon btn-secondary btn-sm"
              onClick={onClose}
              style={{ borderRadius: '50%' }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('cockpit')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.8rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'cockpit' ? 800 : 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'cockpit' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'cockpit' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <Tv size={13} /> Live Cockpit &amp; Projector
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audience_sim')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.8rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'audience_sim' ? 800 : 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'audience_sim' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'audience_sim' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <Eye size={13} /> Audience Voting View (Test)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.8rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'leaderboard' ? 800 : 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'leaderboard' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'leaderboard' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <Award size={13} /> Class Leaderboard ({leaderboard.filter(l => l.voteCount > 0).length}/{teamNames.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('criteria')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.8rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'criteria' ? 800 : 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'criteria' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'criteria' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <SlidersHorizontal size={13} /> Rubric Criteria ({criteria.length})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Presenting:</span>
            <select
              value={activeTeam}
              onChange={(e) => setActiveTeam(e.target.value)}
              className="form-select"
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                color: 'var(--primary)'
              }}
            >
              {teamNames.map(tName => (
                <option key={tName} value={tName}>
                  {tName} ({submissions.filter(s => s.teamName === tName).length} votes)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Main Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: COCKPIT & LIVE PROJECTOR VIEW */}
          {activeTab === 'cockpit' && (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem', alignItems: 'start' }}>
              {/* Left Column: QR Code & Presentation Timer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* QR Code Scanner Card */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    padding: '1.1rem',
                    textAlign: 'center',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                    Audience Mobile Scan
                  </span>

                  {qrDataUrl ? (
                    <div style={{ display: 'inline-block', padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
                      <img src={qrDataUrl} alt="Presentation Voting QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
                    </div>
                  ) : (
                    <div style={{ width: '180px', height: '180px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                      <QrCode size={36} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}

                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', gap: '0.3rem' }}
                    >
                      {copiedLink ? <Check size={12} className="text-teal" /> : <Copy size={12} />}
                      {copiedLink ? 'Link Copied!' : 'Copy Voting Link'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVotingOpen(!isVotingOpen)}
                      className={`btn btn-sm ${isVotingOpen ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
                    >
                      {isVotingOpen ? 'Pause Votes' : 'Resume Votes'}
                    </button>
                  </div>
                </div>

                {/* Presentation Countdown Timer Card */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    padding: '1.1rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={13} className="text-teal" /> Presentation Timer
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {[180, 300, 600].map(sec => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setTimerDuration(sec);
                            setTimerSecondsLeft(sec);
                            setIsTimerRunning(false);
                          }}
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: timerDuration === sec ? 800 : 500,
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: timerDuration === sec ? 'var(--primary-light)' : 'var(--bg-surface)',
                            color: timerDuration === sec ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {sec / 60}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '2.2rem',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      textAlign: 'center',
                      padding: '0.4rem 0',
                      color: timerSecondsLeft < 0 ? '#ef4444' : timerSecondsLeft <= 60 ? '#f59e0b' : 'var(--text-primary)',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {formatTimer(timerSecondsLeft)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`btn btn-sm ${isTimerRunning ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ fontSize: '0.74rem', padding: '0.25rem 0.8rem', gap: '0.35rem', fontWeight: 700 }}
                    >
                      {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
                      {isTimerRunning ? 'Pause' : 'Start'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerSecondsLeft(timerDuration);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem' }}
                      title="Reset Timer"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
                </div>

                {/* Instant Simulator Box */}
                <div
                  style={{
                    backgroundColor: 'rgba(13, 148, 136, 0.06)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--accent-teal)',
                    padding: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <Sparkles size={13} className="text-teal" />
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Quick Test Simulator
                    </span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 0.6rem 0' }}>
                    Instantly simulate incoming audience votes to test live metrics and chart animations.
                  </p>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => handleSimulateAudienceVotes(5)}
                      className="btn btn-teal btn-sm"
                      style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem 0.4rem', fontWeight: 700 }}
                    >
                      +5 Votes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateAudienceVotes(15)}
                      className="btn btn-teal btn-sm"
                      style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem 0.4rem', fontWeight: 700 }}
                    >
                      +15 Votes
                    </button>
                    {activeSubmissions.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCurrentTeamVotes}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.4rem' }}
                        title="Clear current team votes"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Presentation Score Metrics & Audience Feedback Stream */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Team Hero Summary Banner */}
                <div
                  style={{
                    padding: '1.25rem 1.5rem',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                      Currently On Stage
                    </span>
                    <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {activeTeam}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.35rem' }}>
                      <span className="badge badge-secondary" style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>
                        <Users size={11} /> {classData.students.filter(s => s.groupName === activeTeam).length} Team Members
                      </span>
                      <span className="badge badge-teal" style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>
                        <CheckCircle2 size={11} /> {activeSubmissions.length} Audience Reviews
                      </span>
                    </div>
                  </div>

                  {/* Big Live Calculated Score */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      backgroundColor: 'var(--bg-surface)',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.04)'
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Audience Score
                    </span>
                    <span
                      style={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        color: overallTeamScore >= 80 ? 'var(--accent-teal, #0d9488)' : overallTeamScore >= 60 ? 'var(--primary)' : 'var(--text-primary)'
                      }}
                    >
                      {activeSubmissions.length > 0 ? `${overallTeamScore}%` : '--'}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {activeSubmissions.length > 0 ? `Avg: ${(overallTeamScore / 20).toFixed(1)} / 5.0` : 'Awaiting scores'}
                    </span>
                  </div>
                </div>

                {/* Criteria Real-Time Score Bars */}
                <div
                  style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <BarChart3 size={14} className="text-teal" /> Live Criteria Breakdown
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Normalized to 5-point standard
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {criteria.map(crit => {
                      const stat = criteriaStats[crit.id] || { avg: 0, count: 0, max: 5 };
                      const pct = stat.max > 0 ? Math.min(100, Math.round((stat.avg / stat.max) * 100)) : 0;
                      return (
                        <div key={crit.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {crit.name}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                ({crit.weight}% weight)
                              </span>
                              <strong style={{ color: stat.avg >= 4 ? 'var(--accent-teal, #0d9488)' : 'var(--primary)' }}>
                                {stat.count > 0 ? `${stat.avg.toFixed(1)} / ${stat.max}` : '0.0 / 5'}
                              </strong>
                            </div>
                          </div>
                          {/* Animated Progress Bar */}
                          <div
                            style={{
                              height: '8px',
                              backgroundColor: 'var(--bg-app)',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${pct}%`,
                                backgroundColor: pct >= 80 ? 'var(--accent-teal, #0d9488)' : pct >= 60 ? 'var(--primary)' : 'var(--text-muted)',
                                borderRadius: '4px',
                                transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {crit.description}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Qualitative Audience Feedback Stream */}
                <div
                  style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MessageSquare size={14} className="text-teal" /> Live Audience Notes ({activeSubmissions.filter(s => s.constructiveFeedback).length})
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Real-time peer reactions
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {activeSubmissions.filter(s => s.constructiveFeedback).length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.74rem', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                        No written comments submitted for {activeTeam} yet.
                      </div>
                    ) : (
                      activeSubmissions.filter(s => s.constructiveFeedback).map(sub => (
                        <div
                          key={sub.id}
                          style={{
                            padding: '0.55rem 0.75rem',
                            backgroundColor: 'var(--bg-app)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.74rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.68rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: 600 }}>{sub.voterName || 'Audience Peer'}</span>
                            <span>{new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p style={{ margin: 0, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                            &ldquo;{sub.constructiveFeedback}&rdquo;
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIENCE VOTING SIMULATOR FORM */}
          {activeTab === 'audience_sim' && (
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <div
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Student Mobile Scoring Simulator
                    </h4>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      This is the exact responsive interface students see when scanning the QR code.
                    </p>
                  </div>
                </div>

                {simSuccessMsg && (
                  <div style={{ padding: '0.6rem 0.85rem', marginBottom: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: '6px', color: '#059669', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={14} /> {simSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleSingleAudienceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      Your Name / Identifier (Optional):
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={simStudentName}
                      onChange={(e) => setSimStudentName(e.target.value)}
                      placeholder="e.g. Jordan Smith"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', borderRadius: '8px' }}
                    />
                  </div>

                  <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Evaluating Presenting Team:
                    </span>
                    <span className="badge badge-teal" style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                      {activeTeam}
                    </span>
                  </div>

                  {/* Rubric Sliders */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    {criteria.map(crit => {
                      const currentVal = simScores[crit.id] ?? 4;
                      return (
                        <div
                          key={crit.id}
                          style={{
                            padding: '0.85rem',
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {crit.name}
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)' }}>
                              {currentVal} / {crit.maxScore || 5}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
                            {crit.description}
                          </p>
                          <input
                            type="range"
                            min={1}
                            max={crit.maxScore || 5}
                            step={1}
                            value={currentVal}
                            onChange={(e) => setSimScores({ ...simScores, [crit.id]: Number(e.target.value) })}
                            style={{ width: '100%', cursor: 'pointer' }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      Constructive Note / Key Strength (Optional):
                    </label>
                    <textarea
                      rows={2}
                      className="form-input"
                      value={simFeedback}
                      onChange={(e) => setSimFeedback(e.target.value)}
                      placeholder="e.g. Excellent slide visuals and very clear technical breakdown."
                      style={{ fontSize: '0.78rem', padding: '0.5rem 0.75rem', borderRadius: '8px', resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontWeight: 700, padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <CheckCircle2 size={15} /> Submit Live Audience Score
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: LEADERBOARD ACROSS ALL PRESENTING TEAMS */}
          {activeTab === 'leaderboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Classroom Presentation Leaderboard
                  </h4>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Real-time rankings based on peer and audience evaluations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.35rem', fontWeight: 700 }}
                >
                  <Download size={13} /> Export Leaderboard CSV
                </button>
              </div>

              {/* Leaderboard Table */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-surface)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '0.65rem 0.85rem', width: '60px' }}>Rank</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Team</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Audience Votes</th>
                      {criteria.map(c => (
                        <th key={c.id} style={{ padding: '0.65rem 0.85rem' }}>{c.name.split(' ')[0]}</th>
                      ))}
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Overall Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((item, idx) => {
                      const isCurrent = item.teamName === activeTeam;
                      return (
                        <tr
                          key={item.teamName}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: isCurrent ? 'rgba(13, 148, 136, 0.05)' : 'transparent',
                            fontWeight: isCurrent ? 700 : 500
                          }}
                        >
                          <td style={{ padding: '0.65rem 0.85rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                backgroundColor: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--bg-app)',
                                color: idx < 3 ? '#ffffff' : 'var(--text-secondary)'
                              }}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.teamName}</span>
                              {isCurrent && <span className="badge badge-teal" style={{ fontSize: '0.65rem' }}>Active</span>}
                            </div>
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', color: 'var(--text-secondary)' }}>
                            {item.voteCount} reviews
                          </td>
                          {criteria.map(c => (
                            <td key={c.id} style={{ padding: '0.65rem 0.85rem', color: 'var(--text-primary)' }}>
                              {item.criteriaScores[c.id] !== undefined ? `${item.criteriaScores[c.id]} / 5` : '--'}
                            </td>
                          ))}
                          <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                color: item.overallScore >= 80 ? 'var(--accent-teal, #0d9488)' : item.overallScore > 0 ? 'var(--primary)' : 'var(--text-muted)'
                              }}
                            >
                              {item.voteCount > 0 ? `${item.overallScore}%` : '--'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CRITERIA & WEIGHTS CONFIGURATION */}
          {activeTab === 'criteria' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '750px', margin: '0 auto' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Custom Presentation Rubric Criteria
                </h4>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Customize the presentation rubric dimensions, descriptions, and weights.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {criteria.map((crit, idx) => (
                  <div
                    key={crit.id}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={crit.name}
                        onChange={(e) => {
                          const updated = [...criteria];
                          updated[idx].name = e.target.value;
                          setCriteria(updated);
                        }}
                        placeholder="Criterion Title"
                        style={{ flex: 1, fontSize: '0.78rem', fontWeight: 700 }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', width: '110px' }}>
                        <input
                          type="number"
                          className="form-input"
                          value={crit.weight}
                          onChange={(e) => {
                            const updated = [...criteria];
                            updated[idx].weight = Number(e.target.value);
                            setCriteria(updated);
                          }}
                          style={{ width: '60px', fontSize: '0.78rem', textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>% weight</span>
                      </div>
                      {criteria.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = criteria.filter((_, i) => i !== idx);
                            setCriteria(updated);
                          }}
                          className="btn btn-icon btn-secondary btn-sm"
                          title="Remove Criterion"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      value={crit.description}
                      onChange={(e) => {
                        const updated = [...criteria];
                        updated[idx].description = e.target.value;
                        setCriteria(updated);
                      }}
                      placeholder="Behavioral Guidance / Description"
                      style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const newId = `crit_${Date.now()}`;
                    setCriteria([...criteria, { id: newId, name: 'New Criterion', description: 'Evaluation guidance', weight: 20, maxScore: 5 }]);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.35rem', fontWeight: 700 }}
                >
                  <Plus size={13} /> Add Criterion
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCriteria(DEFAULT_PRESENTATION_CRITERIA);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.35rem' }}
                >
                  <RefreshCw size={12} /> Reset to Defaults
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-app)'
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Total Class Presentation Reviews: <strong>{submissions.length}</strong>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                handleSaveAndSync();
                onClose();
              }}
              style={{ fontWeight: 700, padding: '0.35rem 0.85rem' }}
            >
              Done &amp; Save Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePresentationScoringModal;
