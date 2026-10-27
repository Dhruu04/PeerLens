export interface GradingScaleField {
  id: string;
  name: string;
  min: number;
  max: number;
  weight: number; // For future-proofing weighting, defaults to 1
  description?: string; // Guidance / behavioral indicator for reviewers
}

export interface StudentProfileAuditLog {
  timestamp: string;
  field: string;
  from: string;
  to: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  groupName: string;
  submitted: boolean;
  university?: string;
  degree?: string;
  studentType?: string; // 'Normal' | 'Erasmus' | 'Exchange' | 'International' | etc.
  gender?: string;
  nationality?: string;
  englishProficiency?: string;
  isInternational?: boolean;
  isExchange?: boolean;
  currentCountry?: string;
  currentUniversity?: string;
  originalCountry?: string;
  originalUniversity?: string;
  // Academic status & exemption fields
  isExcused?: boolean; // Medical or approved extenuating circumstance exemption
  excusedReason?: string; // Reason description (e.g. "Medical Leave", "Approved Deferral")
  excusedAt?: number; // Timestamp of when exemption was granted
  // Discreet audit & identity provenance fields
  originalName?: string;
  originalEmail?: string;
  editHistory?: StudentProfileAuditLog[];
  nameChangeCount?: number;
  lastProfileEditAt?: number;
  flaggedForReview?: boolean;
  suspiciousReason?: string | null;
  customFields?: Record<string, string | number | boolean>;
  role?: string; // Assigned team charter role (e.g. "Tech Specialist", "Project Lead")
  roleDetails?: string; // Specific responsibility note or charter agreement
}

/**
 * Normalizes nationality string for consistent grouping and comparison (case-insensitive).
 */
