import { normalizeNationality, type Student, type CustomEnrollmentField } from './math';

export type GroupingRuleMode = 
  | 'distribute'       // Distribute values across different teams (diversify, balance, disperse)
  | 'together'         // Keep matching values together in the same team
  | 'mix'              // Legacy alias for 'distribute'
  | 'group'            // Legacy alias for 'together'
  | 'spread'           // Legacy alias for 'distribute'
  | 'balance'          // Legacy alias for 'distribute'
  | 'disperse'         // Legacy alias for 'distribute'
  | 'cluster'          // Legacy alias for 'together'
  | 'strict_disperse'; // Legacy alias

export interface GroupingRule {
  id: string;
  name: string;             // Display name, e.g. "Gender", "University"
  fieldKey: string;         // 'gender' | 'nationality' | 'university' | 'englishProficiency' | 'degree' | 'studentType' | customKey
  mode: GroupingRuleMode;
  weight: number;           // 1 to 50 (or 0 if disabled)
  enabled: boolean;         // Active toggle
  description?: string;     // Contextual guide for users
  type?: 'text' | 'dropdown' | 'boolean' | 'number';
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
  mode: GroupingRuleMode;
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
  customTeamNames?: string[];
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
    mode: GroupingRuleMode;
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
    name: 'Gender Representation',
    fieldKey: 'gender',
    mode: 'distribute',
    weight: 25,
    enabled: true,
    description: 'Balance gender representation evenly across teams',
    type: 'dropdown'
  },
  {
    id: 'rule_university',
    name: 'University Institution',
    fieldKey: 'university',
    mode: 'distribute',
    weight: 50,
    enabled: true,
    description: 'Balance students from different home and host universities across teams',
    type: 'dropdown'
  },
  {
    id: 'rule_nationality',
    name: 'Nationality & Origin',
    fieldKey: 'nationality',
    mode: 'distribute',
    weight: 25,
    enabled: true,
    description: 'Balance diverse cultural and international backgrounds across teams',
    type: 'dropdown'
  },
  {
    id: 'rule_english',
    name: 'Language Proficiency',
    fieldKey: 'englishProficiency',
    mode: 'distribute',
    weight: 25,
    enabled: true,
    description: 'Balance CEFR language proficiency levels evenly across teams',
    type: 'dropdown'
  },
  {
    id: 'rule_degree',
    name: 'Academic Major / Degree',
    fieldKey: 'degree',
    mode: 'distribute',
    weight: 25,
    enabled: true,
    description: 'Balance multidisciplinary skills and major backgrounds across teams',
    type: 'dropdown'
  },
  {
    id: 'rule_student_type',
    name: 'Student Mobility Status',
    fieldKey: 'studentType',
    mode: 'distribute',
    weight: 10,
    enabled: false,
    description: 'Balance exchange, international, and domestic students across teams',
    type: 'dropdown'
  }
];

/**
 * Normalizes legacy or persisted rule definitions to current concise naming and standard modes.
 */
export function normalizeRule(rule: GroupingRule): GroupingRule {
  const mode: GroupingRuleMode = 'distribute';

  let weight = rule.weight;
  if ((rule as any).mode === 'strict_disperse') {
    weight = 50;
  } else if (weight <= 15) {
    weight = 10;
  } else if (weight <= 35) {
    weight = 25;
  } else {
    weight = 50;
  }

  let name = rule.name;
  let description = rule.description;
  let type = rule.type;

  if (rule.fieldKey === 'gender') {
    name = 'Gender Representation';
    description = 'Balance gender representation evenly across teams';
    type = 'dropdown';
  } else if (rule.fieldKey === 'university') {
    name = 'University Institution';
    description = 'Balance students from different home and host universities across teams';
    type = 'dropdown';
  } else if (rule.fieldKey === 'nationality') {
    name = 'Nationality & Origin';
    description = 'Balance diverse cultural and international backgrounds across teams';
    type = 'dropdown';
  } else if (rule.fieldKey === 'englishProficiency') {
    name = 'Language Proficiency';
    description = 'Balance CEFR language proficiency levels evenly across teams';
    type = 'dropdown';
  } else if (rule.fieldKey === 'degree') {
    name = 'Academic Major / Degree';
    description = 'Balance multidisciplinary skills and major backgrounds across teams';
    type = 'dropdown';
  } else if (rule.fieldKey === 'studentType') {
    name = 'Student Mobility Status';
    description = 'Balance exchange, international, and domestic students across teams';
    type = 'dropdown';
  } else if (rule.fieldKey === 'currentCountry') {
    name = 'Current Country';
    description = 'Balance students from different host or current countries across teams';
    type = 'dropdown';
  }

  return {
    ...rule,
    name,
    mode,
    weight,
    description,
    type
  };
}

