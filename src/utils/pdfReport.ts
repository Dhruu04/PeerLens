import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Student, ClassData } from './math';
import { calculateStudentMetrics, calculateStudentWebPAScore, getTeammates } from './math';

export interface PDFReportOptions {
  baseGrade?: number;
  fudgeWeight?: number;
  institutionName?: string;
  courseCode?: string;
}

/**
 * Creates a high-fidelity jsPDF document for an individual student report card.
 */
export function generateStudentReportPDF(
  student: Student,
  classData: ClassData,
  options?: PDFReportOptions
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // Indigo-Blue
  const darkColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const secondaryColor: [number, number, number] = [71, 85, 105]; // Slate 600
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50
  const borderCol: [number, number, number] = [226, 232, 240]; // Slate 200
  const tealColor: [number, number, number] = [13, 148, 136]; // Teal

  // Retrieve base grade and fudge weight configuration
  const storedBase = localStorage.getItem('peer_base_grade');
  const storedFudge = localStorage.getItem('peer_fudge_weight');
  const baseGrade = options?.baseGrade ?? (storedBase ? Number(storedBase) : 100);
  const fudgeWeight = options?.fudgeWeight ?? (storedFudge ? Number(storedFudge) : 0.5);

  // Compute student metrics & WebPA scores
  const metrics = calculateStudentMetrics(student, classData);
  const webpaResult = calculateStudentWebPAScore(student.id, student.groupName, classData, baseGrade, fudgeWeight);
  const teammates = getTeammates(student.id, student.groupName, classData.students);

  // Peer reviews received by this student
  const peerReviews = classData.reviews.filter(
    (r) => r.recipientId === student.id && teammates.includes(r.reviewerId)
  );

  let currentY = 12;

  // --- 1. HEADER BANNER ---
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, 'F');
  doc.setDrawColor(...borderCol);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, 'S');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('PeerLens — Individual Peer Assessment Report', margin + 6, currentY + 9);

  // Subtitle / Classroom
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...secondaryColor);
  const classTitle = `${classData.name || 'Classroom Assessment'} | Assessment Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`;
  doc.text(classTitle, margin + 6, currentY + 16);

  // Verification Badge on Right
  doc.setFillColor(...tealColor);
  doc.roundedRect(pageWidth - margin - 38, currentY + 6, 32, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL RECORD', pageWidth - margin - 22, currentY + 13.5, { align: 'center' });

  currentY += 28;

  // --- 2. STUDENT PROFILE & DEMOGRAPHICS CARD ---
  const cardHeight = 32;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, currentY, contentWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(...borderCol);
  doc.roundedRect(margin, currentY, contentWidth, cardHeight, 2, 2, 'S');

  // Top accent bar
  doc.setFillColor(...primaryColor);
  doc.rect(margin, currentY, contentWidth, 2, 'F');

  // Left Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text(student.name, margin + 5, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...secondaryColor);
  doc.text(`Student ID: ${student.id} | Email: ${student.email}`, margin + 5, currentY + 15);

  const academicInfo = [
    student.university ? `University: ${student.university}` : '',
    student.degree ? `Degree: ${student.degree}` : '',
    student.studentType && student.studentType !== 'Normal' ? `Type: ${student.studentType}` : ''
  ].filter(Boolean).join(' | ') || 'Academic Program: Enrolled Student';
  doc.text(academicInfo, margin + 5, currentY + 21);

  const demoInfo = [
    student.nationality ? `Nationality: ${student.nationality}` : '',
    student.gender && student.gender !== 'Prefer not to say' ? `Gender: ${student.gender}` : '',
    student.englishProficiency ? `English Level: ${student.englishProficiency}` : ''
  ].filter(Boolean).join(' | ');
  if (demoInfo) {
    doc.text(demoInfo, margin + 5, currentY + 27);
  }

  // Right Column: Group & Status Badges
  const groupText = `Team: ${student.groupName || 'Unassigned'}`;
  doc.setFillColor(...lightBg);
  doc.roundedRect(pageWidth - margin - 48, currentY + 7, 43, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...tealColor);
  doc.text(groupText, pageWidth - margin - 26.5, currentY + 12.5, { align: 'center' });

  const statusText = student.submitted ? 'Submission: Completed' : 'Submission: Pending';
  const statusColor: [number, number, number] = student.submitted ? [16, 185, 129] : [245, 158, 11];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...statusColor);
  doc.text(statusText, pageWidth - margin - 26.5, currentY + 20, { align: 'center' });

  currentY += cardHeight + 5;

  // --- 3. KEY PERFORMANCE METRICS & WEBPA SCORE SUMMARY ---
  const colW = (contentWidth - 6) / 3;
  const statBoxH = 20;

  // Box 1: WebPA Teammate Multiplier
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, currentY, colW, statBoxH, 2, 2, 'F');
  doc.setDrawColor(...borderCol);
  doc.roundedRect(margin, currentY, colW, statBoxH, 2, 2, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...secondaryColor);
  doc.text('WebPA Peer Ratio', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const ratioColor: [number, number, number] = webpaResult.ratio >= 1.0 ? [13, 148, 136] : [225, 29, 72];
  doc.setTextColor(...ratioColor);
  doc.text(`${webpaResult.ratio.toFixed(2)}x`, margin + 4, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...secondaryColor);
  doc.text(webpaResult.ratio >= 1.0 ? 'At/Above Teammate Average' : 'Below Teammate Average', margin + 4, currentY + 18);

  // Box 2: Calibrated Final Score
  const box2X = margin + colW + 3;
  doc.setFillColor(...lightBg);
  doc.roundedRect(box2X, currentY, colW, statBoxH, 2, 2, 'F');
  doc.roundedRect(box2X, currentY, colW, statBoxH, 2, 2, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...secondaryColor);
  doc.text(`Calibrated Grade (Base ${baseGrade})`, box2X + 4, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text(`${webpaResult.adjustedGrade.toFixed(1)} / ${baseGrade}`, box2X + 4, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...secondaryColor);
  doc.text(`Fudge Weighting: ${fudgeWeight * 100}%`, box2X + 4, currentY + 18);

  // Box 3: Peer Reviews Received & Participation
  const box3X = margin + (colW + 3) * 2;
  doc.setFillColor(...lightBg);
  doc.roundedRect(box3X, currentY, colW, statBoxH, 2, 2, 'F');
  doc.roundedRect(box3X, currentY, colW, statBoxH, 2, 2, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...secondaryColor);
  doc.text('Peer Reviews Received', box3X + 4, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...darkColor);
  doc.text(`${metrics.reviewsReceived} of ${teammates.length} Teammates`, box3X + 4, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...secondaryColor);
  const participationRate = teammates.length > 0 ? Math.round((metrics.reviewsReceived / teammates.length) * 100) : 0;
  doc.text(`${participationRate}% Group Evaluation Rate`, box3X + 4, currentY + 18);

  currentY += statBoxH + 6;

  // --- 4. RUBRIC CRITERIA BREAKDOWN TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...darkColor);
  doc.text('Rubric Criteria Evaluation Breakdown', margin, currentY + 1);
  currentY += 4;

  const tableBody = classData.fields.map((field) => {
    const avg = metrics.fieldAverages[field.id];
    const stdDev = metrics.fieldStdDevs[field.id];
    const max = field.max || 5;
    const pct = avg !== null ? `${Math.round((avg / max) * 100)}%` : 'N/A';
    const consensus = stdDev !== null ? (stdDev <= 0.5 ? 'High Agreement' : stdDev <= 1.0 ? 'Moderate' : 'Diverse Views') : 'N/A';

    return [
      field.name,
      `${max} pts`,
      avg !== null ? `${avg.toFixed(2)} / ${max}` : 'No reviews',
      stdDev !== null ? `± ${stdDev.toFixed(2)} (${consensus})` : '—',
      pct
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Rubric Criterion', 'Max Scale', 'Peer Average Score', 'Teammate Consensus (StdDev)', 'Performance %']],
    body: tableBody,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.2
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 35 },
      3: { halign: 'left', cellWidth: 46 },
      4: { halign: 'center', fontStyle: 'bold', cellWidth: 24 }
    }
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 6;

  // --- 5. COMMENDATIONS & PRAISE TAGS ---
  const allPraiseTags: string[] = [];
  peerReviews.forEach(r => {
    if (r.praiseTags && Array.isArray(r.praiseTags)) {
      r.praiseTags.forEach(t => allPraiseTags.push(t));
    }
  });

  // Count tag occurrences
  const tagCounts: Record<string, number> = {};
  allPraiseTags.forEach(t => {
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...darkColor);
  doc.text('Peer Commendations & Strengths Awarded', margin, currentY);
  currentY += 4;

  const tagKeys = Object.keys(tagCounts);
  if (tagKeys.length > 0) {
    let tagX = margin;
    let tagY = currentY;

    tagKeys.forEach(tag => {
      const count = tagCounts[tag];
      const tagLabel = `${tag} (${count})`;
      const badgeW = doc.getTextWidth(tagLabel) + 6;

      if (tagX + badgeW > pageWidth - margin) {
        tagX = margin;
        tagY += 6.5;
      }

      doc.setFillColor(240, 253, 250); // Teal 50
      doc.setDrawColor(204, 251, 241); // Teal 100
      doc.roundedRect(tagX, tagY, badgeW, 5.5, 1.2, 1.2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(13, 148, 136); // Teal 600
      doc.text(tagLabel, tagX + 3, tagY + 3.8);

      tagX += badgeW + 3;
    });

    currentY = tagY + 9;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...secondaryColor);
    doc.text('No specific praise tags recorded for this evaluation cycle.', margin, currentY + 2);
    currentY += 7;
  }

  // --- 6. ANONYMIZED QUALITATIVE FEEDBACK ---
  const strengthsList = peerReviews.map(r => r.strengthsText?.trim()).filter(Boolean) as string[];
  const growthList = peerReviews.map(r => r.growthText?.trim()).filter(Boolean) as string[];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...darkColor);
  doc.text('Anonymized Teammate Written Feedback', margin, currentY);
  currentY += 4;

  // Two Column Grid: Strengths vs Growth
  const colFeedbackW = (contentWidth - 4) / 2;

  // Strengths Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, colFeedbackW, 36, 2, 2, 'F');
  doc.setDrawColor(...borderCol);
  doc.roundedRect(margin, currentY, colFeedbackW, 36, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(13, 148, 136); // Teal
  doc.text('Key Strengths & Contributions', margin + 3.5, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...secondaryColor);
  if (strengthsList.length > 0) {
    let sY = currentY + 9.5;
    strengthsList.slice(0, 3).forEach((comment) => {
      const wrapped = doc.splitTextToSize(`• "${comment}"`, colFeedbackW - 7);
      doc.text(wrapped, margin + 3.5, sY);
      sY += wrapped.length * 3.2;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('No written strength comments submitted.', margin + 3.5, currentY + 11);
  }

  // Growth Box
  const growthX = margin + colFeedbackW + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(growthX, currentY, colFeedbackW, 36, 2, 2, 'F');
  doc.roundedRect(growthX, currentY, colFeedbackW, 36, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(225, 29, 72); // Rose
  doc.text('Areas for Improvement & Future Collaboration', growthX + 3.5, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...secondaryColor);
  if (growthList.length > 0) {
    let gY = currentY + 9.5;
    growthList.slice(0, 3).forEach((comment) => {
      const wrapped = doc.splitTextToSize(`• "${comment}"`, colFeedbackW - 7);
      doc.text(wrapped, growthX + 3.5, gY);
      gY += wrapped.length * 3.2;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('No constructive growth areas submitted.', growthX + 3.5, currentY + 11);
  }

  currentY += 40;

  // --- 7. FOOTER / METHODOLOGY EXPLAINER & SIGNATURE ---
  doc.setDrawColor(...borderCol);
  doc.setLineWidth(0.2);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(...secondaryColor);
  const methodologyText = 'Methodology Note: The WebPA (Web-based Peer Assessment) algorithm calculates individual contribution ratios by comparing scores awarded by all peer evaluators in the team against the team average. The final calibrated grade applies the formula: Final Grade = Base Mark × [1 - S + S × (Student Score / Team Average)], where S is the instructor fudge weighting factor.';
  const wrappedMethod = doc.splitTextToSize(methodologyText, contentWidth - 45);
  doc.text(wrappedMethod, margin, currentY);

  // Instructor Signature Line on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...darkColor);
  doc.text('Instructor Verification:', pageWidth - margin - 40, currentY);
  doc.line(pageWidth - margin - 40, currentY + 6, pageWidth - margin, currentY + 6);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.5);
  doc.setTextColor(...secondaryColor);
  doc.text('Authorized Signature & Stamp', pageWidth - margin - 40, currentY + 9);

  return doc;
}

/**
 * Directly downloads the PDF report file to the user's computer.
 */
export function downloadStudentReportPDF(
  student: Student,
  classData: ClassData,
  options?: PDFReportOptions
): void {
  const doc = generateStudentReportPDF(student, classData, options);
  const safeName = student.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fileName = `ReportCard_${safeName}_${student.id}.pdf`;
  doc.save(fileName);
}

/**
 * Returns a base64 Data URI of the generated PDF for embedding in live previews / iframes.
 */
export function getStudentReportPDFDataUri(
  student: Student,
  classData: ClassData,
  options?: PDFReportOptions
): string {
  const doc = generateStudentReportPDF(student, classData, options);
  return doc.output('datauristring');
}