export function normalizeNationality(nationality?: string): string {
  if (!nationality || !nationality.trim()) return '';
  const trimmed = nationality.trim();
  // Capitalize first letter of each word for clean display while preserving case-insensitive value
  return trimmed
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export interface Review {
  reviewerId: string;
  recipientId: string;
  scores: Record<string, number>; // fieldId -> score
  praiseTags?: string[];
  strengthsText?: string;
  growthText?: string;
}

export interface Milestone {
  id: string;
  name: string;
  date: string;
  reviews: Review[];
}

export interface EvaluationFormControls {
  allowSelfReview?: boolean; // Toggle "Self review"
  showGrowthSuggestions?: boolean; // Toggle "What is one constructive suggestion for their improvement?"
  showPraiseTags?: boolean; // Toggle "Strengths & Praise Tags"
  showStrengthsFeedback?: boolean; // Toggle "What are this teammate's primary strengths?"
  showRoleSelection?: boolean; // Toggle "Team Role Selection" on student dashboard
  showIcebreaker?: boolean; // Toggle "Team Kickoff Icebreaker" on student dashboard
  allowProfileEditing?: boolean; // Toggle if students can edit their profile info or not
  unlockMainPeerReview?: boolean; // Toggle whether main peer review round is unlocked & accessible for students
}

export const DEFAULT_EVALUATION_CONTROLS: Required<EvaluationFormControls> = {
  allowSelfReview: false,
  showGrowthSuggestions: false,
  showPraiseTags: false,
  showStrengthsFeedback: false,
  showRoleSelection: false,
  showIcebreaker: false,
  allowProfileEditing: false,
  unlockMainPeerReview: true
};

export function getEvaluationControls(classData?: ClassData | null): Required<EvaluationFormControls> {
  const ec = classData?.evaluationControls;
  return {
    allowSelfReview: ec?.allowSelfReview === true,
    showGrowthSuggestions: ec?.showGrowthSuggestions === true,
    showPraiseTags: ec?.showPraiseTags === true,
    showStrengthsFeedback: ec?.showStrengthsFeedback === true,
    showRoleSelection: ec?.showRoleSelection === true,
    showIcebreaker: ec?.showIcebreaker === true,
    allowProfileEditing: ec?.allowProfileEditing === true,
    unlockMainPeerReview: ec?.unlockMainPeerReview !== false
  };
}

export type PulseScaleType = 'stars_5' | 'likert_5' | 'slider_10' | 'traffic_rag' | 'emoji_sentiment';

export interface PulseCustomQuestion {
  id: string;
  title: string;
  type: 'scale' | 'choice' | 'text';
  options?: string[];
  required?: boolean;
}

export interface PulseScaleOption {
  value: number;
  label: string;
  iconName?: string; // 'star' | 'frown' | 'meh' | 'smile' | 'flame' | 'alert-circle' | 'alert-triangle' | 'check-circle' | 'sparkles'
  color?: string;
}

export interface PulseConfig {
  scaleType: PulseScaleType;
  moralePrompt: string;
  progressPrompt: string;
  notePrompt: string;
  allowBlockerNotes: boolean;
  scaleOptions?: PulseScaleOption[];
  customQuestions?: PulseCustomQuestion[];
}

export interface PulseResponse {
  id: string;
  studentId: string;
  studentName: string;
  groupName: string;
  moraleScore: number;
  scaleType: PulseScaleType;
  status: 'on_track' | 'minor_roadblock' | 'blocked';
  blockerNote?: string;
  customAnswers?: Record<string, string | number>;
  submittedAt: string;
}

export interface PulseRound {
  id: string;
  title: string;
  createdAt: string;
  status: 'active' | 'closed';
  config: PulseConfig;
  responses: PulseResponse[];
}

export const DEFAULT_PULSE_CONFIG: PulseConfig = {
  scaleType: 'stars_5',
  moralePrompt: 'Team Morale & Communication',
  progressPrompt: 'Is your team on track for this milestone?',
  notePrompt: 'Describe any blockers or dependencies (optional)',
  allowBlockerNotes: true,
  scaleOptions: [
    { value: 1, label: 'Struggling / Silent', iconName: 'star', color: '#ef4444' },
    { value: 2, label: 'Disconnected', iconName: 'star', color: '#f59e0b' },
    { value: 3, label: 'Functional / Steady', iconName: 'star', color: '#3b82f6' },
    { value: 4, label: 'Strong Alignment', iconName: 'star', color: '#10b981' },
    { value: 5, label: 'Exceptional Velocity', iconName: 'star', color: '#8b5cf6' }
  ],
  customQuestions: []
};

export const PULSE_SCALE_PRESETS: Record<PulseScaleType, { title: string; description: string; options: PulseScaleOption[]; promptDefault: string }> = {
  stars_5: {
    title: '5-Star Quality Rating',
    description: 'Universal 1-5 star scale for team morale, synergy, and active communication.',
    promptDefault: 'Team Morale & Communication',
    options: [
      { value: 1, label: 'Struggling / Silent', iconName: 'star', color: '#ef4444' },
      { value: 2, label: 'Disconnected', iconName: 'star', color: '#f59e0b' },
      { value: 3, label: 'Functional / Steady', iconName: 'star', color: '#3b82f6' },
      { value: 4, label: 'Strong Alignment', iconName: 'star', color: '#10b981' },
      { value: 5, label: 'Exceptional Velocity', iconName: 'star', color: '#8b5cf6' }
    ]
  },
  likert_5: {
    title: '5-Point Likert Agreement Scale',
    description: 'Academic standard (Edmondson Team Psychological Safety) measuring consensus.',
    promptDefault: 'Our team is collaborating effectively and communicating with trust.',
    options: [
      { value: 1, label: 'Strongly Disagree', iconName: 'number', color: '#ef4444' },
      { value: 2, label: 'Disagree', iconName: 'number', color: '#f97316' },
      { value: 3, label: 'Neutral / Undecided', iconName: 'number', color: '#6b7280' },
      { value: 4, label: 'Agree', iconName: 'number', color: '#10b981' },
      { value: 5, label: 'Strongly Agree', iconName: 'number', color: '#059669' }
    ]
  },
  traffic_rag: {
    title: 'RAG Traffic Light (Red / Amber / Green)',
    description: 'Executive project management delivery status for rapid escalation.',
    promptDefault: 'Current Sprint Health & Delivery Risk',
    options: [
      { value: 1, label: 'Red (Critical Risk / Off Track)', iconName: 'alert-circle', color: '#ef4444' },
      { value: 2, label: 'Amber (At Risk / Needs Help)', iconName: 'alert-triangle', color: '#f59e0b' },
      { value: 3, label: 'Green (On Track / Normal)', iconName: 'check-circle', color: '#10b981' },
      { value: 4, label: 'Blue (Exceeding Expectations)', iconName: 'sparkles', color: '#3b82f6' }
    ]
  },
  emoji_sentiment: {
    title: 'Sentiment Pulse Icons',
    description: 'Low-friction emotional pulse check ideal for fast mobile standup check-ins.',
    promptDefault: 'How do you feel about working with your team right now?',
    options: [
      { value: 1, label: 'Burned Out / Frustrated', iconName: 'frown', color: '#ef4444' },
      { value: 2, label: 'Anxious / Confused', iconName: 'meh', color: '#f59e0b' },
      { value: 3, label: 'Steady & Good', iconName: 'smile', color: '#10b981' },
      { value: 4, label: 'Energized & Thriving', iconName: 'flame', color: '#8b5cf6' }
    ]
  },
  slider_10: {
    title: '1-to-10 Velocity Continuum Slider',
    description: 'Fine-grained numerical slider for tracking quantitative team momentum.',
    promptDefault: 'Team Momentum & Synergy Rating (1-10)',
    options: Array.from({ length: 10 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}/10`,
      iconName: 'number',
      color: i < 3 ? '#ef4444' : i < 6 ? '#f59e0b' : i < 8 ? '#10b981' : '#6366f1'
    }))
  }
};

export interface PresentationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // e.g. 25 (%)
  maxScore: number; // default 5
}

export interface PresentationScoreSubmission {
  id: string;
  teamName: string;
  voterName?: string;
  scores: Record<string, number>; // criterionId -> score (1-5)
  constructiveFeedback?: string;
  timestamp: number;
}

export interface PresentationDaySession {
  activeTeamName: string;
  criteria: PresentationCriterion[];
  submissions: PresentationScoreSubmission[];
  timerDurationSeconds: number;
  isOpenForVoting: boolean;
}

export interface TeamCharterRole {
  id: string;
  title: string;
  iconName?: string; // Lucide icon identifier
  color: string;
  description: string;
  responsibilities: string[];
}

export const DEFAULT_TEAM_ROLES: TeamCharterRole[] = [
  {
    id: 'role_lead',
    title: 'Project Lead',
    color: '#3b82f6',
    description: 'Coordinates sprint deliverables, milestone tracking, and task delegation.',
    responsibilities: ['Sprint planning', 'Milestone tracking', 'Team check-ins']
  },
  {
    id: 'role_tech',
    title: 'Technical Specialist',
    color: '#0d9488',
    description: 'Oversees technical architecture, data structures, and implementation quality.',
    responsibilities: ['System schema', 'Quality reviews', 'Technical execution']
  },
  {
    id: 'role_scribe',
    title: 'Scribe & Documentarian',
    color: '#f59e0b',
    description: 'Maintains meeting notes, project documentation, and submission deliverables.',
    responsibilities: ['Meeting notes', 'Project documentation', 'Deliverable writeup']
  },
  {
    id: 'role_presenter',
    title: 'Pitch & Presentation Lead',
    color: '#ec4899',
    description: 'Prepares slide deck, visual storyline, and leads the final oral presentation.',
    responsibilities: ['Slide design', 'Presentation narrative', 'Q&A leadership']
  },
  {
    id: 'role_qa',
    title: 'Quality & Research Auditor',
    color: '#8b5cf6',
    description: 'Validates research findings, checks rubric alignment, and tests edge cases.',
    responsibilities: ['Rubric validation', 'Fact checking', 'Edge-case testing']
  }
];

export interface CustomIcebreakerTask {
  id: string;
  title: string;
  duration: string;
  prompt: string;
  outcome: string;
}

export const DEFAULT_CUSTOM_ICEBREAKERS: CustomIcebreakerTask[] = [
  {
    id: 'ice_multicultural',
    title: 'Cross-Cultural Passport & Working Style',
    duration: '5 Minutes',
    prompt: 'Each member shares: (1) One cultural tradition, local custom, or favorite comfort dish from their home culture, and (2) Their preferred style of giving and receiving constructive peer feedback.',
    outcome: 'Builds cross-cultural empathy, bridges communication differences, and creates psychological safety.'
  },
  {
    id: 'ice_superpowers',
    title: 'Personal Superpower & Team "Anti-Goal"',
    duration: '5 Minutes',
    prompt: 'Each member shares 1 unique personal strength or latent superpower they bring to this project, plus 1 "Anti-Goal" (the single biggest pitfall this team must avoid this semester).',
    outcome: 'Clarifies individual strengths and aligns expectations on project quality and team accountability.'
  },
  {
    id: 'ice_problem_framing',
    title: 'Vision Alignment & "A+ Outcome" Definition',
    duration: '5 Minutes',
    prompt: 'Each student writes down what an "A+ grade project" looks like in their own words, then the team collaboratively synthesizes a unified 1-sentence team mission statement.',
    outcome: 'Aligns the entire group around shared high standards and clear project ambitions.'
  }
];

export interface TeamCharterConfig {
  selectedRoleIds: string[];
  customRoles?: TeamCharterRole[];
  icebreakerTopic?: 'multicultural' | 'working_norms' | 'superpower' | 'problem_framing' | 'fun_trivia';
  selectedIcebreakerId?: string;
  customIcebreakers?: CustomIcebreakerTask[];
  teamNorms: string[];
}

export const DEFAULT_PRESENTATION_CRITERIA: PresentationCriterion[] = [
  { id: 'pres_clarity', name: 'Delivery & Communication Clarity', description: 'Articulation, vocal pacing, eye contact, and audience engagement.', weight: 25, maxScore: 5 },
  { id: 'pres_visuals', name: 'Slide Deck & Visual Structure', description: 'Clear hierarchy, impactful visuals, data graphs, and clean slide design.', weight: 25, maxScore: 5 },
  { id: 'pres_technical', name: 'Technical Depth & Evidence', description: 'Substantive methodology, thorough analysis, rigor, and factual defense.', weight: 25, maxScore: 5 },
  { id: 'pres_qa', name: 'Q&A Defense & Time Mastery', description: 'Poise, mastery of unexpected questions, and respecting the time limit.', weight: 25, maxScore: 5 }
];

export type EnrollmentFieldType = 'text' | 'dropdown' | 'boolean' | 'number';

export interface CustomEnrollmentField {
  id: string;
  label: string;
  type: EnrollmentFieldType;
  description?: string;
  placeholder?: string;
  options?: string[]; // for dropdown type
  required?: boolean;
  includeInGrouping?: boolean; // include in team distribution / auto-grouping
  defaultValue?: string | number | boolean;
  checkboxLabel?: string; // custom confirmation/agreement statement for checkbox type
  min?: number; // optional lower bound for numeric fields
  max?: number; // optional upper bound for numeric fields
  step?: number; // optional step increment for numeric fields
}

export const DEFAULT_ENROLLMENT_FIELDS: CustomEnrollmentField[] = [
  {
    id: 'name',
    label: 'Full Student Name',
    type: 'text',
    placeholder: 'e.g. Alice Johnson',
    required: true,
    includeInGrouping: false,
    description: 'Student primary legal or preferred name'
  },
  {
    id: 'email',
    label: 'Institutional Email',
    type: 'text',
    placeholder: 'e.g. alice@university.edu',
    required: true,
    includeInGrouping: false,
    description: 'Official university or school email for sign-in'
  },
  {
    id: 'gender',
    label: 'Gender Identity',
    type: 'dropdown',
    options: ['Female', 'Male', 'Non-binary', 'Prefer not to say'],
    required: true,
    includeInGrouping: true,
    description: 'Used for balanced gender representation across teams'
  },
  {
    id: 'degree',
    label: 'Degree / Field of Study',
    type: 'text',
    placeholder: 'e.g. Computer Science, Mechanical Engineering, MBA',
    required: true,
    includeInGrouping: false,
    description: 'Academic background or current major'
  },
  {
    id: 'englishProficiency',
    label: 'CEFR English Proficiency',
    type: 'dropdown',
    options: ['Native Speaker', 'Fluent (C1/C2)', 'Intermediate (B1/B2)', 'Basic (A1/A2)'],
    required: true,
    includeInGrouping: true,
    description: 'Used to equalize language capability across groups'
  },
  {
    id: 'nationality',
    label: 'Country of Origin / Nationality',
    type: 'text',
    placeholder: 'e.g. Germany, Spain, Japan',
    required: true,
    includeInGrouping: true,
    description: 'Home citizenship or culture for diversity'
  },
  {
    id: 'currentCountry',
    label: 'Current Residence / Study Country',
    type: 'text',
    placeholder: 'e.g. Italy, Germany',
    required: false,
    includeInGrouping: false,
    description: 'Current host or residing country'
  },
  {
    id: 'university',
    label: 'University / Institution',
    type: 'text',
    placeholder: 'e.g. Stanford University, TU Munich',
    required: true,
    includeInGrouping: false,
    description: 'Home or host educational institution'
  },
  {
    id: 'isInternational',
    label: 'International Student Status',
    type: 'boolean',
    checkboxLabel: 'Yes, I am an International Student (studying abroad from home country)',
    required: false,
    includeInGrouping: true,
    description: 'Identifies students studying outside their home country to balance international representation'
  },
  {
    id: 'isExchange',
    label: 'Exchange / Erasmus Student',
    type: 'boolean',
    checkboxLabel: 'Yes, I am currently an Exchange or Erasmus student',
    required: false,
    includeInGrouping: true,
    description: 'Helps balance international exchange participants'
  }
];

export const STANDARD_ENROLLMENT_FIELD_IDS = new Set<string>([
  ...DEFAULT_ENROLLMENT_FIELDS.map(f => f.id),
  'id',
  'groupName',
  'university',
  'originalUniversity',
  'originalCountry',
  'currentUniversity',
  'studentType'
]);

export const isStandardEnrollmentField = (fieldId: string): boolean => {
  if (!fieldId) return false;
  return STANDARD_ENROLLMENT_FIELD_IDS.has(fieldId.trim());
};

export type PeerAdjustmentMethodType = 
  | 'webpa'         // Loughborough WebPA (Default & Recommended)
  | 'goldfinch'     // Kaufman & Goldfinch (Tolerance Band PAF)
  | 'johnston'      // Johnston Additive Point Redistribution
  | 'spark'         // SPARK / UTS Self & Peer Assessment
  | 'clamped'       // Safety Net Guardrail (Floor & Ceiling)
  | 'hybrid';       // Syllabus Hybrid (e.g. 70% Base / 30% Peer)

export interface PeerAdjustmentConfig {
  method: PeerAdjustmentMethodType;
  fudgeWeight: number;          // Sensitivity / Impact factor: 0.0 to 1.0 (default 1.0 for true WebPA)
  nonSubmitterPenalty: number;  // Percentage penalty deduction for non-submitters (default 10)
  penalizeNonSubmitters: boolean; // default true
  capAtMaxGrade: boolean;       // whether final grade is capped at max possible grade (default true)
  maxGradeCap?: number;         // default 100
  allowBonusAboveBase: boolean; // default true: deserving students can exceed team base mark!
  deadbandThreshold?: number;   // for Goldfinch: default 0.05 (±5%)
  johnstonSensitivity?: number; // for Johnston: default 1.0
  minClamp?: number;            // for Clamped: default 0.75
  maxClamp?: number;            // for Clamped: default 1.25
  clampMin?: number;            // alias for minClamp
  clampMax?: number;            // alias for maxClamp
  baseWeight?: number;          // for Hybrid: default 0.70
  peerWeight?: number;          // for Hybrid: default 0.30
  hybridBaseWeight?: number;    // alias for baseWeight
  hybridPeerWeight?: number;    // alias for peerWeight
}

export const DEFAULT_PEER_ADJUSTMENT_CONFIG: PeerAdjustmentConfig = {
  method: 'webpa',
  fudgeWeight: 1.0,               // 100% peer adjustment by default!
  nonSubmitterPenalty: 10,        // 10% deduction if student didn't submit reviews
  penalizeNonSubmitters: true,
  capAtMaxGrade: true,
  maxGradeCap: 100,
  allowBonusAboveBase: true,      // Deserving students get more points!
  deadbandThreshold: 0.05,
  johnstonSensitivity: 1.0,
  minClamp: 0.75,
  maxClamp: 1.25,
  baseWeight: 0.70,
  peerWeight: 0.30
};

export interface ClassData {
  id: string;
  name: string;
  fields: GradingScaleField[];
  students: Student[];
  reviews: Review[];
  deadline?: string | null;
  milestones?: Milestone[];
  targetScale?: number | null;
  minTargetScale?: number | null;
  scaleMin?: number | null;
  scaleMax?: number | null;
  customScaleEnabled?: boolean;
  teamBaseGrades?: Record<string, number>;
  evaluationControls?: EvaluationFormControls;
  pulseRounds?: PulseRound[];
  presentationSession?: PresentationDaySession;
  teamCharterConfig?: TeamCharterConfig;
  enrollmentFormFields?: CustomEnrollmentField[];
  peerAdjustmentConfig?: PeerAdjustmentConfig;
  subPeerReviewRounds?: import('./subPeerReview').SubPeerReviewRound[];
  subPeerReviewManualOverrides?: Record<string, import('./subPeerReview').StudentSubReviewFlagStatus>;
  subPeerReviewConfig?: import('./subPeerReview').SubPeerReviewConfig;
}

/**
 * Resolves the team-specific base mark or falls back to the default base grade / class target scale.
 */
export function getTeamBaseGrade(classData: ClassData, groupName: string, defaultGrade?: number): number {
  if (classData?.teamBaseGrades && typeof classData.teamBaseGrades[groupName] === 'number') {
    return classData.teamBaseGrades[groupName];
  }
  const maxScore = getTargetScale(classData);
  if (typeof defaultGrade === 'number' && defaultGrade > 0 && (defaultGrade !== 100 || maxScore === 100)) {
    return defaultGrade;
  }
  return maxScore;
}

/**
 * Resolves the final grade scale to display scores out of.
 * - targetScale === 0: Represents the dynamic sum of all rubrics' maximums.
 * - targetScale === null/undefined: Defaults to 31.
 * - any positive number: Scales out of that custom value.
 */
export function getTargetScale(classData: ClassData): number {
  if (classData.targetScale === 0) {
    return classData.fields.reduce((acc, f) => acc + (f.max ?? 0), 0);
  }
  return classData.targetScale ?? 31;
}

/**
 * Resolves the minimum baseline score corresponding to scale 1 (defaults to 15).
 */
export function getMinTargetScale(classData: ClassData): number {
  return classData.minTargetScale ?? 15;
}

/**
 * Resolves the active rating scale and distributed points map.
 * By default: Scale 1 to 5 maps evenly from min score (15) to max score (31):
 * 1 -> 15, 2 -> 19, 3 -> 23, 4 -> 27, 5 -> 31
 * Custom scale is ONLY used when explicitly opted into (customScaleEnabled: true).
 */
export function getGradeScaleConfig(classData?: ClassData | null): {
  scaleMin: number;
  scaleMax: number;
  scoreMin: number;
  scoreMax: number;
  minTarget: number;
  maxTarget: number;
  stepScore: number;
  steps: Array<{ scaleValue: number; scoreValue: number }>;
  distribution: Array<{ scale: number; rating: number; score: number }>;
  customScaleEnabled: boolean;
} {
  const isCustom = classData?.customScaleEnabled === true;
  const scaleMin = isCustom ? (classData?.scaleMin ?? 1) : 1;
  const scaleMax = isCustom ? (classData?.scaleMax ?? 5) : 5;
  const scoreMin = classData ? getMinTargetScale(classData) : 15;
  const scoreMax = classData ? getTargetScale(classData) : 31;
  
  const stepCount = Math.max(1, scaleMax - scaleMin);
  const scoreRange = scoreMax - scoreMin;
  const rawStep = scoreRange / stepCount;
  const stepScore = Number.isInteger(rawStep) ? rawStep : Number(rawStep.toFixed(2));
  const steps: Array<{ scaleValue: number; scoreValue: number }> = [];
  const distribution: Array<{ scale: number; rating: number; score: number }> = [];

  for (let s = scaleMin; s <= scaleMax; s++) {
    let score: number;
    if (s === scaleMin) {
      score = scoreMin;
    } else if (s === scaleMax) {
      score = scoreMax;
    } else {
      const fraction = (s - scaleMin) / stepCount;
      const rawVal = scoreMin + fraction * scoreRange;
      score = Number.isInteger(rawVal) ? rawVal : Number(rawVal.toFixed(2));
    }
    steps.push({ scaleValue: s, scoreValue: score });
    distribution.push({ scale: s, rating: s, score });
  }

  return {
    scaleMin,
    scaleMax,
    scoreMin,
    scoreMax,
    minTarget: scoreMin,
    maxTarget: scoreMax,
    stepScore,
    steps,
    distribution,
    customScaleEnabled: isCustom
  };
}

export function scaleRatingToScore(rating: number, classData: ClassData): number {
  const { scaleMin, scaleMax, scoreMin, scoreMax } = getGradeScaleConfig(classData);
  if (scaleMax === scaleMin) return scoreMax;
  const clamped = Math.max(scaleMin, Math.min(scaleMax, rating));
  const fraction = (clamped - scaleMin) / (scaleMax - scaleMin);
  const raw = scoreMin + fraction * (scoreMax - scoreMin);
  return Number.isInteger(raw) ? raw : Number(raw.toFixed(2));
}

export function scoreToScaleRating(score: number, classData: ClassData): number {
  const { scaleMin, scaleMax, scoreMin, scoreMax } = getGradeScaleConfig(classData);
  if (scoreMax === scoreMin) return scaleMin;
  const fraction = (score - scoreMin) / (scoreMax - scoreMin);
  const rating = Math.round(scaleMin + fraction * (scaleMax - scaleMin));
  return Math.max(scaleMin, Math.min(scaleMax, rating));
}

export interface Anomaly {
  id: string;
  studentId: string;
  studentName: string;
  type: 'lazy' | 'outlier' | 'collusion';
  description: string;
  severity: 'low' | 'medium' | 'high';
}


/**
 * Calculates the self-excluded peer average for a single student in a specific field.
 * Formula: Sum of scores received from teammates / Number of teammates who graded them.
 */
export function calculateStudentFieldAverage(
  studentId: string,
  fieldId: string,
  reviews: Review[],
  teammateIds: string[]
): number | null {
  // Teammates are other members in the group (excluding the student themselves)
  const peerReviews = reviews.filter(
    (r) => r.recipientId === studentId && teammateIds.includes(r.reviewerId)
  );

  if (peerReviews.length === 0) return null;

  const sum = peerReviews.reduce((acc, r) => acc + (r.scores[fieldId] ?? 0), 0);
  return Number((sum / peerReviews.length).toFixed(2));
}

/**
 * Calculates standard deviation to measure consensus among team members.
 */
export function calculateStudentFieldStdDev(
  studentId: string,
  fieldId: string,
  reviews: Review[],
  teammateIds: string[]
): number | null {
  const peerReviews = reviews.filter(
    (r) => r.recipientId === studentId && teammateIds.includes(r.reviewerId)
  );

  if (peerReviews.length < 2) return null;

  const scores = peerReviews.map((r) => r.scores[fieldId] ?? 0);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  
  return Number(Math.sqrt(variance).toFixed(2));
}

/**
 * Gets a map of studentId -> list of teammates' IDs (excluding self)
 */
export function getTeammates(studentId: string, groupName: string, allStudents: Student[]): string[] {
  return allStudents
    .filter((s) => s.groupName === groupName && s.id !== studentId)
    .map((s) => s.id);
}

/**
 * Computes individual dashboard metrics for the student.
 * Returns overall average percentage, list of averages per field, and review count.
 */
export function calculateStudentMetrics(
  student: Student,
  classData: ClassData
) {
  const teammates = getTeammates(student.id, student.groupName, classData.students);
  const fieldAverages: Record<string, number | null> = {};
  const fieldStdDevs: Record<string, number | null> = {};
  
  let weightedScoreSum = 0;
  let totalWeightSum = 0;

  classData.fields.forEach((field) => {
    const avg = calculateStudentFieldAverage(student.id, field.id, classData.reviews, teammates);
    const stdDev = calculateStudentFieldStdDev(student.id, field.id, classData.reviews, teammates);
    
    fieldAverages[field.id] = avg;
    fieldStdDevs[field.id] = stdDev;

    if (avg !== null) {
      const fieldWeight = field.weight !== undefined && field.weight > 0 
        ? field.weight 
        : (100 / Math.max(1, classData.fields.length));
      
      let fieldPercentage = 0;
      if (classData.customScaleEnabled === true && field.max > field.min) {
        if (avg > field.max && classData.targetScale) {
          fieldPercentage = (avg / getTargetScale(classData)) * 100;
        } else {
          const fraction = (avg - field.min) / (field.max - field.min);
          const scoreMin = getMinTargetScale(classData);
          const scoreMax = getTargetScale(classData);
          const mappedScore = scoreMin + fraction * (scoreMax - scoreMin);
          fieldPercentage = scoreMax > 0 ? (mappedScore / scoreMax) * 100 : 0;
        }
      } else if (field.max > 0) {
        fieldPercentage = (avg / field.max) * 100;
      }

      weightedScoreSum += fieldPercentage * fieldWeight;
      totalWeightSum += fieldWeight;
    }
  });

  const overallPercentage = totalWeightSum > 0 
    ? Number((weightedScoreSum / totalWeightSum).toFixed(1)) 
    : null;

  // Count reviews received
  const reviewsReceived = classData.reviews.filter(
    (r) => r.recipientId === student.id && teammates.includes(r.reviewerId)
  ).length;

  // Expected reviews is number of teammates (max reviewers)
  const expectedReviewsCount = teammates.length;

  return {
    fieldAverages,
    fieldStdDevs,
    overallPercentage,
    reviewsReceived,
    expectedReviewsCount,
    gradeProgress: expectedReviewsCount > 0 ? Number(((reviewsReceived / expectedReviewsCount) * 100).toFixed(0)) : 0
  };
}

/**
 * Calculates global stats for a class
 */
export function calculateClassStats(classData: ClassData) {
  const totalStudents = classData.students.length;
  if (totalStudents === 0) {
    return {
      completionRate: 0,
      submittedCount: 0,
      totalStudents: 0,
      groupCount: 0,
      averagePercentage: 0
    };
  }

  const submittedCount = classData.students.filter((s) => s.submitted).length;
  const completionRate = Number(((submittedCount / totalStudents) * 100).toFixed(0));

  // Count unique groups
  const groups = new Set(classData.students.map((s) => s.groupName));
  const groupCount = groups.size;

  // Average percentage of all students
  const activeClassMetrics = classData.students.map((s) => calculateStudentMetrics(s, classData));
  const validPercentages = activeClassMetrics
    .map((m) => m.overallPercentage)
    .filter((p): p is number => p !== null);

  const averagePercentage = validPercentages.length > 0
    ? Number((validPercentages.reduce((a, b) => a + b, 0) / validPercentages.length).toFixed(1))
    : null;

  return {
    completionRate,
    submittedCount,
    totalStudents,
    groupCount,
    averagePercentage: averagePercentage ?? 0
  };
}

export interface PeerAdjustmentBreakdown {
  rawPeerPercentage: number;
  teamAveragePeerPercentage: number;
  normalizedReviewerScore: number;
  teamExpectedNormalizedScore: number;
  baseMultiplier: number;
  finalMultiplier: number;
  nonSubmitterDeduction: number;
  isNonSubmitter: boolean;
  unadjustedTeamBase: number;
  effectiveGrade: number;
  reviewsCount: number;
  teammatesCount: number;
}

export interface PeerAdjustmentResult {
  ratio: number;
  adjustedGrade: number;
  rawAdjustedGrade: number;
  isCapped: boolean;
  minScore: number;
  maxScore: number;
  isInsufficient: boolean;
  teamBaseGrade: number;
  isExcused?: boolean;
  rawRatio: number;
  penaltyApplied: number;
  method: PeerAdjustmentMethodType;
  methodName: string;
  explanation: string;
  breakdown: PeerAdjustmentBreakdown;
}

export interface PeerAdjustmentMethodMeta {
  id: PeerAdjustmentMethodType;
  name: string;
  shortLabel: string;
  badge: string;
  badgeClass: string;
  formula: string;
  academicOrigin: string;
  description: string;
  whyItsFair: string;
  handlingOfSlackers: string;
  handlingOfDeserving: string;
}

export const PEER_ADJUSTMENT_METHODS_META: Record<PeerAdjustmentMethodType, PeerAdjustmentMethodMeta> = {
  webpa: {
    id: 'webpa',
    name: 'Loughborough WebPA Algorithm',
    shortLabel: 'WebPA (Standard)',
    badge: 'Default & Recommended',
    badgeClass: 'badge-teal',
    formula: 'Adjusted Grade = Team Base × [(1 - W) + W × WebPA Ratio]',
    academicOrigin: 'Loughborough University (UK Higher Education Assessment Standard)',
    description: 'Normalizes each reviewer’s evaluations to eliminate leniency or harshness bias, then computes individual contribution ratios relative to team consensus.',
    whyItsFair: 'Deserving contributors receive marks scaled above the team base mark, while free-riders receive proportional deductions down to zero.',
    handlingOfSlackers: 'Students with zero peer ratings receive 0. Non-submitters are docked by the non-submission penalty (-10%) and capped at 1.00x.',
    handlingOfDeserving: 'Standout contributors scale up to 100% or extra-credit bonus according to their high contribution ratio.'
  },
  goldfinch: {
    id: 'goldfinch',
    name: 'Kaufman & Goldfinch Method',
    shortLabel: 'Goldfinch (Tolerance Band)',
    badge: '5% Deadband Protection',
    badgeClass: 'badge-indigo',
    formula: 'Adjusted Grade = Team Base × [(1 - W) + W × Goldfinch PAF]',
    academicOrigin: 'Kaufman, Felder, Fuller (2000) & Goldfinch (1994) - Engineering Education Standard',
    description: 'Incorporates a 5% tolerance band (0.95–1.05) to filter out petty grading variations, while aggressively rewarding high contributors and penalizing non-performers.',
    whyItsFair: 'Protects students from friendship bias and minor friction while ensuring significant contribution gaps are penalized or rewarded.',
    handlingOfSlackers: 'Under-performers below 0.95 are penalized proportionally. Non-submitters forfeit bonus scaling and receive penalty deductions.',
    handlingOfDeserving: 'Standout performers above 1.05 receive amplified bonus scaling rewarding genuine leadership.'
  },
  johnston: {
    id: 'johnston',
    name: 'Johnston Additive Redistribution',
    shortLabel: 'Johnston (Additive)',
    badge: 'Direct Point Transfer',
    badgeClass: 'badge-purple',
    formula: 'Adjusted Grade = Team Base + [(Student Peer % - Team Avg %) × Sensitivity × W]',
    academicOrigin: 'Johnston, S. (2001) - Additive Peer Assessment Model',
    description: 'Directly transfers marks from slackers to high performers. Points deducted from non-contributors are added to deserving teammates.',
    whyItsFair: 'Team grade average is mathematically invariant (zero-sum redistribution). Points lost by freeloaders directly reward hard workers.',
    handlingOfSlackers: 'Points below team average are subtracted from their grade. Non-submitters receive an additional penalty.',
    handlingOfDeserving: 'High performers receive the exact points forfeited by non-contributing teammates.'
  },
  spark: {
    id: 'spark',
    name: 'SPARK / UTS Self & Peer Assessment',
    shortLabel: 'SPARK (UTS)',
    badge: 'Self vs Peer Multiplier',
    badgeClass: 'badge-blue',
    formula: 'Adjusted Grade = Team Base × [(1 - W) + W × SPA Multiplier]',
    academicOrigin: 'Freeman & McKenzie (University of Technology Sydney)',
    description: 'Separates peer assessment (SPA) from self-assessment (SAPA) to assess both deliverable contribution and metacognitive self-awareness.',
    whyItsFair: 'Ensures objective peer review consensus drives grading while flagging students who over-rate or under-rate their work.',
    handlingOfSlackers: 'Low SPA directly decreases project mark. Non-evaluating students suffer non-submission penalties.',
    handlingOfDeserving: 'Earns higher SPA factor boosting the final grade above team mark.'
  },
  clamped: {
    id: 'clamped',
    name: 'Safety-Net Guardrail (Clamped WebPA)',
    shortLabel: 'Safety Net (Guardrail)',
    badge: 'Floor & Ceiling Clamped',
    badgeClass: 'badge-amber',
    formula: 'Adjusted Grade = Team Base × [(1 - W) + W × Clamp(WebPA, Min, Max)]',
    academicOrigin: 'Institutional Safety Net & Accreditations Guardrails',
    description: 'Applies hard minimum floor (0.75x) and maximum ceiling (1.25x) bounds to prevent runaway grading while still penalizing slackers.',
    whyItsFair: 'Prevents catastrophic failures from personality clashes while still rewarding high contributors and penalizing free-riders.',
    handlingOfSlackers: 'Drops to floor limit (e.g. 75% of base) with additional non-submitter deductions.',
    handlingOfDeserving: 'Scales up to ceiling limit (e.g. 125% of base).'
  },
  hybrid: {
    id: 'hybrid',
    name: 'Syllabus Hybrid (ABET / AACSB Split)',
    shortLabel: '70/30 Syllabus Hybrid',
    badge: 'Accreditation Split',
    badgeClass: 'badge-emerald',
    formula: 'Adjusted Grade = (Team Base × 70%) + (Team Base × WebPA × 30%)',
    academicOrigin: 'ABET & AACSB Institutional Syllabus Requirements',
    description: 'Guarantees a fixed percentage for the group deliverable (e.g. 70%), with peer review evaluating the individual contribution share (e.g. 30%).',
    whyItsFair: 'Complies with strict accreditation policies requiring shared team deliverable ownership while holding individuals accountable.',
    handlingOfSlackers: 'Free-riders forfeit the individual peer share (up to 30% of grade lost) plus non-submitter deductions.',
    handlingOfDeserving: 'High performers earn the maximum individual contribution share.'
  }
};

const PEER_ADJUSTMENT_CONFIG_PREFIX = 'peerlens_adjustment_config_v1_';

export function getPeerAdjustmentConfig(classData?: ClassData | null): PeerAdjustmentConfig {
  if (classData?.peerAdjustmentConfig) {
    return { ...DEFAULT_PEER_ADJUSTMENT_CONFIG, ...classData.peerAdjustmentConfig };
  }
  if (classData?.id) {
    try {
      const raw = localStorage.getItem(`${PEER_ADJUSTMENT_CONFIG_PREFIX}${classData.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_PEER_ADJUSTMENT_CONFIG, ...parsed };
        }
      }
    } catch {
      // fallback
    }
  }
  // Check global / legacy fudge weight if present
  try {
    const legacyWeight = localStorage.getItem('peer_fudge_weight');
    if (legacyWeight !== null && !isNaN(Number(legacyWeight))) {
      return { ...DEFAULT_PEER_ADJUSTMENT_CONFIG, fudgeWeight: Number(legacyWeight) };
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_PEER_ADJUSTMENT_CONFIG };
}

