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
  originalCountry?: string;
  originalUniversity?: string;
  currentUniversity?: string;
  // Discreet audit & identity provenance fields
  originalName?: string;
  originalEmail?: string;
  editHistory?: StudentProfileAuditLog[];
  nameChangeCount?: number;
  lastProfileEditAt?: number;
  flaggedForReview?: boolean;
  suspiciousReason?: string | null;
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
  showRoleBaseline?: boolean; // Toggle "Starting Role Baseline"
  allowProfileEditing?: boolean; // Toggle if students can edit their profile info or not
}

export const DEFAULT_EVALUATION_CONTROLS: Required<EvaluationFormControls> = {
  allowSelfReview: true,
  showGrowthSuggestions: true,
  showPraiseTags: true,
  showStrengthsFeedback: true,
  showRoleBaseline: true,
  allowProfileEditing: true
};

export function getEvaluationControls(classData?: ClassData | null): Required<EvaluationFormControls> {
  const ec = classData?.evaluationControls;
  return {
    allowSelfReview: ec?.allowSelfReview !== false,
    showGrowthSuggestions: ec?.showGrowthSuggestions !== false,
    showPraiseTags: ec?.showPraiseTags !== false,
    showStrengthsFeedback: ec?.showStrengthsFeedback !== false,
    showRoleBaseline: ec?.showRoleBaseline !== false,
    allowProfileEditing: ec?.allowProfileEditing !== false
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

export interface ClassData {
  id: string;
  name: string;
  fields: GradingScaleField[];
  students: Student[];
  reviews: Review[];
  deadline?: string | null;
  milestones?: Milestone[];
  targetScale?: number | null;
  teamBaseGrades?: Record<string, number>;
  evaluationControls?: EvaluationFormControls;
  pulseRounds?: PulseRound[];
}

/**
 * Resolves the team-specific base mark or falls back to the default base grade.
 */
export function getTeamBaseGrade(classData: ClassData, groupName: string, defaultGrade: number = 100): number {
  if (classData?.teamBaseGrades && typeof classData.teamBaseGrades[groupName] === 'number') {
    return classData.teamBaseGrades[groupName];
  }
  return defaultGrade;
}

/**
 * Resolves the final grade scale to display scores out of.
 * - targetScale === 0: Represents the dynamic sum of all rubrics' maximums.
 * - targetScale === null/undefined: Defaults to 20.
 * - any positive number: Scales out of that custom value.
 */
export function getTargetScale(classData: ClassData): number {
  if (classData.targetScale === 0) {
    return classData.fields.reduce((acc, f) => acc + (f.max ?? 0), 0);
  }
  return classData.targetScale ?? 20;
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
      const fieldPercentage = field.max > 0 ? (avg / field.max) * 100 : 0;
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

/**
 * Calculates WebPA adjustment factor and scaled grade for a student.
 * If baseGroupGrade is provided (e.g. 100), applies the scaling formula.
 */
export function calculateStudentWebPAScore(
  studentId: string,
  groupName: string,
  classData: ClassData,
  baseGroupGrade: number = 100,
  fudgeWeight: number = 0.5
) {
  const effectiveBaseGrade = getTeamBaseGrade(classData, groupName, baseGroupGrade);

  const groupStudents = classData.students.filter((s) => s.groupName === groupName);
  if (groupStudents.length <= 1) {
    return {
      ratio: 1.0,
      adjustedGrade: effectiveBaseGrade,
      teamBaseGrade: effectiveBaseGrade
    };
  }

  // Calculate peer averages received for each student in the group
  const peerAverages = groupStudents.map((s) => {
    const teammates = getTeammates(s.id, s.groupName, classData.students);
    let weightedScoreSum = 0;
    let totalWeightSum = 0;
    
    classData.fields.forEach((field) => {
      const avg = calculateStudentFieldAverage(s.id, field.id, classData.reviews, teammates);
      if (avg !== null) {
        const fieldWeight = field.weight !== undefined && field.weight > 0 
          ? field.weight 
          : (100 / Math.max(1, classData.fields.length));
        const fieldPercentage = field.max > 0 ? (avg / field.max) * 100 : 0;
        weightedScoreSum += fieldPercentage * fieldWeight;
        totalWeightSum += fieldWeight;
      }
    });

    // percentage score
    const pct = totalWeightSum > 0 ? (weightedScoreSum / totalWeightSum) / 100 : null;
    return { studentId: s.id, pct };
  });

  const validAverages = peerAverages.filter((x) => x.pct !== null) as { studentId: string; pct: number }[];
  if (validAverages.length === 0) {
    return {
      ratio: 1.0,
      adjustedGrade: effectiveBaseGrade,
      teamBaseGrade: effectiveBaseGrade
    };
  }

  // Group sum of peer average percentages
  const groupSum = validAverages.reduce((acc, x) => acc + x.pct, 0);
  const groupAvg = groupSum / groupStudents.length;

  const studentAvg = validAverages.find((x) => x.studentId === studentId)?.pct ?? null;
  if (studentAvg === null || groupAvg === 0) {
    return {
      ratio: 1.0,
      adjustedGrade: effectiveBaseGrade,
      teamBaseGrade: effectiveBaseGrade
    };
  }

  // WebPA ratio: individual peer average percentage divided by team's average percentage
  const ratio = Number((studentAvg / groupAvg).toFixed(3));
  
  // Adjusted Grade = effectiveBaseGrade * ((1 - fudgeWeight) + fudgeWeight * ratio)
  const adjustedGrade = Number((effectiveBaseGrade * ((1 - fudgeWeight) + fudgeWeight * ratio)).toFixed(1));

  return {
    ratio,
    adjustedGrade,
    teamBaseGrade: effectiveBaseGrade
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


