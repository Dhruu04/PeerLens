export interface GradingScaleField {
  id: string;
  name: string;
  min: number;
  max: number;
  weight: number; // For future-proofing weighting, defaults to 1
  description?: string; // Guidance / behavioral indicator for reviewers
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

export interface ClassData {
  id: string;
  name: string;
  fields: GradingScaleField[];
  students: Student[];
  reviews: Review[];
  deadline?: string | null;
  milestones?: Milestone[];
  targetScale?: number | null;
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
  const groupStudents = classData.students.filter((s) => s.groupName === groupName);
  if (groupStudents.length <= 1) {
    return {
      ratio: 1.0,
      adjustedGrade: baseGroupGrade
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
      adjustedGrade: baseGroupGrade
    };
  }

  // Group sum of peer average percentages
  const groupSum = validAverages.reduce((acc, x) => acc + x.pct, 0);
  const groupAvg = groupSum / groupStudents.length;

  const studentAvg = validAverages.find((x) => x.studentId === studentId)?.pct ?? null;
  if (studentAvg === null || groupAvg === 0) {
    return {
      ratio: 1.0,
      adjustedGrade: baseGroupGrade
    };
  }

  // WebPA ratio: individual peer average percentage divided by team's average percentage
  const ratio = Number((studentAvg / groupAvg).toFixed(3));
  
  // Adjusted Grade = baseGroupGrade * ((1 - fudgeWeight) + fudgeWeight * ratio)
  const adjustedGrade = Number((baseGroupGrade * ((1 - fudgeWeight) + fudgeWeight * ratio)).toFixed(1));

  return {
    ratio,
    adjustedGrade
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

