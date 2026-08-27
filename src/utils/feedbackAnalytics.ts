import type { ClassData } from './math';
import { getTeammates, calculateStudentFieldAverage } from './math';

export interface JohariMetric {
  selfScorePct: number | null;
  peerScorePct: number | null;
  gapPct: number | null;
  category: 'calibrated' | 'overestimating' | 'underestimating' | 'insufficient_data';
  label: string;
  badgeClass: string;
  color: string;
  bgColor: string;
  description: string;
  iconName: 'check' | 'trending-up' | 'trending-down' | 'help';
}

/**
 * Computes the Johari Window Self-Awareness Alignment for a student.
 * Compares average self-evaluation percentage against average peer-evaluation percentage.
 */
export function calculateJohariWindowMetric(studentId: string, classData: ClassData): JohariMetric {
  const student = classData.students.find(s => s.id === studentId);
  if (!student) {
    return {
      selfScorePct: null,
      peerScorePct: null,
      gapPct: null,
      category: 'insufficient_data',
      label: 'No Data',
      badgeClass: 'badge-secondary',
      color: 'var(--text-muted)',
      bgColor: 'var(--bg-app)',
      description: 'Student not found in classroom roster.',
      iconName: 'help'
    };
  }

  // 1. Calculate Self Score Percentage
  const selfReview = classData.reviews.find(r => r.reviewerId === studentId && r.recipientId === studentId);
  let selfScorePct: number | null = null;
  if (selfReview && selfReview.scores && Object.keys(selfReview.scores).length > 0) {
    let selfSum = 0;
    let selfMaxSum = 0;
    classData.fields.forEach(f => {
      const s = selfReview.scores[f.id];
      if (typeof s === 'number') {
        selfSum += s;
        selfMaxSum += f.max;
      }
    });
    if (selfMaxSum > 0) {
      selfScorePct = Math.round((selfSum / selfMaxSum) * 100);
    }
  }

  // 2. Calculate Peer Score Percentage
  const teammates = getTeammates(student.id, student.groupName, classData.students);
  let peerSum = 0;
  let peerMaxSum = 0;
  let hasPeerScore = false;

  classData.fields.forEach(f => {
    const avg = calculateStudentFieldAverage(student.id, f.id, classData.reviews, teammates);
    if (avg !== null) {
      peerSum += avg;
      peerMaxSum += f.max;
      hasPeerScore = true;
    }
  });

  const peerScorePct = hasPeerScore && peerMaxSum > 0 ? Math.round((peerSum / peerMaxSum) * 100) : null;

  // 3. Compare Gap
  if (selfScorePct === null || peerScorePct === null) {
    return {
      selfScorePct,
      peerScorePct,
      gapPct: null,
      category: 'insufficient_data',
      label: selfScorePct === null ? 'Self-Review Needed' : 'Awaiting Peer Reviews',
      badgeClass: 'badge-secondary',
      color: 'var(--text-muted)',
      bgColor: 'var(--bg-app)',
      description: 'Both self-evaluation and teammate reviews are required to measure self-awareness alignment.',
      iconName: 'help'
    };
  }

  const gap = selfScorePct - peerScorePct; // positive = self-rated higher than peers

  if (Math.abs(gap) <= 7.5) {
    return {
      selfScorePct,
      peerScorePct,
      gapPct: gap,
      category: 'calibrated',
      label: 'Accurately Calibrated',
      badgeClass: 'badge-teal',
      color: 'var(--accent-teal)',
      bgColor: 'var(--accent-teal-light)',
      description: `High self-awareness: Self-evaluation (${selfScorePct}%) aligns closely with teammate evaluation consensus (${peerScorePct}%).`,
      iconName: 'check'
    };
  }

  if (gap > 7.5) {
    return {
      selfScorePct,
      peerScorePct,
      gapPct: gap,
      category: 'overestimating',
      label: 'Performance Blind Spot (Overestimating)',
      badgeClass: 'badge-amber',
      color: 'var(--accent-amber)',
      bgColor: 'var(--accent-amber-light)',
      description: `Self-evaluation (${selfScorePct}%) is +${gap}% higher than teammate average (${peerScorePct}%). Potential developmental blind spot.`,
      iconName: 'trending-up'
    };
  }

  return {
    selfScorePct,
    peerScorePct,
    gapPct: gap,
    category: 'underestimating',
    label: 'Hidden Potential (Underestimating)',
    badgeClass: 'badge-primary',
    color: 'var(--primary)',
    bgColor: 'var(--primary-light)',
    description: `Self-evaluation (${selfScorePct}%) is ${Math.abs(gap)}% lower than teammate evaluation (${peerScorePct}%). Student may underestimate their team impact.`,
    iconName: 'trending-down'
  };
}

