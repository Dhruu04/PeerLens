import { normalizeNationality, type Student } from './math';

export type GroupingRuleMode = 
  | 'disperse'         // Maximize diversity / spread values evenly across different teams
  | 'cluster'          // Group matching values together in the same team
  | 'balance'          // Balance distribution / ratios / averages evenly across all teams
  | 'strict_disperse'; // Strict separation (heavily penalizes putting identical values in same team)

export interface GroupingRule {
  id: string;
  name: string;             // Display name, e.g. "Gender Balance", "Nationality Mixing"
  fieldKey: string;         // 'gender' | 'nationality' | 'university' | 'englishProficiency' | 'degree' | 'studentType' | customKey
  mode: GroupingRuleMode;
  weight: number;           // 1 to 50 (or 0 if disabled)
  enabled: boolean;         // Active toggle
  description?: string;     // Contextual guide for users
}

export type DiversityStrategy = 
  | 'custom'
  | 'balanced_all' 
  | 'gender_first' 
  | 'nationality_first' 
  | 'degree_first'
  | 'random_fast';

export interface CustomDiversityField {
  id: string;
  name: string;
  key: string;
  weight: number;
  mode: 'disperse' | 'cluster';
}

export interface GroupingWeights {
  gender?: number;
  nationality?: number;
  university?: number;
  english?: number;
  degree?: number;
  studentType?: number;
  [customKey: string]: number | undefined;
}

export interface GroupingConfig {
  targetSize?: number;
  groupCount?: number;
  prefix?: string;
  rules?: GroupingRule[];
  strategy?: DiversityStrategy;
  weights?: GroupingWeights;
  customFields?: CustomDiversityField[];
  pinnedStudentMap?: Record<string, string>;
}

export interface RuleSatisfactionReport {
  ruleId: string;
  ruleName: string;
  fieldKey: string;
  mode: GroupingRuleMode;
  weight: number;
  satisfactionScore: number; // 0 - 100%
  summary: string;
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
  ruleSatisfactions?: RuleSatisfactionReport[];
  customFieldSummaries?: Record<string, {
    fieldName: string;
    key: string;
    mode: 'disperse' | 'cluster';
    uniqueCount: number;
    score: number;
    values: Record<string, number>;
  }>;
  diversityScore: number; // 0 - 100%
}

export interface DiversityGroupingResult {
  updatedStudents: Student[];
  groups: GroupDiversityReport[];
  overallDiversityScore: number;
  activeRulesCount: number;
  overallRuleBreakdown: RuleSatisfactionReport[];
  genderBalanceRating: 'Optimal' | 'Good' | 'Moderate';
  nationalityMixRating: 'Highly Mixed' | 'Balanced' | 'Moderate';
  englishMixRating: 'Evenly Distributed' | 'Good' | 'Fair';
  customFieldRating?: 'Optimal' | 'Good' | 'Moderate';
}

export interface DiscoveredRosterField {
  key: string;
  name: string;
  count: number;
  distinctCount: number;
  sampleValues: { value: string; count: number }[];
  isStandard: boolean;
}

export const DEFAULT_GROUPING_RULES: GroupingRule[] = [
  {
    id: 'rule_gender',
    name: 'Gender Parity & Balance',
    fieldKey: 'gender',
    mode: 'balance',
    weight: 20,
    enabled: true,
    description: 'Even distribution of Male, Female, and Non-binary students across teams'
  },
  {
    id: 'rule_university',
    name: 'University & Campus Dispersal',
    fieldKey: 'university',
    mode: 'disperse',
    weight: 25,
    enabled: true,
    description: 'Separate students from the same home or host campus into different teams'
  },
  {
    id: 'rule_nationality',
    name: 'Nationality & Origin Diversity',
    fieldKey: 'nationality',
    mode: 'disperse',
    weight: 18,
    enabled: true,
    description: 'Mix different nationalities and cultural backgrounds across teams'
  },
  {
    id: 'rule_english',
    name: 'Language Proficiency Balance',
    fieldKey: 'englishProficiency',
    mode: 'balance',
    weight: 15,
    enabled: true,
    description: 'Evenly distribute CEFR English proficiency levels (C2 to A1) across groups'
  },
  {
    id: 'rule_degree',
    name: 'Degree & Major Diversity',
    fieldKey: 'degree',
    mode: 'disperse',
    weight: 15,
    enabled: true,
    description: 'Disperse students with matching degrees or academic majors'
  },
  {
    id: 'rule_student_type',
    name: 'Student Mobility Status',
    fieldKey: 'studentType',
    mode: 'disperse',
    weight: 10,
    enabled: false,
    description: 'Mix exchange, international, and domestic students across teams'
  }
];

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
 * Robust helper to extract custom or dynamic attribute values from a student record.
 */