export function savePeerAdjustmentConfig(classId: string, config: PeerAdjustmentConfig): void {
  try {
    localStorage.setItem(`${PEER_ADJUSTMENT_CONFIG_PREFIX}${classId || 'default'}`, JSON.stringify(config));
    localStorage.setItem('peer_fudge_weight', String(config.fudgeWeight));
  } catch {
    // ignore
  }
}

/**
 * Calculates academic peer score adjustments using the selected methodology
 * (WebPA, Goldfinch, Johnston, SPARK, Clamped, or Hybrid).
 * Loughborough WebPA is the default standard.
 */
export function calculateStudentPeerAdjustment(
  studentId: string,
  groupName: string,
  classData: ClassData,
  baseGroupGrade?: number,
  configOverrides?: number | Partial<PeerAdjustmentConfig>
): PeerAdjustmentResult {
  const baseConfig = getPeerAdjustmentConfig(classData);
  const config: PeerAdjustmentConfig = typeof configOverrides === 'number'
    ? { ...baseConfig, fudgeWeight: configOverrides }
    : { ...baseConfig, ...configOverrides };

  const minScore = getMinTargetScale(classData);
  const maxScore = getTargetScale(classData);
  const effectiveBaseGrade = getTeamBaseGrade(classData, groupName, baseGroupGrade);
  const targetStudent = classData.students.find((s) => s.id === studentId);
  const meta = PEER_ADJUSTMENT_METHODS_META[config.method] || PEER_ADJUSTMENT_METHODS_META.webpa;

  // 1. If target student is explicitly excused, award neutral multiplier 1.00 and effective base grade
  if (targetStudent?.isExcused) {
    const rawGrade = Math.min(maxScore, effectiveBaseGrade);
    const isCapped = effectiveBaseGrade > maxScore;
    const isInsufficient = rawGrade < minScore;
    return {
      ratio: 1.0,
      adjustedGrade: rawGrade,
      rawAdjustedGrade: effectiveBaseGrade,
      isCapped,
      minScore,
      maxScore,
      isInsufficient,
      teamBaseGrade: effectiveBaseGrade,
      isExcused: true,
      rawRatio: 1.0,
      penaltyApplied: 0,
      method: config.method,
      methodName: 'Excused Exemption',
      explanation: isInsufficient 
        ? `Excused due to approved extenuating circumstances. Awarded base grade ${effectiveBaseGrade} (below minimum threshold of ${minScore} pts: marked Insufficient).`
        : 'Excused due to approved extenuating circumstances. Awarded neutral 1.00x multiplier and base grade without penalty.',
      breakdown: {
        rawPeerPercentage: 100,
        teamAveragePeerPercentage: 100,
        normalizedReviewerScore: 1.0,
        teamExpectedNormalizedScore: 1.0,
        baseMultiplier: 1.0,
        finalMultiplier: 1.0,
        nonSubmitterDeduction: 0,
        isNonSubmitter: false,
        unadjustedTeamBase: effectiveBaseGrade,
        effectiveGrade: rawGrade,
        reviewsCount: 0,
        teammatesCount: 0
      }
    };
  }

  const groupStudents = classData.students.filter((s) => s.groupName === groupName);
  const teammates = getTeammates(studentId, groupName, classData.students);
  const activeStudents = groupStudents.filter((s) => !s.isExcused);

  if (groupStudents.length <= 1 || activeStudents.length <= 1) {
    const rawGrade = Math.min(maxScore, effectiveBaseGrade);
    const isCapped = effectiveBaseGrade > maxScore;
    const isInsufficient = rawGrade < minScore;
    return {
      ratio: 1.0,
      adjustedGrade: rawGrade,
      rawAdjustedGrade: effectiveBaseGrade,
      isCapped,
      minScore,
      maxScore,
      isInsufficient,
      teamBaseGrade: effectiveBaseGrade,
      isExcused: false,
      rawRatio: 1.0,
      penaltyApplied: 0,
      method: config.method,
      methodName: meta.name,
      explanation: isInsufficient
        ? `Solo team or single active member. Awarded base grade ${effectiveBaseGrade} (below minimum threshold of ${minScore} pts: marked Insufficient).`
        : 'Solo team or single active member. Neutral 1.00x multiplier applied.',
      breakdown: {
        rawPeerPercentage: 100,
        teamAveragePeerPercentage: 100,
        normalizedReviewerScore: 1.0,
        teamExpectedNormalizedScore: 1.0,
        baseMultiplier: 1.0,
        finalMultiplier: 1.0,
        nonSubmitterDeduction: 0,
        isNonSubmitter: false,
        unadjustedTeamBase: effectiveBaseGrade,
        effectiveGrade: rawGrade,
        reviewsCount: 0,
        teammatesCount: teammates.length
      }
    };
  }

  // --- STEP 1: REVIEWER-LEVEL NORMALIZATION (Loughborough WebPA Core) ---
  // For each active reviewer j, calculate their awarded marks to active peers
  // Normalize each reviewer's marks so every teammate's evaluation carries identical voting weight.
  const activeReviewers = activeStudents;
  const normalizedReviewsMap: Record<string, Record<string, number>> = {};
  
  activeReviewers.forEach((revStudent) => {
    const peersOfRev = activeStudents.filter((s) => s.id !== revStudent.id);
    if (peersOfRev.length === 0) return;
    
    const revsWritten = classData.reviews.filter(
      (r) => r.reviewerId === revStudent.id && peersOfRev.some((p) => p.id === r.recipientId)
    );

    if (revsWritten.length === 0) {
      return;
    }

    normalizedReviewsMap[revStudent.id] = {};

    let criterionWeightsSum = 0;
    const criterionScoresByPeer: Record<string, number> = {};
    peersOfRev.forEach((p) => { criterionScoresByPeer[p.id] = 0; });

    classData.fields.forEach((field) => {
      const fieldWeight = field.weight !== undefined && field.weight > 0
        ? field.weight
        : (100 / Math.max(1, classData.fields.length));
      criterionWeightsSum += fieldWeight;

      let sumAwardedOnField = 0;
      peersOfRev.forEach((peer) => {
        const review = revsWritten.find((r) => r.recipientId === peer.id);
        const score = review && typeof review.scores[field.id] === 'number' ? review.scores[field.id] : 0;
        sumAwardedOnField += score;
      });

      peersOfRev.forEach((peer) => {
        const review = revsWritten.find((r) => r.recipientId === peer.id);
        const score = review && typeof review.scores[field.id] === 'number' ? review.scores[field.id] : 0;
        const normScore = sumAwardedOnField > 0 ? (score / sumAwardedOnField) : (1 / peersOfRev.length);
        criterionScoresByPeer[peer.id] += normScore * fieldWeight;
      });
    });

    peersOfRev.forEach((peer) => {
      normalizedReviewsMap[revStudent.id][peer.id] = criterionWeightsSum > 0
        ? (criterionScoresByPeer[peer.id] / criterionWeightsSum)
        : (1 / peersOfRev.length);
    });
  });

  // --- STEP 2: AGGREGATE RECEIVED EVALUATIONS PER ACTIVE STUDENT ---
  const studentMetricsMap: Record<string, { normScore: number | null; rawPct: number | null; reviewsCount: number }> = {};

  activeStudents.forEach((student) => {
    const peersWhoCouldReview = activeStudents.filter((s) => s.id !== student.id);
    const reviewsReceived = classData.reviews.filter(
      (r) => r.recipientId === student.id && peersWhoCouldReview.some((p) => p.id === r.reviewerId)
    );
    const validNormScores: number[] = [];

    peersWhoCouldReview.forEach((peer) => {
      if (normalizedReviewsMap[peer.id] && normalizedReviewsMap[peer.id][student.id] !== undefined) {
        validNormScores.push(normalizedReviewsMap[peer.id][student.id]);
      }
    });

    const normScore = validNormScores.length > 0
      ? validNormScores.reduce((a, b) => a + b, 0) / validNormScores.length
      : null;

    let rawPct: number | null = null;
    if (reviewsReceived.length > 0 && classData.fields.length > 0) {
      let weightSum = 0;
      let scoreSum = 0;
      classData.fields.forEach((field) => {
        const fieldWeight = field.weight !== undefined && field.weight > 0 ? field.weight : (100 / classData.fields.length);
        const scores = reviewsReceived.map((r) => r.scores[field.id]).filter((sc): sc is number => typeof sc === 'number');
        if (scores.length > 0) {
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          const critPct = field.max > 0 ? (avgScore / field.max) * 100 : 0;
          scoreSum += critPct * fieldWeight;
          weightSum += fieldWeight;
        }
      });
      rawPct = weightSum > 0 ? Number((scoreSum / weightSum).toFixed(1)) : null;
    }

    studentMetricsMap[student.id] = {
      normScore,
      rawPct,
      reviewsCount: reviewsReceived.length
    };
  });

  // --- STEP 3: COMPUTE TEAM BENCHMARKS ---
  const validNormScores = activeStudents.map((s) => studentMetricsMap[s.id]?.normScore).filter((v): v is number => v !== null);
  const validRawPcts = activeStudents.map((s) => studentMetricsMap[s.id]?.rawPct).filter((v): v is number => v !== null);

  const teamExpectedShare = activeStudents.length > 1 ? (1 / (activeStudents.length - 1)) : 1.0;
  const teamNormAvg = validNormScores.length > 0
    ? validNormScores.reduce((a, b) => a + b, 0) / validNormScores.length
    : teamExpectedShare;
  const teamRawPctAvg = validRawPcts.length > 0
    ? validRawPcts.reduce((a, b) => a + b, 0) / validRawPcts.length
    : 100;

  const targetMetrics = studentMetricsMap[studentId];
  const targetNormScore = targetMetrics?.normScore ?? null;
  const targetRawPct = targetMetrics?.rawPct ?? null;
  const reviewsCount = targetMetrics?.reviewsCount ?? 0;

  // Raw WebPA Multiplier (Ratio of individual normalized performance to team average)
  let rawWebPARatio = 1.0;
  if (targetNormScore !== null && teamNormAvg > 0) {
    rawWebPARatio = Number((targetNormScore / teamNormAvg).toFixed(3));
  } else if (reviewsCount === 0 && validNormScores.length > 0) {
    rawWebPARatio = 1.0;
  }

  // --- STEP 4: APPLY SELECTED METHOD FORMULA ---
  const W = typeof config.fudgeWeight === 'number' ? Math.max(0, Math.min(1, config.fudgeWeight)) : 1.0;
  let methodMultiplier = rawWebPARatio;

  switch (config.method) {
    case 'goldfinch': {
      const threshold = config.deadbandThreshold ?? 0.05;
      if (Math.abs(rawWebPARatio - 1.0) <= threshold) {
        methodMultiplier = 1.000;
      } else if (rawWebPARatio > 1.0 + threshold) {
        const standoutBonus = (rawWebPARatio - (1.0 + threshold)) * 1.25;
        methodMultiplier = Number((1.0 + standoutBonus).toFixed(3));
      } else {
        methodMultiplier = rawWebPARatio;
      }
      break;
    }

    case 'johnston': {
      const sensitivity = config.johnstonSensitivity ?? 1.0;
      const studentPct = targetRawPct ?? teamRawPctAvg;
      const deltaPct = (studentPct - teamRawPctAvg) * sensitivity;
      const pointsShift = Number(((effectiveBaseGrade * (deltaPct / 100)) * W).toFixed(1));
      methodMultiplier = effectiveBaseGrade > 0 ? Number(((effectiveBaseGrade + pointsShift) / effectiveBaseGrade).toFixed(3)) : 1.0;
      break;
    }

    case 'spark': {
      methodMultiplier = rawWebPARatio;
      break;
    }

    case 'clamped': {
      const minC = config.clampMin ?? config.minClamp ?? 0.75;
      const maxC = config.clampMax ?? config.maxClamp ?? 1.25;
      const clamped = Math.max(minC, Math.min(maxC, rawWebPARatio));
      methodMultiplier = Number(clamped.toFixed(3));
      break;
    }

    case 'hybrid': {
      const bWeight = config.hybridBaseWeight ?? config.baseWeight ?? 0.70;
      const pWeight = config.hybridPeerWeight ?? config.peerWeight ?? 0.30;
      methodMultiplier = Number(((bWeight) + (pWeight * rawWebPARatio)).toFixed(3));
      break;
    }

    case 'webpa':
    default: {
      methodMultiplier = rawWebPARatio;
      break;
    }
  }

  let effectiveMultiplier = (1 - W) + (W * methodMultiplier);

  // --- STEP 5: NON-SUBMISSION ACCOUNTABILITY ---
  const isNonSubmitter = targetStudent ? !targetStudent.submitted : false;
  let nonSubmitterPenaltyApplied = 0;

  if (isNonSubmitter && config.penalizeNonSubmitters) {
    nonSubmitterPenaltyApplied = config.nonSubmitterPenalty ?? 10;
    // Non-submitters cannot receive bonus multiplier > 1.0
    effectiveMultiplier = Math.min(1.0, effectiveMultiplier);
    // Deduct non-submission penalty percentage
    effectiveMultiplier = Math.max(0, effectiveMultiplier * (1 - (nonSubmitterPenaltyApplied / 100)));
  }

  // --- STEP 6: FINAL GRADE CALCULATION & CAP ENFORCEMENT ---
  const rawCalculatedGrade = effectiveBaseGrade * effectiveMultiplier;
  const accurateRawGrade = Number(rawCalculatedGrade.toFixed(2));

  // Cap at the maximum score set by the professor (e.g. 31 max)
  const isCapped = accurateRawGrade > maxScore;
  const cappedGrade = Math.min(maxScore, Math.max(0, rawCalculatedGrade));
  const finalAdjustedGrade = Number(cappedGrade.toFixed(1));
  const finalRatio = Number(effectiveMultiplier.toFixed(3));
  const isInsufficient = finalAdjustedGrade < minScore;

  let explanation = '';
  if (reviewsCount === 0) {
    explanation = `No reviews received yet from teammates. Neutral 1.00x multiplier awarded.`;
  } else if (isCapped) {
    explanation = `High Contributor: Peer ratings calculated a score of ${accurateRawGrade} pts (multiplier ${finalRatio}x), capped at the maximum allowable score of ${maxScore} pts.`;
  } else if (finalRatio > 1.0) {
    const ptsAbove = Number((finalAdjustedGrade - effectiveBaseGrade).toFixed(1));
    explanation = `High Contributor: Earned +${ptsAbove} pts above team base mark (${effectiveBaseGrade}) based on strong peer reviews.`;
  } else if (finalRatio < 1.0) {
    const ptsBelow = Number((effectiveBaseGrade - finalAdjustedGrade).toFixed(1));
    explanation = `Lower Contribution: Scaled down by -${ptsBelow} pts below team base mark due to peer review consensus.`;
  } else {
    explanation = `Expected Contribution: Matched team average consensus, receiving exactly the team base mark.`;
  }

  if (isInsufficient) {
    explanation += ` (Score of ${finalAdjustedGrade} is below the minimum threshold of ${minScore} pts: marked Insufficient).`;
  }

  if (isNonSubmitter && config.penalizeNonSubmitters) {
    explanation += ` Non-submission penalty applied (-${nonSubmitterPenaltyApplied}% deduction for failing to submit reviews).`;
  }

  return {
    ratio: finalRatio,
    adjustedGrade: finalAdjustedGrade,
    rawAdjustedGrade: accurateRawGrade,
    isCapped,
    minScore,
    maxScore,
    isInsufficient,
    teamBaseGrade: effectiveBaseGrade,
    isExcused: false,
    rawRatio: rawWebPARatio,
    penaltyApplied: nonSubmitterPenaltyApplied,
    method: config.method,
    methodName: meta.name,
    explanation,
    breakdown: {
      rawPeerPercentage: targetRawPct ?? 0,
      teamAveragePeerPercentage: Number(teamRawPctAvg.toFixed(1)),
      normalizedReviewerScore: Number((targetNormScore ?? 0).toFixed(4)),
      teamExpectedNormalizedScore: Number(teamNormAvg.toFixed(4)),
      baseMultiplier: rawWebPARatio,
      finalMultiplier: finalRatio,
      nonSubmitterDeduction: nonSubmitterPenaltyApplied,
      isNonSubmitter,
      unadjustedTeamBase: effectiveBaseGrade,
      effectiveGrade: finalAdjustedGrade,
      reviewsCount,
      teammatesCount: teammates.length
    }
  };
}

