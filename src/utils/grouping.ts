import { normalizeNationality, type Student } from './math';

export type DiversityStrategy = 
  | 'balanced_all' 
  | 'gender_first' 
  | 'nationality_first' 
  | 'degree_first'
  | 'random_fast'
  | 'custom';

export interface CustomDiversityField {
  id: string;
  name: string;        // e.g. "Degree / Major", "Student Type", "Skillset", "Role"
  key: string;         // property name on Student (e.g. "degree", "studentType", "role", or custom tag)
  weight: number;      // 0 - 50 (default: 15)
  mode: 'disperse' | 'cluster'; // 'disperse' mixes evenly across teams, 'cluster' keeps similar together
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
  strategy?: DiversityStrategy;
  weights?: GroupingWeights;
  customFields?: CustomDiversityField[];
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
  customFieldSummaries?: Record<string, {
    fieldName: string;
    key: string;
    mode: 'disperse' | 'cluster';
    uniqueCount: number;
    score: number; // 0 - 100%
    values: Record<string, number>;
  }>;
  diversityScore: number; // 0 - 100%
}

export interface DiversityGroupingResult {
  updatedStudents: Student[];
  groups: GroupDiversityReport[];
  overallDiversityScore: number;
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
    degree: { name: 'Degree / Major', isStandard: true, values: {} },
    studentType: { name: 'Student Mobility Status', isStandard: true, values: {} },
    nationality: { name: 'Nationality / Origin', isStandard: true, values: {} },
    university: { name: 'University / Campus', isStandard: true, values: {} },
    currentCountry: { name: 'Host / Current Country', isStandard: true, values: {} },
    englishProficiency: { name: 'CEFR Language Proficiency', isStandard: true, values: {} },
    gender: { name: 'Gender Identity', isStandard: true, values: {} }
  };

  // Inspect each student
  students.forEach(s => {
    // Standard keys
    for (const key of Object.keys(fieldKeyMap)) {
      const val = getStudentFieldValue(s, key);
      if (val && val !== 'Unspecified' && val !== 'Normal' && val !== 'N/A') {
        fieldKeyMap[key].values[val] = (fieldKeyMap[key].values[val] || 0) + 1;
      }
    }

    // Inspect customFields dictionary
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
 * Intelligent Multi-Criteria Diversity Grouping Engine
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
  const customFields = config.customFields || [];

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
    const rep = calculateGroupReport(singleGroupName, updated, 3.5, customFields);
    return {
      updatedStudents: updated,
      groups: [rep],
      overallDiversityScore: 100,
      genderBalanceRating: 'Optimal',
      nationalityMixRating: 'Highly Mixed',
      englishMixRating: 'Evenly Distributed',
      customFieldRating: 'Optimal'
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
  
  // Weights configuration
  let wUni = 16.0;      // High priority to spread students from the same university
  let wGender = 12.0;   // High priority to balance male / female ratios
  let wNat = 8.0;       // Moderate priority for nationality
  let wEng = 6.0;       // Balanced CEFR English distribution
  let wDegree = 10.0;   // Degree/major balance
  let wStudentType = 6.0; // Student mobility balance

  if (strategy === 'gender_first') {
    wGender = 28.0;
    wUni = 10.0;
    wNat = 5.0;
    wEng = 3.0;
    wDegree = 4.0;
  } else if (strategy === 'nationality_first') {
    wUni = 20.0;
    wNat = 18.0;
    wGender = 6.0;
    wEng = 4.0;
    wDegree = 4.0;
  } else if (strategy === 'degree_first') {
    wDegree = 24.0;
    wUni = 14.0;
    wGender = 8.0;
    wNat = 6.0;
    wEng = 4.0;
  } else if (strategy === 'random_fast') {
    wUni = 1.0;
    wGender = 1.0;
    wNat = 1.0;
    wEng = 1.0;
    wDegree = 1.0;
    wStudentType = 1.0;
  }

  // Override with explicit config weights if provided
  if (config.weights) {
    if (config.weights.gender !== undefined) wGender = config.weights.gender;
    if (config.weights.nationality !== undefined) wNat = config.weights.nationality;
    if (config.weights.university !== undefined) wUni = config.weights.university;
    if (config.weights.english !== undefined) wEng = config.weights.english;
    if (config.weights.degree !== undefined) wDegree = config.weights.degree;
    if (config.weights.studentType !== undefined) wStudentType = config.weights.studentType;
  }

  // 1. Initial Stratified Partitioning
  const stratifiedPool = [...pool].sort((a, b) => {
    // Custom field sort: cluster fields first, then disperse fields
    if (customFields.length > 0) {
      for (const cf of customFields) {
        if (cf.weight >= 8) {
          const va = getStudentFieldValue(a, cf.key, cf.name).toLowerCase();
          const vb = getStudentFieldValue(b, cf.key, cf.name).toLowerCase();
          if (va !== vb) return va.localeCompare(vb);
        }
      }
    }

    if (strategy === 'degree_first') {
      const da = (a.degree || '').toLowerCase();
      const db = (b.degree || '').toLowerCase();
      if (da !== db) return da.localeCompare(db);
    }

    const ua = (a.university || '').toLowerCase();
    const ub = (b.university || '').toLowerCase();
    if (ua !== ub) return ua.localeCompare(ub);

    const ga = a.gender || '';
    const gb = b.gender || '';
    if (ga !== gb) return ga.localeCompare(gb);

    const ca = (a.currentCountry || '').toLowerCase();
    const cb = (b.currentCountry || '').toLowerCase();
    if (ca !== cb) return ca.localeCompare(cb);

    const na = (a.nationality || '').toLowerCase();
    const nb = (b.nationality || '').toLowerCase();
    if (na !== nb) return na.localeCompare(nb);

    return getEnglishScore(b.englishProficiency) - getEnglishScore(a.englishProficiency);
  });

  // Distribute in snake-order
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

    // A. Gender penalty
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

    // B. University Clustering Penalty
    const uniCounts: Record<string, number> = {};
    for (const s of group) {
      const u = (s.university || '').toLowerCase().trim();
      if (u && u !== 'unspecified' && u !== 'n/a') {
        uniCounts[u] = (uniCounts[u] || 0) + 1;
      }
    }
    for (const count of Object.values(uniCounts)) {
      if (count > 1) {
        cost += Math.pow(count - 1, 2) * wUni * 5.0;
      }
    }

    // C. Smart Nationality & Geographic Location Mixing
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
            cost += wNat * 0.5;
          } else {
            cost += wNat * 4.0;
          }
        }
      }
    }

    // D. English Proficiency balance penalty
    const avgScore = group.reduce((acc, s) => acc + getEnglishScore(s.englishProficiency), 0) / group.length;
    cost += Math.pow(avgScore - classAvgEnglish, 2) * wEng * 4.0;

    const hasAdvancedOrNative = group.some(s => getEnglishScore(s.englishProficiency) >= 4);
    if (!hasAdvancedOrNative && group.length >= 3) {
      cost += 25.0 * wEng;
    }

    // E1. Degree / Major Clustering Penalty
    if (wDegree > 0) {
      const degCounts: Record<string, number> = {};
      for (const s of group) {
        const d = (s.degree || '').toLowerCase().trim();
        if (d && d !== 'unspecified' && d !== 'n/a') {
          degCounts[d] = (degCounts[d] || 0) + 1;
        }
      }
      for (const count of Object.values(degCounts)) {
        if (count > 1) {
          cost += Math.pow(count - 1, 2) * wDegree * 2.5;
        }
      }
    }

    // E2. Student Mobility / Type Clustering Penalty
    if (wStudentType > 0) {
      const typeCounts: Record<string, number> = {};
      for (const s of group) {
        const t = (s.studentType || '').toLowerCase().trim();
        if (t && t !== 'unspecified' && t !== 'n/a' && t !== 'normal') {
          typeCounts[t] = (typeCounts[t] || 0) + 1;
        }
      }
      for (const count of Object.values(typeCounts)) {
        if (count > 1) {
          cost += Math.pow(count - 1, 2) * wStudentType * 2.0;
        }
      }
    }

    // F. Dynamic Custom Fields Evaluation
    for (const cf of customFields) {
      if (cf.weight <= 0) continue;
      const valCounts: Record<string, number> = {};

      for (const s of group) {
        const val = getStudentFieldValue(s, cf.key, cf.name).toLowerCase().trim();
        if (val && val !== 'unspecified' && val !== 'n/a' && val !== 'none') {
          valCounts[val] = (valCounts[val] || 0) + 1;
        }
      }

      if (cf.mode === 'disperse') {
        // Disperse mode: penalize multiple members having the exact same value in this team
        for (const count of Object.values(valCounts)) {
          if (count > 1) {
            cost += Math.pow(count - 1, 2) * cf.weight * 3.5;
          }
        }
      } else if (cf.mode === 'cluster') {
        // Cluster mode: penalize having multiple different values in this team
        const uniqueCount = Object.keys(valCounts).length;
        if (uniqueCount > 1) {
          cost += Math.pow(uniqueCount - 1, 2) * cf.weight * 4.5;
        }
      }
    }

    return cost;
  }

  function evaluateTotalCost(): number {
    return groupBuckets.reduce((acc, grp) => acc + evaluateGroupCost(grp), 0);
  }

  // 3. Iterative Local Search / Optimization Swaps (Simulated Annealing)
  let currentTotalCost = evaluateTotalCost();
  const maxIterations = 3500;

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
    groupReports.push(calculateGroupReport(groupName, assignedMembers, classAvgEnglish, customFields));
  });

  // Calculate overall metrics
  const avgDiversityScore = groupReports.length > 0
    ? Math.round(groupReports.reduce((acc, g) => acc + g.diversityScore, 0) / groupReports.length)
    : 100;

  const genderBalanceRating = avgDiversityScore >= 85 ? 'Optimal' : avgDiversityScore >= 70 ? 'Good' : 'Moderate';
  const nationalityMixRating = avgDiversityScore >= 80 ? 'Highly Mixed' : avgDiversityScore >= 65 ? 'Balanced' : 'Moderate';
  const englishMixRating = avgDiversityScore >= 75 ? 'Evenly Distributed' : avgDiversityScore >= 60 ? 'Good' : 'Fair';
  const customFieldRating = avgDiversityScore >= 80 ? 'Optimal' : avgDiversityScore >= 65 ? 'Good' : 'Moderate';

  return {
    updatedStudents,
    groups: groupReports,
    overallDiversityScore: avgDiversityScore,
    genderBalanceRating,
    nationalityMixRating,
    englishMixRating,
    customFieldRating
  };
}

