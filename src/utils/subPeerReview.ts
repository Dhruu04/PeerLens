// src/utils/subPeerReview.ts
// Formative Sub Peer Reviews & Longitudinal Milestone Trajectory Engine
// Allows professors to host formative peer reviews at custom intervals for long-duration projects,
// dynamically flagging struggling teammates in red, tracking growth/fall over time,
// and automatically recognizing turnaround recoveries when performance improves.

import type { ClassData, Student, Review } from './math';

export interface SubPeerReviewRound {
  id: string;
  title: string;              // e.g. "Sprint 1 Sub-Review", "Month 1 Progress Checkpoint"
  createdAt: string;          // ISO string
  deadline?: string | null;
  status: 'active' | 'closed';
  weight?: number;            // weight for cumulative score (default 1)
  reviews: Review[];          // peer evaluation reviews submitted in this round
  customNote?: string;
}

export interface SubPeerReviewConfig {
  atRiskDeltaThreshold: number;       // default: -10 (e.g. -10%)
  atRiskScoreCutoff: number;          // default: 60 (e.g. 60%)
  watchDeltaThreshold: number;        // default: -3.5
  thrivingDeltaThreshold: number;     // default: 6
  growthMinDelta: number;             // default: 4
  anonymizeFeedbackToStudents: boolean; // default: true
}

export const DEFAULT_SUB_PEER_REVIEW_CONFIG: SubPeerReviewConfig = {
  atRiskDeltaThreshold: -10,
  atRiskScoreCutoff: 60,
  watchDeltaThreshold: -3.5,
  thrivingDeltaThreshold: 6,
  growthMinDelta: 4,
  anonymizeFeedbackToStudents: true
};

export type StudentSubReviewFlagStatus = 
  | 'at_risk'        // Red flag: Substantially below team average or peer dissatisfaction
  | 'recovered'      // Turnaround: Previously below average, but currently at/above team average!
  | 'watch'          // Borderline: Moderately below team average (-4% to -10%)
  | 'thriving'       // Leader/High Performer: Well above team average (+6% or more)
  | 'on_track'       // On Track: Performing in harmony with team mean
  | 'pending';       // No reviews received yet in this round

export interface StudentRoundEvaluation {
  roundId: string;
  roundTitle: string;
  roundDate: string;
  status: 'active' | 'closed';
  scorePct: number | null;          // Score received out of 100%
  averageRubricScore: number | null;// e.g. 3.8 out of 5
  teamAvgPct: number | null;        // Team average score in this round
  deltaPct: number | null;          // scorePct - teamAvgPct (+5.2% or -16.4%)
  flagStatus: StudentSubReviewFlagStatus;
  reviewsCount: number;             // number of teammates who reviewed this student
  praiseTags: string[];
  strengths: string[];
  growthSuggestions: string[];
  criterionScores: Record<string, number>; // criterionId -> average score received
  rawReviews: Review[];             // Full underlying reviews for instructor inspection & editing
}

export interface StudentSubReviewTrajectory {
  studentId: string;
  studentName: string;
  groupName: string;
  studentEmail?: string;
  cumulativeScorePct: number | null;      // Weighted cumulative percentage across rounds
  cumulativeAverageRubric: number | null; // e.g. 4.1 / 5
  cumulativeTeamAvgPct: number | null;    // Cumulative team average
  cumulativeDeltaPct: number | null;      // Cumulative difference vs team (+/-)
  currentFlagStatus: StudentSubReviewFlagStatus;
  isManuallyOverridden?: boolean;         // True if instructor manually overrode flag
  manualOverrideStatus?: StudentSubReviewFlagStatus;
  hasHistoricalRedFlag: boolean;         // Was ever flagged in past rounds?
  roundsCount: number;                   // Number of rounds with data
  roundEvaluations: StudentRoundEvaluation[];
  trendDirection: 'growth' | 'fall' | 'stable' | 'insufficient_data';
  trendPoints: Array<{ roundTitle: string; scorePct: number; deltaPct: number }>;
  overallFeedbackSummary: {
    topStrengths: string[];
    topGrowthSuggestions: string[];
    topPraiseTags: string[];
  };
}

export interface TeamSubReviewSummary {
  groupName: string;
  memberCount: number;
  cumulativeTeamScorePct: number | null;
  activeFlaggedCount: number;
  recoveredCount: number;
  students: StudentSubReviewTrajectory[];
  roundAverages: Array<{
    roundId: string;
    roundTitle: string;
    teamAvgPct: number | null;
  }>;
}

