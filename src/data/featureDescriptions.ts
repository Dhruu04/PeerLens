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
    title: 'Layout Presets (Essentials, Recommended, Show All)',
    category: 'Interface & Layout',
    summary: 'Switch between Essentials Only, Recommended, and Show All Modules to keep the workspace clean.',
    whatItDoes: 'Provides pre-calibrated layout settings that toggle visibility across 40+ interface elements (Header icons, Home Hub widgets, Section 1 roster tools, Section 2 rubric cards, and Section 3 reports).',
    whatToDo: [
      'Click the Layout Presets buttons on the header or floating tools pill.',
      'Select "Recommended" for a balanced layout showing essential classroom tools without clutter.',
      'Select "Essentials Only" for an ultra-focused layout that hides advanced analytics to keep the interface simple.',
      'Select "Show All Modules" to turn on every available feature and tool simultaneously.',
      'Click "Customize View" to fine-tune individual modules to your personal teaching style.'
    ],
    whatYouGet: [
      'Zero visual clutter: customize exactly what appears on your screen.',
      'Optimized projector and classroom presentation layouts.',
      'Instant configuration persistence stored automatically in your browser profile.'
    ],
    proTip: 'Use Essentials Only during initial classroom onboarding sessions so students and instructors focus exclusively on roster verification and basic rubric review.'
  },

  // --- SECTION 1: ENROLLMENT & TEAMS ---
  'auto-group-studio': {
    id: 'auto-group-studio',
    title: 'Auto-Group Teams',
    category: 'Algorithm',
    summary: 'Automatically forms balanced student groups using rules (diversity, skills, size).',
    whatItDoes: 'Solves the complex group formation problem by balancing student teams across multi-dimensional criteria: home vs. host university dispersion, cross-border nationality mixing (195+ countries), 50/50 gender parity, and CEFR English language proficiency spread.',
    whatToDo: [
      'Choose whether to optimize by target group size (e.g., 4–5 members) or a fixed number of teams.',
      'Select balance rules: Gender, Nationality, Major, University, and Language.',
      'Click "Reshuffle Teams" to automatically generate balanced student groups.',
      'Inspect computed team diversity scores and drag-and-drop students between teams if manual fine-tuning is desired.',
      'Click "Save Groups to Roster" to lock the teams into the classroom directory.'
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
    title: 'Student Join Code & Link',
    category: 'Student Portal',
    summary: 'Generates a QR code and URL for students to register themselves.',
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
    title: 'Load Demo Students & Roster Tools',
    category: 'Roster',
    summary: 'Populates 100 sample students to test the software and provides quick roster actions.',
    whatItDoes: 'Populates the classroom with 100 realistic, culturally diverse demo student records spanning 35+ countries, multiple universities, CEFR English proficiencies (B2 to Native), and degrees for instant testing and faculty demonstrations.',
    whatToDo: [
      'Click "Load Demo Students" inside Section 1 to instantly generate a diverse student cohort.',
      'Click "Download Sample Template (.xlsx)" for a pre-formatted Excel template ready for university LMS data.',
      'Use "Manual Add Participant" to quickly append a late-enrolling student to any team.'
    ],
    whatYouGet: [
      'Instant test cohort to verify grouping algorithms, rubrics, and WebPA calculations in seconds.',
      'Ready-to-use template files formatted for Canvas, Blackboard, and Moodle imports.',
      'Pre-populated international and Erasmus exchange attributes.'
    ],
    proTip: 'Combine "Load Demo Students" with "Auto-Group Teams" to showcase automated diversity optimization during faculty workshops.'
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
    title: 'Duplicate Student Alert',
    category: 'Roster',
    summary: 'Flags identical student names, IDs, or emails in the roster.',
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
    proTip: 'Always resolve duplicate warnings prior to launching Section 2 (Grading Rubric) or generating student evaluation links.'
  },

  // --- SECTION 2: REVIEW SYSTEM ---
  'rubric-builder': {
    id: 'rubric-builder',
    title: 'Weight Total (100%) & Rubric Builder',
    category: 'Grading',
    summary: 'Shows whether your criteria percentages add up to 100% and configures rubric criteria.',
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
    title: 'Grading Rubric Criteria',
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
    title: 'Rubric Presets (IPAF Standard)',
    category: 'Grading',
    summary: 'Instant 1-click loading of the research-synthesized IPAF standard rubric.',
    whatItDoes: 'Pre-populates criteria with 6 empirically validated dimensions with behaviorally anchored rating scale (BARS) indicators: Contribution Quality (20%), Reliability (20%), Problem-Solving (15%), Communication (15%), Initiative (15%), and Quality Drive (15%) — totaling exactly 100%.',
    whatToDo: [
      'Locate the Rubric Presets ribbon in Section 2: Grading Rubric.',
      'Click the "IPAF Standard" button to instantly load the research-synthesized framework.',
      'The rubric automatically configures 6 behaviorally anchored dimensions totaling exactly 100% weight.',
      'Feel free to fine-tune descriptors or weights if needed for specific course syllabi.'
    ],
    whatYouGet: [
      'Empirically validated peer evaluation dimensions supported by meta-analytic research.',
      'Differentiated weighting consensus: task contribution and reliability carry higher weight.',
      'Clear behavioral indicators preventing rater ambiguity and halo effects.'
    ],
    proTip: 'IPAF consolidates CATME, Salas\'s Big Five, AAC&U VALUE, and Loughborough WebPA into one unified 6-dimension instrument.'
  },

  'target-scale': {
    id: 'target-scale',
    title: 'Grade Scale',
    category: 'Grading',
    summary: 'Sets whether final grades are out of 20, 100, or a custom maximum.',
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
    title: 'Preview Student View',
    category: 'Student Portal',
    summary: 'Test-drives what students see when filling out peer reviews on their phones/laptops.',
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

  'evaluation-controls': {
    id: 'evaluation-controls',
    title: 'Feedback Settings',
    category: 'Student Portal',
    summary: 'Toggles praise badges, written comments, and self-evaluations.',
    whatItDoes: 'Controls student evaluation form fields including Self-Review calibration, Primary Strengths formative feedback, Constructive Improvement suggestions, Praise tags, Role Baseline archetype selection, and Student Profile self-editing freeze locks.',
    whatToDo: [
      'Toggle Self-Review on or off to calibrate student self-assessment vs team ratings.',
      'Enable or disable qualitative prompts (Primary Strengths & Constructive Improvement).',
      'Toggle micro-recognition praise chips and role archetype baselines.',
      'Lock profile editing to freeze student names, roles, and email addresses.'
    ],
    whatYouGet: [
      'Tailored evaluation experience customized to your course rubric and institutional requirements.',
      'Optional qualitative feedback or pure numerical rating mode.',
      'Roster identity lock prevention against student tampering.'
    ],
    proTip: 'Use the "Rating Only" quick preset for high-velocity quantitative evaluations, or "Full Experience" for comprehensive 360-degree peer growth feedback.'
  },

  'team-health-pulse': {
    id: 'team-health-pulse',
    title: 'Team Health Check-ins',
    category: 'Analytics',
    summary: 'Quick 30-second morale and blocker check-ins during group projects.',
    whatItDoes: 'Empowers instructors to launch lightweight 30-second pulse surveys during active milestones to track student team morale, collaboration velocity, and project roadblocks. Presents an interactive, naturally sorted matrix table with multi-column sorting (Team Name, Members Responded, Morale, Milestone Status, Blocker Notes), live search, and filter pills (All, Needs Attention, Pending Check-ins, On Track). On the student dashboard, it renders a dedicated 30s check-in form with instant feedback and cross-tab reminder banners without affecting formal peer reviews.',
    whatToDo: [
      'Navigate to Section 2: Grading Rubric to locate the Team Health Check-ins card.',
      'Click "Launch New Pulse Round" or "Load Sample 3-Round Sprints" to initialize sprint monitoring.',
      'Select a rating scale: 5-Star Rating, 5-Point Likert, 1-10 Velocity Slider, Traffic Light (RAG), or Emoji Sentiment.',
      'Add optional custom questions tailored to specific project deliverables.',
      'Students log into their dashboard and complete the 30-second check-in with 1-click status and blocker notes.',
      'Inspect the class-wide Morale Index, Teams On Track rate, and Blocked Teams count in real time.',
      'Sort columns or use the "Needs Attention" filter pill to immediately surface struggling teams for instructor intervention.'
    ],
    whatYouGet: [
      'Proactive early warning radar detecting group friction weeks before final submissions.',
      'Interactive sparkline trend visualizations illustrating historical team velocity across sprints.',
      'Real-time student blocker notes highlighting missing dependencies, team silence, or technical bottlenecks.',
      'Naturally sorted team rows (Team 1, Team 2... Team 10, Team 11) with responsive filtering and CSV export.',
      'Completely decoupled check-in lifecycle that preserves regular peer evaluation statuses.'
    ],
    formula: 'Team Morale = (Σ Student Morale Ratings) / Active Respondents; Blocker Rate = Blocked Students / Total Responses',
    proTip: 'Run a 30-second pulse check midway through a milestone. Teams flagged in Red (Blocked) can be mentored immediately before interpersonal conflicts impact deliverables.'
  },

  'milestones-sprints': {
    id: 'milestones-sprints',
    title: 'Past Review Rounds',
    category: 'Grading',
    summary: 'Archives past peer evaluations (e.g., Midterm Review, Final Review).',
    whatItDoes: 'Saves a complete snapshot of all peer evaluations, scores, and multipliers for a project sprint (e.g., Sprint 1 Midterm 30%, Sprint 2 Final Delivery 70%), allowing instructors to reset the active evaluation matrix for the next sprint while preserving past marks.',
    whatToDo: [
      'Once a sprint deadline passes, click "Archive Active Session".',
      'Give the milestone a name (e.g. "Midterm Review" or "Final Review").',
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
    title: 'Peer Score Adjustment',
    category: 'Grading',
    summary: 'Adjusts individual student grades up or down based on teammate reviews.',
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
    proTip: 'Peer score adjustment ensures individual grades reflect true contributions without subjective guesswork.'
  },

  'webpa-calibration': {
    id: 'webpa-calibration',
    title: 'Peer Review Impact (0–100%)',
    category: 'Grading',
    summary: 'How heavily peer reviews influence the final group grade.',
    whatItDoes: 'Controls how much weight is given to the shared group project deliverable mark vs. individual peer evaluation scores. Uses the official Loughborough weighting model with instructor-tunable sensitivity.',
    whatToDo: [
      'Enter the Project Base Mark (e.g., 85/100 awarded by the instructor for the shared group submission).',
      'Adjust the Peer Review Impact slider (0% to 100%):',
      '• 0%: Everyone receives the exact same team grade (no individual adjustment).',
      '• 50% (Recommended): 50% based on shared team deliverable + 50% scaled by peer ratings.',
      '• 100%: Grade is fully determined by peer review scores.',
      'Check the live Calibrated Mark column in the Gradebook table to preview results.'
    ],
    whatYouGet: [
      'Customized grading bounds tailored to your course syllabus and university grading policies.',
      'Safety rails that prevent a single low review from catastrophically failing a student.',
      'Transparent, defensible calculations to show students during grade inquiries.'
    ],
    formula: 'Final Grade = Base Team Mark × [ (1 - Impact Weight) + (Impact Weight × Peer Multiplier) ]',
    proTip: 'A 50% impact provides the optimal balance: meaningful reward for outstanding effort while keeping final marks within a reasonable distribution.'
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
    title: 'Skills Radar Chart',
    category: 'Analytics',
    summary: 'Visual chart comparing team strengths across all rubric criteria.',
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
    title: 'Self vs. Peer Rating Comparison',
    category: 'Analytics',
    summary: 'Shows if students rate themselves much higher or lower than teammates rated them.',
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
    proTip: 'Research demonstrates that students with high calibration show higher career advancement in collaborative professional environments.'
  },

  'feedback-sentiment': {
    id: 'feedback-sentiment',
    title: 'Written Feedback Summary',
    category: 'Analytics',
    summary: 'Summarizes common themes and praise words written by teammates.',
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
    proTip: 'Combining quantitative scores with qualitative praise tags ensures grading feels both fair and encouraging.'
  },

  'anomaly-detection': {
    id: 'anomaly-detection',
    title: 'Suspicious Ratings Alert',
    category: 'Algorithm',
    summary: 'Detects students who trade high scores, grade randomly, or give uniform marks.',
    whatItDoes: 'Continuously scans submission patterns for statistical discrepancies that deviate from normal grading distributions, flagging potential grading bad-faith for instructor review.',
    whatToDo: [
      'Check the Suspicious Ratings Alert box in Section 3 for flagged alerts:',
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
    title: 'Class Gradebook Table',
    category: 'Grading',
    summary: 'Complete gradebook table with all student scores, averages, and calibrated marks.',
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
    title: 'Who Rated Whom Grid',
    category: 'Analytics',
    summary: 'Breakdown table showing exactly who gave what score to whom.',
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
    title: 'Omni Command Palette & Rapid Launcher (Ctrl+K or /)',
    category: 'Interface & Layout',
    summary: 'Full-text searchable keyboard command launcher for instant navigation, actions, and module toggles.',
    whatItDoes: 'Powers rapid keyboard-driven navigation across all classrooms, tools, tabs, settings, feature toggles, and modal dialogues with categorized search results and keyboard arrow navigation.',
    whatToDo: [
      'Press Ctrl+K (Cmd+K on macOS) or press "/" anywhere on the instructor dashboard.',
      'Type keywords like "rubric", "pulse", "export", "auto group", "dark mode", or any team name.',
      'Use Up/Down arrow keys to browse categorized results and press Enter to execute.'
    ],
    whatYouGet: [
      'Instant access to 50+ software capabilities in under 1 second.',
      'Keyboard accessibility and high-velocity workflows for power-user instructors.',
      'Instant filtering by course, team, or administrative tool.'
    ],
    proTip: 'Press "/" from anywhere on the dashboard for instant single-keystroke access to the entire software command catalog.'
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
    title: 'Email Links to Students',
    category: 'Student Portal',
    summary: 'Sends private evaluation links to students via email.',
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
    title: 'Peer Review Form',
    category: 'Student Portal',
    summary: 'Where students submit ratings and feedback for teammates.',
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
    title: 'Export to Canvas / Blackboard / Moodle',
    category: 'Grading',
    summary: '1-click grade exports formatted for standard school LMS gradebooks.',
    whatItDoes: 'Generates specialized CSV gradebook exports strictly adhering to import specifications of major Learning Management Systems (Canvas LMS, Blackboard Learn, Moodle, and Brightspace D2L), eliminating manual column restructuring.',
    whatToDo: [
      'Choose your institution\'s LMS platform (Canvas, Blackboard, Moodle, or Brightspace D2L).',
      'Select your desired grade output format: Calibrated Final Grade, Rubric Scaled Mark, or Percentage (0–100%).',
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
  },

  'team-cohorts': {
    id: 'team-cohorts',
    title: 'Team Overview Cards',
    category: 'Roster',
    summary: 'Cards showing all teams and their members, completion status, and scores.',
    whatItDoes: 'Provides instructors with a holistic overview of all student teams in Section 1, tracking peer review submission status, team size equity, and diversity factors across the cohort.',
    whatToDo: [
      'Navigate to Section 1: Students & Teams.',
      'View the Team Overview Cards grid showing each team, its members, and completion badges.',
      'Filter roster or gradebook by individual teams with a single click.',
      'Use Auto-Group Teams to balance teams by gender, nationality, and language proficiency.'
    ],
    whatYouGet: [
      'Instant visibility into which teams have complete vs. pending peer evaluations.',
      'Clean team-by-team filtering across roster and calculation matrices.',
      '1-Click navigation and inspection of individual student contributions.'
    ],
    proTip: 'Click any team badge in the Command Palette or on team cards to instantly filter the entire roster and gradebook to that group.'
  },

  'evaluation-form-controls': {
    id: 'evaluation-form-controls',
    title: 'Feedback Settings',
    category: 'Grading',
    summary: 'Toggles praise badges, written comments, and self-evaluations.',
    whatItDoes: 'Gives course instructors granular pedagogical control over which elements appear on the student evaluation form. Toggles self-reflection, qualitative strengths and growth text areas, research-backed praise tags across 6 soft-skill dimensions, role archetype baselines, and student profile locking.',
    whatToDo: [
      'Navigate to Section 2: Grading Rubric and locate the Feedback Settings card.',
      'Toggle "Allow Self-Review" to mandate or omit self-assessment.',
      'Toggle "Praise Badges" so students can celebrate peers as Creative Problem Solvers, Reliable & Punctual, Supportive Team Players, etc.',
      'Toggle "Qualitative Written Feedback" to collect formative written comments alongside numerical ratings.',
      'Toggle "Lock Profile Info Editing" once your roster is finalized to prevent unauthorized name or email changes.'
    ],
    whatYouGet: [
      'Pedagogical flexibility tailoring the assessment form to undergraduate vs postgraduate course objectives.',
      'Enriched formative feedback combining quantitative criteria scores with qualitative praise and constructive tips.',
      'Complete roster integrity and fraud prevention via profile locking after drop/add deadlines.'
    ],
    proTip: 'Lock student profile editing right after the university census date to ensure student names and emails stay strictly synchronized with your registrar records.'
  },

  'quick-action-pill': {
    id: 'quick-action-pill',
    title: 'Quick Action Center & Floating Dock',
    category: 'Interface & Layout',
    summary: 'Persistent floating utility dock with top bar shortcuts, layout modules manager, and direct administrative tools.',
    whatItDoes: 'Provides an unobtrusive, always-accessible floating dock in the bottom-right corner of the workspace. Enables instructors to trigger top bar tools, manage visible layout modules across all 3 sections, balance criteria weights, and run diagnostics without losing their position on screen.',
    whatToDo: [
      'Click the floating action icon in the bottom-right corner (or press Escape to close).',
      'Use "Top Bar Actions" with interactive hover states to access Search, Academic Guide, Projector View, Email Center, and Settings.',
      'Use "Modules Manager" to toggle the visibility of individual cards across Section 1, 2, or 3.',
      'Use "Tools & Utilities" for 1-click roster population, IPAF preset loading, auto weight balancing, and report exports.'
    ],
    whatYouGet: [
      'Frictionless navigation across all 40+ system capabilities without vertical scrolling.',
      'Instant layout customization to adapt the interface for lecture presentation vs grading mode.',
      'Keyboard accessibility with full Escape key dismissal and click-outside handling.'
    ],
    proTip: 'When projecting in class, use the Quick Action Center to quickly toggle between Projector View, Rubrics, and Student Simulator without leaving your active tab.'
  }
};

export default FEATURE_INFO_REGISTRY;