export interface FeedbackThemeInsight {
  word: string;
  count: number;
  category: 'strength' | 'growth';
}

export interface ClassFeedbackAnalysis {
  totalStrengthsComments: number;
  totalGrowthComments: number;
  topStrengthsThemes: FeedbackThemeInsight[];
  topGrowthThemes: FeedbackThemeInsight[];
  topPraiseTags: { tag: string; count: number }[];
  flaggedComments: { reviewerId: string; recipientName: string; text: string; reason: string }[];
}

const COMMON_STOPWORDS = new Set([
  'the', 'and', 'to', 'a', 'of', 'in', 'i', 'is', 'that', 'it', 'on', 'you', 'this', 'for', 'but', 
  'with', 'are', 'have', 'be', 'at', 'or', 'as', 'was', 'so', 'if', 'out', 'not', 'they', 'we', 
  'an', 'by', 'from', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'more', 'about', 'which',
  'when', 'one', 'my', 'me', 'he', 'she', 'him', 'her', 'his', 'hers', 'them', 'who', 'could', 'very',
  'can', 'also', 'did', 'do', 'does', 'been', 'has', 'had', 'should', 'would', 'will', 'well', 'good', 'great'
]);

/**
 * Analyzes qualitative written feedback across the entire classroom.
 * Surfaces top recurring strengths, improvement themes, praise tag distribution, and anonymity check flags.
 */
export function extractClassFeedbackInsights(classData: ClassData): ClassFeedbackAnalysis {
  const strengthsCounts: Record<string, number> = {};
  const growthCounts: Record<string, number> = {};
  const praiseTagCounts: Record<string, number> = {};
  const flaggedComments: { reviewerId: string; recipientName: string; text: string; reason: string }[] = [];

  let totalStrengthsComments = 0;
  let totalGrowthComments = 0;

  // Collect student names for anonymity leakage check
  const studentNamesList = classData.students.map(s => s.name.toLowerCase().trim()).filter(n => n.length > 2);

  classData.reviews.forEach(rev => {
    // Exclude self-evaluations for teammate qualitative analysis
    if (rev.reviewerId === rev.recipientId) return;

    const recipient = classData.students.find(s => s.id === rev.recipientId);
    const recipientName = recipient?.name || 'Unknown Student';

    // 1. Process Praise Tags
    if (Array.isArray(rev.praiseTags)) {
      rev.praiseTags.forEach(tag => {
        praiseTagCounts[tag] = (praiseTagCounts[tag] || 0) + 1;
      });
    }

    // 2. Process Strengths Comments
    if (rev.strengthsText && rev.strengthsText.trim()) {
      totalStrengthsComments++;
      const text = rev.strengthsText.trim();
      
      // Tokenize
      const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !COMMON_STOPWORDS.has(w));
      words.forEach(w => {
        strengthsCounts[w] = (strengthsCounts[w] || 0) + 1;
      });

      // Anonymity Check
      const lowerText = text.toLowerCase();
      for (const name of studentNamesList) {
        if (lowerText.includes(name)) {
          flaggedComments.push({
            reviewerId: rev.reviewerId,
            recipientName,
            text,
            reason: `Contains student name: "${name}"`
          });
          break;
        }
      }
    }

    // 3. Process Growth Comments
    if (rev.growthText && rev.growthText.trim()) {
      totalGrowthComments++;
      const text = rev.growthText.trim();

      const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !COMMON_STOPWORDS.has(w));
      words.forEach(w => {
        growthCounts[w] = (growthCounts[w] || 0) + 1;
      });

      // Anonymity Check
      const lowerText = text.toLowerCase();
      for (const name of studentNamesList) {
        if (lowerText.includes(name)) {
          flaggedComments.push({
            reviewerId: rev.reviewerId,
            recipientName,
            text,
            reason: `Contains student name: "${name}"`
          });
          break;
        }
      }
    }
  });

  // Sort top keywords
  const topStrengthsThemes: FeedbackThemeInsight[] = Object.entries(strengthsCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count, category: 'strength' }));

  const topGrowthThemes: FeedbackThemeInsight[] = Object.entries(growthCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count, category: 'growth' }));

  const topPraiseTags = Object.entries(praiseTagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));

  return {
    totalStrengthsComments,
    totalGrowthComments,
    topStrengthsThemes,
    topGrowthThemes,
    topPraiseTags,
    flaggedComments
  };
}