/**
 * Calculates WebPA adjustment factor and scaled grade for a student.
 * Fully backwards-compatible with all existing callers.
 */
export function calculateStudentWebPAScore(
  studentId: string,
  groupName: string,
  classData: ClassData,
  baseGroupGrade?: number,
  fudgeWeightOrConfig: number | Partial<PeerAdjustmentConfig> = 1.0
): PeerAdjustmentResult {
  return calculateStudentPeerAdjustment(studentId, groupName, classData, baseGroupGrade, fudgeWeightOrConfig);
}

export interface GradeDisplayInfo {
  isInsufficient: boolean;
  isCapped: boolean;
  displayText: string;
  realScoreText: string;
  tooltipText: string;
  adjustedGrade: number;
  rawAdjustedGrade: number;
  teamBaseGrade: number;
  minScore: number;
  maxScore: number;
}

export function getGradeDisplayInfo(webpa: PeerAdjustmentResult): GradeDisplayInfo {
  const { adjustedGrade, rawAdjustedGrade, teamBaseGrade, minScore, maxScore, isInsufficient, isCapped } = webpa;
  const realScoreText = `${adjustedGrade.toFixed(1)} / ${teamBaseGrade}`;
  const displayText = isInsufficient ? 'Insufficient' : realScoreText;
  const tooltipText = isInsufficient
    ? `Real Score: ${adjustedGrade.toFixed(1)} / ${teamBaseGrade} (Below minimum passing threshold of ${minScore} pts)`
    : isCapped
      ? `Capped at maximum allowable score of ${maxScore} pts (Calculated: ${rawAdjustedGrade} pts)`
      : `Calibrated Score: ${adjustedGrade.toFixed(1)} / ${teamBaseGrade}`;

  return {
    isInsufficient,
    isCapped,
    displayText,
    realScoreText,
    tooltipText,
    adjustedGrade,
    rawAdjustedGrade,
    teamBaseGrade,
    minScore,
    maxScore
  };
}