/**
 * Calculates detailed multi-dimensional diversity metrics for a single group.
 */
export function calculateGroupReport(
  groupName: string, 
  members: Student[], 
  classAvgEnglish: number = 3.5,
  customFields?: CustomDiversityField[]
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

  // Custom Field Summaries
  const customFieldSummaries: Record<string, { fieldName: string; key: string; mode: 'disperse' | 'cluster'; uniqueCount: number; score: number; values: Record<string, number> }> = {};
  if (customFields && customFields.length > 0) {
    for (const cf of customFields) {
      const valCounts: Record<string, number> = {};
      const uniqueVals = new Set<string>();

      for (const s of members) {
        const rawVal = getStudentFieldValue(s, cf.key, cf.name);
        const val = rawVal || 'Unspecified';
        valCounts[val] = (valCounts[val] || 0) + 1;
        if (rawVal && rawVal !== 'Unspecified' && rawVal !== 'N/A') uniqueVals.add(rawVal);
      }

      let cfScore = 100;
      if (cf.mode === 'disperse') {
        const duplicates = Math.max(0, studentCount - uniqueVals.size);
        cfScore = Math.max(40, Math.round(100 - (duplicates * 18)));
      } else {
        if (uniqueVals.size > 1) {
          cfScore = Math.max(35, Math.round(100 - ((uniqueVals.size - 1) * 25)));
        }
      }

      customFieldSummaries[cf.id] = {
        fieldName: cf.name,
        key: cf.key,
        mode: cf.mode,
        uniqueCount: uniqueVals.size,
        score: cfScore,
        values: valCounts
      };
    }
  }

  // Diversity Score (0 to 100)
  let score = 100;

  if (studentCount >= 2) {
    // University duplicates penalty
    const uniDuplicates = Math.max(0, studentCount - uniqueUniversityCount);
    score -= (uniDuplicates * 14);

    // Nationality duplicates penalty
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

    // Custom fields penalty / bonus
    if (customFields && customFields.length > 0) {
      for (const cf of customFields) {
        if (cf.weight <= 0) continue;
        const summary = customFieldSummaries[cf.id];
        if (!summary) continue;

        if (cf.mode === 'disperse') {
          const duplicates = Math.max(0, studentCount - summary.uniqueCount);
          score -= Math.min(15, duplicates * (cf.weight / 6));
        } else if (cf.mode === 'cluster') {
          if (summary.uniqueCount > 1) {
            score -= Math.min(15, (summary.uniqueCount - 1) * (cf.weight / 5));
          }
        }
      }
    }
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
    customFieldSummaries,
    diversityScore: finalDiversityScore
  };
}
