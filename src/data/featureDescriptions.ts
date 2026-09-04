export interface FeatureInfoItem {
  id: string;
  title: string;
  category: 'Algorithm' | 'Grading' | 'Analytics' | 'Roster' | 'Student Portal' | 'Interface & Layout' | 'Security';
  summary: string;
  whatItDoes: string;
  whatToDo: string[];
  whatYouGet: string[];
  formula?: string;
  proTip?: string;
}

export const FEATURE_INFO_REGISTRY: Record<string, FeatureInfoItem> = {
  // --- INTERFACE & LAYOUT PRESETS ---
  'density-presets': {
    id: 'density-presets',
    title: 'Interface Density & Layout Presets',
    category: 'Interface & Layout',
    summary: 'Instant single-click workspace personalization switching between Minimal, Standard, and Full Suite layouts.',
    whatItDoes: 'Provides pre-calibrated interface density configurations that toggle visibility across 40+ granular UI elements (Header icons, Home Hub widgets, Section 1 roster tools, Section 2 rubric cards, and Section 3 analytics cards).',
    whatToDo: [
      'Click the "Interface Density & Layout Presets" card on the Home Hub or navigate to Settings → Interface & Modules.',
      'Select "Standard Default" for a balanced, professional workflow showing essential tools without clutter.',
      'Select "Minimal Mode" for an ultra-focused distraction-free layout (hides meters, export bars, advanced audit cards, and secondary icons).',
      'Select "Full Suite" to unlock all 40+ advanced modules and diagnostic panels simultaneously.',
      'Click "Customize View" in the top navigation bar to fine-tune individual toggles to your personal teaching style.'
    ],
    whatYouGet: [
      'Zero visual clutter: customize exactly what appears on your screen.',
      'Optimized projector and classroom presentation layouts.',
      'Instant configuration persistence stored automatically in your browser profile.'
    ],
    proTip: 'Use Minimal Mode during initial classroom onboarding sessions so students and instructors focus exclusively on roster verification and basic rubric review.'
  },

  // --- SECTION 1: ENROLLMENT & TEAMS ---
  'auto-group-studio': {
    id: 'auto-group-studio',
    title: 'Intelligent Auto-Group & Diversity Studio',
    category: 'Algorithm',
    summary: 'Combinatorial simulated annealing partitioner creating high-synergy, multi-dimensionally balanced student teams.',
    whatItDoes: 'Solves the complex NP-hard group formation problem by balancing student teams across multi-dimensional criteria: home vs. host university dispersion, cross-border nationality mixing (195+ countries), 50/50 gender parity, and CEFR English language proficiency spread.',
    whatToDo: [
      'Choose whether to optimize by target group size (e.g., 4–5 members) or a fixed number of teams.',
      'Select an algorithmic strategy: "Multi-Dimensional (Gender + Nationality + University + English)", "50/50 Gender Parity", or "Nationality & University Mixing".',
      'Click "Generate Optimized Groups" to run the combinatorial simulated annealing optimizer.',
      'Inspect computed team diversity scores and drag-and-drop students between teams if manual fine-tuning is desired.',
      'Click "Apply Formed Groups to Roster" to lock the teams into the classroom directory.'
    ],
    whatYouGet: [
      'Balanced teams with zero demographic isolation and rich multi-institutional collaboration.',
      'An aggregate Diversity Score (0–100%) measuring overall balance across the entire class.',
      'Per-group diagnostic report cards showing gender breakdown, university origins, nationalities, and average English level.',
      'Exportable team rosters in CSV and Excel formats.'
    ],
    formula: 'Diversity Score = w₁·UniversityDispersion + w₂·NationalityEntropy + w₃·GenderParity + w₄·LanguageDistribution',
    proTip: 'A diversity score above 85% minimizes communication silos, prevents groupthink, and yields higher overall team satisfaction in semester projects.'
  },

  'classroom-qr': {
    id: 'classroom-qr',
    title: 'Self-Enrollment QR Code & Mobile Portal',
    category: 'Student Portal',
    summary: 'High-resolution presentation QR display and direct mobile registration link for frictionless in-class onboarding.',
    whatItDoes: 'Allows 100+ students to onboard simultaneously in under 30 seconds using their smartphones. Captures full names, institutional emails, academic degrees, gender, CEFR English proficiency, and international exchange status.',
    whatToDo: [
      'Click "Open QR Presentation Mode" to project a large, clean QR code on your auditorium display.',
      'Students scan the code or access the direct URL via laptop/phone browser.',
      'Watch live enrollment counters update in real time on the instructor dashboard.',
      'Students automatically receive direct access to their anonymous peer evaluation portal.'
    ],
    whatYouGet: [
      'Instant classroom onboarding without manual spreadsheet data entry.',
      'Zero password fatigue: unique secure tokens load each student\'s profile and assigned teammates.',
      'Automatic duplicate name and email detection during registration.'
    ],
    proTip: 'Cloud synchronization updates student submissions on the dashboard in real-time without refreshing the page.'
  },

  'quick-actions': {
    id: 'quick-actions',
    title: 'Quick Actions & 100 Demo Cohort Generator',
    category: 'Roster',
    summary: 'Instant realistic demo student cohort populator, single participant additions, and roster spreadsheet downloads.',
    whatItDoes: 'Populates the classroom with 100 realistic, culturally diverse demo student records spanning 35+ countries, multiple universities, CEFR English proficiencies (B2 to Native), and degrees for instant testing and faculty demonstrations.',
    whatToDo: [
      'Click "100 Demo Sample" inside Section 1 to instantly generate a diverse student cohort.',
      'Click "Download Sample Template (.xlsx)" for a pre-formatted Excel template ready for university LMS data.',
      'Use "Manual Add Participant" to quickly append a late-enrolling student to any team.'
    ],
    whatYouGet: [
      'Instant test cohort to verify grouping algorithms, rubrics, and WebPA calculations in seconds.',
      'Ready-to-use template files formatted for Canvas, Blackboard, and Moodle imports.',
      'Pre-populated international and Erasmus exchange attributes.'
    ],
    proTip: 'Combine "100 Demo Sample" with "AutoGroup Studio" to showcase simulated annealing diversity optimization during faculty workshops.'
  },

  'import-wizard': {
    id: 'import-wizard',
    title: 'Smart Roster Import Wizard & Column Mapper',
    category: 'Roster',
    summary: 'Bulk onboard student cohorts from Excel (.xlsx), CSV, or clipboard text with intelligent automatic header column mapping.',
    whatItDoes: 'Auto-detects columns for Student Name, Email, Unique ID, Assigned Team, Nationality, Degree, Gender, and CEFR English level. Validates duplicate IDs/emails and provides an in-browser spreadsheet editor before committing.',
    whatToDo: [
      'Upload a .csv, .xlsx, .txt file or paste raw student data directly into the wizard text area.',
      'Review the smart column mapping dropdowns to match your file columns.',
      'Review the verification table and correct any flagged validation errors.',
      'Click "Finalize & Import Roster" to load all students into your classroom directory.'
    ],
    whatYouGet: [
      'Instant classroom setup in under 30 seconds.',
      'Clean data validation preventing duplicate emails or malformed student records.',
      'Support for pre-assigned teams or unassigned rosters for auto-grouping.'
    ],
    proTip: 'You can download the sample template (.xlsx) from the Quick Actions card for an example spreadsheet structure.'
  },

  'classroom-roster': {
    id: 'classroom-roster',
    title: 'Classroom Roster & Multi-Select Bulk Actions',
    category: 'Roster',
    summary: 'Centralized directory of student records, assigned teams, multi-select toolbar, and duplicate audits.',
    whatItDoes: 'Presents a comprehensive roster table showing student profiles, institutional emails, assigned teams, CEFR English level, nationality, exchange journey, and submission status. Supports bulk team reassignments and deletions.',
    whatToDo: [
      'Search by student name, degree, or ID, or filter by specific team using the dropdown.',
      'Select student checkboxes to activate the Multi-Select Bulk Actions toolbar.',
      'Reassign multiple students to a team or batch delete entries with a single click.',
      'Inspect amber warning badges that alert you to duplicate email registrations.',
      'Click the smartphone icon in any student row to test their personal evaluation experience.'
    ],
    whatYouGet: [
      'Centralized, searchable classroom registry with fast in-table filtering.',
      'Instant tracking of pending vs completed evaluations per student.',
      'Double-blind hashing protecting student identities during review rounds.'
    ],
    proTip: 'All student IDs are hashed and double-blinded during evaluation rounds for complete confidentiality.'
  },

  'duplicate-detector': {
    id: 'duplicate-detector',
    title: 'Duplicate Enrollment Warning & Audit Banner',
    category: 'Roster',
    summary: 'Real-time detection and resolution of duplicate student emails, names, or student IDs.',
    whatItDoes: 'Continuously monitors the classroom roster during self-registration and spreadsheet imports. Flags duplicate entries with actionable resolution controls to prevent duplicate evaluation submissions.',
    whatToDo: [
      'When duplicates are detected, an alert banner appears above the roster table.',
      'Review the duplicate pairs or groups highlighted in amber.',
      'Choose to merge duplicate records or delete the redundant entry with 1 click.'
    ],
    whatYouGet: [
      'Guaranteed roster integrity before evaluation links are dispatched.',
      'Prevention of double-voting or split grades for the same student.'
    ],
    proTip: 'Always resolve duplicate warnings prior to launching Section 2 (Review System) or generating student evaluation links.'
  },

  // --- SECTION 2: REVIEW SYSTEM ---
  'rubric-builder': {
    id: 'rubric-builder',
    title: '100% Balanced Rubric Builder & Weight Auto-Balancer',
    category: 'Grading',
    summary: 'Design multi-criteria evaluation rubrics with qualitative performance anchors and mathematical 100% weight balancing.',
    whatItDoes: 'Configures criteria dimensions (e.g., Technical Contribution, Communication, Reliability, Quality of Work) with customizable scale ranges and qualitative descriptors. Ensures weights sum exactly to 100% for mathematical validity in academic peer grading.',
    whatToDo: [
      'Add custom criteria or load an accredited preset from the templates ribbon.',
      'Edit criteria names, behavioral descriptions, and individual weight percentages.',
      'Use the "Auto-Balance Weights to 100%" button to distribute weight percentages equally across all criteria with 1 click.',
      'Verify the live validation bar confirms "Total Weightage: 100% (Balanced & Valid)".'
    ],
    whatYouGet: [
      'Mathematically sound evaluation rubrics ready for university accreditation.',
      'Clear behavioral descriptors that guide students on what constitutes excellent teamwork.',
      'Guaranteed 100% weight balance preventing distorted grade calculations.'
    ],
    formula: 'Total Weight = ∑(Criteria Weight_i) = 100.0%',
    proTip: 'Keeping rubric criteria between 3 and 5 dimensions reduces student cognitive fatigue and yields the most consistent peer ratings.'
  },

  'grading-rubric': {
    id: 'grading-rubric',
    title: 'Rubric Criteria & Weightage Management',
    category: 'Grading',
    summary: 'Configure multi-dimensional evaluation dimensions with customized score bounds and weights.',
    whatItDoes: 'Controls the criteria used by students to assess their teammates. Each criterion has an adjustable minimum and maximum score, weight percentage, and qualitative behavioral descriptions.',
    whatToDo: [
      'Click "Add Custom Criterion" to append a new evaluation dimension.',
      'Set the score bounds (e.g., 1 to 20 or 1 to 5) and assign the criterion weight.',
      'Click "Auto-Balance Weights" if you want all criteria to have equal weighting.'
    ],
    whatYouGet: [
      'Flexible evaluation criteria tailored to your course syllabus.',
      'Consistent rubric dimensions displayed across student evaluation portals and report cards.'
    ],
    proTip: 'Use 1–20 scales for granular grading in engineering capstones and 1–5 Likert scales for soft skills.'
  },

  'rubric-presets': {
    id: 'rubric-presets',
    title: 'Integrated Peer Assessment Framework (IPAF) Ribbon',
    category: 'Grading',
    summary: 'Instant 1-click loading of the research-synthesized IPAF standard derived from CATME, Salas Big Five, AAC&U VALUE, and WebPA.',
    whatItDoes: 'Pre-populates criteria with 6 empirically validated dimensions with behaviorally anchored rating scale (BARS) indicators: Contribution Quality (20%), Reliability (20%), Problem-Solving (15%), Communication (15%), Initiative (15%), and Quality Drive (15%) — totaling exactly 100%.',
    whatToDo: [
      'Locate the Standardized Rubric Ribbon in Section 2: Review System.',
      'Click the "IPAF Standard" button to instantly load the research-synthesized framework.',
      'The rubric automatically configures 6 behaviorally anchored dimensions totaling exactly 100% weight.',
      'Feel free to fine-tune descriptors or weights if needed for specific course syllabi.'
    ],
    whatYouGet: [
      'Empirically validated peer evaluation dimensions supported by meta-analytic research (Falchikov & Goldfinch; Ohland et al.).',
      'Differentiated weighting consensus: task contribution and reliability carry higher weight, while collaborative processes carry balanced weight.',
      'Clear behavioral indicators preventing rater ambiguity and halo effects.'
    ],
    proTip: 'IPAF consolidates CATME, Salas\'s Big Five, AAC&U VALUE, and Loughborough WebPA into one unified 6-dimension instrument, saving hours of manual rubric design.'
  },

  'target-scale': {
    id: 'target-scale',
    title: 'Final Grade Scaling Target Scale Card',
    category: 'Grading',
    summary: 'Configure target score bounds: Likert (1–5), Out of 20 (Standard), Out of 100 (Percentage), or Direct Rubric Sum.',
    whatItDoes: 'Defines the mathematical scale to which individual final peer grades are normalized. Allows instructors to seamlessly match their university grading scheme (e.g., scale of 20 in France/Belgium, percentage 100 in UK/US, or 1–5 GPA).',
    whatToDo: [
      'Select a target scale from the dropdown: "Out of 20", "Out of 100 (Percentage)", "Scale of 1–5", or "Direct Rubric Sum".',
      'The system automatically recalculates calibrated gradebook marks to fit the chosen scale bounds.',
      'Check the live Calibrated Mark column in the Gradebook table to preview results.'
    ],
    whatYouGet: [
      'Seamless alignment with your university syllabus and registrar grading standards.',
      'Accurate report cards generated in the exact grading scale your students expect.'
    ],
    proTip: 'When using "Out of 100", student report cards and Excel exports generate direct percentage marks for Canvas, Blackboard, or Moodle gradebook upload.'
  },

  'eval-simulator': {
    id: 'eval-simulator',
    title: 'Student Interface Experience Preview & Simulator',
    category: 'Student Portal',
    summary: 'Interactive preview simulating what students experience on their mobile devices with qualitative snap score buttons.',
    whatItDoes: 'Allows instructors to test evaluation scales before student links are dispatched. Demonstrates qualitative score tier snap buttons ("Needs Work", "Good", "Excellent") and fine-tuning sliders with color-coded feedback.',
    whatToDo: [
      'Click the qualitative snap buttons ("Needs Work (50%)", "Good (80%)", "Excellent (100%)") to test scale responses.',
      'Drag the score slider to fine-tune the mark and observe descriptive feedback.',
      'Ensure the scale and qualitative guidance are clear and intuitive for your students.'
    ],
    whatYouGet: [
      'Confidence in rubric clarity before broadcasting links to 100+ students.',
      'Firsthand experience of the mobile-first evaluation interface.'
    ],
    proTip: 'Qualitative tier snap buttons help students anchor their ratings objectively rather than defaulting to arbitrary numbers.'
  },

  'milestones-sprints': {
    id: 'milestones-sprints',
    title: 'Milestone Sprints & Session Archiver',
    category: 'Grading',
    summary: 'Freeze and archive active grading sessions into permanent milestone records across multi-phase project sprints.',
    whatItDoes: 'Saves a complete snapshot of all peer evaluations, scores, and multipliers for a project sprint (e.g., Sprint 1 Midterm 30%, Sprint 2 Final Delivery 70%), allowing instructors to reset the active evaluation matrix for the next sprint while preserving past marks.',
    whatToDo: [
      'Once a sprint deadline passes, click "Archive Active Session".',
      'Give the milestone a name (e.g. "Sprint 1: Architecture & Design").',
      'The milestone is permanently archived and can be reviewed, compared, or deleted at any time.'
    ],
    whatYouGet: [
      'Historical record of student performance trajectory across multiple project phases.',
      'Ability to run recurring peer evaluations without losing historical submissions.',
      'Aggregate semester grade calculations combining multiple milestone weights.'
    ],
    proTip: 'Running 2 to 3 milestone reviews across a semester prevents end-of-term surprises and gives students a chance to improve.'
  },

  // --- SECTION 3: GRADING & PERFORMANCE ANALYTICS ---
  'webpa-scoring': {
    id: 'webpa-scoring',
    title: 'WebPA Mathematical Peer Scoring Engine',
    category: 'Grading',
    summary: 'Loughborough University WebPA algorithm for objective individual grade adjustments.',
    whatItDoes: 'Compiles multi-criteria anonymous peer reviews within each team, standardizes raw marks against team consensus, and derives an individual contribution multiplier (WebPA Factor). Self-grading reviews are strictly excluded to eliminate self-inflation bias.',
    whatToDo: [
      'Define your rubric criteria in Section 2.',
      'Have students complete anonymous peer reviews rating each teammate.',
      'The engine automatically computes each student\'s received peer score average.',
      'Inspect the computed WebPA Multiplier (1.00 = expected average; >1.00 = high contribution; <1.00 = low contribution).',
      'Set the team deliverable base mark in the WebPA Calibrator to instantly compute individual grades.'
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
    summary: 'Fine-tune the sensitivity and bounds of individual grade adjustments with the 0%–100% Fudge Weight slider.',
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
      'Click "Export Excel (.xlsx)" for a comprehensive 2-sheet audit workbook with formulas.'
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
      'Open any Student Report Card to see that student\'s personal radar polygon plotted against their team average.',
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
    summary: 'Psychological perception alignment comparing a student\'s self-rating with anonymous peer consensus.',
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
    formula: 'Delta = (Self Rating Score - Peer Average Score) ÷ Max Score  [Threshold: ±7.5%]',
    proTip: 'Research demonstrates that students with high Johari calibration show 40% higher career advancement in collaborative professional environments.'
  },

  'feedback-sentiment': {
    id: 'feedback-sentiment',
    title: 'Qualitative Feedback Themes & Praise Badges',
    category: 'Analytics',
    summary: 'Automated natural language keyword extraction and anonymous peer praise tokens.',
    whatItDoes: 'Extracts top positive themes and constructive growth suggestions from all written peer reviews. Displays peer praise badges (e.g., "Problem Solver", "Great Communicator", "Reliable", "Creative Thinker") awarded by teammates.',
    whatToDo: [
      'Inspect the Top Strengths and Growth Areas keyword clouds in Section 3.',
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
    title: 'Statistical Anomaly & Collusion Audit',
    category: 'Algorithm',
    summary: 'Automated detection of score manipulation, collusion rings, extreme bias, and retaliatory ratings.',
    whatItDoes: 'Continuously scans submission patterns for statistical discrepancies that deviate from normal grading distributions, flagging potential grading bad-faith for instructor review.',
    whatToDo: [
      'Check the Anomaly Audit box in Section 3 for flagged alerts:',
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
    title: 'Results Summary Sheet & Gradebook Table',
    category: 'Grading',
    summary: 'Comprehensive classroom performance gradebook with raw rubric averages, standard deviations, and calibrated marks.',
    whatItDoes: 'Presents an exhaustive master table showing each student\'s enrollment status, review count, per-criterion peer averages, consensus standard deviations, praise badges, WebPA factor, and final calibrated mark.',
    whatToDo: [
      'Filter by Team Group or search by Student Name, Degree, or ID.',
      'Inspect the StdDev columns: low values indicate strong team agreement; high values indicate split peer opinions.',
      'Click "Export Excel Report" for a formatted multi-sheet workbook, or "CSV" for LMS gradebook import.',
      'Click "Student PDF Reports" to batch-download personalized report cards.'
    ],
    whatYouGet: [
      'Complete transparency across all evaluation dimensions.',
      'Ready-to-archive spreadsheets formatted with Excel styling and color coding.',
      'Direct copy-paste compatibility with Canvas, Blackboard, and Moodle gradebooks.'
    ],
    proTip: 'Use the group filter dropdown to focus on a specific team during presentations or grading conferences.'
  },

  'who-rated-whom': {
    id: 'who-rated-whom',
    title: 'Who Rated Whom: Evaluation Audit Cross-Matrix',
    category: 'Analytics',
    summary: 'Double-blind peer rating matrix displaying exact ratings given and received across teammates.',
    whatItDoes: 'Displays a cross-tabular grid showing exactly how each student in a team rated each peer across criteria. Enables instructors to instantly audit peer consensus, check for reciprocal biases, and inspect written comments in context.',
    whatToDo: [
      'Select a team to view their internal evaluation cross-matrix.',
      'Rows represent reviewers; columns represent recipients.',
      'Examine the diagonal for self-ratings (strictly excluded from WebPA calculations).',
      'Click any cell to inspect criteria sub-scores and qualitative feedback.'
    ],
    whatYouGet: [
      'Complete audit visibility into team dynamics and grading integrity.',
      'Defensible evidence to address student grading appeals.',
      'Instant detection of isolated interpersonal conflicts.'
    ],
    proTip: 'Only instructors can access this matrix; students only ever see their aggregated, anonymized team feedback.'
  },

  // --- SYSTEM & PORTALS ---
  'command-palette': {
    id: 'command-palette',
    title: 'Quick Search & Command Palette (Ctrl+K)',
    category: 'Interface & Layout',
    summary: 'Instant spotlight finder jumping across students, rubrics, team filters, and classroom actions with keyboard speed.',
    whatItDoes: 'Launches a fast, keyboard-accessible command bar by pressing Ctrl+K (or Cmd+K) anywhere in the application. Lets you search students by name or email, jump directly to specific teams, trigger exports, or switch tabs.',
    whatToDo: [
      'Press Ctrl+K (Cmd+K on macOS) or click the Search bar in the top navigation.',
      'Type any student name, team name, or navigation action.',
      'Use Arrow keys to navigate results and press Enter to execute.'
    ],
    whatYouGet: [
      'Rapid keyboard navigation across large classrooms with 100+ students.',
      'Direct shortcuts to common actions without traversing multiple menus.'
    ],
    proTip: 'Type "/" or press "?" to open the full global keyboard shortcuts cheat sheet.'
  },

  'projector-view': {
    id: 'projector-view',
    title: 'Fullscreen Live Classroom Projector Mode',
    category: 'Student Portal',
    summary: 'Privacy-safe auditorium presentation display showing big QR check-ins and live progress without exposing grades.',
    whatItDoes: 'Provides an auditorium-ready presentation screen featuring a live digital clock, high-contrast QR code for student check-ins, team diversity overview, and submission progress meters, while hiding private student marks.',
    whatToDo: [
      'Click the "Projector" button in the top action dock.',
      'Project the display onto your classroom screen during lectures or workshops.',
      'Students scan the code to access their registration or peer rating portal.'
    ],
    whatYouGet: [
      'Privacy-safe public display that will not accidentally expose student grades or peer ratings.',
      'Live submission progress encouraging students to complete evaluations before deadline.'
    ],
    proTip: 'Press F11 in your browser for true full-screen auditorium projection.'
  },

  'link-dispatcher': {
    id: 'link-dispatcher',
    title: 'Classroom Email Center & Personal Link Dispatcher',
    category: 'Student Portal',
    summary: 'Automated personal access URL distributor and customized email notifier via Brevo SMTP or EmailJS.',
    whatItDoes: 'Generates secure, personalized evaluation links for each enrolled student and provides copy-paste email templates or direct mailing triggers with real-time delivery logs.',
    whatToDo: [
      'Click the Email icon in the top navigation dock.',
      'Select the target milestone and recipient group (All Students, Pending Only, etc.).',
      'Preview personalized email templates with dynamic tokens like {StudentName} and {PersonalLink}.',
      'Send via native mail client, Brevo SMTP API, or copy links directly.'
    ],
    whatYouGet: [
      '1-Click private evaluation access for every student.',
      'Automated reminder emails sent only to students with pending evaluations.',
      'Zero password fatigue: unique secure tokens load only the student\'s assigned teammates.'
    ],
    proTip: 'Students do not need passwords; their unique link safely loads only their assigned team members.'
  },

  'student-grading-matrix': {
    id: 'student-grading-matrix',
    title: 'Anonymous Teammate Assessment Matrix (Student View)',
    category: 'Student Portal',
    summary: 'Student evaluation workspace with double-blind peer rating sliders and praise badges.',
    whatItDoes: 'Provides an intuitive, mobile-friendly interface for students to grade teammates across rubric criteria, select praise tags, and complete self-calibration ratings without seeing other students\' grades.',
    whatToDo: [
      'Rate each assigned teammate on the rubric criteria scales.',
      'Select up to 3 praise badges representing peer strengths.',
      'Provide constructive feedback in the optional written text areas.',
      'Complete the self-reflection rating and click "Submit Peer Evaluations".'
    ],
    whatYouGet: [
      'Engaging, confidential evaluation experience for students.',
      'Immediate feedback on self-awareness calibration.',
      'Safe, anonymous praise and constructive growth tips for teammates.'
    ],
    proTip: 'Reviews can be updated any time before the instructor closes the milestone evaluation window.'
  },

  'lms-export': {
    id: 'lms-export',
    title: 'LMS Gradebook Integration & Smart Export Formats',
    category: 'Grading',
    summary: '1-click, compliant CSV gradebooks ready for direct upload into Canvas, Blackboard, Moodle, and Brightspace D2L.',
    whatItDoes: 'Generates specialized CSV gradebook exports strictly adhering to import specifications of major Learning Management Systems (Canvas LMS, Blackboard Learn, Moodle, and Brightspace D2L), eliminating manual column restructuring.',
    whatToDo: [
      'Choose your institution\'s LMS platform (Canvas, Blackboard, Moodle, or Brightspace D2L).',
      'Select your desired grade output format: WebPA Calibrated Final Grade, Rubric Scaled Mark, or Percentage (0–100%).',
      'Review the live CSV preview table showing the exact format and column mapping.',
      'Click "Download CSV" or "Copy CSV" to transfer grades into your LMS course gradebook.',
      'Click "LMS Import Step-by-Step Guide" to see exact import instructions for your platform.'
    ],
    whatYouGet: [
      'Strictly compliant CSV files with required headers, points-possible definitions, and student identifiers.',
      'Zero manual spreadsheet manipulation or formula formatting.',
      'Immediate synchronization of peer-assessed final grades directly into institutional grade centers.'
    ],
    proTip: 'Canvas imports require the "Points Possible" row in line 2; PeerLens automatically generates this so your Canvas gradebook imports without errors.'
  }
};

export default FEATURE_INFO_REGISTRY;