export interface CriterionDisputeRow {
  fieldId: string;
  fieldName: string;
  maxScore: number;
  weight: number;
  selfScore: number | null;
  peerAverage: number | null;
  delta: number | null; // self - peerAverage
  peerScores: number[];
  stdDev: number | null;
  consensusLevel: 'strong' | 'moderate' | 'divergent';
}

export interface StudentDisputeAudit {
  studentId: string;
  studentName: string;
  studentEmail: string;
  groupName: string;
  isExcused: boolean;
  submitted: boolean;
  teamBaseGrade: number;
  webpaRatio: number;
  adjustedGrade: number;
  fudgeWeight: number;
  overallSelfPercentage: number | null;
  overallPeerPercentage: number | null;
  overallGapDelta: number | null;
  criteriaBreakdown: CriterionDisputeRow[];
  reviewsReceivedCount: number;
  teammatesCount: number;
  retaliationRisk: boolean;
  retaliationDetails?: string;
  unanimousPeerConsensus: boolean;
  praiseTags: string[];
  qualitativeStrengths: string[];
  qualitativeGrowthSuggestions: string[];
  suggestedEmailResponse: string;
}

export function generateStudentDisputeAudit(
  student: Student,
  classData: ClassData,
  baseGroupGrade: number = 100,
  fudgeWeight: number = 0.5
): StudentDisputeAudit {
  const webpa = calculateStudentWebPAScore(student.id, student.groupName, classData, baseGroupGrade, fudgeWeight);
  const teammates = getTeammates(student.id, student.groupName, classData.students);
  const teammatesCount = teammates.length;

  // Self review
  const selfReview = classData.reviews.find(r => r.reviewerId === student.id && r.recipientId === student.id);
  
  // Reviews received from teammates
  const peerReviews = classData.reviews.filter(r => r.recipientId === student.id && teammates.includes(r.reviewerId));
  const reviewsReceivedCount = peerReviews.length;

  // Reviews written by this student to teammates (for retaliation audit)
  const writtenToTeammates = classData.reviews.filter(r => r.reviewerId === student.id && teammates.includes(r.recipientId));

  let selfWeightedSum = 0;
  let selfTotalWeight = 0;
  let peerWeightedSum = 0;
  let peerTotalWeight = 0;

  const criteriaBreakdown: CriterionDisputeRow[] = classData.fields.map(field => {
    const selfScore = selfReview && selfReview.scores[field.id] !== undefined ? selfReview.scores[field.id] : null;
    const peerScores = peerReviews.map(r => r.scores[field.id]).filter((s): s is number => s !== undefined);
    const peerAvg = peerScores.length > 0 ? Number((peerScores.reduce((a, b) => a + b, 0) / peerScores.length).toFixed(2)) : null;
    const delta = selfScore !== null && peerAvg !== null ? Number((selfScore - peerAvg).toFixed(2)) : null;
    
    // Std dev among peers
    let stdDev: number | null = null;
    if (peerScores.length >= 2) {
      const mean = peerScores.reduce((a, b) => a + b, 0) / peerScores.length;
      const variance = peerScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / peerScores.length;
      stdDev = Number(Math.sqrt(variance).toFixed(2));
    }

    const consensusLevel = stdDev === null || stdDev <= 0.6 ? 'strong' : stdDev <= 1.2 ? 'moderate' : 'divergent';

    const fieldWeight = field.weight !== undefined && field.weight > 0 ? field.weight : (100 / Math.max(1, classData.fields.length));

    if (selfScore !== null && field.max > 0) {
      selfWeightedSum += (selfScore / field.max) * 100 * fieldWeight;
      selfTotalWeight += fieldWeight;
    }
    if (peerAvg !== null && field.max > 0) {
      peerWeightedSum += (peerAvg / field.max) * 100 * fieldWeight;
      peerTotalWeight += fieldWeight;
    }

    return {
      fieldId: field.id,
      fieldName: field.name,
      maxScore: field.max,
      weight: fieldWeight,
      selfScore,
      peerAverage: peerAvg,
      delta,
      peerScores,
      stdDev,
      consensusLevel
    };
  });

  const overallSelfPercentage = selfTotalWeight > 0 ? Number((selfWeightedSum / selfTotalWeight).toFixed(1)) : null;
  const overallPeerPercentage = peerTotalWeight > 0 ? Number((peerWeightedSum / peerTotalWeight).toFixed(1)) : null;
  const overallGapDelta = overallSelfPercentage !== null && overallPeerPercentage !== null ? Number((overallSelfPercentage - overallPeerPercentage).toFixed(1)) : null;

  // Retaliation Check: Did this student rate teammates much lower than what teammates gave each other?
  let retaliationRisk = false;
  let retaliationDetails: string | undefined;
  if (writtenToTeammates.length > 0 && classData.fields.length > 0) {
    let studentGivenSum = 0, studentGivenMax = 0;
    writtenToTeammates.forEach(rev => {
      classData.fields.forEach(f => {
        studentGivenSum += rev.scores[f.id] ?? 0;
        studentGivenMax += f.max;
      });
    });
    const studentGivenPct = studentGivenMax > 0 ? (studentGivenSum / studentGivenMax) * 100 : 0;
    if (studentGivenPct < 60 && (overallPeerPercentage ?? 100) > studentGivenPct + 25) {
      retaliationRisk = true;
      retaliationDetails = `Student rated teammates very critically (avg ${studentGivenPct.toFixed(0)}%) compared to the team consensus.`;
    }
  }

  // Consensus uniformity
  const unanimousPeerConsensus = criteriaBreakdown.every(c => c.consensusLevel === 'strong');

  // Qualitative praise & comments
  const praiseTagsSet = new Set<string>();
  const qualitativeStrengths: string[] = [];
  const qualitativeGrowthSuggestions: string[] = [];

  peerReviews.forEach(rev => {
    rev.praiseTags?.forEach(tag => praiseTagsSet.add(tag));
    if (rev.strengthsText?.trim()) qualitativeStrengths.push(rev.strengthsText.trim());
    if (rev.growthText?.trim()) qualitativeGrowthSuggestions.push(rev.growthText.trim());
  });

  const receivedPraiseTags = Array.from(praiseTagsSet);

  // Ready-to-copy email draft
  const firstName = student.name.split(' ')[0] || student.name;
  const selfPctStr = overallSelfPercentage !== null ? `${overallSelfPercentage}%` : 'N/A';
  const peerPctStr = overallPeerPercentage !== null ? `${overallPeerPercentage}%` : 'N/A';
  
  const suggestedEmailResponse = [
    `Dear ${firstName},`,
    '',
    `Thank you for inquiring about your peer evaluation results for ${student.groupName || 'your team'}.`,
    '',
    `Here is a summary of the standardized mathematical evaluation breakdown:`,
    `• Team Base Grade: ${webpa.teamBaseGrade.toFixed(1)} pts`,
    `• WebPA Contribution Multiplier: ${webpa.ratio.toFixed(2)}${student.isExcused ? ' (Neutralized - Excused Exemption Applied)' : ''}`,
    `• Calibrated Final Score: ${webpa.adjustedGrade.toFixed(1)} pts`,
    '',
    `Audit Summary:`,
    `• Self-Assessment Overall: ${selfPctStr}`,
    `• Anonymous Peer Consensus: ${peerPctStr} (based on ${reviewsReceivedCount} submitted peer evaluations from your team)`,
    overallGapDelta !== null && overallGapDelta > 15
      ? `• Observed Variance: There is a notable gap (+${overallGapDelta}%) between your self-evaluation and the mutual consensus of your teammates across rubric criteria.`
      : `• Observed Variance: Teammates evaluated your participation with ${unanimousPeerConsensus ? 'high consensus across all rubric dimensions' : 'moderate variance'}.`,
    receivedPraiseTags.length > 0 ? `• Peer Recognition Tags: ${receivedPraiseTags.join(', ')}` : '',
    qualitativeGrowthSuggestions.length > 0 ? `• Primary Constructive Feedback: "${qualitativeGrowthSuggestions[0]}"` : '',
    '',
    `All evaluations are collected under strict academic confidentiality and normalized according to the Loughborough WebPA algorithm. If you would like to discuss strategies for future team milestones, please feel free to visit during office hours.`,
    '',
    `Best regards,`,
    `Course Instruction Team`
  ].filter(line => line !== '').join('\n');

  return {
    studentId: student.id,
    studentName: student.name,
    studentEmail: student.email,
    groupName: student.groupName,
    isExcused: !!student.isExcused,
    submitted: student.submitted,
    teamBaseGrade: webpa.teamBaseGrade,
    webpaRatio: webpa.ratio,
    adjustedGrade: webpa.adjustedGrade,
    fudgeWeight,
    overallSelfPercentage,
    overallPeerPercentage,
    overallGapDelta,
    criteriaBreakdown,
    reviewsReceivedCount,
    teammatesCount,
    retaliationRisk,
    retaliationDetails,
    unanimousPeerConsensus,
    praiseTags: receivedPraiseTags,
    qualitativeStrengths,
    qualitativeGrowthSuggestions,
    suggestedEmailResponse
  };
}

