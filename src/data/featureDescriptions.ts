export interface FeatureInfoItem {
  id: string;
  title: string;
  category: 'Algorithm' | 'Grading' | 'Analytics' | 'Roster' | 'Student Portal' | 'Security';
  summary: string;
  whatItDoes: string;
  whatToDo: string[];
  whatYouGet: string[];
  formula?: string;
  proTip?: string;
}

export const FEATURE_INFO_REGISTRY: Record<string, FeatureInfoItem> = {
  'auto-group-studio': {
    id: 'auto-group-studio',
    title: 'Intelligent Auto-Group & Diversity Studio',
    category: 'Algorithm',
    summary: 'Combinatorial multi-criteria balancing partitioner for high-synergy student teams.',
    whatItDoes: 'Solves the complex group formation problem by balancing student teams across 3 key demographic and skill dimensions: 50/50 gender parity, cross-cultural nationality dispersion (195+ countries), and CEFR English language proficiency spread.',
    whatToDo: [
      'Choose whether to optimize by target group size (e.g. 4–5 members) or a fixed number of teams.',
      'Select an algorithmic strategy: "Multi-Dimensional (Gender + Culture + English)", "Language Spread", or "Gender Parity".',
      'Click "Generate Optimized Groups" to run the combinatorial simulated annealing optimizer.',
      'Inspect the computed team diversity scores and drag-and-drop students between teams if manual fine-tuning is desired.',
      'Click "Apply Formed Groups to Roster" to lock the teams into the classroom directory.'
    ],
    whatYouGet: [
      'Balanced teams with zero demographic isolation (no lone international or minority students).',
      'An aggregate Diversity Score (0–100%) measuring overall balance across the entire class.',
      'Per-group diagnostic report cards showing gender breakdown, national origins, and average English level.',
      'Exportable team rosters in CSV and Excel formats.'
    ],
    formula: 'Diversity Score = w₁·GenderParity + w₂·NationalityEntropy + w₃·LanguageDistribution',
    proTip: 'A diversity score above 85% minimizes communication silos, prevents groupthink, and yields higher overall team satisfaction in semester projects.'
  },

  'webpa-scoring': {
    id: 'webpa-scoring',
    title: 'WebPA Mathematical Peer Scoring Engine',
    category: 'Grading',
    summary: 'Loughborough University WebPA algorithm for objective individual grade adjustments.',
    whatItDoes: 'Compiles multi-criteria anonymous peer reviews within each team, standardizes raw marks against team consensus, and derives an individual contribution multiplier (WebPA Factor). Self-grading reviews are strictly excluded to eliminate self-inflation bias.',
    whatToDo: [
      'Define your rubric criteria (e.g. Technical Contribution, Collaboration, Reliability, Quality).',
      'Have students complete anonymous peer reviews rating each teammate on 1–5 or 1–10 scales.',
      'The engine automatically computes each student’s received peer score average.',
      'Inspect the computed WebPA Multiplier (1.00 = expected average; >1.00 = high contribution; <1.00 = low contribution).',
      'Set the team deliverable base mark to instantly compute individual grades.'
    ],
    whatYouGet: [
      'Fair, individual accountability that rewards leaders and identifies free-riders.',
      'Non-punitive grade adjustments: points are redistributed within the team mark without artificial deflation.',
      'Protection against self-inflation and bad-faith collusion through double-blind masking.',
      'Clear mathematical audit trail ready for academic accreditation.'
    ],
    formula: 'WebPA Multiplier = (Student Received Peer Average) ÷ (Combined Team Average)',
    proTip: 'WebPA is the gold standard peer assessment algorithm used across UK, European, and US universities for capstone and STEM group work.'
  },

  'webpa-calibration': {
    id: 'webpa-calibration',
    title: 'WebPA Grade Calibration & Fudge Factor Tuning',
    category: 'Grading',
    summary: 'Fine-tune the sensitivity and bounds of individual grade adjustments.',
    whatItDoes: 'Controls how much weight is given to the shared group project deliverable mark vs. individual peer evaluation scores. Uses the official Loughborough weighting model with instructor-tunable sensitivity.',
    whatToDo: [
      'Enter the Project Base Mark (e.g., 85/100 awarded by the instructor for the shared group submission).',
      'Adjust the Calibrator Fudge Weight slider (0% to 100%):',
      '• 0% Fudge: Everyone receives the exact same team grade (no individual adjustment).',
      '• 50% Fudge (Recommended): 50% based on shared team deliverable + 50% scaled by peer ratings.',
      '• 100% Fudge: Grade is fully determined by peer contribution multiplier.',
      'Check the live Calibrated Mark column in the Gradebook table to preview results.'
    ],
    whatYouGet: [
      'Customized grading bounds tailored to your course syllabus and university grading policies.',
      'Safety rails that prevent a single low review from catastrophically failing a student.',
      'Transparent, defensible calculations to show students during grade inquiries.'
    ],
    formula: 'Final Grade = Base Team Mark × [ (1 - Fudge Weight) + (Fudge Weight × WebPA Multiplier) ]',
    proTip: 'A 50% Fudge Factor provides the optimal academic balance: it provides meaningful reward for outstanding effort while keeping final marks within a reasonable distribution.'
  },

  'calculation-matrix': {
    id: 'calculation-matrix',
    title: 'Real-Time Calculation Matrix & Multipliers',
    category: 'Grading',
    summary: 'Live recalculation workspace tracking peer reviews, team benchmarks, and adjusted marks.',
    whatItDoes: 'Instantly recalculates all team multipliers, standard deviations, and adjusted individual marks in real time as students submit evaluations, completely eliminating manual spreadsheet errors.',
    whatToDo: [
      'Monitor the submission ribbon to track completion percentages across teams.',
      'Switch milestone views to inspect different project phases.',
      'Click "Student PDF Reports" to preview and batch-download official grade report cards.',
      'Click "Download Excel Report (.xlsx)" for a comprehensive 2-sheet audit workbook with formulas.'
    ],
    whatYouGet: [
      'Zero manual spreadsheet maintenance or broken formulas.',
      'Immediate visibility into pending vs completed evaluations per team.',
      'Comprehensive export formats for Canvas, Blackboard, Moodle, and university registrar systems.'
    ],
    proTip: 'Calculations run client-side with full encryption for complete student data privacy and GDPR compliance.'
  },

  'radar-analytics': {
    id: 'radar-analytics',
    title: 'Multi-Axis Competency Spider Radar Analytics',
    category: 'Analytics',
    summary: 'Interactive polygon diagram comparing student and team performance across rubric dimensions.',
    whatItDoes: 'Plots peer evaluations across all rubric dimensions (e.g., Quality, Leadership, Communication, Problem Solving) on concentric radial axes, allowing immediate visual recognition of team strengths and skill gaps.',
    whatToDo: [
      'Use the "Overlay" dropdown to compare the Class Benchmark against any specific Team.',
      'Open any Student Report Card to see that student’s personal radar polygon plotted against their team average.',
      'Identify axes where the polygon expands outwards (core strengths) or contracts inwards (coaching opportunities).'
    ],
    whatYouGet: [
      'Visual, intuitive competency mapping that students understand at a glance.',
      'Objective evidence for post-project retrospective discussions and 1-on-1 mentoring.',
      'High-resolution radar charts embedded directly into student PDF report cards.'
    ],
    proTip: 'Radar charts help students identify specific behavioral strengths rather than just focusing on a single numerical mark.'
  },

  'johari-window': {
    id: 'johari-window',
    title: 'Self-Awareness & Johari Window Alignment Matrix',
    category: 'Analytics',
    summary: 'Psychological perception alignment comparing a student’s self-rating with anonymous peer consensus.',
    whatItDoes: 'Compares the score a student gives themselves during self-reflection against the anonymous scores given to them by teammates, classifying each student into 3 psychological self-awareness quadrants (±7.5% threshold):',
    whatToDo: [
      'Review the Class Self-Awareness distribution bar (Calibrated vs Blind Spot vs Imposter).',
      '• Accurately Calibrated (Teal): Self-rating matches peer consensus within ±7.5% (healthy, realistic self-perception).',
      '• Blind Spot / Overestimating (Amber): Student rated themselves substantially higher than their teammates rated them.',
      '• Imposter / Underestimating (Indigo): Student was rated very highly by peers but rated themselves modestly.',
      'Use these findings to guide constructive feedback during office hours.'
    ],
    whatYouGet: [
      'Actionable behavioral insights into student self-awareness and team dynamics.',
      'Early detection of uncommunicated friction or self-confidence issues.',
      'A safe, objective metric for teaching self-reflection in professional engineering and business education.'
    ],
    proTip: 'Research demonstrates that students with high Johari calibration show 40% higher career advancement in collaborative professional environments.'
  },

  'feedback-sentiment': {
    id: 'feedback-sentiment',
    title: 'Qualitative Feedback Themes & Praise Badges',
    category: 'Analytics',
    summary: 'Automated natural language keyword extraction and anonymous peer praise tokens.',
    whatItDoes: 'Extracts top positive themes and constructive growth suggestions from all written peer reviews. Displays peer praise badges (e.g., "Problem Solver", "Great Communicator", "Reliable", "Creative Thinker") awarded by teammates.',
    whatToDo: [
      'Inspect the Top Strengths and Growth Areas keyword clouds in the Grade Analytics tab.',
      'View praise badge counts in the Gradebook table and Student Report Cards.',
      'Export anonymized qualitative comment transcripts with one click.'
    ],
    whatYouGet: [
      'Morale-boosting peer recognition badges that highlight non-cognitive skills.',
      'Anonymized, constructive qualitative comments that give students concrete steps for improvement.',
      'Instant sentiment overview of classroom collaboration dynamics.'
    ],
    proTip: 'Combining quantitative WebPA multipliers with qualitative praise tags ensures grading feels both fair and encouraging.'
  },

  'anomaly-detection': {
    id: 'anomaly-detection',
    title: 'AI & Statistical Anomaly & Collusion Audit',
    category: 'Algorithm',
    summary: 'Automated detection of score manipulation, collusion rings, extreme bias, and retaliatory ratings.',
    whatItDoes: 'Continuously scans submission patterns for statistical discrepancies that deviate from normal grading distributions, flagging potential grading bad-faith for instructor review.',
    whatToDo: [
      'Check the Anomaly Audit box in Grade Analytics for flagged alerts:',
      '• Self-Inflation Alert: Student gave themselves 100% while team gave them significantly lower marks.',
      '• Collusion Ring: Two or more students giving each other reciprocal maximum marks while downgrading others.',
      '• Outlier / Retaliatory Score: A reviewer giving extreme 1-star ratings when all other peers give 5-star ratings (>1.5 StdDev).',
      'Click any alert to inspect the individual ratings and apply moderation overrides if necessary.'
    ],
    whatYouGet: [
      'Automated defense against unfair or malicious peer grading.',
      'Confidence that final grades accurately reflect genuine individual contribution.',
      'Audit log with flagged standard deviations to justify instructor adjustments.'
    ],
    formula: 'Anomaly Flag = |Reviewer Score - Team Consensus Mean| > 1.5 · Standard Deviation',
    proTip: 'Flags serve as instructor alerts for review and do not alter grades automatically without instructor approval.'
  },

  'results-summary-sheet': {
    id: 'results-summary-sheet',
    title: 'Results Summary Sheet & Gradebook Matrix',
    category: 'Grading',
    summary: 'Comprehensive classroom performance gradebook with raw rubric averages, standard deviations, and calibrated marks.',
    whatItDoes: 'Presents an exhaustive master table showing each student’s enrollment status, review count, per-criterion peer averages, consensus standard deviations, praise badges, WebPA factor, and final mark.',
    whatToDo: [
      'Filter by Team Group or search by Student Name, Degree, or ID.',
      'Inspect the StdDev columns: low values indicate strong team agreement; high values indicate split peer opinions.',
      'Click "Export Excel Report" for a formatted multi-sheet workbook, or "CSV" for LMS gradebook import.'
    ],
    whatYouGet: [
      'Complete transparency across all evaluation dimensions.',
      'Ready-to-archive spreadsheets formatted with Excel styling and color coding.',
      'Direct copy-paste compatibility with Canvas, Blackboard, and Moodle gradebooks.'
    ],
    proTip: 'Use the group filter dropdown to focus on a specific team during presentations or grading conferences.'
  },

  'milestones-sprints': {
    id: 'milestones-sprints',
    title: 'Milestone Sprints & History Archiver',
    category: 'Grading',
    summary: 'Freeze and archive active grading sessions into permanent milestone records.',
    whatItDoes: 'Saves a complete snapshot of all peer evaluations, scores, and multipliers for a project sprint, allowing instructors to reset the active evaluation matrix for the next sprint while preserving past marks.',
    whatToDo: [
      'Once a sprint deadline passes, click "Archive Active Session".',
      'Give the milestone a name (e.g. "Sprint 1: Architecture & Design").',
      'The milestone is permanently archived and can be reviewed or deleted at any time.'
    ],
    whatYouGet: [
      'Historical record of student performance trajectory across multiple project phases.',
      'Ability to run recurring peer evaluations without losing historical submissions.',
      'Aggregate semester grade calculations combining multiple milestone weights.'
    ],
    proTip: 'Running 2 to 3 milestone reviews across a semester prevents end-of-term surprises and gives students a chance to improve.'
  },

  'import-wizard': {
    id: 'import-wizard',
    title: 'Bulk Roster Importer & Smart Column Mapper',
    category: 'Roster',
    summary: 'Import classroom rosters from CSV, Excel, LMS exports, or raw copy-paste text.',
    whatItDoes: 'Auto-detects columns for Student Name, Email, Unique ID, Assigned Team, Nationality, Degree, Gender, and CEFR English level. Validates duplicate IDs/emails and provides an in-browser spreadsheet editor before committing.',
    whatToDo: [
      'Upload a .csv, .xlsx, .txt file or paste raw student data directly into the input box.',
      'Review the smart column mapping dropdowns to match your file columns.',
      'Review the verification table and correct any flagged validation errors.',
      'Click "Finalize & Import Roster" to load all students into your classroom.'
    ],
    whatYouGet: [
      'Instant classroom setup in under 30 seconds.',
      'Clean data validation preventing duplicate emails or broken student IDs.',
      'Support for pre-assigned teams or unassigned rosters for auto-grouping.'
    ],
    proTip: 'You can download the sample template (.xlsx) from the Quick Actions card for an example spreadsheet structure.'
  },

  'classroom-roster': {
    id: 'classroom-roster',
    title: 'Classroom Roster & Enrollment Directory',
    category: 'Roster',
    summary: 'Centralized directory of student records, assigned teams, and international status.',
    whatItDoes: 'Tracks student profiles including institutional emails, assigned teams, CEFR English level, nationality, exchange journey, and submission status.',
    whatToDo: [
      'Add individual students or import an entire class list via the Bulk CSV Roster Importer.',
      'Filter and search by team, nationality, degree, or completion status.',
      'Edit student details or trigger instant peer evaluation test links.'
    ],
    whatYouGet: [
      'Centralized, searchable classroom registry.',
      'Instant tracking of pending vs completed evaluations.',
      'Double-blind hashing protecting student identities during review rounds.'
    ],
    proTip: 'All student IDs are hashed and double-blinded during evaluation rounds for complete confidentiality.'
  },

  'classroom-qr': {
    id: 'classroom-qr',
    title: 'Live Classroom QR & Presentation Mode',
    category: 'Student Portal',
    summary: 'Full-screen projector display for in-class self-enrollment and real-time grading.',
    whatItDoes: 'Renders dynamic QR codes for projection in lecture halls, allowing students to scan on their smartphones and instantly self-register or submit peer evaluations.',
    whatToDo: [
      'Click "Open QR Presentation Mode" to open the high-contrast projector view.',
      'Students scan the QR code to reach the mobile-optimized self-registration portal.',
      'Watch live participant counters increment as students register.'
    ],
    whatYouGet: [
      'Frictionless classroom onboarding: zero student accounts or passwords required.',
      'Real-time live counter showing enrollment and evaluation progress on the big screen.',
      'Cloud synchronization keeping student smartphones instantly in sync with the instructor.'
    ],
    proTip: 'Cloud synchronization ensures student smartphones instantly sync with the professor’s dashboard.'
  },

  'rubric-presets': {
    id: 'rubric-presets',
    title: 'Accredited Academic Rubric Presets Library',
    category: 'Grading',
    summary: 'Instant 1-click loading of standardized rubrics from ABET, AACSB, CDIO, and WebPA standards.',
    whatItDoes: 'Pre-populates criteria dimensions with professional behavioral indicators (e.g., Engineering Capstone, Business Case Study, Software Agile Sprint, Clinical Teamwork).',
    whatToDo: [
      'Browse the preset cards in the Evaluation Rubric tab.',
      'Click "Load Preset" on any rubric (e.g., Standard WebPA 4-Criteria, Agile Software Teamwork).',
      'Customize criteria names, scales (1–5 Likert or 1–10 scale), and weights to match your course syllabus.'
    ],
    whatYouGet: [
      'Accredited, standardized evaluation rubrics recognized by ABET and AACSB.',
      'Clear behavioral indicators that guide students on what constitutes excellent teamwork.',
      'Consistent, calibrated scoring across diverse classroom sections.'
    ],
    proTip: 'Using 3 to 5 well-defined rubric dimensions ensures students evaluate peers with high consistency and lower cognitive fatigue.'
  },

  'milestone-manager': {
    id: 'milestone-manager',
    title: 'Milestone Sprints & Aggregate Course Weighting',
    category: 'Grading',
    summary: 'Manage multi-phase project sprints with independent grading weights.',
    whatItDoes: 'Enables sequential peer evaluation rounds throughout a semester (e.g. Sprint 1 Midterm 30%, Sprint 2 Final Delivery 70%). Calculates an aggregate cumulative WebPA grade.',
    whatToDo: [
      'Add milestones corresponding to key deliverables (e.g. Design Phase, Prototype, Final Defense).',
      'Assign percentage weights to each milestone totaling 100%.',
      'Archive active evaluation sessions into historical milestones to freeze marks.'
    ],
    whatYouGet: [
      'Continuous accountability across the full duration of a group project.',
      'Automated aggregate grade calculation combining all sprint marks.',
      'Historical progress tracking showing which students improved over time.'
    ],
    proTip: 'Running a formative peer assessment early in week 3-4 helps identify free-riders before final grades are impacted.'
  },

  'link-dispatcher': {
    id: 'link-dispatcher',
    title: 'Personal Evaluation Link Dispatcher',
    category: 'Student Portal',
    summary: 'Automated personal access URL distributor and customized email notifier.',
    whatItDoes: 'Generates secure, personalized evaluation links for each enrolled student and provides copy-paste email templates or direct mailing triggers.',
    whatToDo: [
      'Click "Dispatch Student Links" in the dashboard toolbar.',
      'Select target milestone and recipient group (All Students, Pending Only, etc.).',
      'Preview personalized email templates with dynamic tokens like {StudentName} and {PersonalLink}.',
      'Send via native mail client or copy links directly.'
    ],
    whatYouGet: [
      '1-Click private evaluation access for every student.',
      'Automated reminder emails sent only to students with pending evaluations.',
      'Zero password fatigue: unique secure tokens load only the student’s assigned teammates.'
    ],
    proTip: 'Students do not need passwords; their unique link safely loads only their assigned team members.'
  },

  'student-enrollment-portal': {
    id: 'student-enrollment-portal',
    title: 'Student Self-Registration Portal',
    category: 'Student Portal',
    summary: 'Mobile-first onboarding form for student profile and demographic balancing.',
    whatItDoes: 'Collects institutional identity, degree, gender, CEFR English level, and international/Erasmus exchange details for algorithmic team optimization.',
    whatToDo: [
      'Students scan the classroom QR code or click their join link on mobile.',
      'Fill out institutional email and degree field.',
      'Select CEFR English proficiency (Native, Fluent, Advanced, Working, Basic).',
      'Indicate international/exchange status and residence/host country.',
      'Receive instant personal grading portal access link.'
    ],
    whatYouGet: [
      'Frictionless mobile onboarding in under 60 seconds.',
      'Rich demographic profile data for diversity optimization.',
      'Direct link to their personal grading dashboard upon submission.'
    ],
    proTip: 'Mobile optimized with instant searchable dropdowns for 195+ countries worldwide.'
  },

  'student-grading-matrix': {
    id: 'student-grading-matrix',
    title: 'Anonymous Teammate Assessment Matrix',
    category: 'Student Portal',
    summary: 'Student evaluation workspace with double-blind peer rating sliders.',
    whatItDoes: 'Provides an intuitive interface for students to grade teammates across rubric criteria, select praise tags, and complete self-calibration ratings.',
    whatToDo: [
      'Rate each assigned teammate on the 1-5 rubric criteria scales.',
      'Select up to 3 praise badges representing peer strengths.',
      'Provide constructive feedback in the optional written text areas.',
      'Complete the self-reflection rating and click "Submit Peer Evaluations".'
    ],
    whatYouGet: [
      'Engaging, confidential evaluation experience.',
      'Immediate feedback on self-awareness calibration.',
      'Safe, anonymous praise and constructive growth tips for teammates.'
    ],
    proTip: 'Reviews can be updated any time before the instructor closes the milestone evaluation window.'
  }
};
