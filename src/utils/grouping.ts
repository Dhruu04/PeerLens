import { normalizeNationality, type Student } from './math';

export type DiversityStrategy = 'balanced_all' | 'gender_first' | 'nationality_first' | 'random_fast';

export interface GroupingConfig {
  targetSize?: number;
  groupCount?: number;
  prefix?: string;
  strategy?: DiversityStrategy;
  weights?: {
    gender?: number;
    nationality?: number;
    english?: number;
  };
}

export interface GroupDiversityReport {
  groupName: string;
  studentCount: number;
  students: Student[];
  genderCounts: Record<string, number>;
  nationalities: string[];
  uniqueNationalityCount: number;
  englishLevels: Record<string, number>;
  avgEnglishScore: number;
  avgEnglishCEFR: string;
  diversityScore: number; // 0 - 100%
}

export interface DiversityGroupingResult {
  updatedStudents: Student[];
  groups: GroupDiversityReport[];
  overallDiversityScore: number;
  genderBalanceRating: 'Optimal' | 'Good' | 'Moderate';
  nationalityMixRating: 'Highly Mixed' | 'Balanced' | 'Moderate';
  englishMixRating: 'Evenly Distributed' | 'Good' | 'Fair';
}

const ENGLISH_SCORE_MAP: Record<string, number> = {
  'native / bilingual': 5,
  'native': 5,
  'bilingual': 5,
  'fluent (c1/c2)': 4,
  'fluent': 4,
  'c1': 4,
  'c2': 4,
  'advanced (b2)': 3,
  'advanced': 3,
  'b2': 3,
  'intermediate (b1)': 2,
  'intermediate': 2,
  'b1': 2,
  'basic (a1/a2)': 1,
  'basic': 1,
  'a1': 1,
  'a2': 1
};

export function getEnglishScore(level?: string): number {
  if (!level) return 3;
  const cleaned = level.toLowerCase().trim();
  for (const [key, val] of Object.entries(ENGLISH_SCORE_MAP)) {
    if (cleaned.includes(key)) return val;
  }
  return 3;
}

/**
 * Converts a numerical English score (1-5) into a clean, human-readable CEFR level (A1, A2, B1, B2, C1, C2/Native).
 */
export function getCEFRLevelFromScore(score: number): { code: string; label: string; full: string } {
  if (score >= 4.5) {
    return { code: 'C2', label: 'Native / Bilingual', full: 'C2 (Native/Bilingual)' };
  } else if (score >= 3.5) {
    return { code: 'C1', label: 'Fluent', full: 'C1 (Fluent)' };
  } else if (score >= 2.5) {
    return { code: 'B2', label: 'Advanced', full: 'B2 (Advanced)' };
  } else if (score >= 1.7) {
    return { code: 'B1', label: 'Intermediate', full: 'B1 (Intermediate)' };
  } else if (score >= 1.2) {
    return { code: 'A2', label: 'Elementary', full: 'A2 (Elementary)' };
  } else {
    return { code: 'A1', label: 'Basic', full: 'A1 (Basic)' };
  }
}

/**
 * Intelligent Multi-Criteria Diversity Grouping Engine
 * Balances Gender representation (e.g. 50/50 male-female), mixes Nationalities,
 * and distributes English Proficiency levels evenly across all teams.
 */