export function getStudentFieldValue(student: Student, key: string, name?: string): string {
  if (!student) return '';
  
  if (key === 'university') {
    return getEffectiveUniversity(student);
  }
  if (key === 'nationality') {
    return getEffectiveNationality(student);
  }
  if (key === 'currentCountry') {
    return getEffectiveCurrentCountry(student);
  }

  // 1. Check customFields dictionary
  if (student.customFields) {
    if (student.customFields[key] !== undefined && student.customFields[key] !== '') {
      return String(student.customFields[key]).trim();
    }
    if (name && student.customFields[name] !== undefined && student.customFields[name] !== '') {
      return String(student.customFields[name]).trim();
    }
  }

  // 2. Check direct property
  const direct = (student as any)[key] || (name ? (student as any)[name] : undefined);
  if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
    return String(direct).trim();
  }

  // 3. Case-insensitive key/name resolution
  const normKey = key.toLowerCase().replace(/[\s_-]+/g, '');
  const normName = name ? name.toLowerCase().replace(/[\s_-]+/g, '') : '';

  if (student.customFields) {
    for (const [k, v] of Object.entries(student.customFields)) {
      const cNorm = k.toLowerCase().replace(/[\s_-]+/g, '');
      if ((cNorm === normKey || (normName && cNorm === normName)) && v !== undefined && v !== null && String(v).trim() !== '') {
        return String(v).trim();
      }
    }
  }

  for (const [k, v] of Object.entries(student)) {
    const cNorm = k.toLowerCase().replace(/[\s_-]+/g, '');
    if ((cNorm === normKey || (normName && cNorm === normName)) && v !== undefined && v !== null && typeof v === 'string' && v.trim() !== '') {
      return v.trim();
    }
  }

  return '';
}

/**
 * Scans an active student cohort and discovers all populated attributes and custom tags.
 */
export function discoverRosterFields(students: Student[]): DiscoveredRosterField[] {
  if (!students || students.length === 0) return [];

  const fieldKeyMap: Record<string, {
    name: string;
    isStandard: boolean;
    values: Record<string, number>;
  }> = {
    gender: { name: 'Gender Identity', isStandard: true, values: {} },
    university: { name: 'University / Campus', isStandard: true, values: {} },
    nationality: { name: 'Nationality / Origin', isStandard: true, values: {} },
    englishProficiency: { name: 'CEFR Language Proficiency', isStandard: true, values: {} },
    degree: { name: 'Degree / Major', isStandard: true, values: {} },
    studentType: { name: 'Student Mobility Status', isStandard: true, values: {} },
    currentCountry: { name: 'Host / Current Country', isStandard: true, values: {} }
  };

  students.forEach(s => {
    // Standard keys
    for (const key of Object.keys(fieldKeyMap)) {
      const val = getStudentFieldValue(s, key);
      if (val && val !== 'Unspecified' && val !== 'Normal' && val !== 'N/A') {
        fieldKeyMap[key].values[val] = (fieldKeyMap[key].values[val] || 0) + 1;
      }
    }

    // Custom fields dictionary
    if (s.customFields) {
      for (const [cKey, cVal] of Object.entries(s.customFields)) {
        if (cVal && String(cVal).trim() !== '') {
          if (!fieldKeyMap[cKey]) {
            const formattedName = cKey.charAt(0).toUpperCase() + cKey.slice(1).replace(/([A-Z])/g, ' $1');
            fieldKeyMap[cKey] = { name: formattedName, isStandard: false, values: {} };
          }
          const strVal = String(cVal).trim();
          fieldKeyMap[cKey].values[strVal] = (fieldKeyMap[cKey].values[strVal] || 0) + 1;
        }
      }
    }
  });

  const results: DiscoveredRosterField[] = [];

  for (const [key, meta] of Object.entries(fieldKeyMap)) {
    const totalCount = Object.values(meta.values).reduce((a, b) => a + b, 0);
    const distinctCount = Object.keys(meta.values).length;

    if (totalCount > 0) {
      const sortedVals = Object.entries(meta.values)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));

      results.push({
        key,
        name: meta.name,
        count: totalCount,
        distinctCount,
        sampleValues: sortedVals,
        isStandard: meta.isStandard
      });
    }
  }

  return results.sort((a, b) => b.count - a.count);
}