/**
 * Priority Level definitions and standard weights:
 * Low: 10 pts (gentle influence)
 * Medium: 25 pts (balanced focus)
 * High: 50 pts (strong constraint)
 */
export type PriorityLevel = 'low' | 'medium' | 'high';

export const PRIORITY_LEVELS: Record<PriorityLevel, { label: string; shortLabel: string; weight: number; desc: string; color: string; bg: string }> = {
  low: { label: 'Low', shortLabel: 'Low', weight: 10, desc: 'Gentle influence', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
  medium: { label: 'Medium', shortLabel: 'Med', weight: 25, desc: 'Balanced focus', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
  high: { label: 'High', shortLabel: 'High', weight: 50, desc: 'High priority constraint', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' }
};

export function getPriorityTier(weight: number): PriorityLevel {
  if (weight <= 15) return 'low';
  if (weight <= 35) return 'medium';
  return 'high';
}

/**
 * Provides a clean, concise short name for rules in compact summary strips
 */
export function getShortRuleName(fullName: string): string {
  const map: Record<string, string> = {
    'Gender Representation': 'Gender',
    'Gender Identity': 'Gender',
    'University Institution': 'University',
    'Nationality & Origin': 'Nationality',
    'Country of Origin / Nationality': 'Nationality',
    'Language Proficiency': 'Language',
    'CEFR English Proficiency': 'English',
    'Academic Major / Degree': 'Major',
    'Student Mobility Status': 'Mobility',
    'International Student Status': 'International',
    'Exchange / Erasmus Student': 'Exchange',
    'Prior Coding Experience': 'Coding'
  };
  if (map[fullName]) return map[fullName];
  return fullName.replace(/Status|Representation|Institution|Proficiency/gi, '').trim() || fullName;
}

/**
 * Calculates dynamic percentage weights using the Largest Remainder Method (Hare-Niemeyer).
 * Guarantees that the sum of integer percentages across all active rules ALWAYS equals EXACTLY 100%.
 */
export function calculateDynamicRuleWeights<T extends { id: string; weight: number; enabled?: boolean }>(
  rules: T[]
): Map<string, number> {
  const result = new Map<string, number>();
  const activeRules = rules.filter(r => r.enabled !== false && r.weight > 0);
  if (activeRules.length === 0) return result;

  const totalWeight = activeRules.reduce((sum, r) => sum + r.weight, 0);
  if (totalWeight <= 0) {
    const equalShare = Math.floor(100 / activeRules.length);
    const remainder = 100 - equalShare * activeRules.length;
    activeRules.forEach((r, idx) => {
      result.set(r.id, equalShare + (idx < remainder ? 1 : 0));
    });
    return result;
  }

  // Calculate raw percentage, floor, and remainder for each rule
  const items = activeRules.map((rule, idx) => {
    const rawPct = (rule.weight / totalWeight) * 100;
    const floorPct = Math.floor(rawPct);
    const remainder = rawPct - floorPct;
    return { id: rule.id, floorPct, remainder, originalIndex: idx };
  });

  const sumFloors = items.reduce((sum, item) => sum + item.floorPct, 0);
  const leftover = 100 - sumFloors;

  // Sort descending by remainder, tie-breaking by original array order
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(b.remainder - a.remainder) > 0.000001) {
      return b.remainder - a.remainder;
    }
    return a.originalIndex - b.originalIndex;
  });

  const bonusIds = new Set(sorted.slice(0, leftover).map(item => item.id));

  items.forEach(item => {
    result.set(item.id, item.floorPct + (bonusIds.has(item.id) ? 1 : 0));
  });

  return result;
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
 * Helper to determine data type of a rule: numeric, boolean, or categorical.
 */
export function inferRuleType(
  rule: GroupingRule,
  students: Student[]
): 'numeric' | 'boolean' | 'categorical' {
  if (rule.type === 'number') return 'numeric';
  if (rule.type === 'boolean') return 'boolean';
  if (rule.type === 'text' || rule.type === 'dropdown') return 'categorical';

  // Inspect student cohort values if type not specified
  let nonZeroCount = 0;
  let numCount = 0;
  let boolCount = 0;

  for (const s of students) {
    const raw = getStudentFieldValue(s, rule.fieldKey, rule.name);
    if (!raw || raw === 'Unspecified' || raw === 'N/A') continue;
    nonZeroCount++;
    const lower = raw.toLowerCase().trim();
    if (lower === 'true' || lower === 'false' || lower === 'yes' || lower === 'no') {
      boolCount++;
    }
    const num = Number(raw);
    if (!isNaN(num) && typeof num === 'number') {
      numCount++;
    }
  }

  if (nonZeroCount >= 2) {
    if (boolCount === nonZeroCount) return 'boolean';
    if (numCount === nonZeroCount) return 'numeric';
  }

  return 'categorical';
}

export function extractNumericValue(student: Student, key: string, name?: string): number | null {
  const val = getStudentFieldValue(student, key, name);
  if (!val || val === 'Unspecified' || val === 'N/A') return null;

  // 1. Direct standard number parsing
  const directNum = Number(val);
  if (!isNaN(directNum) && isFinite(directNum)) return directNum;

  // 2. Check for ranges, e.g. "2-3", "2 - 3", "2.5-3.5" (calculate midpoint average)
  const rangeMatch = String(val).trim().match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    if (!isNaN(low) && !isNaN(high) && isFinite(low) && isFinite(high)) {
      return (low + high) / 2;
    }
  }

  // 3. Extract first valid numeric floating point from strings like "3 years", "4.5 hrs", ">5", etc.
  const floatMatch = String(val).match(/[-+]?[0-9]*\.?[0-9]+/);
  if (floatMatch && floatMatch[0] && floatMatch[0] !== '-' && floatMatch[0] !== '.') {
    const parsed = parseFloat(floatMatch[0]);
    if (!isNaN(parsed) && isFinite(parsed)) return parsed;
  }

  return null;
}