export function generateDiverseGroups(
  students: Student[],
  config: GroupingConfig
): DiversityGroupingResult {
  if (!students || students.length === 0) {
    return {
      updatedStudents: [],
      groups: [],
      overallDiversityScore: 100,
      genderBalanceRating: 'Optimal',
      nationalityMixRating: 'Highly Mixed',
      englishMixRating: 'Evenly Distributed'
    };
  }

  const totalStudents = students.length;
  const prefix = (config.prefix && config.prefix.trim()) ? config.prefix.trim() : 'Team';
  const strategy = config.strategy || 'balanced_all';

  // Determine number of groups K
  let numGroups = 1;
  if (config.groupCount && config.groupCount >= 1) {
    numGroups = Math.min(config.groupCount, totalStudents);
  } else if (config.targetSize && config.targetSize >= 2) {
    numGroups = Math.max(1, Math.round(totalStudents / config.targetSize));
  } else {
    numGroups = Math.max(1, Math.ceil(totalStudents / 4));
  }

  // Handle trivial 1-group case
  if (numGroups <= 1) {
    const singleGroupName = `${prefix} 1`;
    const updated = students.map(s => ({ ...s, groupName: singleGroupName }));
    const rep = calculateGroupReport(singleGroupName, updated);
    return {
      updatedStudents: updated,
      groups: [rep],
      overallDiversityScore: 100,
      genderBalanceRating: 'Optimal',
      nationalityMixRating: 'Highly Mixed',
      englishMixRating: 'Evenly Distributed'
    };
  }

  // Clone student records
  const pool: Student[] = students.map(s => ({
    ...s,
    gender: (s.gender && s.gender.trim()) ? s.gender.trim() : 'Unspecified',
    nationality: normalizeNationality(s.nationality) || 'Unspecified',
    englishProficiency: (s.englishProficiency && s.englishProficiency.trim()) ? s.englishProficiency.trim() : 'Fluent (C1/C2)'
  }));

  // Target group sizes: distribute remainder evenly
  const baseSize = Math.floor(totalStudents / numGroups);
  const remainder = totalStudents % numGroups;
  const targetSizes: number[] = Array.from({ length: numGroups }, (_, i) => 
    i < remainder ? baseSize + 1 : baseSize
  );

  // Group buckets initialized
  const groupBuckets: Student[][] = Array.from({ length: numGroups }, () => []);

  // Compute class-wide statistics for penalty targets
  const classAvgEnglish = pool.reduce((acc, s) => acc + getEnglishScore(s.englishProficiency), 0) / totalStudents;
  
  // Weights based on chosen strategy
  let wGender = 12.0;
  let wNat = 10.0;
  let wEng = 6.0;

  if (strategy === 'gender_first') {
    wGender = 25.0;
    wNat = 5.0;
    wEng = 3.0;
  } else if (strategy === 'nationality_first') {
    wGender = 5.0;
    wNat = 25.0;
    wEng = 4.0;
  } else if (strategy === 'random_fast') {
    wGender = 1.0;
    wNat = 1.0;
    wEng = 1.0;
  }

  if (config.weights) {
    if (config.weights.gender !== undefined) wGender = config.weights.gender;
    if (config.weights.nationality !== undefined) wNat = config.weights.nationality;
    if (config.weights.english !== undefined) wEng = config.weights.english;
  }

  // 1. Initial Stratified Partitioning (Snake distribution across sorted strata)
  // Sort students into multi-criteria strata: Gender -> Nationality -> English Score
  const stratifiedPool = [...pool].sort((a, b) => {
    // Gender comparison
    const ga = a.gender || '';
    const gb = b.gender || '';
    if (ga !== gb) return ga.localeCompare(gb);

    // Nationality comparison
    const na = a.nationality || '';
    const nb = b.nationality || '';
    if (na !== nb) return na.localeCompare(nb);

    // English proficiency comparison
    return getEnglishScore(b.englishProficiency) - getEnglishScore(a.englishProficiency);
  });

  // Distribute in snake-order (0, 1, 2... K-1, K-1, K-2... 0)
  let currentGroupIdx = 0;
  let direction = 1;

  for (const student of stratifiedPool) {
    // Find next available group that has capacity
    let attempts = 0;
    while (groupBuckets[currentGroupIdx].length >= targetSizes[currentGroupIdx] && attempts < numGroups) {
      currentGroupIdx += direction;
      if (currentGroupIdx >= numGroups) {
        currentGroupIdx = numGroups - 1;
        direction = -1;
      } else if (currentGroupIdx < 0) {
        currentGroupIdx = 0;
        direction = 1;
      }
      attempts++;
    }

    groupBuckets[currentGroupIdx].push(student);

    // Move index in snake pattern
    currentGroupIdx += direction;
    if (currentGroupIdx >= numGroups) {
      currentGroupIdx = numGroups - 1;
      direction = -1;
    } else if (currentGroupIdx < 0) {
      currentGroupIdx = 0;
      direction = 1;
    }
  }

  // 2. Cost function evaluation
  function evaluateGroupCost(group: Student[]): number {
    if (group.length === 0) return 0;
    let cost = 0;

    // A. Gender penalty: penalize skew from balanced ratio
    const genderCounts: Record<string, number> = {};
    for (const s of group) {
      const g = (s.gender || 'Unspecified').toLowerCase();
      genderCounts[g] = (genderCounts[g] || 0) + 1;
    }

    const females = genderCounts['female'] || 0;
    const males = genderCounts['male'] || 0;
    const specified = females + males;
    if (specified >= 2) {
      const diff = Math.abs(females - males);
      // Square difference to penalize extreme imbalances (e.g. 4 females 0 males)
      cost += Math.pow(diff, 2) * wGender;
    }

    // B. Nationality clustering penalty: penalize multiple students from identical nationality in same team
    const natCounts: Record<string, number> = {};
    for (const s of group) {
      const n = (s.nationality || 'Unspecified').toLowerCase();
      if (n !== 'unspecified') {
        natCounts[n] = (natCounts[n] || 0) + 1;
      }
    }
    for (const count of Object.values(natCounts)) {
      if (count > 1) {
        // High penalty for duplicates
        cost += Math.pow(count - 1, 2) * wNat * 4.0;
      }
    }

    // C. English Proficiency balance penalty
    const avgScore = group.reduce((acc, s) => acc + getEnglishScore(s.englishProficiency), 0) / group.length;
    cost += Math.pow(avgScore - classAvgEnglish, 2) * wEng * 5.0;

    // Check if group has 0 proficient/advanced speakers
    const hasAdvancedOrNative = group.some(s => getEnglishScore(s.englishProficiency) >= 4);
    if (!hasAdvancedOrNative && group.length >= 3) {
      cost += 30.0 * wEng;
    }

    return cost;
  }

  function evaluateTotalCost(): number {
    return groupBuckets.reduce((acc, grp) => acc + evaluateGroupCost(grp), 0);
  }

  // 3. Iterative Local Search / Optimization Swaps (Simulated Annealing)
  let currentTotalCost = evaluateTotalCost();
  const maxIterations = 2500;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Pick two random distinct groups
    const g1Idx = Math.floor(Math.random() * numGroups);
    let g2Idx = Math.floor(Math.random() * numGroups);
    while (g2Idx === g1Idx) {
      g2Idx = Math.floor(Math.random() * numGroups);
    }

    const g1 = groupBuckets[g1Idx];
    const g2 = groupBuckets[g2Idx];

    if (g1.length === 0 || g2.length === 0) continue;

    const s1Idx = Math.floor(Math.random() * g1.length);
    const s2Idx = Math.floor(Math.random() * g2.length);

    // Compute cost before swap for these 2 groups
    const oldCost = evaluateGroupCost(g1) + evaluateGroupCost(g2);

    // Tentatively swap
    const s1 = g1[s1Idx];
    const s2 = g2[s2Idx];
    g1[s1Idx] = s2;
    g2[s2Idx] = s1;

    // Compute cost after swap
    const newCost = evaluateGroupCost(g1) + evaluateGroupCost(g2);

    if (newCost < oldCost) {
      // Keep swap (cost decreased)
      currentTotalCost += (newCost - oldCost);
    } else {
      // Revert swap
      g1[s1Idx] = s1;
      g2[s2Idx] = s2;
    }
  }

  // 4. Construct Final Structured Output & Diversity Reports
  const updatedStudents: Student[] = [];
  const groupReports: GroupDiversityReport[] = [];

  groupBuckets.forEach((bucket, idx) => {
    const groupName = `${prefix} ${idx + 1}`;
    const assignedMembers = bucket.map(s => ({
      ...s,
      groupName
    }));

    updatedStudents.push(...assignedMembers);
    groupReports.push(calculateGroupReport(groupName, assignedMembers, classAvgEnglish));
  });

  // Calculate overall metrics
  const avgDiversityScore = groupReports.length > 0
    ? Math.round(groupReports.reduce((acc, g) => acc + g.diversityScore, 0) / groupReports.length)
    : 100;

  // Compute qualitative rating labels
  const genderBalanceRating = avgDiversityScore >= 85 ? 'Optimal' : avgDiversityScore >= 70 ? 'Good' : 'Moderate';
  const nationalityMixRating = avgDiversityScore >= 80 ? 'Highly Mixed' : avgDiversityScore >= 65 ? 'Balanced' : 'Moderate';
  const englishMixRating = avgDiversityScore >= 75 ? 'Evenly Distributed' : avgDiversityScore >= 60 ? 'Good' : 'Fair';

  return {
    updatedStudents,
    groups: groupReports,
    overallDiversityScore: avgDiversityScore,
    genderBalanceRating,
    nationalityMixRating,
    englishMixRating
  };
}

