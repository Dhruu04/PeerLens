import React, { useState, useMemo } from 'react';
import {
  Activity,
  Star,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Send,
  Users,
  Frown,
  Meh,
  Smile,
  Flame,
  Sparkles
} from 'lucide-react';
import type { ClassData, PulseRound, PulseScaleType, PulseResponse } from '../utils/math';
import { PULSE_SCALE_PRESETS } from '../utils/math';
import Modal from './Modal';

interface StudentPulseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClass: ClassData;
  activeRound: PulseRound;
  preselectedStudentId?: string;
  onSubmitResponse: (roundId: string, response: Omit<PulseResponse, 'id' | 'submittedAt'>) => void;
}

export const StudentPulseModal: React.FC<StudentPulseModalProps> = ({
  isOpen,
  onClose,
  activeClass,
  activeRound,
  preselectedStudentId,
  onSubmitResponse
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudentId || (activeClass.students[0]?.id ?? '')
  );
  const [moraleScore, setMoraleScore] = useState<number>(3);
  const [status, setStatus] = useState<'on_track' | 'minor_roadblock' | 'blocked'>('on_track');
  const [blockerNote, setBlockerNote] = useState<string>('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const selectedStudent = useMemo(() => {
    return activeClass.students.find(s => s.id === selectedStudentId) || activeClass.students[0] || null;
  }, [activeClass.students, selectedStudentId]);

  const scaleType: PulseScaleType = activeRound.config?.scaleType || 'stars_5';
  const scalePreset = PULSE_SCALE_PRESETS[scaleType] || PULSE_SCALE_PRESETS.stars_5;
  const options = activeRound.config?.scaleOptions || scalePreset.options;

  const renderScaleIcon = (iconName?: string, isSelected?: boolean, color?: string) => {
    const size = 22;
    const style = { color: isSelected ? color || 'var(--primary)' : 'var(--text-secondary)' };
    switch (iconName) {
      case 'alert-circle':
        return <AlertCircle size={size} style={style} />;
      case 'alert-triangle':
        return <AlertTriangle size={size} style={style} />;
      case 'check-circle':
        return <CheckCircle2 size={size} style={style} />;
      case 'sparkles':
        return <Sparkles size={size} style={style} />;
      case 'frown':
        return <Frown size={24} style={style} />;
      case 'meh':
        return <Meh size={24} style={style} />;
      case 'smile':
        return <Smile size={24} style={style} />;
      case 'flame':
        return <Flame size={24} style={style} />;
      case 'star':
        return <Star size={size} style={{ ...style, fill: isSelected ? color || '#f59e0b' : 'transparent' }} />;
      default:
        return <Activity size={size} style={style} />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    onSubmitResponse(activeRound.id, {
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      groupName: selectedStudent.groupName,
      moraleScore,
      scaleType,
      status,
      blockerNote: blockerNote.trim() ? blockerNote.trim() : undefined,
      customAnswers: Object.keys(customAnswers).length > 0 ? customAnswers : undefined
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1600);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="560px">
      <div style={{ padding: '0.5rem 0.25rem' }}>
        {/* Header Ribbon */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                color: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Activity size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {activeRound.title}
                </h3>
                <span className="badge badge-teal" style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  30s Pulse
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {activeClass.name} · Quick, frictionless team health check-in
              </p>
            </div>
          </div>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
              Pulse Recorded!
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Thanks for checking in! Your response helps ensure your team stays on track.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Step 1: Student Identity */}
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Select Your Name / Team
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="form-input"
                    style={{ height: '38px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    {activeClass.students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.groupName || 'Unassigned'})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedStudent && (
                  <span className="badge badge-secondary" style={{ height: '38px', padding: '0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                    <Users size={13} /> {selectedStudent.groupName}
                  </span>
                )}
              </div>
            </div>

            {/* Step 2: Scale-specific Morale / Communication Input */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  1. {activeRound.config?.moralePrompt || 'Team Morale & Communication'}
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {scalePreset.title}
                </span>
              </div>

              {/* 5-STAR RATING */}
              {scaleType === 'stars_5' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 0' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isFilled = starVal <= moraleScore;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setMoraleScore(starVal)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.35rem',
                            transition: 'transform 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                          title={`Rate ${starVal} Star${starVal > 1 ? 's' : ''}`}
                        >
                          <Star
                            size={32}
                            style={{
                              fill: isFilled ? '#f59e0b' : 'transparent',
                              color: isFilled ? '#f59e0b' : 'var(--border-color)',
                              strokeWidth: 2
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: options[moraleScore - 1]?.color || '#f59e0b' }}>
                    {options[moraleScore - 1]?.label || `${moraleScore} Stars`}
                  </div>
                </div>
              )}

              {/* LIKERT 5-POINT AGREEMENT SCALE */}
              {scaleType === 'likert_5' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {options.map((opt) => {
                    const isSelected = moraleScore === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMoraleScore(opt.value)}
                        style={{
                          padding: '0.65rem 0.35rem',
                          borderRadius: '8px',
                          border: `1.5px solid ${isSelected ? opt.color : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? `${opt.color}15` : 'var(--bg-app)',
                          color: isSelected ? opt.color : 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '1.05rem', fontWeight: 900 }}>{opt.value}</span>
                        <span style={{ fontSize: '0.66rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.15 }}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* RAG TRAFFIC LIGHT STATUS */}
              {scaleType === 'traffic_rag' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {options.map((opt) => {
                    const isSelected = moraleScore === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMoraleScore(opt.value)}
                        style={{
                          padding: '0.75rem 0.5rem',
                          borderRadius: '10px',
                          border: `2px solid ${isSelected ? opt.color : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? `${opt.color}18` : 'var(--bg-app)',
                          color: isSelected ? opt.color : 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {renderScaleIcon(opt.iconName, isSelected, opt.color)}
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, textAlign: 'center' }}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* SENTIMENT PULSE ICONS */}
              {scaleType === 'emoji_sentiment' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {options.map((opt) => {
                    const isSelected = moraleScore === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMoraleScore(opt.value)}
                        style={{
                          padding: '0.85rem 0.4rem',
                          borderRadius: '12px',
                          border: `2px solid ${isSelected ? opt.color : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? `${opt.color}18` : 'var(--bg-app)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        {renderScaleIcon(opt.iconName, isSelected, opt.color)}
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isSelected ? opt.color : 'var(--text-primary)', textAlign: 'center' }}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 1-10 VELOCITY SLIDER */}
              {scaleType === 'slider_10' && (
                <div style={{ padding: '0.5rem 0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>1 (Low Momentum)</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>{moraleScore} / 10</span>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>10 (Peak Velocity)</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={moraleScore}
                    onChange={(e) => setMoraleScore(Number(e.target.value))}
                    style={{ width: '100%', height: '8px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <span key={n} style={{ fontWeight: n === moraleScore ? 800 : 500, color: n === moraleScore ? 'var(--primary)' : 'inherit' }}>{n}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Milestone Progress & Roadblock Status */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                2. {activeRound.config?.progressPrompt || 'Is your team on track for this milestone?'}
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStatus('on_track')}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '9px',
                    border: `2px solid ${status === 'on_track' ? '#10b981' : 'var(--border-color)'}`,
                    backgroundColor: status === 'on_track' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-app)',
                    color: status === 'on_track' ? '#059669' : 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontWeight: 700,
                    fontSize: '0.78rem'
                  }}
                >
                  <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                  <span>On Track</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>No issues</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('minor_roadblock')}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '9px',
                    border: `2px solid ${status === 'minor_roadblock' ? '#f59e0b' : 'var(--border-color)'}`,
                    backgroundColor: status === 'minor_roadblock' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-app)',
                    color: status === 'minor_roadblock' ? '#d97706' : 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontWeight: 700,
                    fontSize: '0.78rem'
                  }}
                >
                  <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                  <span>Minor Roadblock</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>Needs sync</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('blocked')}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '9px',
                    border: `2px solid ${status === 'blocked' ? '#ef4444' : 'var(--border-color)'}`,
                    backgroundColor: status === 'blocked' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-app)',
                    color: status === 'blocked' ? '#dc2626' : 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontWeight: 700,
                    fontSize: '0.78rem'
                  }}
                >
                  <AlertCircle size={18} style={{ color: '#ef4444' }} />
                  <span>Blocked</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>Need help</span>
                </button>
              </div>
            </div>

            {/* Custom Questions Added by Professor */}
            {activeRound.config?.customQuestions && activeRound.config.customQuestions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {activeRound.config.customQuestions.map((q, idx) => (
                  <div key={q.id} style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      {idx + 3}. {q.title} {q.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>

                    {q.type === 'scale' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map((val) => {
                          const isSel = customAnswers[q.id] === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setCustomAnswers(prev => ({ ...prev, [q.id]: val }))}
                              style={{
                                flex: 1,
                                height: '36px',
                                borderRadius: '8px',
                                border: `1.5px solid ${isSel ? 'var(--primary)' : 'var(--border-color)'}`,
                                backgroundColor: isSel ? 'var(--primary-light)' : 'var(--bg-app)',
                                color: isSel ? 'var(--primary)' : 'var(--text-primary)',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'choice' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {(q.options || ['Yes', 'Partially', 'No']).map((opt) => {
                          const isSel = customAnswers[q.id] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setCustomAnswers(prev => ({ ...prev, [q.id]: opt }))}
                              style={{
                                padding: '0.55rem 0.75rem',
                                borderRadius: '8px',
                                border: `1.5px solid ${isSel ? 'var(--primary)' : 'var(--border-color)'}`,
                                backgroundColor: isSel ? 'var(--primary-light)' : 'var(--bg-app)',
                                color: isSel ? 'var(--primary)' : 'var(--text-primary)',
                                fontWeight: isSel ? 700 : 500,
                                fontSize: '0.8rem',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <span>{opt}</span>
                              {isSel && <CheckCircle2 size={14} style={{ color: 'var(--primary)' }} />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'text' && (
                      <input
                        type="text"
                        value={(customAnswers[q.id] as string) || ''}
                        onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Your answer..."
                        className="form-input"
                        style={{ height: '36px', fontSize: '0.82rem' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: Optional 1-line Blocker Note */}
            {activeRound.config?.allowBlockerNotes !== false && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  {activeRound.config?.notePrompt || 'Describe any blockers or dependencies (optional)'}
                </label>
                <input
                  type="text"
                  value={blockerNote}
                  onChange={(e) => setBlockerNote(e.target.value)}
                  placeholder="e.g. Waiting on API credentials, or teammates haven't replied to group chat..."
                  className="form-input"
                  style={{ height: '38px', fontSize: '0.82rem' }}
                />
              </div>
            )}

            {/* Submission Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{ fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-teal"
                style={{ fontSize: '0.82rem', fontWeight: 800, gap: '0.4rem', padding: '0 1.25rem' }}
              >
                <Send size={14} /> Submit 30-Second Pulse
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