/**
 * Intelligent conflict & anomaly detection engine.
 * Scans active classroom reviews and flags lazy grading, outliers, and collusion.
 */
export function detectClassAnomalies(classData: ClassData): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const maxScoreSum = classData.fields.reduce((acc, f) => acc + f.max, 0);
  if (maxScoreSum === 0 || classData.students.length === 0) return anomalies;

  // 1. Check Lazy/Uniform Grading
  classData.students.forEach((student) => {
    if (!student.submitted) return;
    
    // Get all reviews written by this student (excluding self-evaluation)
    const writtenReviews = classData.reviews.filter(
      (r) => r.reviewerId === student.id && r.recipientId !== student.id
    );

    if (writtenReviews.length < 2) return;

    // Collect all individual scores assigned by this reviewer
    const allScores: number[] = [];
    writtenReviews.forEach((r) => {
      Object.values(r.scores).forEach((val) => allScores.push(val));
    });

    if (allScores.length < 2) return;

    // Compute standard deviation of all scores assigned by this student
    const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const variance = allScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / allScores.length;
    const stdDev = Math.sqrt(variance);

    // If stdDev is exactly 0, they graded everyone identically
    if (stdDev === 0) {
      anomalies.push({
        id: `lazy_${student.id}`,
        studentId: student.id,
        studentName: student.name,
        type: 'lazy',
        description: `Lazy/Uniform Grading: Assigned the exact same score (${mean}) to every metric for all teammates.`,
        severity: 'medium'
      });
    }
  });

  // 2. Check Spiteful/Outlier Grading
  classData.reviews.forEach((review) => {
    // Exclude self evaluation
    if (review.reviewerId === review.recipientId) return;

    const recipient = classData.students.find((s) => s.id === review.recipientId);
    const reviewer = classData.students.find((s) => s.id === review.reviewerId);
    if (!recipient || !reviewer) return;

    // Calculate recipient's overall average percentage from all teammates
    const { overallPercentage } = calculateStudentMetrics(recipient, classData);

    if (overallPercentage === null) return;

    // Calculate reviewer's specific average percentage given to this recipient
    let reviewerScoreSum = 0;
    let reviewerMaxSum = 0;
    classData.fields.forEach((field) => {
      const score = review.scores[field.id];
      if (score !== undefined) {
        reviewerScoreSum += score;
        reviewerMaxSum += field.max;
      }
    });

    if (reviewerMaxSum === 0) return;
    const reviewerPct = (reviewerScoreSum / reviewerMaxSum) * 100;

    // If reviewer graded this recipient > 30% lower than the student's peer average
    if (overallPercentage - reviewerPct > 30) {
      anomalies.push({
        id: `outlier_low_${reviewer.id}_to_${recipient.id}`,
        studentId: reviewer.id,
        studentName: reviewer.name,
        type: 'outlier',
        description: `Extreme Negative Outlier: Graded teammate "${recipient.name}" significantly lower (${reviewerPct.toFixed(0)}%) than their peer group average (${overallPercentage.toFixed(0)}%).`,
        severity: 'high'
      });
    }
    // If reviewer graded this recipient > 30% higher than the student's peer average
    else if (reviewerPct - overallPercentage > 30 && overallPercentage < 65) {
      anomalies.push({
        id: `outlier_high_${reviewer.id}_to_${recipient.id}`,
        studentId: reviewer.id,
        studentName: reviewer.name,
        type: 'outlier',
        description: `Extreme Positive Outlier: Graded teammate "${recipient.name}" significantly higher (${reviewerPct.toFixed(0)}%) than their peer group average (${overallPercentage.toFixed(0)}%).`,
        severity: 'low'
      });
    }
  });

  // 3. Check Collusion (Reciprocal High Grading)
  const len = classData.students.length;
  for (let i = 0; i < len; i++) {
    for (let j = i + 1; j < len; j++) {
      const s1 = classData.students[i];
      const s2 = classData.students[j];

      // Must be in the same group
      if (s1.groupName !== s2.groupName) continue;

      const review1to2 = classData.reviews.find((r) => r.reviewerId === s1.id && r.recipientId === s2.id);
      const review2to1 = classData.reviews.find((r) => r.reviewerId === s2.id && r.recipientId === s1.id);

      if (!review1to2 || !review2to1) continue;

      // Calculate score percentage s1 gave to s2
      let sum1to2 = 0, max1to2 = 0;
      classData.fields.forEach((f) => {
        sum1to2 += review1to2.scores[f.id] ?? 0;
        max1to2 += f.max;
      });
      const pct1to2 = max1to2 > 0 ? (sum1to2 / max1to2) * 100 : 0;

      // Calculate score percentage s2 gave to s1
      let sum2to1 = 0, max2to1 = 0;
      classData.fields.forEach((f) => {
        sum2to1 += review2to1.scores[f.id] ?? 0;
        max2to1 += f.max;
      });
      const pct2to1 = max2to1 > 0 ? (sum2to1 / max2to1) * 100 : 0;

      // If both gave each other perfect or near-perfect ratings (> 90%)
      if (pct1to2 >= 90 && pct2to1 >= 90) {
        // Double-check if their averages from others are lower (confirms suspicious positive feedback)
        const mates1 = getTeammates(s1.id, s1.groupName, classData.students).filter((id) => id !== s2.id);
        const mates2 = getTeammates(s2.id, s2.groupName, classData.students).filter((id) => id !== s1.id);

        let sumOthersTo1 = 0, count1 = 0;
        mates1.forEach((mId) => {
          const rev = classData.reviews.find((r) => r.reviewerId === mId && r.recipientId === s1.id);
          if (rev) {
            classData.fields.forEach((f) => {
              sumOthersTo1 += rev.scores[f.id] ?? 0;
              count1 += f.max;
            });
          }
        });
        const othersPctTo1 = count1 > 0 ? (sumOthersTo1 / count1) * 100 : null;

        let sumOthersTo2 = 0, count2 = 0;
        mates2.forEach((mId) => {
          const rev = classData.reviews.find((r) => r.reviewerId === mId && r.recipientId === s2.id);
          if (rev) {
            classData.fields.forEach((f) => {
              sumOthersTo2 += rev.scores[f.id] ?? 0;
              count2 += f.max;
            });
          }
        });
        const othersPctTo2 = count2 > 0 ? (sumOthersTo2 / count2) * 100 : null;

        // If their peer rating from others is significantly lower (< 75% or 15% lower than collusion scores)
        const sus1 = othersPctTo1 !== null && othersPctTo1 < 80;
        const sus2 = othersPctTo2 !== null && othersPctTo2 < 80;

        if (sus1 || sus2) {
          anomalies.push({
            id: `collusion_${s1.id}_${s2.id}`,
            studentId: s1.id,
            studentName: `${s1.name} & ${s2.name}`,
            type: 'collusion',
            description: `Reciprocal Collusion Risk: Both students assigned near-perfect scores (${pct1to2.toFixed(0)}% and ${pct2to1.toFixed(0)}%) to each other, despite lower averages from other team members.`,
            severity: 'high'
          });
        }
      }
    }
  }

  return anomalies;
}

