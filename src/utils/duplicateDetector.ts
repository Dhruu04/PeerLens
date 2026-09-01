import type { Student } from './math';

export interface DuplicateFlag {
  studentId: string;
  matchedStudentId: string;
  matchedStudentName: string;
  matchedStudentEmail: string;
  reason: string;
  type: 'exact_email' | 'exact_name_diff_email' | 'reversed_name' | 'similar_email';
  severity: 'high' | 'medium';
}

/**
 * Normalizes text by trimming, lowercasing, and collapsing multiple spaces.
 */
export function normalizeText(text?: string): string {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Extract email local-part username (e.g. "john.doe" from "john.doe@university.edu")
 */
export function getEmailUsername(email?: string): string {
  if (!email) return '';
  const parts = email.trim().toLowerCase().split('@');
  return parts[0]?.replace(/[._-]/g, '') || '';
}

/**
 * Detects potential or exact duplicate enrollments in a classroom roster.
 */
export function detectDuplicateEnrollments(
  students: Student[],
  ignoredPairs: Set<string> = new Set()
): Map<string, DuplicateFlag[]> {
  const flagsMap = new Map<string, DuplicateFlag[]>();

  if (!students || students.length < 2) {
    return flagsMap;
  }

  for (let i = 0; i < students.length; i++) {
    const s1 = students[i];
    const name1 = normalizeText(s1.name);
    const email1 = normalizeText(s1.email);
    const words1 = name1.split(' ').filter(Boolean);
    const reversedName1 = words1.slice().reverse().join(' ');
    const user1 = getEmailUsername(s1.email);

    for (let j = i + 1; j < students.length; j++) {
      const s2 = students[j];
      const pairKey = [s1.id, s2.id].sort().join(':::');
      if (ignoredPairs.has(pairKey)) {
        continue;
      }

      const name2 = normalizeText(s2.name);
      const email2 = normalizeText(s2.email);
      const words2 = name2.split(' ').filter(Boolean);
      const reversedName2 = words2.slice().reverse().join(' ');
      const user2 = getEmailUsername(s2.email);

      let flag: { reason: string; type: DuplicateFlag['type']; severity: DuplicateFlag['severity'] } | null = null;

      // 1. Exact Email Match (High Severity)
      if (email1 && email2 && email1 === email2) {
        flag = {
          reason: `Identical email address with ${s2.name} (${s2.email})`,
          type: 'exact_email',
          severity: 'high'
        };
      }
      // 2. Exact Name Match with Different Email (High Severity)
      else if (name1 && name2 && name1 === name2) {
        flag = {
          reason: `Identical full name as ${s2.name}, but enrolled with different email (${s2.email})`,
          type: 'exact_name_diff_email',
          severity: 'high'
        };
      }
      // 3. Reversed First/Last Name Match (e.g. "Rossi Matteo" vs "Matteo Rossi")
      else if (name1 && name2 && words1.length >= 2 && words2.length >= 2 && (name1 === reversedName2 || name2 === reversedName1)) {
        flag = {
          reason: `Reversed name order match with ${s2.name} (${s2.email})`,
          type: 'reversed_name',
          severity: 'medium'
        };
      }
      // 4. Same Distinct Username prefix on different domains
      else if (user1 && user2 && user1.length >= 4 && user1 === user2 && (words1[0] === words2[0] || words1[words1.length - 1] === words2[words2.length - 1])) {
        flag = {
          reason: `Similar username and partial name overlap with ${s2.name} (${s2.email})`,
          type: 'similar_email',
          severity: 'medium'
        };
      }

      if (flag) {
        // Add flag to s1
        const existingFlags1 = flagsMap.get(s1.id) || [];
        existingFlags1.push({
          studentId: s1.id,
          matchedStudentId: s2.id,
          matchedStudentName: s2.name,
          matchedStudentEmail: s2.email,
          reason: flag.reason,
          type: flag.type,
          severity: flag.severity
        });
        flagsMap.set(s1.id, existingFlags1);

        // Add corresponding flag to s2
        const existingFlags2 = flagsMap.get(s2.id) || [];
        existingFlags2.push({
          studentId: s2.id,
          matchedStudentId: s1.id,
          matchedStudentName: s1.name,
          matchedStudentEmail: s1.email,
          reason: flag.reason,
          type: flag.type,
          severity: flag.severity
        });
        flagsMap.set(s2.id, existingFlags2);
      }
    }
  }

  return flagsMap;
}