/**
 * Intelligent Custom Rule-Based Diversity Grouping Engine with Enhanced Math & Multi-Objective simulated annealing
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
      activeRulesCount: 0,
      overallRuleBreakdown: [],
      genderBalanceRating: 'Optimal',
      nationalityMixRating: 'Highly Mixed',
      englishMixRating: 'Evenly Distributed'
    };
  }

  const totalStudents = students.length;
  const prefix = (config.prefix && config.prefix.trim()) ? config.prefix.trim() : 'Team';
  
  // Resolve active rules
  let effectiveRules: GroupingRule[] = [];
  if (config.rules && config.rules.length > 0) {
    effectiveRules = config.rules.filter(r => r.enabled && r.weight > 0);
  } else if (config.customFields && config.customFields.length > 0) {
    effectiveRules = config.customFields.map(cf => ({
      id: cf.id,
      name: cf.name,
      fieldKey: cf.key,
      mode: cf.mode,
      weight: cf.weight,
      enabled: true
    }));
  } else {
    effectiveRules = DEFAULT_GROUPING_RULES.filter(r => r.enabled && r.weight > 0);
  }

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
    const rep = calculateGroupReport(singleGroupName, updated, 3.5, effectiveRules);
    return {
      updatedStudents: updated,
      groups: [rep],
      overallDiversityScore: 100,
      activeRulesCount: effectiveRules.length,
      overallRuleBreakdown: rep.ruleSatisfactions || [],
      genderBalanceRating: 'Optimal',
      nationalityMixRating: 'Highly Mixed',
      englishMixRating: 'Evenly Distributed',
      customFieldRating: 'Optimal'
    };
  }

  // Standardize student pool
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

  const groupBuckets: Student[][] = Array.from({ length: numGroups }, () => []);
  const classAvgEnglish = pool.reduce((acc, s) => acc + getEnglishScore(s.englishProficiency), 0) / totalStudents;

  // Compute cohort-wide distributions for optimal chi-squared balancing
  const cohortDistributions: Record<string, Record<string, number>> = {};
  for (const rule of effectiveRules) {
    if (rule.mode === 'balance') {
      cohortDistributions[rule.fieldKey] = {};
      for (const s of pool) {
        const val = getStudentFieldValue(s, rule.fieldKey, rule.name).toLowerCase().trim() || 'unspecified';
        cohortDistributions[rule.fieldKey][val] = (cohortDistributions[rule.fieldKey][val] || 0) + 1;
      }
    }
  }

  // 1. Initial Stratified Partitioning with Pinned Student Anchoring
  const groupNames: string[] = Array.from({ length: numGroups }, (_, i) => `${prefix} ${i + 1}`);
  const pinnedMap = config.pinnedStudentMap || {};
  const pinnedIds = new Set(Object.keys(pinnedMap));

  // Pre-assign pinned students to their corresponding buckets
  const unpinnedPool: Student[] = [];
  for (const s of pool) {
    if (pinnedIds.has(s.id)) {
      const targetGroupName = pinnedMap[s.id];
      const gIdx = groupNames.indexOf(targetGroupName);
      if (gIdx >= 0 && gIdx < numGroups) {
        groupBuckets[gIdx].push(s);
      } else {
        unpinnedPool.push(s);
      }
    } else {
      unpinnedPool.push(s);
    }
  }

  const sortedActiveRules = [...effectiveRules].sort((a, b) => b.weight - a.weight);

  const stratifiedPool = [...unpinnedPool].sort((a, b) => {
    for (const rule of sortedActiveRules) {
      if (rule.fieldKey === 'englishProficiency') {
        const diff = getEnglishScore(b.englishProficiency) - getEnglishScore(a.englishProficiency);
        if (diff !== 0) return diff;
      } else {
        const va = getStudentFieldValue(a, rule.fieldKey, rule.name).toLowerCase();
        const vb = getStudentFieldValue(b, rule.fieldKey, rule.name).toLowerCase();
        if (va !== vb) return va.localeCompare(vb);
      }
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  // Distribute unpinned students in snake-order to balance baseline characteristics
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

  // 2. Mathematically Calibrated Multi-Constraint Cost Function
  function evaluateGroupCost(group: Student[]): number {
    if (group.length === 0) return 0;
    let cost = 0;
    const gSize = group.length;

    for (const rule of effectiveRules) {
      const w = rule.weight;
      if (w <= 0) continue;

      if (rule.mode === 'balance') {
        if (rule.fieldKey === 'gender') {
          const genderCounts: Record<string, number> = {};
          for (const s of group) {
            const g = (s.gender || 'Unspecified').toLowerCase();
            genderCounts[g] = (genderCounts[g] || 0) + 1;
          }
          const females = genderCounts['female'] || 0;
          const males = genderCounts['male'] || 0;
          const diff = Math.abs(females - males);
          if (diff > 1) {
            cost += Math.pow(diff - 1, 2) * w * 2.0;
          }
        } else if (rule.fieldKey === 'englishProficiency') {
          const avgScore = group.reduce((acc, s) => acc + getEnglishScore(s.englishProficiency), 0) / gSize;
          cost += Math.pow(avgScore - classAvgEnglish, 2) * w * 5.0;
          const hasAdvanced = group.some(s => getEnglishScore(s.englishProficiency) >= 4);
          if (!hasAdvanced && gSize >= 3) {
            cost += 25.0 * w;
          }
        } else {
          // Categorical Chi-Squared Expected Balance
          const groupValCounts: Record<string, number> = {};
          for (const s of group) {
            const val = getStudentFieldValue(s, rule.fieldKey, rule.name).toLowerCase().trim() || 'unspecified';
            groupValCounts[val] = (groupValCounts[val] || 0) + 1;
          }
          const cDist = cohortDistributions[rule.fieldKey];
          if (cDist) {
            for (const [vKey, cCount] of Object.entries(cDist)) {
              const expected = (cCount / totalStudents) * gSize;
              const actual = groupValCounts[vKey] || 0;
              cost += Math.pow(actual - expected, 2) * w * 2.2;
            }
          }
        }
      } else if (rule.mode === 'disperse') {
        if (rule.fieldKey === 'nationality') {
          for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
              const s1 = group[i];
              const s2 = group[j];
              const nat1 = (s1.nationality || '').toLowerCase().trim();
              const nat2 = (s2.nationality || '').toLowerCase().trim();
              if (nat1 && nat2 && nat1 !== 'unspecified' && nat1 === nat2) {
                const uni1 = (s1.university || '').toLowerCase().trim();
                const uni2 = (s2.university || '').toLowerCase().trim();
                if (uni1 && uni2 && uni1 !== uni2) {
                  cost += w * 1.0;
                } else {
                  cost += w * 4.0;
                }
              }
            }
          }
        } else {
          const valCounts: Record<string, number> = {};
          for (const s of group) {
            const val = getStudentFieldValue(s, rule.fieldKey, rule.name).toLowerCase().trim();
            if (val && val !== 'unspecified' && val !== 'n/a' && val !== 'none') {
              valCounts[val] = (valCounts[val] || 0) + 1;
            }
          }
          for (const count of Object.values(valCounts)) {
            if (count > 1) {
              cost += Math.pow(count - 1, 2) * w * 3.8;
            }
          }
        }
      } else if (rule.mode === 'strict_disperse') {
        const valCounts: Record<string, number> = {};
        for (const s of group) {
          const val = getStudentFieldValue(s, rule.fieldKey, rule.name).toLowerCase().trim();
          if (val && val !== 'unspecified' && val !== 'n/a' && val !== 'none') {
            valCounts[val] = (valCounts[val] || 0) + 1;
          }
        }
        for (const count of Object.values(valCounts)) {
          if (count > 1) {
            cost += Math.pow(count - 1, 2) * w * 25.0; // High barrier penalty
          }
        }
      } else if (rule.mode === 'cluster') {
        const valCounts: Record<string, number> = {};
        for (const s of group) {
          const val = getStudentFieldValue(s, rule.fieldKey, rule.name).toLowerCase().trim();
          if (val && val !== 'unspecified' && val !== 'n/a' && val !== 'none') {
            valCounts[val] = (valCounts[val] || 0) + 1;
          }
        }
        const uniqueCount = Object.keys(valCounts).length;
        if (uniqueCount > 1) {
          cost += Math.pow(uniqueCount - 1, 2) * w * 5.0;
        }
      }
    }

    return cost;
  }

  function evaluateTotalCost(): number {
    return groupBuckets.reduce((acc, grp) => acc + evaluateGroupCost(grp), 0);
  }

  // 3. Simulated Annealing with Dynamic Exponential Cooling
  let currentTotalCost = evaluateTotalCost();
  const maxIterations = 4500;
  const initialTemp = 120.0;

  for (let iter = 0; iter < maxIterations; iter++) {
    const temp = initialTemp * Math.pow(1 - iter / maxIterations, 1.5);
    const g1Idx = Math.floor(Math.random() * numGroups);
    let g2Idx = Math.floor(Math.random() * numGroups);
    while (g2Idx === g1Idx && numGroups > 1) {
      g2Idx = Math.floor(Math.random() * numGroups);
    }

    const g1 = groupBuckets[g1Idx];
    const g2 = groupBuckets[g2Idx];

    if (g1.length === 0 || g2.length === 0) continue;

    const s1Idx = Math.floor(Math.random() * g1.length);
    const s2Idx = Math.floor(Math.random() * g2.length);

    const s1 = g1[s1Idx];
    const s2 = g2[s2Idx];

    // Preserve pinned students: do not swap if either student is pinned
    if (pinnedIds.has(s1.id) || pinnedIds.has(s2.id)) continue;

    const oldCost = evaluateGroupCost(g1) + evaluateGroupCost(g2);

    g1[s1Idx] = s2;
    g2[s2Idx] = s1;

    const newCost = evaluateGroupCost(g1) + evaluateGroupCost(g2);
    const delta = newCost - oldCost;

    if (delta < 0 || (temp > 0.05 && Math.random() < Math.exp(-delta / Math.max(0.01, temp)))) {
      currentTotalCost += delta;
    } else {
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
    groupReports.push(calculateGroupReport(groupName, assignedMembers, classAvgEnglish, effectiveRules));
  });

  // Calculate overall metrics
  const avgDiversityScore = groupReports.length > 0
    ? Math.round(groupReports.reduce((acc, g) => acc + g.diversityScore, 0) / groupReports.length)
    : 100;

  // Aggregate overall rule breakdowns
  const ruleMap: Record<string, { name: string; key: string; mode: GroupingRuleMode; weight: number; sumScore: number; count: number }> = {};
  for (const grp of groupReports) {
    if (grp.ruleSatisfactions) {
      for (const rs of grp.ruleSatisfactions) {
        if (!ruleMap[rs.ruleId]) {
          ruleMap[rs.ruleId] = {
            name: rs.ruleName,
            key: rs.fieldKey,
            mode: rs.mode,
            weight: rs.weight,
            sumScore: 0,
            count: 0
          };
        }
        ruleMap[rs.ruleId].sumScore += rs.satisfactionScore;
        ruleMap[rs.ruleId].count += 1;
      }
    }
  }

  const overallRuleBreakdown: RuleSatisfactionReport[] = Object.entries(ruleMap).map(([id, r]) => ({
    ruleId: id,
    ruleName: r.name,
    fieldKey: r.key,
    mode: r.mode,
    weight: r.weight,
    satisfactionScore: r.count > 0 ? Math.round(r.sumScore / r.count) : 100,
    summary: `${r.name}: ${r.count > 0 ? Math.round(r.sumScore / r.count) : 100}% compliance`
  }));

  const genderBalanceRating = avgDiversityScore >= 85 ? 'Optimal' : avgDiversityScore >= 70 ? 'Good' : 'Moderate';
  const nationalityMixRating = avgDiversityScore >= 80 ? 'Highly Mixed' : avgDiversityScore >= 65 ? 'Balanced' : 'Moderate';
  const englishMixRating = avgDiversityScore >= 75 ? 'Evenly Distributed' : avgDiversityScore >= 60 ? 'Good' : 'Fair';
  const customFieldRating = avgDiversityScore >= 80 ? 'Optimal' : avgDiversityScore >= 65 ? 'Good' : 'Moderate';

  return {
    updatedStudents,
    groups: groupReports,
    overallDiversityScore: avgDiversityScore,
    activeRulesCount: effectiveRules.length,
    overallRuleBreakdown,
    genderBalanceRating,
    nationalityMixRating,
    englishMixRating,
    customFieldRating
  };
}

/**
 * Calculates detailed multi-dimensional diversity metrics for a single group based on active custom rules.
 */