export interface TeamPulseSummary {
  teamName: string;
  memberCount: number;
  responseCount: number;
  averageMorale: number; // 1-5 normalized
  rawAverageMorale: number;
  scaleType: PulseScaleType;
  dominantStatus: 'on_track' | 'minor_roadblock' | 'blocked';
  statusCounts: { on_track: number; minor_roadblock: number; blocked: number };
  blockerNotes: Array<{ studentName: string; note: string; submittedAt: string }>;
  sparkline: Array<{ roundId: string; roundTitle: string; averageMorale: number; dominantStatus: string }>;
}

export interface ClassPulseOverview {
  activeRound: PulseRound | null;
  totalRounds: number;
  classAverageMorale: number;
  teamsOnTrackPercent: number;
  teamsBlockedCount: number;
  totalTeamsCount: number;
  totalSubmissions: number;
  totalStudentsExpected: number;
  teamSummaries: TeamPulseSummary[];
}

export function calculateTeamPulseMetrics(classData: ClassData, selectedRoundId?: string): ClassPulseOverview {
  const rounds = classData.pulseRounds || [];
  const activeRound = selectedRoundId 
    ? rounds.find(r => r.id === selectedRoundId) || rounds[rounds.length - 1] || null
    : rounds.find(r => r.status === 'active') || rounds[rounds.length - 1] || null;

  const teamMap = new Map<string, Student[]>();
  classData.students.forEach(s => {
    const g = s.groupName || 'Unassigned';
    if (!teamMap.has(g)) teamMap.set(g, []);
    teamMap.get(g)!.push(s);
  });

  const teamSummaries: TeamPulseSummary[] = [];
  let totalClassMoraleSum = 0;
  let totalClassMoraleCount = 0;
  let teamsOnTrackCount = 0;
  let teamsBlockedCount = 0;

  const uniqueTeams = Array.from(teamMap.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  uniqueTeams.forEach(teamName => {
    const members = teamMap.get(teamName) || [];
    const memberCount = members.length;
    const memberIds = new Set(members.map(m => m.id));

    // Responses in current active/selected round
    const currentResponses = activeRound ? activeRound.responses.filter(r => memberIds.has(r.studentId) || r.groupName === teamName) : [];
    const responseCount = currentResponses.length;

    let moraleSum = 0;
    const statusCounts = { on_track: 0, minor_roadblock: 0, blocked: 0 };
    const blockerNotes: Array<{ studentName: string; note: string; submittedAt: string }> = [];

    currentResponses.forEach(r => {
      moraleSum += r.moraleScore;
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      if (r.blockerNote && r.blockerNote.trim().length > 0) {
        blockerNotes.push({
          studentName: r.studentName,
          note: r.blockerNote.trim(),
          submittedAt: r.submittedAt
        });
      }
    });

    const rawAverageMorale = responseCount > 0 ? moraleSum / responseCount : 0;
    
    // Normalize to 1-5 scale for uniform reporting
    let averageMorale = rawAverageMorale;
    const scaleType = activeRound?.config?.scaleType || 'stars_5';
    if (scaleType === 'slider_10') {
      averageMorale = rawAverageMorale / 2;
    } else if (scaleType === 'traffic_rag' || scaleType === 'emoji_sentiment') {
      averageMorale = (rawAverageMorale / 4) * 5;
    }

    if (responseCount > 0) {
      totalClassMoraleSum += averageMorale;
      totalClassMoraleCount += 1;
    }

    // Determine dominant status
    let dominantStatus: 'on_track' | 'minor_roadblock' | 'blocked' = 'on_track';
    if (statusCounts.blocked > 0) {
      dominantStatus = 'blocked';
      teamsBlockedCount++;
    } else if (statusCounts.minor_roadblock > 0) {
      dominantStatus = 'minor_roadblock';
    } else if (responseCount > 0) {
      teamsOnTrackCount++;
    }

    // Historical sparkline across rounds
    const sparkline: Array<{ roundId: string; roundTitle: string; averageMorale: number; dominantStatus: string }> = [];
    rounds.forEach(r => {
      const rRes = r.responses.filter(resp => memberIds.has(resp.studentId) || resp.groupName === teamName);
      if (rRes.length > 0) {
        const rSum = rRes.reduce((acc, curr) => acc + curr.moraleScore, 0);
        let rAvg = rSum / rRes.length;
        if (r.config?.scaleType === 'slider_10') rAvg /= 2;
        else if (r.config?.scaleType === 'traffic_rag' || r.config?.scaleType === 'emoji_sentiment') rAvg = (rAvg / 4) * 5;

        const hasBlocked = rRes.some(resp => resp.status === 'blocked');
        const hasWarning = rRes.some(resp => resp.status === 'minor_roadblock');
        const dStat = hasBlocked ? 'blocked' : hasWarning ? 'minor_roadblock' : 'on_track';

        sparkline.push({
          roundId: r.id,
          roundTitle: r.title,
          averageMorale: Number(rAvg.toFixed(1)),
          dominantStatus: dStat
        });
      }
    });

    teamSummaries.push({
      teamName,
      memberCount,
      responseCount,
      averageMorale: Number(averageMorale.toFixed(1)),
      rawAverageMorale: Number(rawAverageMorale.toFixed(1)),
      scaleType,
      dominantStatus,
      statusCounts,
      blockerNotes,
      sparkline
    });
  });

  const totalTeamsCount = uniqueTeams.length;
  const classAverageMorale = totalClassMoraleCount > 0 ? Number((totalClassMoraleSum / totalClassMoraleCount).toFixed(1)) : 0;
  const teamsOnTrackPercent = totalTeamsCount > 0 ? Math.round((teamsOnTrackCount / totalTeamsCount) * 100) : 0;
  const totalSubmissions = activeRound ? activeRound.responses.length : 0;
  const totalStudentsExpected = classData.students.length;

  return {
    activeRound,
    totalRounds: rounds.length,
    classAverageMorale,
    teamsOnTrackPercent,
    teamsBlockedCount,
    totalTeamsCount,
    totalSubmissions,
    totalStudentsExpected,
    teamSummaries
  };
}

/**
 * Generates rich, realistic sample pulse check rounds across historical sprints for instant testing.
 */
export function generateSamplePulseRounds(classData: ClassData): PulseRound[] {
  const students = classData.students;
  if (students.length === 0) return [];

  const round1: PulseRound = {
    id: `pulse_${Date.now() - 14 * 86400000}`,
    title: 'Sprint 1 Kickoff & Synergy',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    status: 'closed',
    config: {
      ...DEFAULT_PULSE_CONFIG,
      scaleType: 'stars_5',
      moralePrompt: 'Team Morale & Communication',
      progressPrompt: 'Is your team on track for Sprint 1 deliverables?'
    },
    responses: []
  };

  const round2: PulseRound = {
    id: `pulse_${Date.now() - 7 * 86400000}`,
    title: 'Midterm Architecture Standup',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    status: 'closed',
    config: {
      ...DEFAULT_PULSE_CONFIG,
      scaleType: 'likert_5',
      moralePrompt: 'Our team is communicating openly and resolving technical roadblocks effectively.',
      progressPrompt: 'Are all core milestones on schedule for midterm code review?'
    },
    responses: []
  };

  const round3: PulseRound = {
    id: `pulse_${Date.now()}`,
    title: 'Milestone 3 Pre-Demo Pulse',
    createdAt: new Date().toISOString(),
    status: 'active',
    config: {
      ...DEFAULT_PULSE_CONFIG,
      scaleType: 'traffic_rag',
      moralePrompt: 'Current Team Velocity & Alignment Status',
      progressPrompt: 'Confidence level for Friday demonstration'
    },
    responses: []
  };

  // Populate realistic variations
  students.forEach((s, idx) => {
    // Round 1 (Stars 1-5)
    const r1Score = idx % 7 === 0 ? 2 : idx % 4 === 0 ? 3 : idx % 3 === 0 ? 4 : 5;
    const r1Status = r1Score <= 2 ? 'minor_roadblock' : 'on_track';
    round1.responses.push({
      id: `r1_${s.id}`,
      studentId: s.id,
      studentName: s.name,
      groupName: s.groupName,
      moraleScore: r1Score,
      scaleType: 'stars_5',
      status: r1Status,
      blockerNote: r1Score <= 2 ? 'Clarifying requirements for database schema.' : undefined,
      submittedAt: round1.createdAt
    });

    // Round 2 (Likert 1-5)
    const r2Score = idx % 5 === 0 ? 2 : idx % 6 === 0 ? 3 : 4;
    const r2Status = r2Score <= 2 ? 'blocked' : r2Score === 3 ? 'minor_roadblock' : 'on_track';
    round2.responses.push({
      id: `r2_${s.id}`,
      studentId: s.id,
      studentName: s.name,
      groupName: s.groupName,
      moraleScore: r2Score,
      scaleType: 'likert_5',
      status: r2Status,
      blockerNote: r2Status === 'blocked' ? 'Waiting on third-party API keys and repo permissions.' : undefined,
      submittedAt: round2.createdAt
    });

    // Round 3 (Traffic RAG: 1=Red, 2=Amber, 3=Green, 4=Blue)
    // 85% submission rate for active round
    if (idx % 8 !== 0) {
      const isTeamProblem = s.groupName.includes('3') || s.groupName.includes('Gamma');
      const r3Score = isTeamProblem ? 1 : idx % 5 === 0 ? 2 : idx % 2 === 0 ? 3 : 4;
      const r3Status = r3Score === 1 ? 'blocked' : r3Score === 2 ? 'minor_roadblock' : 'on_track';
      round3.responses.push({
        id: `r3_${s.id}`,
        studentId: s.id,
        studentName: s.name,
        groupName: s.groupName,
        moraleScore: r3Score,
        scaleType: 'traffic_rag',
        status: r3Status,
        blockerNote: r3Status === 'blocked' ? 'One member has been unresponsive on Slack since Tuesday.' : undefined,
        submittedAt: round3.createdAt
      });
    }
  });

  return [round1, round2, round3];
}

export * from './subPeerReview';


