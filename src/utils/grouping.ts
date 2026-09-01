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
    university?: number;
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
  universities: string[];
  uniqueUniversityCount: number;
  currentCountries: string[];
  uniqueCurrentCountryCount: number;
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
 * Converts a numerical English score (1-5) into a clean, human-readable CEFR level.
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
 * Extracts normalized effective university institution for a student.
 */
export function getEffectiveUniversity(s: Student): string {
  if (s.isExchange && s.currentUniversity && s.currentUniversity.trim()) {
    return s.currentUniversity.trim();
  }
  const uni = s.university || s.currentUniversity || s.originalUniversity || '';
  return uni.trim();
}

/**
 * Extracts normalized current country of residence/study.
 */
export function getEffectiveCurrentCountry(s: Student): string {
  if (s.currentCountry && s.currentCountry.trim()) {
    return normalizeNationality(s.currentCountry);
  }
  return normalizeNationality(s.nationality) || 'Unspecified';
}

/**
 * Extracts normalized nationality of origin.
 */
export function getEffectiveNationality(s: Student): string {
  return normalizeNationality(s.nationality || s.originalCountry) || 'Unspecified';
}

/**
 * Intelligent Multi-Criteria Diversity Grouping Engine
 * 
 * Balances:
 * 1. University Diversity (High Priority): Prevents clustering students from the same university.
 * 2. Smart Geographic & Nationality Diversity: Gives higher priority to difference in university/study location
 *    rather than pure nationality alone (e.g. an Italian student studying in Germany and an Italian student
 *    studying in Italy can naturally share a team without heavy penalties because they bring diverse institutional
 *    and country experiences).
 * 3. 50/50 Gender Parity.
 * 4. Balanced CEFR English proficiency distribution.
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

  // Clone student records with standardized fields
  const pool: Student[] = students.map(s => ({
    ...s,
    gender: (s.gender && s.gender.trim()) ? s.gender.trim() : 'Unspecified',
    nationality: getEffectiveNationality(s),
    currentCountry: getEffectiveCurrentCountry(s),
    university: getEffectiveUniversity(s),
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

  // Compute class-wide statistics
  const classAvgEnglish = pool.reduce((acc, s) => acc + getEnglishScore(s.englishProficiency), 0) / totalStudents;
  
  // Weights prioritizing University difference over raw nationality
  let wUni = 16.0;      // High priority to spread students from the same university
  let wGender = 12.0;   // High priority to balance male / female ratios
  let wNat = 8.0;       // Moderate priority for nationality (nuanced by host university/country)
  let wEng = 6.0;       // Balanced CEFR English distribution

  if (strategy === 'gender_first') {
    wGender = 26.0;
    wUni = 12.0;
    wNat = 5.0;
    wEng = 3.0;
  } else if (strategy === 'nationality_first') {
    wUni = 20.0;
    wNat = 16.0;
    wGender = 6.0;
    wEng = 4.0;
  } else if (strategy === 'random_fast') {
    wUni = 1.0;
    wGender = 1.0;
    wNat = 1.0;
    wEng = 1.0;
  }

  if (config.weights) {
    if (config.weights.gender !== undefined) wGender = config.weights.gender;
    if (config.weights.nationality !== undefined) wNat = config.weights.nationality;
    if (config.weights.university !== undefined) wUni = config.weights.university;
    if (config.weights.english !== undefined) wEng = config.weights.english;
  }

  // 1. Initial Stratified Partitioning (Snake distribution across sorted strata)
  // Sort students into multi-criteria strata: University -> Gender -> Current Country -> Nationality -> English Score
  const stratifiedPool = [...pool].sort((a, b) => {
    // University comparison (primary: separate students from same university into different teams)
    const ua = (a.university || '').toLowerCase();
    const ub = (b.university || '').toLowerCase();
    if (ua !== ub) return ua.localeCompare(ub);

    // Gender comparison
    const ga = a.gender || '';
    const gb = b.gender || '';
    if (ga !== gb) return ga.localeCompare(gb);

    // Current Country comparison
    const ca = (a.currentCountry || '').toLowerCase();
    const cb = (b.currentCountry || '').toLowerCase();
    if (ca !== cb) return ca.localeCompare(cb);

    // Nationality comparison
    const na = (a.nationality || '').toLowerCase();
    const nb = (b.nationality || '').toLowerCase();
    if (na !== nb) return na.localeCompare(nb);

    // English proficiency comparison
    return getEnglishScore(b.englishProficiency) - getEnglishScore(a.englishProficiency);
  });

  // Distribute in snake-order (0, 1, 2... K-1, K-1, K-2... 0)
  let currentGroupIdx = 0;
  let direction = 1;

  for (const student of stratifiedPool) {
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
      cost += Math.pow(diff, 2) * wGender;
    }

    // B. University Clustering Penalty (HIGHEST PRIORITY)
    // Penalize multiple students from the same university in the same group
    const uniCounts: Record<string, number> = {};
    for (const s of group) {
      const u = (s.university || '').toLowerCase().trim();
      if (u && u !== 'unspecified' && u !== 'n/a') {
        uniCounts[u] = (uniCounts[u] || 0) + 1;
      }
    }
    for (const count of Object.values(uniCounts)) {
      if (count > 1) {
        // Heavy quadratic penalty for clustering same university
        cost += Math.pow(count - 1, 2) * wUni * 5.0;
      }
    }

    // C. Smart Nationality & Geographic Location Mixing
    // Pairwise evaluation:
    // If two students share the SAME nationality:
    // - If they have DIFFERENT universities OR DIFFERENT current countries (e.g. Italian at TU Munich vs Italian at Polimi):
    //   -> Almost NO penalty (they bring genuine institutional/cross-border diversity)!
    // - If they share the SAME nationality AND the SAME university AND the SAME current country:
    //   -> Full clustering penalty!
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const s1 = group[i];
        const s2 = group[j];

        const nat1 = (s1.nationality || '').toLowerCase().trim();
        const nat2 = (s2.nationality || '').toLowerCase().trim();

        if (nat1 && nat2 && nat1 !== 'unspecified' && nat1 === nat2) {
          const uni1 = (s1.university || '').toLowerCase().trim();
          const uni2 = (s2.university || '').toLowerCase().trim();
          const curCountry1 = (s1.currentCountry || '').toLowerCase().trim();
          const curCountry2 = (s2.currentCountry || '').toLowerCase().trim();

          const hasDifferentUni = uni1 && uni2 && uni1 !== uni2;
          const hasDifferentCountry = curCountry1 && curCountry2 && curCountry1 !== curCountry2;

          if (hasDifferentUni || hasDifferentCountry) {
            // Diverse academic or geographic environment! Low penalty
            cost += wNat * 0.5;
          } else {
            // Same nationality + same university/country: clustering penalty
            cost += wNat * 4.0;
          }
        }
      }
    }

    // D. English Proficiency balance penalty
    const avgScore = group.reduce((acc, s) => acc + getEnglishScore(s.englishProficiency), 0) / group.length;
    cost += Math.pow(avgScore - classAvgEnglish, 2) * wEng * 4.0;

    // Check if group has 0 proficient/advanced speakers
    const hasAdvancedOrNative = group.some(s => getEnglishScore(s.englishProficiency) >= 4);
    if (!hasAdvancedOrNative && group.length >= 3) {
      cost += 25.0 * wEng;
    }

    return cost;
  }

  function evaluateTotalCost(): number {
    return groupBuckets.reduce((acc, grp) => acc + evaluateGroupCost(grp), 0);
  }

  // 3. Iterative Local Search / Optimization Swaps (Simulated Annealing)
  let currentTotalCost = evaluateTotalCost();
  const maxIterations = 3000;

  for (let iter = 0; iter < maxIterations; iter++) {
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

    const oldCost = evaluateGroupCost(g1) + evaluateGroupCost(g2);

    const s1 = g1[s1Idx];
    const s2 = g2[s2Idx];
    g1[s1Idx] = s2;
    g2[s2Idx] = s1;

    const newCost = evaluateGroupCost(g1) + evaluateGroupCost(g2);

    if (newCost < oldCost) {
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
 * Calculates detailed multi-dimensional diversity metrics for a single group.
 */