export function calculateGroupReport(
  groupName: string, 
  members: Student[], 
  classAvgEnglish: number = 3.5,
  rulesOrCustomFields?: GroupingRule[] | CustomDiversityField[]
): GroupDiversityReport {
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

  const activeRules: GroupingRule[] = (rulesOrCustomFields || []).map((item: any) => {
    if ('fieldKey' in item) {
      return item as GroupingRule;
    }
    return {
      id: item.id,
      name: item.name,
      fieldKey: item.key,
      mode: item.mode,
      weight: item.weight,
      enabled: true
    };
  });

  const ruleSatisfactions: RuleSatisfactionReport[] = [];
  const customFieldSummaries: Record<string, { fieldName: string; key: string; mode: 'disperse' | 'cluster'; uniqueCount: number; score: number; values: Record<string, number> }> = {};

  let totalWeight = 0;
  let weightedScoreSum = 0;

  for (const rule of activeRules) {
    if (!rule.enabled || rule.weight <= 0) continue;

    let ruleScore = 100;
    let summary = '';
    const valCounts: Record<string, number> = {};
    const uniqueVals = new Set<string>();

    for (const s of members) {
      const rawVal = getStudentFieldValue(s, rule.fieldKey, rule.name);
      const val = rawVal || 'Unspecified';
      valCounts[val] = (valCounts[val] || 0) + 1;
      if (rawVal && rawVal !== 'Unspecified' && rawVal !== 'N/A' && rawVal !== 'None') {
        uniqueVals.add(rawVal);
      }
    }

    if (rule.mode === 'balance') {
      if (rule.fieldKey === 'gender') {
        const females = genderCounts['Female'] || genderCounts['female'] || 0;
        const males = genderCounts['Male'] || genderCounts['male'] || 0;
        const diff = Math.abs(females - males);
        ruleScore = Math.max(40, 100 - (diff > 1 ? (diff - 1) * 18 : 0));
        summary = `${females}F / ${males}M ratio`;
      } else if (rule.fieldKey === 'englishProficiency') {
        const dev = Math.abs(avgEnglishScore - classAvgEnglish);
        ruleScore = Math.max(40, Math.round(100 - (dev * 20)));
        summary = `Avg CEFR ${getCEFRLevelFromScore(avgEnglishScore).code} (${avgEnglishScore.toFixed(1)})`;
      } else {
        const maxValCount = Math.max(...Object.values(valCounts), 0);
        const dupes = Math.max(0, maxValCount - 1);
        ruleScore = Math.max(40, 100 - (dupes * 18));
        summary = `${uniqueVals.size} distinct categories`;
      }
    } else if (rule.mode === 'disperse' || rule.mode === 'strict_disperse') {
      const duplicates = Math.max(0, studentCount - uniqueVals.size);
      const penaltyFactor = rule.mode === 'strict_disperse' ? 28 : 16;
      ruleScore = Math.max(35, Math.round(100 - (duplicates * penaltyFactor)));
      summary = `${uniqueVals.size} unique / ${studentCount} members`;
    } else if (rule.mode === 'cluster') {
      if (uniqueVals.size > 1) {
        ruleScore = Math.max(30, Math.round(100 - ((uniqueVals.size - 1) * 22)));
        summary = `${uniqueVals.size} clusters mixed`;
      } else {
        ruleScore = 100;
        summary = `Single cluster aligned (${Array.from(uniqueVals)[0] || 'Unassigned'})`;
      }
    }

    ruleSatisfactions.push({
      ruleId: rule.id,
      ruleName: rule.name,
      fieldKey: rule.fieldKey,
      mode: rule.mode,
      weight: rule.weight,
      satisfactionScore: ruleScore,
      summary
    });

    customFieldSummaries[rule.id] = {
      fieldName: rule.name,
      key: rule.fieldKey,
      mode: (rule.mode === 'cluster' ? 'cluster' : 'disperse'),
      uniqueCount: uniqueVals.size,
      score: ruleScore,
      values: valCounts
    };

    totalWeight += rule.weight;
    weightedScoreSum += (ruleScore * rule.weight);
  }

  let finalDiversityScore = 100;
  if (totalWeight > 0) {
    finalDiversityScore = Math.round(weightedScoreSum / totalWeight);
  } else if (studentCount >= 2) {
    const uniDupes = Math.max(0, studentCount - uniqueUniversityCount);
    const natDupes = Math.max(0, studentCount - uniqueNationalityCount);
    finalDiversityScore = Math.max(50, 100 - (uniDupes * 15) - (natDupes * 10));
  }

  finalDiversityScore = Math.max(30, Math.min(100, finalDiversityScore));
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
    ruleSatisfactions,
    customFieldSummaries,
    diversityScore: finalDiversityScore
  };
}