export interface SubPeerReviewClassSummary {
  rounds: SubPeerReviewRound[];
  activeRound: SubPeerReviewRound | null;
  totalRounds: number;
  completedRounds: number;
  classCumulativeScorePct: number | null;
  totalStudents: number;
  flaggedAtRiskCount: number;       // Currently red-flagged students
  recoveredCount: number;           // Students who recovered from previous red flags
  watchCount: number;
  thrivingCount: number;
  config: SubPeerReviewConfig;
  teamSummaries: TeamSubReviewSummary[];
  allStudentTrajectories: StudentSubReviewTrajectory[];
}

export const DEFAULT_SUB_REVIEW_FIELDS: Array<{ id: string; name: string; min: number; max: number; weight: number }> = [
  { id: 'contrib', name: 'Contribution & Work Ethic', min: 1, max: 5, weight: 1 },
  { id: 'quality', name: 'Deliverable Quality', min: 1, max: 5, weight: 1 },
  { id: 'collab', name: 'Communication & Collaboration', min: 1, max: 5, weight: 1 }
];

/**
 * Calculates longitudinal sub peer review metrics, team benchmarks,
 * dynamic red flags, and turnaround recoveries across all milestones.
 */
export function calculateSubPeerReviewMetrics(classData: ClassData): SubPeerReviewClassSummary {
  const rawRounds = classData.subPeerReviewRounds || [];
  // Sort rounds chronologically
  const rounds = [...rawRounds].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const activeRound = rounds.find(r => r.status === 'active') || null;
  const completedRounds = rounds.filter(r => r.status === 'closed').length;

  const cfg: SubPeerReviewConfig = {
    ...DEFAULT_SUB_PEER_REVIEW_CONFIG,
    ...(classData.subPeerReviewConfig || {})
  };

  const students = classData.students || [];
  const fields = (classData.fields && classData.fields.length > 0)
    ? classData.fields
    : DEFAULT_SUB_REVIEW_FIELDS;

  // Group students by team
  const teamsMap = new Map<string, Student[]>();
  students.forEach(s => {
    const gName = (s.groupName && s.groupName.trim()) ? s.groupName.trim() : 'Unassigned';
    if (!teamsMap.has(gName)) {
      teamsMap.set(gName, []);
    }
    teamsMap.get(gName)!.push(s);
  });

  // 1. Calculate per-round evaluation for each student
  // Map of studentId -> array of StudentRoundEvaluation
  const studentEvalsMap = new Map<string, StudentRoundEvaluation[]>();
  students.forEach(s => studentEvalsMap.set(s.id, []));

  // Team averages per round: map of `${groupName}__${round.id}` -> teamAvgPct
  const teamRoundAvgMap = new Map<string, number | null>();

  rounds.forEach(round => {
    const roundReviews = round.reviews || [];

    // First pass: compute each student's scorePct in this round
    const studentRoundScores = new Map<string, {
      scorePct: number | null;
      averageRubric: number | null;
      reviewsCount: number;
      praiseTags: string[];
      strengths: string[];
      growthSuggestions: string[];
      criterionScores: Record<string, number>;
      rawReviews: Review[];
    }>();

    students.forEach(student => {
      // Find peer reviews received by this student in this round (exclude self reviews)
      const receivedReviews = roundReviews.filter(
        r => r.recipientId === student.id && r.reviewerId !== student.id
      );

      if (receivedReviews.length === 0) {
        studentRoundScores.set(student.id, {
          scorePct: null,
          averageRubric: null,
          reviewsCount: 0,
          praiseTags: [],
          strengths: [],
          growthSuggestions: [],
          criterionScores: {},
          rawReviews: []
        });
        return;
      }

      let totalPoints = 0;
      let totalMaxPoints = 0;
      const praiseTags: string[] = [];
      const strengths: string[] = [];
      const growthSuggestions: string[] = [];
      const critSums: Record<string, { sum: number; count: number }> = {};

      receivedReviews.forEach(rev => {
        if (rev.scores && typeof rev.scores === 'object') {
          Object.entries(rev.scores).forEach(([fid, val]) => {
            if (typeof val === 'number' && !isNaN(val)) {
              const matchedField = fields.find(f => f.id === fid);
              const fMax = matchedField?.max ?? 5;
              totalPoints += val;
              totalMaxPoints += fMax;
              if (!critSums[fid]) critSums[fid] = { sum: 0, count: 0 };
              critSums[fid].sum += val;
              critSums[fid].count += 1;
            }
          });
        }
        if (rev.praiseTags && Array.isArray(rev.praiseTags)) {
          praiseTags.push(...rev.praiseTags);
        }
        if (rev.strengthsText && rev.strengthsText.trim()) {
          strengths.push(rev.strengthsText.trim());
        }
        if (rev.growthText && rev.growthText.trim()) {
          growthSuggestions.push(rev.growthText.trim());
        }
      });

      const scorePct = totalMaxPoints > 0 ? Number(((totalPoints / totalMaxPoints) * 100).toFixed(1)) : null;
      const scaleMin = classData.scaleMin ?? 1;
      const scaleMax = classData.scaleMax ?? 5;
      const averageRubric = scorePct !== null
        ? Number((scaleMin + (scorePct / 100) * (scaleMax - scaleMin)).toFixed(2))
        : null;

      const criterionScores: Record<string, number> = {};
      Object.keys(critSums).forEach(fid => {
        if (critSums[fid].count > 0) {
          criterionScores[fid] = Number((critSums[fid].sum / critSums[fid].count).toFixed(2));
        }
      });

      studentRoundScores.set(student.id, {
        scorePct,
        averageRubric,
        reviewsCount: receivedReviews.length,
        praiseTags,
        strengths,
        growthSuggestions,
        criterionScores,
        rawReviews: receivedReviews
      });
    });

    // Second pass: compute team average for this round
    teamsMap.forEach((teamMembers, groupName) => {
      const validScores = teamMembers
        .map(m => studentRoundScores.get(m.id)?.scorePct)
        .filter((pct): pct is number => pct !== null && typeof pct === 'number');

      const teamAvg = validScores.length > 0
        ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1))
        : null;

      teamRoundAvgMap.set(`${groupName}__${round.id}`, teamAvg);
    });

    // Third pass: determine delta and round flag status for each student
    students.forEach(student => {
      const gName = (student.groupName && student.groupName.trim()) ? student.groupName.trim() : 'Unassigned';
      const roundData = studentRoundScores.get(student.id)!;
      const teamAvg = teamRoundAvgMap.get(`${gName}__${round.id}`) ?? null;

      let deltaPct: number | null = null;
      let flagStatus: StudentSubReviewFlagStatus = 'pending';

      if (roundData.scorePct !== null && teamAvg !== null) {
        deltaPct = Number((roundData.scorePct - teamAvg).toFixed(1));

        // Configurable flag thresholds:
        if (deltaPct <= cfg.atRiskDeltaThreshold || roundData.scorePct < cfg.atRiskScoreCutoff) {
          flagStatus = 'at_risk';
        } else if (deltaPct <= cfg.watchDeltaThreshold) {
          flagStatus = 'watch';
        } else if (deltaPct >= cfg.thrivingDeltaThreshold) {
          flagStatus = 'thriving';
        } else {
          flagStatus = 'on_track';
        }
      }

      studentEvalsMap.get(student.id)!.push({
        roundId: round.id,
        roundTitle: round.title,
        roundDate: round.createdAt,
        status: round.status,
        scorePct: roundData.scorePct,
        averageRubricScore: roundData.averageRubric,
        teamAvgPct: teamAvg,
        deltaPct,
        flagStatus,
        reviewsCount: roundData.reviewsCount,
        praiseTags: roundData.praiseTags,
        strengths: roundData.strengths,
        growthSuggestions: roundData.growthSuggestions,
        criterionScores: roundData.criterionScores,
        rawReviews: roundData.rawReviews
      });
    });
  });

  // 2. Build full Student Trajectories with dynamic recovery detection
  const allStudentTrajectories: StudentSubReviewTrajectory[] = [];
  let flaggedAtRiskCount = 0;
  let recoveredCount = 0;
  let watchCount = 0;
  let thrivingCount = 0;

  students.forEach(student => {
    const evals = studentEvalsMap.get(student.id) || [];
    const validEvals = evals.filter(e => e.scorePct !== null);

    // Cumulative score (weighted by round weight)
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let totalWeightedTeamAvg = 0;
    let totalTeamAvgWeight = 0;

    evals.forEach(e => {
      const r = rounds.find(rd => rd.id === e.roundId);
      const w = r?.weight && r.weight > 0 ? r.weight : 1;
      if (e.scorePct !== null) {
        totalWeightedScore += e.scorePct * w;
        totalWeight += w;
      }
      if (e.teamAvgPct !== null) {
        totalWeightedTeamAvg += e.teamAvgPct * w;
        totalTeamAvgWeight += w;
      }
    });

    const cumulativeScorePct = totalWeight > 0 ? Number((totalWeightedScore / totalWeight).toFixed(1)) : null;
    const cumulativeTeamAvgPct = totalTeamAvgWeight > 0 ? Number((totalWeightedTeamAvg / totalTeamAvgWeight).toFixed(1)) : null;
    const cumulativeDeltaPct = (cumulativeScorePct !== null && cumulativeTeamAvgPct !== null)
      ? Number((cumulativeScorePct - cumulativeTeamAvgPct).toFixed(1))
      : null;

    const scaleMin = classData.scaleMin ?? 1;
    const scaleMax = classData.scaleMax ?? 5;
    const cumulativeAverageRubric = cumulativeScorePct !== null
      ? Number((scaleMin + (cumulativeScorePct / 100) * (scaleMax - scaleMin)).toFixed(2))
      : null;

    // Check if the student was EVER flagged red in past rounds
    const hadHistoricalRedFlag = evals.some(e => e.flagStatus === 'at_risk');

    // Find the latest completed or latest available evaluation
    const latestEvalWithData = [...evals].reverse().find(e => e.scorePct !== null);

    let currentFlagStatus: StudentSubReviewFlagStatus = 'pending';

    if (latestEvalWithData) {
      // Dynamic Recovery Detection:
      // If student was flagged red in earlier rounds, BUT in the latest round they are no longer at risk,
      // they get celebrated as 'recovered' (Turnaround)!
      if (hadHistoricalRedFlag && latestEvalWithData.flagStatus !== 'at_risk' && (latestEvalWithData.deltaPct ?? 0) >= cfg.watchDeltaThreshold) {
        currentFlagStatus = 'recovered';
      } else {
        currentFlagStatus = latestEvalWithData.flagStatus;
      }
    }

    // Check Professor Manual Override
    const manualOverride = classData.subPeerReviewManualOverrides?.[student.id];
    let isManuallyOverridden = false;
    let manualOverrideStatus: StudentSubReviewFlagStatus | undefined = undefined;

    if (manualOverride) {
      currentFlagStatus = manualOverride;
      isManuallyOverridden = true;
      manualOverrideStatus = manualOverride;
    }

    if (currentFlagStatus === 'at_risk') flaggedAtRiskCount++;
    else if (currentFlagStatus === 'recovered') recoveredCount++;
    else if (currentFlagStatus === 'watch') watchCount++;
    else if (currentFlagStatus === 'thriving') thrivingCount++;

    // Trend direction
    let trendDirection: 'growth' | 'fall' | 'stable' | 'insufficient_data' = 'insufficient_data';
    if (validEvals.length >= 2) {
      const firstScore = validEvals[0].scorePct!;
      const lastScore = validEvals[validEvals.length - 1].scorePct!;
      const diff = lastScore - firstScore;
      if (diff >= cfg.growthMinDelta) trendDirection = 'growth';
      else if (diff <= -cfg.growthMinDelta) trendDirection = 'fall';
      else trendDirection = 'stable';
    } else if (validEvals.length === 1) {
      trendDirection = 'stable';
    }

    const trendPoints = validEvals.map(e => ({
      roundTitle: e.roundTitle,
      scorePct: e.scorePct!,
      deltaPct: e.deltaPct ?? 0
    }));

    // Aggregate feedback
    const allPraiseTags: string[] = [];
    const allStrengths: string[] = [];
    const allGrowthSuggestions: string[] = [];

    evals.forEach(e => {
      allPraiseTags.push(...e.praiseTags);
      allStrengths.push(...e.strengths);
      allGrowthSuggestions.push(...e.growthSuggestions);
    });

    allStudentTrajectories.push({
      studentId: student.id,
      studentName: student.name,
      groupName: (student.groupName && student.groupName.trim()) ? student.groupName.trim() : 'Unassigned',
      studentEmail: student.email,
      cumulativeScorePct,
      cumulativeAverageRubric,
      cumulativeTeamAvgPct,
      cumulativeDeltaPct,
      currentFlagStatus,
      isManuallyOverridden,
      manualOverrideStatus,
      hasHistoricalRedFlag: hadHistoricalRedFlag,
      roundsCount: validEvals.length,
      roundEvaluations: evals,
      trendDirection,
      trendPoints,
      overallFeedbackSummary: {
        topStrengths: Array.from(new Set(allStrengths)).slice(0, 6),
        topGrowthSuggestions: Array.from(new Set(allGrowthSuggestions)).slice(0, 6),
        topPraiseTags: Array.from(new Set(allPraiseTags)).slice(0, 10)
      }
    });
  });

  // 3. Build Team Summaries
  const teamSummaries: TeamSubReviewSummary[] = [];
  const sortedTeamNames = Array.from(teamsMap.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  sortedTeamNames.forEach(groupName => {
    const teamStudents = allStudentTrajectories.filter(s => s.groupName === groupName);
    const validScores = teamStudents
      .map(s => s.cumulativeScorePct)
      .filter((v): v is number => v !== null);

    const cumulativeTeamScorePct = validScores.length > 0
      ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1))
      : null;

    const activeFlaggedCount = teamStudents.filter(s => s.currentFlagStatus === 'at_risk').length;
    const recoveredInTeam = teamStudents.filter(s => s.currentFlagStatus === 'recovered').length;

    const roundAverages = rounds.map(r => ({
      roundId: r.id,
      roundTitle: r.title,
      teamAvgPct: teamRoundAvgMap.get(`${groupName}__${r.id}`) ?? null
    }));

    teamSummaries.push({
      groupName,
      memberCount: teamStudents.length,
      cumulativeTeamScorePct,
      activeFlaggedCount,
      recoveredCount: recoveredInTeam,
      students: teamStudents,
      roundAverages
    });
  });

  // Class Cumulative Average
  const allValidStudentScores = allStudentTrajectories
    .map(s => s.cumulativeScorePct)
    .filter((v): v is number => v !== null);

  const classCumulativeScorePct = allValidStudentScores.length > 0
    ? Number((allValidStudentScores.reduce((a, b) => a + b, 0) / allValidStudentScores.length).toFixed(1))
    : null;

  return {
    rounds,
    activeRound,
    totalRounds: rounds.length,
    completedRounds,
    classCumulativeScorePct,
    totalStudents: students.length,
    flaggedAtRiskCount,
    recoveredCount,
    watchCount,
    thrivingCount,
    config: cfg,
    teamSummaries,
    allStudentTrajectories
  };
}