export function calculateGroupReport(groupName: string, members: Student[], classAvgEnglish: number = 3.5): GroupDiversityReport {
  const genderCounts: Record<string, number> = {};
  const natSet = new Set<string>();
  const uniSet = new Set<string>();
  const curCountrySet = new Set<string>();
  const englishLevels: Record<string, number> = {};
  let totalEnglishScore = 0;

  for (const s of members) {
    const g = s.gender || 'Unspecified';
    genderCounts[g] = (genderCounts[g] || 0) + 1;

    const n = getEffectiveNationality(s);
    if (n && n !== 'Unspecified') natSet.add(n);

    const u = getEffectiveUniversity(s);
    if (u && u !== 'Unassigned' && u !== 'N/A') uniSet.add(u);

    const c = getEffectiveCurrentCountry(s);
    if (c && c !== 'Unspecified') curCountrySet.add(c);

    const eng = s.englishProficiency || 'Fluent (C1/C2)';
    englishLevels[eng] = (englishLevels[eng] || 0) + 1;
    totalEnglishScore += getEnglishScore(eng);
  }

  const studentCount = members.length;
  const uniqueNationalityCount = natSet.size;
  const uniqueUniversityCount = uniSet.size;
  const uniqueCurrentCountryCount = curCountrySet.size;
  const avgEnglishScore = studentCount > 0 ? Number((totalEnglishScore / studentCount).toFixed(1)) : 0;

  // Diversity Score (0 to 100)
  // Components:
  // 1. University diversity ratio (unique unis / total members) - 35 pts
  // 2. Nationality & Country diversity (unique nationalities & host countries) - 30 pts
  // 3. Gender parity (female / male balance) - 20 pts
  // 4. English spread (variance from class mean) - 15 pts
  let score = 100;

  if (studentCount >= 2) {
    // University duplicates penalty
    const uniDuplicates = Math.max(0, studentCount - uniqueUniversityCount);
    score -= (uniDuplicates * 14);

    // Nationality duplicates penalty (mitigated if universities or current countries differ)
    let effectiveNatDuplicates = 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const s1 = members[i];
        const s2 = members[j];
        const n1 = getEffectiveNationality(s1);
        const n2 = getEffectiveNationality(s2);
        if (n1 && n2 && n1 !== 'Unspecified' && n1 === n2) {
          const u1 = getEffectiveUniversity(s1);
          const u2 = getEffectiveUniversity(s2);
          const c1 = getEffectiveCurrentCountry(s1);
          const c2 = getEffectiveCurrentCountry(s2);
          if (u1 === u2 && c1 === c2) {
            effectiveNatDuplicates += 1;
          } else {
            effectiveNatDuplicates += 0.25;
          }
        }
      }
    }
    score -= Math.min(25, Math.round(effectiveNatDuplicates * 10));

    // Gender skew penalty
    const females = genderCounts['Female'] || genderCounts['female'] || 0;
    const males = genderCounts['Male'] || genderCounts['male'] || 0;
    const specified = females + males;
    if (specified >= 2) {
      const diff = Math.abs(females - males);
      if (diff > 1) {
        score -= (diff * 8);
      }
    }

    // English deviation penalty
    const engDev = Math.abs(avgEnglishScore - classAvgEnglish);
    score -= (engDev * 8);
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
    universities: Array.from(uniSet),
    uniqueUniversityCount,
    currentCountries: Array.from(curCountrySet),
    uniqueCurrentCountryCount,
    englishLevels,
    avgEnglishScore,
    avgEnglishCEFR: avgCEFR.full,
    diversityScore: finalDiversityScore
  };
}