export function extractBooleanValue(student: Student, key: string, name?: string): boolean | null {
  const val = getStudentFieldValue(student, key, name);
  if (!val || val === 'Unspecified' || val === 'N/A') return null;
  const lower = val.toLowerCase().trim();
  if (lower === 'true' || lower === 'yes' || lower === '1') return true;
  if (lower === 'false' || lower === 'no' || lower === '0') return false;
  return null;
}

/**
 * Scans an active student cohort and discovers all populated attributes and custom tags.
 * Also discovers newly configured custom enrollment fields from the class form.
 */
export function discoverRosterFields(
  students: Student[],
  configuredFields?: CustomEnrollmentField[]
): DiscoveredRosterField[] {
  const CORE_KEYS = new Set([
    'name', 'email', 'gender', 'university', 'nationality',
    'degree', 'englishproficiency', 'studenttype', 'currentcountry',
    'isinternational', 'isexchange'
  ]);

  const fieldKeyMap: Record<string, {
    key: string;
    name: string;
    isStandard: boolean;
    type?: 'text' | 'dropdown' | 'boolean' | 'number';
    values: Record<string, number>;
  }> = {
    gender: { key: 'gender', name: 'Gender', isStandard: true, values: {} },
    university: { key: 'university', name: 'University', isStandard: true, values: {} },
    nationality: { key: 'nationality', name: 'Nationality', isStandard: true, values: {} },
    englishProficiency: { key: 'englishProficiency', name: 'Language Proficiency', isStandard: true, values: {} },
    degree: { key: 'degree', name: 'Degree / Major', isStandard: true, values: {} },
    studentType: { key: 'studentType', name: 'Student Mobility', isStandard: true, values: {} },
    currentCountry: { key: 'currentCountry', name: 'Current Country', isStandard: true, values: {} }
  };

  // 1. Map configured custom enrollment fields (e.g. newly added questions like "course duration", "laptop", etc.)
  const aliasToCanonical: Record<string, string> = {};

  if (Array.isArray(configuredFields)) {
    configuredFields.forEach(f => {
      const normId = f.id.toLowerCase().trim();
      const normLabel = f.label.toLowerCase().trim();

      // Skip core identity baseline fields
      if (CORE_KEYS.has(normId)) return;

      const canonicalKey = f.id;
      aliasToCanonical[normId] = canonicalKey;
      aliasToCanonical[normLabel] = canonicalKey;

      if (!fieldKeyMap[canonicalKey]) {
        fieldKeyMap[canonicalKey] = {
          key: canonicalKey,
          name: f.label.trim(),
          isStandard: false,
          type: f.type,
          values: {}
        };
      }
    });
  }

  // 2. Scan student cohort for values
  if (Array.isArray(students)) {
    students.forEach(s => {
      // Standard core keys
      for (const standardKey of ['gender', 'university', 'nationality', 'englishProficiency', 'degree', 'studentType', 'currentCountry']) {
        const val = getStudentFieldValue(s, standardKey);
        if (val && val !== 'Unspecified' && val !== 'Normal' && val !== 'N/A') {
          fieldKeyMap[standardKey].values[val] = (fieldKeyMap[standardKey].values[val] || 0) + 1;
        }
      }

      // Custom fields dictionary on student
      if (s.customFields && typeof s.customFields === 'object') {
        const seenForStudent = new Set<string>();

        for (const [cKey, cVal] of Object.entries(s.customFields)) {
          if (cVal === undefined || cVal === null || String(cVal).trim() === '') continue;

          const normKey = cKey.toLowerCase().trim();
          if (CORE_KEYS.has(normKey)) continue;

          const canonicalKey = aliasToCanonical[normKey] || cKey;

          if (seenForStudent.has(canonicalKey)) continue;
          seenForStudent.add(canonicalKey);

          if (!fieldKeyMap[canonicalKey]) {
            const formattedName = cKey.charAt(0).toUpperCase() + cKey.slice(1).replace(/([A-Z])/g, ' $1');
            fieldKeyMap[canonicalKey] = {
              key: canonicalKey,
              name: formattedName,
              isStandard: false,
              values: {}
            };
          }

          const strVal = String(cVal).trim();
          fieldKeyMap[canonicalKey].values[strVal] = (fieldKeyMap[canonicalKey].values[strVal] || 0) + 1;
        }
      }
    });
  }

  // 3. Compile deduplicated results
  const results: DiscoveredRosterField[] = [];
  const seenResultNames = new Set<string>();

  for (const meta of Object.values(fieldKeyMap)) {
    const totalCount = Object.values(meta.values).reduce((a, b) => a + b, 0);
    const distinctCount = Object.keys(meta.values).length;

    // Deduplicate by normalized name
    const normName = meta.name.toLowerCase().trim();
    if (seenResultNames.has(normName)) continue;

    // Include if it has student values, OR if it is a configured custom field in the class form
    if (totalCount > 0 || !meta.isStandard) {
      seenResultNames.add(normName);
      const sortedVals = Object.entries(meta.values)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));

      results.push({
        key: meta.key,
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
    const singleGroupName = (config.customTeamNames && config.customTeamNames[0] && config.customTeamNames[0].trim())
      ? config.customTeamNames[0].trim()
      : `${prefix} 1`;
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

  // Precompute cohort-level statistics for every active rule
  const ruleStatsMap: Record<string, {
    type: 'numeric' | 'boolean' | 'categorical';
    classMean: number;
    classStdDev: number;
    classTrueRatio: number;
  }> = {};

  for (const rule of effectiveRules) {
    const rType = inferRuleType(rule, pool);
    if (rType === 'numeric') {
      const nums: number[] = [];
      pool.forEach(s => {
        const n = extractNumericValue(s, rule.fieldKey, rule.name);
        if (n !== null) nums.push(n);
      });
      const mean = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      const variance = nums.length > 0 ? nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / nums.length : 1;
      ruleStatsMap[rule.id] = {
        type: 'numeric',
        classMean: mean,
        classStdDev: Math.sqrt(variance) || 1,
        classTrueRatio: 0
      };
    } else if (rType === 'boolean') {
      let trues = 0;
      let total = 0;
      pool.forEach(s => {
        const b = extractBooleanValue(s, rule.fieldKey, rule.name);
        if (b !== null) {
          total++;
          if (b) trues++;
        }
      });
      ruleStatsMap[rule.id] = {
        type: 'boolean',
        classMean: 0,
        classStdDev: 1,
        classTrueRatio: total > 0 ? trues / total : 0.5
      };
    } else {
      ruleStatsMap[rule.id] = {
        type: 'categorical',
        classMean: 0,
        classStdDev: 1,
        classTrueRatio: 0
      };
    }
  }

  // 1. Initial Stratified Partitioning with Pinned Student Anchoring
  const groupNames: string[] = Array.from({ length: numGroups }, (_, i) => 
    (config.customTeamNames && config.customTeamNames[i] && config.customTeamNames[i].trim())
      ? config.customTeamNames[i].trim()
      : `${prefix} ${i + 1}`
  );
  const pinnedMap = config.pinnedStudentMap || {};
  const pinnedIds = new Set(Object.keys(pinnedMap));

  // Pre-assign pinned students to their corresponding buckets
  const unpinnedPool: Student[] = [];
  for (const s of pool) {
    if (pinnedIds.has(s.id)) {
      const targetGroupName = (pinnedMap[s.id] || '').trim().toLowerCase();
      const gIdx = groupNames.findIndex(g => g.trim().toLowerCase() === targetGroupName);
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
      const stat = ruleStatsMap[rule.id];
      if (stat && stat.type === 'numeric') {
        const na = extractNumericValue(a, rule.fieldKey, rule.name) ?? stat.classMean;
        const nb = extractNumericValue(b, rule.fieldKey, rule.name) ?? stat.classMean;
        if (na !== nb) return nb - na; // Sort descending numerically so snake draft balances sums & averages
      } else if (stat && stat.type === 'boolean') {
        const ba = extractBooleanValue(a, rule.fieldKey, rule.name) ? 1 : 0;
        const bb = extractBooleanValue(b, rule.fieldKey, rule.name) ? 1 : 0;
        if (ba !== bb) return bb - ba;
      } else if (rule.fieldKey === 'englishProficiency') {
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
      const isMax = w >= 45 || (rule as any).mode === 'strict_disperse';

      // Multi-Type Balanced Distribution Cost Evaluation
      const stat = ruleStatsMap[rule.id];
      if (stat && stat.type === 'numeric') {
        const teamNums: number[] = [];
        group.forEach(s => {
          const n = extractNumericValue(s, rule.fieldKey, rule.name);
          if (n !== null) teamNums.push(n);
        });
        if (teamNums.length > 0) {
          const teamAvg = teamNums.reduce((a, b) => a + b, 0) / teamNums.length;
          const normDiff = Math.abs(teamAvg - stat.classMean) / Math.max(0.5, stat.classStdDev);
          cost += Math.pow(normDiff, 2) * w * (isMax ? 25.0 : 5.0);
        }
      } else if (stat && stat.type === 'boolean') {
        let trueCount = 0;
        group.forEach(s => {
          if (extractBooleanValue(s, rule.fieldKey, rule.name) === true) trueCount++;
        });
        const expectedTrue = gSize * stat.classTrueRatio;
        const diff = Math.abs(trueCount - expectedTrue);
        cost += Math.pow(diff, 2) * w * (isMax ? 25.0 : 4.0);
      } else if (rule.fieldKey === 'gender') {
        const genderCounts: Record<string, number> = {};
        for (const s of group) {
          const g = (s.gender || 'Unspecified').toLowerCase();
          genderCounts[g] = (genderCounts[g] || 0) + 1;
        }
        const females = genderCounts['female'] || 0;
        const males = genderCounts['male'] || 0;
        const diff = Math.abs(females - males);
        if (diff > 1) {
          cost += Math.pow(diff - 1, 2) * w * (isMax ? 16.0 : 2.0);
        }
      } else if (rule.fieldKey === 'englishProficiency') {
        const avgScore = group.reduce((acc, s) => acc + getEnglishScore(s.englishProficiency), 0) / gSize;
        cost += Math.pow(avgScore - classAvgEnglish, 2) * w * (isMax ? 25.0 : 5.0);
        const hasAdvanced = group.some(s => getEnglishScore(s.englishProficiency) >= 4);
        if (!hasAdvanced && gSize >= 3) {
          cost += (isMax ? 80.0 : 25.0) * w;
        }
      } else if (rule.fieldKey === 'nationality') {
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
                cost += w * (isMax ? 8.0 : 1.0);
              } else {
                cost += w * (isMax ? 25.0 : 4.0);
              }
            }
          }
        }
      } else {
        // Categorical uniqueness dispersion across teams (University, Degree, Mobility, Custom Dropdown/Text)
        const valCounts: Record<string, number> = {};
        for (const s of group) {
          const val = getStudentFieldValue(s, rule.fieldKey, rule.name).toLowerCase().trim();
          if (val && val !== 'unspecified' && val !== 'n/a' && val !== 'none') {
            valCounts[val] = (valCounts[val] || 0) + 1;
          }
        }
        for (const count of Object.values(valCounts)) {
          if (count > 1) {
            cost += Math.pow(count - 1, 2) * w * (isMax ? 25.0 : 3.8);
          }
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
    const groupName = (config.customTeamNames && config.customTeamNames[idx] && config.customTeamNames[idx].trim())
      ? config.customTeamNames[idx].trim()
      : `${prefix} ${idx + 1}`;
    const assignedMembers = bucket.map(s => ({
      ...s,
      groupName
    }));

    updatedStudents.push(...assignedMembers);
    groupReports.push(calculateGroupReport(groupName, assignedMembers, classAvgEnglish, effectiveRules, ruleStatsMap));
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
  rulesOrCustomFields?: GroupingRule[] | CustomDiversityField[],
  cohortStats?: Record<string, { type: 'numeric' | 'boolean' | 'categorical'; classMean: number; classStdDev: number; classTrueRatio: number }>
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
  const customFieldSummaries: Record<string, { fieldName: string; key: string; mode: GroupingRuleMode; uniqueCount: number; score: number; values: Record<string, number> }> = {};

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

    const isMax = rule.weight >= 45 || (rule as any).mode === 'strict_disperse';

    const stat = cohortStats ? cohortStats[rule.id] : null;
    const rType = stat ? stat.type : inferRuleType(rule, members);

    if (rType === 'numeric') {
      const teamNums: number[] = [];
      members.forEach(s => {
        const n = extractNumericValue(s, rule.fieldKey, rule.name);
        if (n !== null) teamNums.push(n);
      });
      const teamAvg = teamNums.length > 0 ? (teamNums.reduce((a, b) => a + b, 0) / teamNums.length) : 0;
      const targetMean = stat ? stat.classMean : teamAvg;
      const targetStd = stat ? stat.classStdDev : 1;
      const dev = Math.abs(teamAvg - targetMean) / Math.max(0.5, targetStd);
      ruleScore = Math.max(35, Math.round(100 - (dev * (isMax ? 32 : 20))));
      summary = `Team Avg: ${teamAvg.toFixed(1)} (Class: ${targetMean.toFixed(1)})`;
    } else if (rType === 'boolean') {
      let trueCount = 0;
      members.forEach(s => {
        if (extractBooleanValue(s, rule.fieldKey, rule.name) === true) trueCount++;
      });
      const targetRatio = stat ? stat.classTrueRatio : 0.5;
      const expected = studentCount * targetRatio;
      const diff = Math.abs(trueCount - expected);
      ruleScore = Math.max(35, Math.round(100 - (diff * (isMax ? 28 : 18))));
      summary = `${trueCount} Yes / ${studentCount - trueCount} No`;
    } else if (rule.fieldKey === 'gender') {
      const females = genderCounts['Female'] || genderCounts['female'] || 0;
      const males = genderCounts['Male'] || genderCounts['male'] || 0;
      const diff = Math.abs(females - males);
      ruleScore = Math.max(35, 100 - (diff > 1 ? (diff - 1) * (isMax ? 26 : 18) : 0));
      summary = `${females}F / ${males}M ratio`;
    } else if (rule.fieldKey === 'englishProficiency') {
      const dev = Math.abs(avgEnglishScore - classAvgEnglish);
      ruleScore = Math.max(35, Math.round(100 - (dev * (isMax ? 30 : 20))));
      summary = `Avg CEFR ${getCEFRLevelFromScore(avgEnglishScore).code} (${avgEnglishScore.toFixed(1)})`;
    } else {
      const duplicates = Math.max(0, studentCount - uniqueVals.size);
      const penaltyFactor = isMax ? 28 : 16;
      ruleScore = Math.max(35, Math.round(100 - (duplicates * penaltyFactor)));
      summary = `${uniqueVals.size} unique / ${studentCount} members`;
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
      mode: (rule.mode === 'together' || rule.mode === 'group' || rule.mode === 'cluster' ? 'together' : 'distribute'),
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