/**
 * Calculates detailed diversity metrics for a single group.
 */
export function calculateGroupReport(groupName: string, members: Student[], classAvgEnglish: number = 3.5): GroupDiversityReport {
  const genderCounts: Record<string, number> = {};
  const natSet = new Set<string>();
  const englishLevels: Record<string, number> = {};
  let totalEnglishScore = 0;

  for (const s of members) {
    const g = s.gender || 'Unspecified';
    genderCounts[g] = (genderCounts[g] || 0) + 1;

    const n = normalizeNationality(s.nationality);
    if (n) natSet.add(n);

    const eng = s.englishProficiency || 'Fluent (C1/C2)';
    englishLevels[eng] = (englishLevels[eng] || 0) + 1;
    totalEnglishScore += getEnglishScore(eng);
  }

  const studentCount = members.length;
  const uniqueNationalityCount = natSet.size;
  const avgEnglishScore = studentCount > 0 ? Number((totalEnglishScore / studentCount).toFixed(1)) : 0;

  // Diversity Score (0 to 100)
  // Components:
  // 1. Nationality diversity ratio (unique nats / total members) - 40 pts
  // 2. Gender balance (female / male parity) - 35 pts
  // 3. English spread variance from class mean - 25 pts
  let score = 100;

  if (studentCount >= 2) {
    // Nationality penalty: duplicates
    const natDuplicates = Math.max(0, studentCount - uniqueNationalityCount);
    score -= (natDuplicates * 15);

    // Gender skew penalty
    const females = genderCounts['Female'] || genderCounts['female'] || 0;
    const males = genderCounts['Male'] || genderCounts['male'] || 0;
    const specified = females + males;
    if (specified >= 2) {
      const diff = Math.abs(females - males);
      if (diff > 1) {
        score -= (diff * 10);
      }
    }

    // English deviation penalty
    const engDev = Math.abs(avgEnglishScore - classAvgEnglish);
    score -= (engDev * 10);
  }

  const finalDiversityScore = Math.max(35, Math.min(100, Math.round(score)));
  const avgCEFR = getCEFRLevelFromScore(avgEnglishScore);

  return {
    groupName,
    studentCount,
    students: members,
    genderCounts,
    nationalities: Array.from(natSet),
    uniqueNationalityCount,
    englishLevels,
    avgEnglishScore,
    avgEnglishCEFR: avgCEFR.full,
    diversityScore: finalDiversityScore
  };
}
