import { calculateStudentMetrics, calculateStudentWebPAScore, getTargetScale, normalizeNationality } from './math';
import type { Student, ClassData } from './math';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js';
}

/**
 * Intelligent client-side CSV parser.
 * Maps CSV headers dynamically to standard student keys (id, name, email, groupName, gender, nationality, englishProficiency).
 */
export function parseCSV(csvContent: string): {
  students: Student[];
  errors: string[];
} {
  const students: Student[] = [];
  const errors: string[] = [];

  if (!csvContent || csvContent.trim() === '') {
    errors.push('The CSV file is empty.');
    return { students, errors };
  }

  // Detect line splits (supports CR, LF, CRLF)
  const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) {
    errors.push('CSV must contain a header row and at least one data row.');
    return { students, errors };
  }

  // Detect separator (comma, semicolon, or tab)
  const firstLine = lines[0];
  let separator = ',';
  if (firstLine.includes(';')) separator = ';';
  else if (firstLine.includes('\t')) separator = '\t';

  // Helper to split line respecting quotes (simple but robust implementation)
  const splitCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cell = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(cell.trim().replace(/^"|"$/g, ''));
        cell = '';
      } else {
        cell += char;
      }
    }
    result.push(cell.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = splitCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s_-]+/g, ''));

  // Find column indices by scanning synonyms
  const idIdx = headers.findIndex((h) => ['id', 'uniqueid', 'rollno', 'studentid', 'number'].includes(h));
  const nameIdx = headers.findIndex((h) => ['name', 'studentname', 'fullname', 'member'].includes(h));
  const emailIdx = headers.findIndex((h) => ['email', 'emailid', 'mail', 'address'].includes(h));
  const groupIdx = headers.findIndex((h) => ['group', 'team', 'groupname', 'teamname', 'classgroup'].includes(h));
  const uniIdx = headers.findIndex((h) => ['university', 'uni', 'college', 'institution', 'school'].includes(h));
  const degreeIdx = headers.findIndex((h) => ['degree', 'major', 'program', 'course', 'degreefield'].includes(h));
  const studentTypeIdx = headers.findIndex((h) => ['studenttype', 'type', 'status', 'erasmus'].includes(h));
  const genderIdx = headers.findIndex((h) => ['gender', 'sex'].includes(h));
  const nationalityIdx = headers.findIndex((h) => ['nationality', 'country', 'citizenship', 'nation'].includes(h));
  const englishIdx = headers.findIndex((h) => ['englishproficiency', 'english', 'englishlevel', 'languagelevel', 'proficiency'].includes(h));

  if (nameIdx === -1 || emailIdx === -1) {
    errors.push('Could not identify "Name" or "Email" columns in the CSV header.');
    return { students, errors };
  }

  // Keep track of duplicate IDs to prevent bugs
  const seenIds = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const row = splitCSVLine(lines[i]);
    
    // Skip empty lines or rows that are completely empty
    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

    const rawName = row[nameIdx] || '';
    const rawEmail = row[emailIdx] || '';
    const rawGroup = groupIdx !== -1 ? row[groupIdx] : 'Unassigned';
    const rawUni = uniIdx !== -1 ? row[uniIdx] : '';
    const rawDegree = degreeIdx !== -1 ? row[degreeIdx] : '';
    const rawStudentType = studentTypeIdx !== -1 ? row[studentTypeIdx] : 'Normal';
    const rawGender = genderIdx !== -1 ? row[genderIdx] : 'Prefer not to say';
    const rawNationality = nationalityIdx !== -1 ? row[nationalityIdx] : '';
    const rawEnglish = englishIdx !== -1 ? row[englishIdx] : 'Fluent (C1/C2)';
    
    // Auto-generate or capture unique ID
    let rawId = idIdx !== -1 && row[idIdx] ? row[idIdx] : '';
    if (!rawId) {
      // Create a stable deterministic ID if missing
      rawId = 'std_' + Math.abs(hashCode(rawEmail || rawName));
    }

    if (!rawName.trim()) {
      errors.push(`Row ${i + 1}: Name is empty. Row skipped.`);
      continue;
    }

    if (!rawEmail.trim() || !validateEmail(rawEmail)) {
      errors.push(`Row ${i + 1}: "${rawEmail || 'N/A'}" is not a valid email. Row skipped.`);
      continue;
    }

    if (seenIds.has(rawId)) {
      // Re-hash or modify slightly to prevent duplicate primary keys
      rawId = `${rawId}_${i}`;
    }

    seenIds.add(rawId);

    students.push({
      id: rawId,
      name: rawName,
      email: rawEmail,
      groupName: rawGroup || 'Group A',
      submitted: false,
      university: rawUni ? rawUni.trim() : undefined,
      degree: rawDegree ? rawDegree.trim() : undefined,
      studentType: rawStudentType ? rawStudentType.trim() : 'Normal',
      gender: rawGender ? rawGender.trim() : 'Prefer not to say',
      nationality: normalizeNationality(rawNationality),
      englishProficiency: rawEnglish ? rawEnglish.trim() : 'Fluent (C1/C2)',
    });
  }

  return { students, errors };
}