/**
 * Generates realistic longitudinal sub peer review rounds spanning a multi-month project
 * with rich trajectories: recoveries, active red flags, high performers, and balanced scores.
 */
export function generateSampleSubPeerReviews(classData: ClassData): SubPeerReviewRound[] {
  const students = classData.students || [];
  const fields = (classData.fields && classData.fields.length > 0)
    ? classData.fields
    : DEFAULT_SUB_REVIEW_FIELDS;

  if (students.length === 0) {
    return [];
  }

  // Helper to generate reviews for a team in a given round
  const createTeamReviews = (roundIdx: number): Review[] => {
    const reviews: Review[] = [];

    // Group students by team
    const teamsMap = new Map<string, Student[]>();
    students.forEach(s => {
      const g = s.groupName || 'Unassigned';
      if (!teamsMap.has(g)) teamsMap.set(g, []);
      teamsMap.get(g)!.push(s);
    });

    teamsMap.forEach((teamMembers) => {
      if (teamMembers.length < 2) return;

      teamMembers.forEach((recipient, rIdx) => {
        teamMembers.forEach((reviewer) => {
          if (reviewer.id === recipient.id) return; // skip self

          // Diverse behaviors by recipient index pattern:
          // rIdx === 0: Steady leader (Thriving) -> high scores
          // rIdx === 1: Turnaround Student -> low in round 0, improved in round 1, high in round 2!
          // rIdx === 2: Struggling Student -> starts ok, drops low in round 2 (Active Red Flag!)
          // others: Normal balanced
          let performanceFactor = 0.85; // baseline 85%

          if (rIdx === 0) {
            performanceFactor = 0.94; // Consistent Pillar
          } else if (rIdx === 1) {
            // Turnaround student: 58% in R0, 74% in R1, 88% in R2
            performanceFactor = roundIdx === 0 ? 0.58 : roundIdx === 1 ? 0.74 : 0.89;
          } else if (rIdx === 2) {
            // Falling student: 82% in R0, 72% in R1, 56% in R2
            performanceFactor = roundIdx === 0 ? 0.82 : roundIdx === 1 ? 0.70 : 0.55;
          } else {
            performanceFactor = 0.82 + (rIdx % 3) * 0.05;
          }

          const scores: Record<string, number> = {};
          fields.forEach((f, fIdx) => {
            const min = f.min ?? 1;
            const max = f.max ?? 5;
            const span = max - min;
            // Add a little realistic variance per criterion
            const jitter = ((fIdx + roundIdx) % 3 === 0 ? -0.1 : 0.05);
            const clampedPct = Math.max(0.1, Math.min(1.0, performanceFactor + jitter));
            scores[f.id] = Math.round(min + clampedPct * span);
          });

          // Praise tags & feedback
          const praiseTags: string[] = [];
          let strengthsText: string | undefined;
          let growthText: string | undefined;

          if (performanceFactor >= 0.85) {
            praiseTags.push('Proactive Lead', 'Reliable Delivery', 'Clear Communication');
            strengthsText = 'Always completes commitments on time and helps coordinate team milestones.';
            if (performanceFactor < 0.9) {
              growthText = 'Could delegate more technical tasks to help other teammates grow.';
            }
          } else if (performanceFactor <= 0.65) {
            praiseTags.push('Good Ideas');
            strengthsText = 'Has strong creative contributions when present during brainstorming.';
            growthText = 'Needs to attend all scheduled team syncs and respond promptly on Slack.';
          } else {
            praiseTags.push('Team Player', 'Helpful Feedback');
            strengthsText = 'Consistent quality of work and receptive to peer feedback.';
            growthText = 'Keep pushing progress ahead of the milestone deadline.';
          }

          reviews.push({
            reviewerId: reviewer.id,
            recipientId: recipient.id,
            scores,
            praiseTags,
            strengthsText,
            growthText
          });
        });
      });
    });

    return reviews;
  };

  const now = Date.now();
  const dayMs = 86400000;

  const round1: SubPeerReviewRound = {
    id: `subrev_r1_${Date.now().toString(36)}`,
    title: 'Sprint 1: Scope & Foundations Review',
    createdAt: new Date(now - 45 * dayMs).toISOString(),
    deadline: new Date(now - 38 * dayMs).toISOString().slice(0, 10),
    status: 'closed',
    weight: 1,
    reviews: createTeamReviews(0),
    customNote: 'Initial team alignment, early task assignments, and kickoff communication.'
  };

  const round2: SubPeerReviewRound = {
    id: `subrev_r2_${Date.now().toString(36)}`,
    title: 'Sprint 2: Architecture & Prototype Checkpoint',
    createdAt: new Date(now - 25 * dayMs).toISOString(),
    deadline: new Date(now - 18 * dayMs).toISOString().slice(0, 10),
    status: 'closed',
    weight: 1,
    reviews: createTeamReviews(1),
    customNote: 'Mid-sprint architectural decisions, peer collaboration, and prototype build.'
  };

  const round3: SubPeerReviewRound = {
    id: `subrev_r3_${Date.now().toString(36)}`,
    title: 'Sprint 3: Midterm Feature Integration',
    createdAt: new Date(now - 8 * dayMs).toISOString(),
    deadline: new Date(now - 2 * dayMs).toISOString().slice(0, 10),
    status: 'closed',
    weight: 1,
    reviews: createTeamReviews(2),
    customNote: 'Core feature integration, code reviews, and cross-functional team delivery.'
  };

  const round4: SubPeerReviewRound = {
    id: `subrev_r4_${Date.now().toString(36)}`,
    title: 'Sprint 4: Pre-Final Milestone Checkpoint',
    createdAt: new Date(now - 1 * dayMs).toISOString(),
    deadline: new Date(now + 5 * dayMs).toISOString().slice(0, 10),
    status: 'active',
    weight: 1,
    reviews: createTeamReviews(2).slice(0, Math.floor(students.length * 1.5)), // partial submissions for active round
    customNote: 'Active sprint review ahead of final presentation delivery.'
  };

  return [round1, round2, round3, round4];
}