/**
 * Generates a clean CSV file string containing all peer-grading final scores.
 */
export function generateResultsCSV(classData: ClassData): string {
  const headers = [
    'Student ID',
    'Name',
    'Email',
    'University',
    'Degree',
    'Student Type',
    'Gender',
    'Nationality',
    'English Proficiency',
    'Group Name',
    'Submission Status',
    'Peer Reviews Received',
    'Expected Reviews',
    ...classData.fields.map((f) => `Avg: ${f.name} (Max ${f.max})`),
    ...classData.fields.map((f) => `StdDev: ${f.name}`),
    'WebPA Ratio (Teammate Multiplier)',
    'Calibrated Final Grade',
    'Overall Average Score %',
    'Praise Tags Summary'
  ];

  const rows = classData.students.map((student) => {
    const metrics = calculateStudentMetrics(student, classData);

    const fieldAveragesList = classData.fields.map((field) => {
      const val = metrics.fieldAverages[field.id];
      return val !== null ? val : 'N/A';
    });

    const fieldStdDevsList = classData.fields.map((field) => {
      const val = metrics.fieldStdDevs[field.id];
      return val !== null ? val : 'N/A';
    });

    // Aggregate praise tags received by the student from teammates
    const teammates = classData.students
      .filter((s) => s.groupName === student.groupName && s.id !== student.id)
      .map((s) => s.id);
      
    const receivedReviews = classData.reviews.filter(
      (r) => r.recipientId === student.id && teammates.includes(r.reviewerId)
    );

    const tagCounts: Record<string, number> = {};
    receivedReviews.forEach((r) => {
      if (Array.isArray(r.praiseTags)) {
        r.praiseTags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const praiseSummary = Object.entries(tagCounts)
      .map(([tag, count]) => `${tag} (x${count})`)
      .join(' | ') || 'None';

    const storedBase = localStorage.getItem('peer_base_grade');
    const storedFudge = localStorage.getItem('peer_fudge_weight');
    const baseMark = storedBase ? Number(storedBase) : 100;
    const fudgeWeight = storedFudge ? Number(storedFudge) : 0.5;

    const { ratio, adjustedGrade } = calculateStudentWebPAScore(
      student.id,
      student.groupName,
      classData,
      baseMark,
      fudgeWeight
    );

    return [
      escapeCSVValue(student.id),
      escapeCSVValue(student.name),
      escapeCSVValue(student.email),
      escapeCSVValue(student.university || 'N/A'),
      escapeCSVValue(student.degree || 'N/A'),
      escapeCSVValue(student.studentType || 'Normal'),
      escapeCSVValue(student.gender || 'Prefer not to say'),
      escapeCSVValue(student.nationality || 'N/A'),
      escapeCSVValue(student.englishProficiency || 'Fluent (C1/C2)'),
      escapeCSVValue(student.groupName),
      student.submitted ? 'Submitted' : 'Pending',
      metrics.reviewsReceived,
      metrics.expectedReviewsCount,
      ...fieldAveragesList,
      ...fieldStdDevsList,
      metrics.reviewsReceived > 0 ? `${ratio.toFixed(2)}x` : 'N/A',
      metrics.reviewsReceived > 0 ? `${adjustedGrade} / ${baseMark}` : 'N/A',
      metrics.overallPercentage !== null ? `${metrics.overallPercentage}%` : 'N/A',
      escapeCSVValue(praiseSummary)
    ];
  });

  const csvRows = [
    headers.join(','),
    ...rows.map((row) => row.join(','))
  ];

  return csvRows.join('\r\n');
}

/* --- HELPERS --- */

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function escapeCSVValue(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Parses an Excel (.xlsx or .xls) file into a 2D string matrix
 */
export function parseExcelFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        
        const matrix: string[][] = json.map(row => 
          row.map(val => (val === null || val === undefined) ? '' : String(val).trim())
        );
        resolve(matrix);
      } catch (err) {
        reject(new Error('Failed to parse Excel file structure. Make sure it is a valid .xlsx or .xls document.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read Excel file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extracts line-grouped text column data from a PDF file
 */
export function parsePDFFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        const parsedRows: string[][] = [];
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          const lineGroups: Record<number, { x: number; text: string }[]> = {};
          
          textContent.items.forEach((item: any) => {
            if (!item.str || item.str.trim() === '') return;
            
            const y = Math.round(item.transform[5]);
            const x = item.transform[4];
            
            let foundGroupY = Object.keys(lineGroups).map(Number).find(groupY => Math.abs(groupY - y) <= 4);
            
            if (foundGroupY === undefined) {
              foundGroupY = y;
              lineGroups[foundGroupY] = [];
            }
            
            lineGroups[foundGroupY].push({ x, text: item.str });
          });
          
          const sortedYs = Object.keys(lineGroups).map(Number).sort((a, b) => b - a);
          
          sortedYs.forEach(y => {
            const items = lineGroups[y].sort((a, b) => a.x - b.x);
            const fullLineText = items.map(item => item.text).join(' ').trim();
            
            if (fullLineText.length > 0) {
              const cols = fullLineText.split(/\s{2,}/).map(c => c.trim()).filter(c => c.length > 0);
              if (cols.length > 0) {
                parsedRows.push(cols);
              }
            }
          });
        }
        
        resolve(parsedRows);
      } catch (err: any) {
        reject(new Error(`Failed to parse PDF text stream: ${err.message || err}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read PDF file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Splits standard or complex CSV/TSV text into a 2D string matrix.
 * Handles UTF-8 BOM, auto-detected delimiters (comma, semicolon, tab, pipe), and quoted cells.
 */
export function parseCSVToMatrix(rawContent: string): string[][] {
  if (!rawContent || !rawContent.trim()) return [];

  // Strip UTF-8 BOM if present
  let content = rawContent.replace(/^\uFEFF/, '').trim();

  // Detect dominant separator from the first few lines (ignoring quoted substrings)
  const previewLines = content.split(/\r?\n/).slice(0, 5);
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };

  previewLines.forEach(line => {
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (!inQuotes && counts[c] !== undefined) {
        counts[c]++;
      }
    }
  });

  // Pick delimiter with max count (default to comma)
  let separator = ',';
  let maxCount = 0;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      separator = delim;
    }
  }

  // Tokenize stream respecting quotes and newlines
  const matrix: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some(c => c.length > 0)) {
        matrix.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      matrix.push(currentRow);
    }
  }

  return matrix;
}

/**
 * General router function to parse CSV, Excel, or PDF into 2D string matrix
 */
export async function extractRosterMatrix(file: File): Promise<string[][]> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcelFile(file);
  } else if (extension === 'pdf') {
    return parsePDFFile(file);
  } else {
    // Treat as CSV or plain text
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const matrix = parseCSVToMatrix(text);
        resolve(matrix);
      };
      reader.onerror = () => reject(new Error('Failed to read CSV/plain text file.'));
      reader.readAsText(file);
    });
  }
}

/**
 * Helper to parse raw copy-pasted spreadsheet cells (tab, comma, or semicolon separated)
 */
export function parseRawPastedText(text: string): string[][] {
  return parseCSVToMatrix(text);
}

/**
 * Exports all peer assessment scores, WebPA metrics, and written teammate feedback into a dual-sheet .xlsx Excel workbook file using SheetJS (xlsx).
 */
export function exportClassroomToExcel(classData: ClassData): void {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Calculate rubric range
  const maxScale = getTargetScale(classData);

  // Read fudge weighting configuration from local storage
  const storedBase = localStorage.getItem('peer_base_grade');
  const storedFudge = localStorage.getItem('peer_fudge_weight');
  const baseMark = storedBase ? Number(storedBase) : 100;
  const fudgeWeight = storedFudge ? Number(storedFudge) : 0.5;

  // 1. SHEET 1: Classroom Summary Sheet
  const summaryHeaders = [
    'Student ID',
    'Name',
    'Email',
    'University',
    'Degree',
    'Student Type',
    'Gender',
    'Nationality',
    'English Proficiency',
    'Group Name',
    'Submission Status',
    'Peer Reviews Received',
    'Expected Reviews',
    ...classData.fields.map((f) => `Avg: ${f.name} (Max ${f.max})`),
    ...classData.fields.map((f) => `StdDev: ${f.name}`),
    'WebPA Ratio (Teammate Multiplier)',
    'Calibrated Final Grade',
    'Overall Average Score %',
    'Subjective Scaled Score',
    'Praise Tags Summary'
  ];

  const summaryRows = classData.students.map((student) => {
    const metrics = calculateStudentMetrics(student, classData);

    const fieldAveragesList = classData.fields.map((field) => {
      const val = metrics.fieldAverages[field.id];
      return val !== null ? val : 'N/A';
    });

    const fieldStdDevsList = classData.fields.map((field) => {
      const val = metrics.fieldStdDevs[field.id];
      return val !== null ? val : 'N/A';
    });

    // Praise tags aggregation
    const teammates = classData.students
      .filter((s) => s.groupName === student.groupName && s.id !== student.id)
      .map((s) => s.id);
      
    const receivedReviews = classData.reviews.filter(
      (r) => r.recipientId === student.id && teammates.includes(r.reviewerId)
    );

    const tagCounts: Record<string, number> = {};
    receivedReviews.forEach((r) => {
      if (Array.isArray(r.praiseTags)) {
        r.praiseTags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const praiseSummary = Object.entries(tagCounts)
      .map(([tag, count]) => `${tag} (x${count})`)
      .join(' | ') || 'None';

    const { ratio, adjustedGrade } = calculateStudentWebPAScore(
      student.id,
      student.groupName,
      classData,
      baseMark,
      fudgeWeight
    );

    const scaledScoreStr = metrics.overallPercentage !== null 
      ? `${((metrics.overallPercentage / 100) * maxScale).toFixed(1)} / ${maxScale}`
      : 'N/A';

    return [
      student.id,
      student.name,
      student.email,
      student.university || 'N/A',
      student.degree || 'N/A',
      student.studentType || 'Normal',
      student.gender || 'Prefer not to say',
      student.nationality || 'N/A',
      student.englishProficiency || 'Fluent (C1/C2)',
      student.groupName,
      student.submitted ? 'Submitted' : 'Pending',
      metrics.reviewsReceived,
      metrics.expectedReviewsCount,
      ...fieldAveragesList,
      ...fieldStdDevsList,
      metrics.reviewsReceived > 0 ? `${ratio.toFixed(2)}x` : 'N/A',
      metrics.reviewsReceived > 0 ? `${adjustedGrade} / ${baseMark}` : 'N/A',
      metrics.overallPercentage !== null ? `${metrics.overallPercentage}%` : 'N/A',
      scaledScoreStr,
      praiseSummary
    ];
  });

  const summarySheetData = [summaryHeaders, ...summaryRows];
  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Classroom Summary');

  // 2. SHEET 2: Teammate Written Reviews (anonymized feedback log grouped by recipient)
  const feedbackHeaders = [
    'Recipient Name',
    'Group Name',
    'Anonymous Reviewer Ref',
    'Review Strengths Feedback',
    'Opportunities for Growth Feedback',
    'Praise Tags Selected'
  ];

  const feedbackRows: any[][] = [];

  classData.students.forEach((student) => {
    const teammates = classData.students
      .filter((s) => s.groupName === student.groupName && s.id !== student.id)
      .map((s) => s.id);

    const receivedReviews = classData.reviews.filter(
      (r) => r.recipientId === student.id && teammates.includes(r.reviewerId)
    );

    receivedReviews.forEach((rev, idx) => {
      const reviewerRef = `Teammate ${idx + 1}`;
      const strengths = rev.strengthsText ? rev.strengthsText.trim() : 'No comments provided.';
      const growth = rev.growthText ? rev.growthText.trim() : 'No comments provided.';
      const tags = Array.isArray(rev.praiseTags) && rev.praiseTags.length > 0 
        ? rev.praiseTags.join(' | ') 
        : 'None';

      feedbackRows.push([
        student.name,
        student.groupName,
        reviewerRef,
        strengths,
        growth,
        tags
      ]);
    });

    if (receivedReviews.length === 0) {
      feedbackRows.push([
        student.name,
        student.groupName,
        'N/A',
        'No peer evaluations received yet.',
        'No peer evaluations received yet.',
        'None'
      ]);
    }
  });

  const feedbackSheetData = [feedbackHeaders, ...feedbackRows];
  const wsFeedback = XLSX.utils.aoa_to_sheet(feedbackSheetData);
  XLSX.utils.book_append_sheet(wb, wsFeedback, 'Teammate Written Reviews');

  // Write Excel file and trigger standard browser download stream
  const fileName = `${classData.name.replace(/\s+/g, '_')}_grades_report.xlsx`;
  XLSX.writeFile(wb, fileName);
}

