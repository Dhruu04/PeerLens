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
  // ─── 1. INTERFACE & WORKSPACE ───────────────────────────────────────
  'density-presets': {
    id: 'density-presets',
    title: 'Workspace Layout Presets',
    category: 'Interface & Layout',
    summary: 'Instantly toggle between Essentials Only, Recommended, and Show All views.',
    whatItDoes: 'Controls the density of your dashboard by showing or hiding advanced analytics, diagnostics, and auxiliary tools. Tailors the workspace to your immediate focus.',
    whatToDo: [
      'Click the Layout Presets switcher in the top navigation bar or tools menu.',
      'Select "Recommended" for standard classroom workflows without unnecessary distraction.',
      'Select "Essentials Only" for simple grading or "Show All Modules" for full analytical power.'
    ],
    whatYouGet: [
      'A clutter-free interface customized to your immediate teaching task.',
      'Optimized layout spacing for laptops, tablets, and classroom projectors.',
      'Saved preferences that persist automatically in your browser profile.'
    ],
    proTip: 'Use "Essentials Only" during onboarding and early weeks, then switch to "Recommended" when reviewing final peer evaluation metrics.'
  },

  'command-palette': {
    id: 'command-palette',
    title: 'Omni Command Palette (Ctrl+K or /)',
    category: 'Interface & Layout',
    summary: 'Search anything and trigger software tools in under 1 second using your keyboard.',
    whatItDoes: 'Provides a fast spotlight search bar across all classrooms, enrolled students, teams, rubric tools, export options, and settings modals.',
    whatToDo: [
      'Press Ctrl+K (or Cmd+K on macOS) or press "/" anywhere on the dashboard.',
      'Type any keyword, student name, team number, or administrative action.',
      'Use the Up/Down arrow keys to browse results and press Enter to jump directly.'
    ],
    whatYouGet: [
      'Instant 1-second access to 50+ software features without mouse hunting.',
      'Rapid filtering across student names, emails, and group cohorts.',
      'Keyboard-accessible shortcuts designed for busy instructors.'
    ],
    proTip: 'Press "/" from any page for a single-keystroke launch to jump between sections during class.'
  },

  'quick-action-pill': {
    id: 'quick-action-pill',
    title: 'Floating Quick Action Dock',
    category: 'Interface & Layout',
    summary: 'Always-accessible floating launcher for layout toggles and essential utilities.',
    whatItDoes: 'Pins an unobtrusive action pill to the bottom-right corner of your screen, letting you jump to top bar actions, toggle visible modules, and run utilities without scrolling.',
    whatToDo: [
      'Click the floating pill icon in the bottom-right corner of your screen.',
      'Use the Modules Manager tab to toggle specific cards on or off.',
      'Trigger quick tools like weight auto-balancing, sample cohort loading, or exports.'
    ],
    whatYouGet: [
      'Zero vertical scrolling needed to reach primary classroom controls.',
      'Instant access to Projector Mode, Settings, and Email Link Dispatcher.',
      'Clean Escape key dismissal and click-outside closing.'
    ],
    proTip: 'While presenting on an auditorium screen, use the floating dock to switch views seamlessly.'
  },

  // ─── 2. ROSTER, ENROLLMENT & TEAMS ──────────────────────────────────
  'auto-group-studio': {
    id: 'auto-group-studio',
    title: 'AutoGroup Studio',
    category: 'Algorithm',
    summary: 'Automatically partitions balanced student teams using diversity & skill rules.',
    whatItDoes: 'Solves the group formation challenge by balancing teams across gender parity, international exchange dispersion, home university spread, and CEFR English proficiency.',
    whatToDo: [
      'Choose your optimization strategy: Target Group Size (e.g. 4-5) or Fixed Team Count.',
      'Select active balance rules (Gender Parity, Nationality Spread, English Proficiency).',
      'Click "Re-Shuffle & Apply", inspect the Diversity Score (0–100%), and save to roster.'
    ],
    whatYouGet: [
      'Equitably balanced teams with zero isolated minority members.',
      'Live team diagnostic cards showing nationality count, gender ratio, and skill balance.',
      'Drastic reduction in student complaints and team formation bias.'
    ],
    formula: 'Diversity Score = w₁·UniversityEntropy + w₂·NationalitySpread + w₃·GenderParity + w₄·LanguageDistribution',
    proTip: 'Target a Diversity Score of 85% or higher to avoid cultural silos and encourage rich cross-institutional collaboration.'
  },

  'classroom-qr': {
    id: 'classroom-qr',
    title: 'Student Self-Enrollment & QR Code',
    category: 'Student Portal',
    summary: 'Enables 100+ students to onboard simultaneously in under 30 seconds via smartphone.',
    whatItDoes: 'Generates a high-contrast QR code and join URL for your auditorium display. Students register their profile, degree, and international exchange status directly.',
    whatToDo: [
      'Click "Open QR Presentation Mode" to display the large join code in lecture.',
      'Students scan the code on their mobile devices and submit their enrollment form.',
      'Watch your roster populate in real time on the live dashboard counter.'
    ],
    whatYouGet: [
      'Elimination of manual spreadsheet data entry and typos.',
      'Automatic duplicate detection for student emails and student IDs.',
      'Immediate assignment of private evaluation access tokens for every student.'
    ],
    proTip: 'Project the QR code during the first 5 minutes of class for effortless 100% cohort enrollment.'
  },

  'quick-actions': {
    id: 'quick-actions',
    title: 'Roster Quick Actions & Demo Cohort',
    category: 'Roster',
    summary: 'One-click tools to load 100 sample students, download templates, or add members.',
    whatItDoes: 'Accelerates testing and setup by providing a realistic 100-student demo cohort spanning 35+ nationalities, standard Excel templates, and manual student entry.',
    whatToDo: [
      'Click "100 Demo Sample" to instantly populate a full testing cohort.',
      'Click "Excel Template (.xlsx)" to download a pre-formatted university roster template.',
      'Use "Add Member" to quickly insert a late-enrolling student directly into a team.'
    ],
    whatYouGet: [
      'Instant test data to verify grouping, rubrics, and formulas in seconds.',
      'LMS-compliant template spreadsheets ready for Canvas, Blackboard, and Moodle.',
      'Quick manual edits without navigating away from the classroom overview.'
    ],
    proTip: 'Use the 100 Demo Sample to test different rubric weights and WebPA calibration sliders before your course begins.'
  },

  'import-wizard': {
    id: 'import-wizard',
    title: 'Roster Import Wizard & Column Mapper',
    category: 'Roster',
    summary: 'Import student rosters from Excel (.xlsx), CSV, or copy-pasted text.',
    whatItDoes: 'Auto-detects columns for Student Name, Email, Student ID, Group Name, Nationality, Degree, and Gender. Validates data integrity before adding students to your active class.',
    whatToDo: [
      'Upload an .xlsx or .csv spreadsheet file, or paste raw tabular text directly.',
      'Verify the smart dropdown column mappings (Name, Email, Team, etc.).',
      'Review the verification table and click "Finalize & Import Roster".'
    ],
    whatYouGet: [
      'Complete classroom setup in under 30 seconds from any university LMS export.',
      'Automatic warning flags for missing emails or duplicate student IDs.',
      'Flexible support for pre-assigned groups or unassigned cohorts ready for AutoGroup.'
    ],
    proTip: 'If your file includes a "Group" or "Team" column, students will automatically be assigned to their designated cohorts.'
  },

  'classroom-roster': {
    id: 'classroom-roster',
    title: 'Class Roster & Directory',
    category: 'Roster',
    summary: 'Centralized directory of student profiles, team assignments, and evaluation progress.',
    whatItDoes: 'Displays a searchable table of all enrolled students with nationality, academic degree, assigned team, English level, and live evaluation submission status.',
    whatToDo: [
      'Use the search bar or team filter dropdown to locate specific students quickly.',
      'Select student checkboxes to trigger bulk actions (reassign team, delete, export).',
      'Click the simulator phone icon in any row to preview that student\'s personal view.'
    ],
    whatYouGet: [
      'Instant visibility into who has submitted their reviews and who is still pending.',
      'Batch management controls to reassign or remove multiple students at once.',
      'Direct access to copy individual evaluation links with one click.'
    ],
    proTip: 'Click the column headers to sort by Team Name or Submission Status to quickly identify pending teammates.'
  },

  'duplicate-detector': {
    id: 'duplicate-detector',
    title: 'Roster Duplicate Guard',
    category: 'Roster',
    summary: 'Monitors roster records and warns if duplicate names, IDs, or emails are found.',
    whatItDoes: 'Scans the classroom directory in real time to prevent duplicate student profiles, split peer review responses, and skewed grade calculations.',
    whatToDo: [
      'Check the alert banner if duplicate records are flagged in amber.',
      'Review the highlighted duplicate pairs and their respective team assignments.',
      'Click "Merge Records" or delete redundant entries to ensure 100% roster integrity.'
    ],
    whatYouGet: [
      'Guaranteed roster integrity before dispatching private evaluation links.',
      'Prevention of split grades or double-voting within the same team.',
      'Clean gradebook exports ready for official registrar submission.'
    ],
    proTip: 'Always resolve duplicate warnings before generating student evaluation links or publishing final grades.'
  },

  'team-cohorts': {
    id: 'team-cohorts',
    title: 'Team Cohorts Overview',
    category: 'Roster',
    summary: 'Card-based cohort board showing all teams, members, and completion progress.',
    whatItDoes: 'Organizes your class into clean visual cohort columns matching the AutoGroup aesthetic. Displays team size, base deliverable mark, evaluation progress bars, and member demographics at a glance.',
    whatToDo: [
      'Browse team cards to monitor completion rates (e.g. "4/5 Submitted, 80% Done").',
      'Click the deliverable mark (e.g. "20 pts") to adjust the project grade for any team.',
      'Use team header buttons to copy teammate emails, send group messages, or export spreadsheets.'
    ],
    whatYouGet: [
      'Fast, high-level monitoring of which teams are done vs. pending.',
      'Independent deliverable base grades per team to account for project quality variations.',
      'Clean, compact member cards with deep drill-down available via QuickLook HUD.'
    ],
    proTip: 'Hover over any student card and press Spacebar to launch the QuickLook HUD for deep rubric criteria and self-awareness scores.'
  },

  // ─── 3. RUBRIC, SCALES & EVALUATION SETTINGS ─────────────────────────
  'rubric-builder': {
    id: 'rubric-builder',
    title: 'Rubric Criteria & Weight Balancer',
    category: 'Grading',
    summary: 'Build custom peer evaluation criteria and ensure weights sum to exactly 100%.',
    whatItDoes: 'Enables instructors to define multi-dimensional performance criteria (e.g. Technical Contribution, Reliability, Problem-Solving) with customizable score bounds and qualitative level descriptors.',
    whatToDo: [
      'Add custom criteria or select an accredited preset (such as the IPAF Standard).',
      'Set score bounds (e.g. 1 to 20 or 1 to 5) and assign individual weight percentages.',
      'Click "Auto-Balance Weights" to distribute percentages equally and reach 100% instantly.'
    ],
    whatYouGet: [
      'Mathematically sound evaluation dimensions accepted by academic accreditation boards.',
      'Behavioral descriptors that clearly explain expectations to students.',
      'Guaranteed 100% total weightage that prevents distorted WebPA calculations.'
    ],
    formula: 'Total Rubric Weight = ∑(Criteria Weight_i) = 100.0%',
    proTip: 'Keeping criteria between 3 and 5 dimensions reduces student cognitive fatigue and yields the most reliable, objective peer ratings.'
  },

  'grading-rubric': {
    id: 'grading-rubric',
    title: 'Evaluation Criteria Builder',
    category: 'Grading',
    summary: 'Configure evaluation dimensions, score bounds, and qualitative behavioral descriptors.',
    whatItDoes: 'Determines the questions students answer when rating teammates. Each criterion includes a title, weight percentage, scale limits, and descriptions for low, average, and high performance.',
    whatToDo: [
      'Click "Add Criterion" to introduce a new evaluation question.',
      'Define behavioral guidance for what constitutes poor, competent, and excellent teamwork.',
      'Adjust weights according to your course syllabus emphasis (e.g. 40% Technical, 30% Collaboration).'
    ],
    whatYouGet: [
      'Customized evaluation rubrics that align with your syllabus learning outcomes.',
      'Clear student guidance that prevents subjective, arbitrary rating behavior.',
      'Clean presentation across mobile devices and student report cards.'
    ],
    proTip: 'Use a 1–20 scale for detailed engineering capstones and a 1–5 scale for introductory courses.'
  },

  'rubric-presets': {
    id: 'rubric-presets',
    title: 'Accredited Rubric Presets (IPAF Standard)',
    category: 'Grading',
    summary: 'One-click load of research-validated rubrics combining CATME, AAC&U, and WebPA.',
    whatItDoes: 'Pre-loads 6 behaviorally anchored dimensions: Contribution Quality (20%), Reliability (20%), Problem-Solving (15%), Communication (15%), Initiative (15%), and Quality Drive (15%) totaling 100%.',
    whatToDo: [
      'Locate the Rubric Presets ribbon in Section 2: Grading Rubric.',
      'Click "IPAF Standard" to load the 6 research-synthesized criteria instantly.',
      'Review the pre-balanced 100% weights and customize descriptors if needed.'
    ],
    whatYouGet: [
      'Immediate access to an instrument backed by decades of teamwork research.',
      'Prioritized weighting that values reliability and task contribution appropriately.',
      'Clear behavioral anchors that eliminate rater halo effects.'
    ],
    proTip: 'The IPAF preset aligns with ABET, AACSB, and European Bologna Process collaborative teamwork standards.'
  },

  'target-scale': {
    id: 'target-scale',
    title: 'Final Grade Scale (20, 100, or GPA)',
    category: 'Grading',
    summary: 'Sets whether final individual marks are out of 20, 100%, or a custom scale.',
    whatItDoes: 'Normalizes calculated peer grades to match your institutional grading scale (e.g. 0-20 in France/Belgium, 0-100% in UK/US, or 1-5 GPA).',
    whatToDo: [
      'Select your grading standard: "Out of 20", "Out of 100 (Percentage)", or "Scale 1–5".',
      'The engine automatically recalculates all student marks to match the chosen bounds.',
      'Inspect the Calibrated Mark column in the Gradebook to preview the results.'
    ],
    whatYouGet: [
      'Direct compatibility with your university registrar grading policies.',
      'Report cards formatted in the exact scoring units students expect.',
      'Flawless export files ready for direct LMS gradebook upload.'
    ],
    proTip: 'Choose "Out of 100" if you plan to export percentage grades directly into Canvas, Blackboard, or Moodle.'
  },

  'eval-simulator': {
    id: 'eval-simulator',
    title: 'Student View Simulator',
    category: 'Student Portal',
    summary: 'Preview the mobile-first peer evaluation form exactly as your students see it.',
    whatItDoes: 'Provides an interactive sandbox of the student grading portal. Lets instructors test sliders, qualitative snap buttons (Needs Work, Good, Excellent), and comment fields before launch.',
    whatToDo: [
      'Test the qualitative snap buttons (50%, 80%, 100%) to observe scale behavior.',
      'Drag score sliders to confirm that color coding and feedback guidance feel natural.',
      'Verify that rubric instructions and prompts are clear and easy to understand.'
    ],
    whatYouGet: [
      'Confidence in rubric clarity before links are dispatched to 100+ students.',
      'Firsthand experience of the mobile smartphone evaluation interface.',
      'Validation of qualitative prompts and praise badge selections.'
    ],
    proTip: 'Snap buttons help students anchor ratings objectively rather than defaulting to arbitrary middle numbers.'
  },

  'evaluation-controls': {
    id: 'evaluation-controls',
    title: 'Evaluation Form & Feedback Settings',
    category: 'Student Portal',
    summary: 'Configure optional self-reviews, written comments, praise badges, and profile locks.',
    whatItDoes: 'Provides granular control over what students see in their evaluation portal: self-rating calibration, qualitative strength & growth text prompts, 6 soft-skill praise tags, and identity editing locks.',
    whatToDo: [
      'Toggle "Self-Review" to collect student self-assessments alongside peer ratings.',
      'Enable "Written Feedback Prompts" to gather formative qualitative comments.',
      'Toggle "Praise Badges" to let students recognize peer strengths (e.g. Creative Thinker).',
      'Enable "Lock Profile Info Editing" once your roster is finalized to freeze names and emails.'
    ],
    whatYouGet: [
      'Pedagogical flexibility to run quick numerical ratings or comprehensive 360° reviews.',
      'Roster security that prevents unauthorized student name or email changes.',
      'Rich formative feedback data alongside objective numerical WebPA scores.'
    ],
    proTip: 'Lock profile editing right after your university drop/add deadline to keep student records synchronized.'
  },

  'evaluation-form-controls': {
    id: 'evaluation-form-controls',
    title: 'Form Feature Settings',
    category: 'Grading',
    summary: 'Toggle qualitative feedback, self-evaluations, and praise badges.',
    whatItDoes: 'Customizes the student evaluation form structure to match your syllabus. Lets you mandate self-reflection, collect qualitative growth suggestions, or run a streamlined score-only session.',
    whatToDo: [
      'Select whether to enable Self-Review (used for Johari Window calibration).',
      'Enable or disable qualitative written comment textareas.',
      'Turn on Praise Chips to highlight collaboration strengths.'
    ],
    whatYouGet: [
      'Tailored evaluation experience customized to your course level.',
      'Option to focus strictly on numerical grades or comprehensive formative feedback.',
      'Automatic calculation of self-awareness calibration metrics.'
    ],
    proTip: 'Use "Rating Only" for rapid mid-semester checkpoints, and "Full Experience" for final capstone reviews.'
  },

  'submission-window': {
    id: 'submission-window',
    title: 'Submission Window & Lockout Cutoff',
    category: 'Grading',
    summary: 'Set a firm closing date and time that locks the student portal automatically.',
    whatItDoes: 'Enforces hard evaluation deadlines. Once the designated timestamp passes, student portal links automatically enter read-only mode and block new or modified ratings.',
    whatToDo: [
      'Set your desired Closing Date & Time in Section 2.',
      'The student portal displays a live countdown clock showing time remaining.',
      'When the deadline passes, submissions lock automatically without manual intervention.'
    ],
    whatYouGet: [
      'Firm submission deadlines that prevent late rating tampering.',
      'Clear student deadline visibility to minimize late submission inquiries.',
      'Option to extend or re-open the deadline anytime with a single click.'
    ],
    proTip: 'Set your cutoff 2 hours before class presentations so you can review the results matrix before meeting with teams.'
  },

  'email-automation': {
    id: 'email-automation',
    title: 'Email Engine & Direct Student Links',
    category: 'Student Portal',
    summary: 'Send individualized evaluation links to students with unique secure tokens.',
    whatItDoes: 'Dispatches private evaluation portal links via EmailJS or Brevo SMTP API, or native email client. Each link includes a secure token loading only that student\'s assigned teammates.',
    whatToDo: [
      'Choose your active email service (EmailJS, Brevo API, or Local Mailto).',
      'Click "Send Links to All" to dispatch invitations to the entire cohort.',
      'Click "Send Reminders to Incomplete" to target only students who haven\'t submitted.'
    ],
    whatYouGet: [
      'Zero password fatigue: students click their private link and begin grading immediately.',
      'Targeted reminder automation that drives completion rates above 95%.',
      'Complete confidentiality: students only ever evaluate their own teammates.'
    ],
    proTip: 'Use "Send Reminders to Incomplete" 24 hours before your deadline to boost final response rates.'
  },

  'team-health-pulse': {
    id: 'team-health-pulse',
    title: 'Team Health Pulse & Sprints',
    category: 'Analytics',
    summary: 'Lightweight 30-second morale and blocker check-ins during group projects.',
    whatItDoes: 'Allows instructors to launch fast 30-second pulse surveys during ongoing project milestones. Tracks student morale, project velocity, and roadblocks with early warning radar.',
    whatToDo: [
      'Click "Launch New Pulse Round" and select a scale (5-Star, Likert, or Traffic Light).',
      'Students complete the 30-second check-in on their phones with morale rating and blocker notes.',
      'Inspect the live Morale Index and filter by "Needs Attention" to intervene early.'
    ],
    whatYouGet: [
      'Early detection of team friction and communication breakdown weeks before deadlines.',
      'Real-time student blocker notes identifying missing deliverables or absent teammates.',
      'Historical velocity trends tracking team progress across project sprints.'
    ],
    formula: 'Team Morale = (∑ Morale Ratings) ÷ (Respondents); Blocker Rate = Blocked Teams ÷ Total Teams',
    proTip: 'Run a 30-second check-in at the 50% project mark to catch struggling teams while there is still time to help.'
  },

  'milestones-sprints': {
    id: 'milestones-sprints',
    title: 'Milestones & Past Sprints Archive',
    category: 'Grading',
    summary: 'Archive evaluation snapshots for Midterm and Final project sprints.',
    whatItDoes: 'Saves a complete snapshot of all peer reviews, multipliers, and marks for a project sprint, letting instructors reset the active evaluation matrix while preserving historical records.',
    whatToDo: [
      'When a project phase concludes, click "Archive Active Session".',
      'Name the milestone (e.g. "Sprint 1: Midterm Architecture" or "Sprint 2: Final Delivery").',
      'Switch between archived milestones anytime to review historical performance.'
    ],
    whatYouGet: [
      'Permanent historical record of student performance trajectory across the term.',
      'Ability to run multiple peer evaluations throughout the semester without data loss.',
      'Defensible audit trail for assigning cumulative semester teamwork marks.'
    ],
    proTip: 'Running both a Midterm Review (30%) and Final Review (70%) gives students a chance to act on early feedback.'
  },

  // ─── 4. ALGORITHMS & PERFORMANCE METRICS ────────────────────────────
  'webpa-scoring': {
    id: 'webpa-scoring',
    title: 'WebPA Peer Adjustment Algorithm',
    category: 'Algorithm',
    summary: 'Calculates individual contribution multipliers to adjust shared group marks.',
    whatItDoes: 'Compiles anonymous peer reviews within each team, normalizes raw scores against team consensus, and derives an individual contribution factor. Self-ratings are strictly excluded.',
    whatToDo: [
      'Students complete anonymous peer evaluations rating each teammate on rubric criteria.',
      'The WebPA algorithm computes each student\'s received peer score average.',
      'Inspect the computed Multiplier: 1.00x is expected average, >1.00x is high contribution, <1.00x is low.'
    ],
    whatYouGet: [
      'Fair, individual accountability that rewards leaders and identifies free-riders.',
      'Redistribution of credit within the team without artificial grade deflation.',
      'Mathematically defensible grades grounded in Loughborough University research.'
    ],
    formula: 'WebPA Factor = (Student Received Peer Average) ÷ (Combined Team Average)',
    proTip: 'In plain English: A factor of 1.10x means a student contributed 10% more than their team average.'
  },

  'webpa-calibration': {
    id: 'webpa-calibration',
    title: 'Peer Review Impact Weight (0–100%)',
    category: 'Grading',
    summary: 'Controls how much peer reviews influence final grades vs. shared deliverable marks.',
    whatItDoes: 'Tunes the sensitivity of peer evaluation adjustments. At 100% (default standard), grades scale fully by peer review so deserving students earn marks above base and slackers receive proportional deductions. At lower percentages (e.g. 70% or 50%), adjustments are blended with the base deliverable.',
    whatToDo: [
      'Enter the Project Base Mark awarded for the team submission (e.g. 85 / 100).',
      'Tune the Peer Review Impact (0–100%) slider to calibrate individual WebPA scaling against the shared team base mark.',
      'Ensure "Penalize Non-Submitters" is enabled so students who failed to review peers do not receive full credit.',
      'Preview final student marks in the live Peer Adjusted Grade column or click Inspect Calculations for full step-by-step audit.'
    ],
    whatYouGet: [
      'Deserving students who carried the team earn higher marks than the shared base grade.',
      'Free-riders who did nothing receive proportional deductions and cannot get full credit.',
      'Students who failed to submit reviews are held accountable with non-submission penalties.'
    ],
    formula: 'Final Grade = Base Team Mark × [ (1 - Impact Weight) + (Impact Weight × WebPA Factor) ]',
    proTip: 'A 50% impact provides the ideal balance: meaningful accountability without extreme grade swings.'
  },

  'calculation-matrix': {
    id: 'calculation-matrix',
    title: 'Calculation Matrix & Peer Spread',
    category: 'Grading',
    summary: 'Live recalculation workspace tracking peer reviews, benchmarks, and adjusted marks.',
    whatItDoes: 'Automatically recalculates all team multipliers, standard deviations, and adjusted individual marks in real time as reviews arrive, eliminating manual spreadsheet formulas.',
    whatToDo: [
      'Monitor the submission progress bar to track review completion across teams.',
      'Review team WebPA averages and criteria score spreads.',
      'Click "Export Excel (.xlsx)" for a complete 2-sheet audit workbook with active formulas.'
    ],
    whatYouGet: [
      'Zero manual spreadsheet maintenance or broken calculation formulas.',
      'Instant visibility into team consensus vs. disagreement (Standard Deviation).',
      'Exportable reports ready for university registrar archiving.'
    ],
    proTip: 'Low standard deviation indicates strong team consensus; high standard deviation flags mixed peer opinions.'
  },

  'radar-analytics': {
    id: 'radar-analytics',
    title: 'Skills Radar Fingerprint',
    category: 'Analytics',
    summary: 'Visual polygon comparing student & team strengths across all rubric criteria.',
    whatItDoes: 'Plots peer evaluations across all rubric dimensions on radial axes, providing an immediate visual snapshot of technical, communication, and leadership competencies.',
    whatToDo: [
      'Use the overlay dropdown to compare a specific team against the class benchmark.',
      'Open any Student Report Card to see that student\'s personal polygon vs. team average.',
      'Identify outward points (core strengths) and inward valleys (growth opportunities).'
    ],
    whatYouGet: [
      'Visual competency mapping that students understand at a glance.',
      'Actionable evidence for 1-on-1 mentoring and post-project retrospectives.',
      'High-resolution radar charts embedded directly into student PDF report cards.'
    ],
    proTip: 'Radar charts help students focus on specific skills to improve rather than dwelling solely on numerical marks.'
  },

  'johari-window': {
    id: 'johari-window',
    title: 'Johari Self-Awareness Matrix',
    category: 'Analytics',
    summary: 'Compares student self-ratings against anonymous peer consensus (±7.5% threshold).',
    whatItDoes: 'Classifies each student into 3 psychological self-awareness quadrants by comparing what they scored themselves vs. what their teammates scored them:',
    whatToDo: [
      'Review the Class Self-Awareness distribution bar (Calibrated vs Blind Spot vs Imposter).',
      '• Accurately Calibrated (Teal): Self-rating matches peer ratings within ±7.5%.',
      '• Blind Spot / Overestimating (Amber): Student rated themselves substantially higher than peers did.',
      '• Imposter / Underestimating (Indigo): Peers rated student much higher than student rated themselves.'
    ],
    whatYouGet: [
      'Actionable behavioral insights into student self-awareness and team dynamics.',
      'Early detection of interpersonal blind spots or imposter syndrome.',
      'An objective, research-backed framework for teaching reflective practice.'
    ],
    formula: 'Self Delta = (Self Score - Peer Consensus Average) ÷ Scale Maximum  [Threshold: ±7.5%]',
    proTip: 'Use Blind Spot and Imposter badges during 1-on-1 coaching to encourage realistic self-reflection.'
  },

  'feedback-sentiment': {
    id: 'feedback-sentiment',
    title: 'Written Feedback & Praise Analysis',
    category: 'Analytics',
    summary: 'Summarizes positive themes, praise badges, and constructive growth tips.',
    whatItDoes: 'Aggregates peer recognition badges (e.g. "Problem Solver", "Great Communicator", "Reliable") and formative written feedback written by teammates.',
    whatToDo: [
      'Inspect the Top Strengths and Growth Areas summary clouds.',
      'Review praise badge counts awarded across the cohort.',
      'Export anonymized qualitative comment transcripts with one click.'
    ],
    whatYouGet: [
      'Encouraging peer recognition badges that highlight valuable soft skills.',
      'Actionable constructive comments that give students tangible steps to improve.',
      'Complete anonymity: comments are separated from reviewer identities.'
    ],
    proTip: 'Formative written comments often provide more lasting educational value to students than numerical scores alone.'
  },

  'anomaly-detection': {
    id: 'anomaly-detection',
    title: 'Suspicious Ratings & Collusion Guard',
    category: 'Algorithm',
    summary: 'Detects self-inflation, collusion rings, and retaliatory outlier ratings.',
    whatItDoes: 'Scans submission patterns for statistical anomalies that deviate from team consensus by more than 1.5 standard deviations, flagging potential bias for instructor review.',
    whatToDo: [
      'Check the Suspicious Ratings Alert box for flagged submission anomalies.',
      '• Self-Inflation: Student gave themselves top marks while peers gave low scores.',
      '• Collusion Ring: Students trading reciprocal maximum marks.',
      '• Retaliatory Outlier: A reviewer giving extreme low scores contrary to all other peers.',
      'Click any alert to inspect individual ratings and apply moderation if warranted.'
    ],
    whatYouGet: [
      'Automated defense against unfair or malicious peer evaluations.',
      'Complete confidence that final grades reflect genuine contributions.',
      'Detailed audit evidence to justify instructor score adjustments.'
    ],
    formula: 'Anomaly Flag = |Reviewer Score - Team Consensus Mean| > 1.5 · Standard Deviation',
    proTip: 'Flags serve as instructor alerts for review and never alter grades automatically without instructor approval.'
  },

  // ─── 5. RESULTS & EXPORTS ───────────────────────────────────────────
  'results-summary-sheet': {
    id: 'results-summary-sheet',
    title: 'Results Summary Sheet & Gradebook',
    category: 'Grading',
    summary: 'Master performance matrix with student marks, WebPA factors, and export tools.',
    whatItDoes: 'Presents the complete gradebook in two switchable views: the comprehensive Table Matrix (with criteria means, StdDev, and column toggles) and the AutoGroup-style Team Cohorts board.',
    whatToDo: [
      'Toggle between "Table Matrix" and "Team Cohorts" view to match your workflow.',
      'Use the Columns popover to show or hide criteria scores, praise tags, or Johari badges.',
      'Click "Export" to download complete 2-sheet Excel workbooks or CSV files for LMS import.'
    ],
    whatYouGet: [
      'Complete transparency across all evaluation dimensions and final calibrated grades.',
      'One-click Excel reports with pre-formatted calculation sheets and color styling.',
      'Seamless LMS import compatibility for Canvas, Blackboard, and Moodle.'
    ],
    proTip: 'Use the Team Cohorts view during presentations for clean card-based reviews, and Table Matrix for spreadsheet grade audits.'
  },

  'who-rated-whom': {
    id: 'who-rated-whom',
    title: 'Who Rated Whom Audit Grid',
    category: 'Analytics',
    summary: 'Cross-tabular matrix showing exactly who gave what score to whom.',
    whatItDoes: 'Displays a team-by-team cross matrix where rows represent reviewers and columns represent recipients, enabling instructors to audit team consensus and reciprocal ratings.',
    whatToDo: [
      'Select a team from the dropdown to display their internal evaluation matrix.',
      'Examine the diagonal for self-ratings (which are excluded from WebPA calculations).',
      'Inspect row and column totals to identify unilateral bias or reciprocal score trading.'
    ],
    whatYouGet: [
      'Full audit visibility into team dynamics and grading integrity.',
      'Defensible evidence to address student grading inquiries or disputes.',
      'Immediate detection of isolated interpersonal conflicts.'
    ],
    proTip: 'This cross-matrix is strictly instructor-only; students only ever see their aggregated, anonymized feedback.'
  },

  'lms-export': {
    id: 'lms-export',
    title: 'LMS Gradebook Export (Canvas / Blackboard / Moodle)',
    category: 'Grading',
    summary: 'One-click CSV exports formatted to match university LMS import specifications.',
    whatItDoes: 'Formats grade data to strictly adhere to the exact column schemas, points-possible headers, and student ID formats required by Canvas, Blackboard, Moodle, and Brightspace D2L.',
    whatToDo: [
      'Select your university LMS platform (Canvas, Blackboard, Moodle, or Brightspace).',
      'Choose your grade format: Calibrated Final Grade, Scaled Mark, or Percentage (0–100%).',
      'Click "Download CSV" and upload directly into your LMS grade center.'
    ],
    whatYouGet: [
      'Zero manual spreadsheet restructuring or formula formatting.',
      'Guaranteed error-free uploads that recognize student IDs and points possible.',
      'Hours saved compared to manual grade entry.'
    ],
    proTip: 'Canvas imports require the "Points Possible" row in line 2; PeerLens generates this automatically.'
  },

  // ─── 6. STUDENT PORTALS & SESSIONS ──────────────────────────────────
  'student-grading-matrix': {
    id: 'student-grading-matrix',
    title: 'Student Peer Evaluation Portal',
    category: 'Student Portal',
    summary: 'The mobile-friendly portal where students submit ratings and feedback for teammates.',
    whatItDoes: 'Provides an intuitive, double-blind interface where students rate teammates across rubric criteria, award praise tags, write constructive feedback, and complete self-reflection.',
    whatToDo: [
      'Students open their private link on mobile phone or laptop.',
      'Rate each assigned teammate on the rubric criteria sliders.',
      'Select praise tags, write qualitative feedback, and submit their evaluations.'
    ],
    whatYouGet: [
      'An engaging, confidential evaluation experience with 0 password friction.',
      'Formative feedback combining quantitative scores with qualitative praise.',
      'Safe, anonymous peer recognition.'
    ],
    proTip: 'Students can update their ratings anytime until the instructor closes the evaluation window.'
  },

  'link-dispatcher': {
    id: 'link-dispatcher',
    title: 'Evaluation Link Dispatcher',
    category: 'Student Portal',
    summary: 'Email individualized evaluation links to students with personalized tokens.',
    whatItDoes: 'Generates private portal URLs containing unique student tokens and provides copy-paste email templates or automated delivery via EmailJS or Brevo.',
    whatToDo: [
      'Click the Email icon in the top navigation dock.',
      'Select recipients (All Enrolled Students or Incomplete Only).',
      'Preview personalized templates and dispatch links with 1 click.'
    ],
    whatYouGet: [
      'Fast, private evaluation access for every student without login credentials.',
      'Automated reminders targeting only students with pending evaluations.',
      'Real-time delivery status logs.'
    ],
    proTip: 'Students do not need accounts or passwords; their unique link loads only their assigned teammates.'
  },

  'projector-view': {
    id: 'projector-view',
    title: 'Auditorium Projector & Live Mode',
    category: 'Student Portal',
    summary: 'Public presentation display showing big QR check-in and live submission counts.',
    whatItDoes: 'Provides a privacy-safe presentation screen designed for auditorium projectors, showing a live digital clock, high-contrast QR code, and completion counters while hiding all private grades.',
    whatToDo: [
      'Click "Projector Mode" in the top navigation bar during lectures.',
      'Display on your lecture hall screen while students scan and submit.',
      'Watch live submission counters update dynamically in real time.'
    ],
    whatYouGet: [
      'A safe public display that will never accidentally expose student grades.',
      'Engaging live progress counters that encourage timely submissions.',
      'High-contrast QR code easily readable from the back of the lecture hall.'
    ],
    proTip: 'Press F11 in your browser for true full-screen projection without browser toolbars.'
  },

  'presentation-scoring': {
    id: 'presentation-scoring',
    title: 'Presentation Day & Audience Scoring',
    category: 'Grading',
    summary: 'Live real-time peer scoring for group presentations and project pitches.',
    whatItDoes: 'Enables audience members and instructors to score presenting teams in real time using presentation criteria (Delivery, Content, Q&A, Visuals) with countdown timers and instant leaderboards.',
    whatToDo: [
      'Select the presenting team and open the scoring session.',
      'Students and judges submit ratings and qualitative feedback in real time.',
      'Review aggregated score summaries and award presentation badges.'
    ],
    whatYouGet: [
      'Interactive classroom engagement during long group presentation sessions.',
      'Immediate score tabulation without paper rubrics or manual data entry.',
      'Comprehensive presentation report cards combining audience and instructor ratings.'
    ],
    proTip: 'Use the built-in presentation timer with audio chime to keep group pitches strictly on schedule.'
  },

  'cloud-sync': {
    id: 'cloud-sync',
    title: 'Local-First Architecture & Cloud Sync',
    category: 'Security',
    summary: 'Works 100% offline in browser storage with optional real-time Firebase cloud backup.',
    whatItDoes: 'Stores all classrooms, rubrics, and grades securely in your local browser storage by default. Optionally connects to Firebase Cloud Firestore for real-time multi-device sync and student submissions.',
    whatToDo: [
      'Use PeerLens immediately without an account or cloud setup (local-first mode).',
      'Optionally connect your free Firebase config in the Cloud tab for multi-device sync.',
      'Export regular JSON workspace backups with 1 click from the Settings menu.'
    ],
    whatYouGet: [
      '100% data privacy and GDPR compliance: student records stay on your computer by default.',
      'Zero downtime: continues working even if lecture hall Wi-Fi drops.',
      'Seamless optional cloud synchronization when multi-device access is needed.'
    ],
    proTip: 'Download a JSON workspace backup at the end of each semester to keep permanent archives of your course data.'
  },

  'enrollment-builder': {
    id: 'enrollment-builder',
    title: 'Custom Enrollment Form Questions',
    category: 'Roster',
    summary: 'Design custom registration questions, required fields, and AutoGroup balancing attributes.',
    whatItDoes: 'Allows instructors to customize the student onboarding form. Collect custom student attributes (e.g. skills, exchange status, past course experience) with text fields, dropdown choices, numbers, or checkboxes.',
    whatToDo: [
      'Click "Add Question" to introduce a new question to your student join form.',
      'Select the question type: Text, Dropdown Choices, Numbers, or Checkboxes.',
      'Toggle "Required" to mandate an answer, and "Include in Grouping" for AutoGroup diversity.'
    ],
    whatYouGet: [
      'Custom student profiles tailored specifically to your course syllabus.',
      'Seamless integration into AutoGroup team formation for balanced skill distribution.',
      'Instant real-time preview of the mobile smartphone enrollment screen.'
    ],
    proTip: 'Tag key technical skills as "Include in Grouping" so AutoGroup spreads specialized knowledge evenly across teams.'
  },

  'team-kickoff': {
    id: 'team-kickoff',
    title: 'Team Roles, Icebreakers & Agreements',
    category: 'Roster',
    summary: 'Jumpstart psychological safety and role clarity with customizable team charters.',
    whatItDoes: 'Provides an engaging kickoff session where teams choose structured roles (Project Lead, QA, Architect, Spokesperson), complete icebreakers, and sign shared working agreements.',
    whatToDo: [
      'Select active roles or create course-specific responsibilities with custom badges.',
      'Choose an interactive icebreaker prompt to initiate open communication on Day 1.',
      'Click "Print Agreements" or export PDFs for teams to sign and keep as a working contract.'
    ],
    whatYouGet: [
      'Documented working norms and response-time expectations agreed upon by all teammates.',
      'Early reduction in team friction and role ambiguity before project milestones begin.',
      'Printable and downloadable PDF team agreements for classroom orientation.'
    ],
    proTip: 'Encourage teams to reference their signed agreement whenever communication delays or unbalanced workloads arise.'
  },

  'student-report': {
    id: 'student-report',
    title: 'Student 360° Report Card & PDF Export',
    category: 'Grading',
    summary: 'Individual performance summary with WebPA adjustments, radar charts, and anonymous feedback.',
    whatItDoes: 'Generates an individualized, accreditation-ready report card for each student. Includes received peer ratings, radar chart competency fingerprint, Johari self-awareness score, and qualitative praise tags.',
    whatToDo: [
      'Use the student switcher or arrow buttons to preview individual report cards.',
      'Inspect the WebPA multiplier breakdown and calibrated final grade calculation.',
      'Click "Download PDF" or "Batch Print All" to generate confidential student summaries.'
    ],
    whatYouGet: [
      'Clear, defensible explanation of how group marks were adjusted for individual effort.',
      'Constructive peer praise and growth suggestions that motivate future improvement.',
      'Complete reviewer anonymity: peers cannot see who submitted individual ratings.'
    ],
    proTip: 'Use Batch PDF Export at the end of the term to provide each student with personalized formative feedback.'
  },

  'lms-custom-export': {
    id: 'lms-custom-export',
    title: 'Direct LMS Gradebook Export (Canvas, Blackboard, Moodle, D2L)',
    category: 'Grading',
    summary: 'Pre-formatted gradebook export compatible with Canvas, Blackboard, Moodle, and Brightspace D2L.',
    whatItDoes: 'Generates LMS-ready CSV and TSV gradebooks tailored to the exact column schema, student identifiers (SIS ID, User ID, OrgDefinedId), and Points Possible rows required by major university learning platforms.',
    whatToDo: [
      'Select your LMS platform: Canvas, Blackboard Learn, Moodle Grader, or Brightspace D2L.',
      'Choose score export type: Adjusted Grade, WebPA Multiplier, or Letter Grade.',
      'Filter by team or evaluation status if exporting in cohorts.',
      'Click "Download CSV" and import directly into your university LMS gradebook.'
    ],
    whatYouGet: [
      '100% compliance with LMS gradebook import specifications (Canvas row 2 Points Possible, D2L OrgDefinedId hashes).',
      'Elimination of manual spreadsheet reformatting and CSV editing errors.',
      'Zero grade discrepancies between PeerLens calibrated scores and your official institutional gradebook.'
    ],
    proTip: 'In Canvas, leave the assignment column empty before import; Canvas automatically matches students by SIS User ID.'
  },

  'peer-adjustment-inspector': {
    id: 'peer-adjustment-inspector',
    title: 'Peer Score Adjustment Calculation Inspector',
    category: 'Grading',
    summary: 'Full step-by-step mathematical audit trail explaining how individual grades are calculated.',
    whatItDoes: 'Provides an instructor audit cockpit showing every intermediate calculation step for any student: unweighted review matrix, column normalization to eliminate rater bias, peer multiplier, instructor sensitivity blending, and non-submission penalty verification.',
    whatToDo: [
      'Click "Inspect Calculations" in the WebPA Calibrator header or student dossier.',
      'Select any student from the dropdown to review their individualized calculation pipeline.',
      'Inspect each mathematical stage: Matrix Normalization, Peer Multiplier, Sensitivity Blending, and Non-Submission rules.',
      'Export or copy the calculation breakdown for student grade appeals or accreditation documentation.'
    ],
    whatYouGet: [
      'Absolute mathematical defensibility during student grade disputes and office hours.',
      'Full transparency into how peer marks were normalized across harsh and generous raters.',
      'Accreditation-ready calculation audit trail confirming fair, objective individual evaluation.'
    ],
    formula: 'Final Grade = TeamBase × [ (1 - W) + (W × WebPA) ] (with non-submitter -10% deduction)',
    proTip: 'Open the inspector during office hours to show students exactly how their teammates evaluated their work without revealing anonymous individual raters.'
  },

  'layout-library-presets': {
    id: 'layout-library-presets',
    title: 'Layout Library & Custom Density Presets',
    category: 'Interface & Layout',
    summary: 'Switch between Standard, Minimal, Full Diagnostics, Blank Canvas, or custom saved workspaces.',
    whatItDoes: 'Allows instructors to instantly load predefined UI layouts or save personalized views. Tailor the dashboard to high-speed grading, live projector presentations, or in-depth analytical audits.',
    whatToDo: [
      'Click the Layout Presets dropdown or press "Layout Library" in the top tools menu.',
      'Choose a system preset: Standard (balanced), Minimal (grading rush), Full (all diagnostics), or Blank Canvas.',
      'Customize module visibility in Edit Mode (Alt+E) and click "+ Save View" to store a custom named preset.',
      'Switch between saved layout profiles anytime with a single click.'
    ],
    whatYouGet: [
      'Rapid task-switching without manually toggling 40+ individual interface switches.',
      'Clean classroom projection views without exposing confidential student metrics.',
      'Persistent personal layout presets stored in your browser profile.'
    ],
    proTip: 'Use "Minimal" during final exam week for high-speed grade entry, then switch to "Full Diagnostics" for accreditation reporting.'
  },

  'onboarding-checklist': {
    id: 'onboarding-checklist',
    title: '8-Milestone Onboarding Checklist',
    category: 'Interface & Layout',
    summary: 'Guided setup checklist walking instructors through class launch in 8 clear milestones.',
    whatItDoes: 'Tracks classroom setup progress from initial roster import to LMS grade export. Automatically checks off completed steps and provides 1-click action triggers to configure settings, branding, rubrics, and charters.',
    whatToDo: [
      'Check your current progress in the Onboarding Checklist widget on the classroom dashboard.',
      'Click any incomplete milestone (e.g. "AutoGroup Studio", "Institutional Branding") to jump directly to its tool.',
      'Follow the sequential 8 milestones to complete a full classroom setup in under 5 minutes.'
    ],
    whatYouGet: [
      'Clear, confidence-inspiring roadmap ensuring no critical setting or rubric criteria is overlooked.',
      'Automatic completion detection as students enroll, teams form, and rubrics are saved.',
      'Collapsible, non-intrusive design that stays out of your way once classroom setup is complete.'
    ],
    proTip: 'Click "Form Teams with AutoGroup" to launch simulated annealing grouping once your student roster is uploaded.'
  },

  'layout-edit-mode': {
    id: 'layout-edit-mode',
    title: 'Interactive Layout Edit Mode (Alt+E)',
    category: 'Interface & Layout',
    summary: 'Visually reorder, show, or hide any dashboard card or submodule directly on-screen.',
    whatItDoes: 'Enables interactive drag-free layout editing. Toggle on Edit Mode to see attached badges, reorder arrows, and instant hide controls on every section without opening settings.',
    whatToDo: [
      'Press Alt+E or click the pencil icon in the top navigation dock.',
      'Click "Hide" on any module badge to remove unwanted cards from view.',
      'Use the Up / Down arrows on card headers to customize visual section hierarchy.',
      'Click "Save & Exit" or press Esc when your layout is tailored to your workflow.'
    ],
    whatYouGet: [
      'Instant custom layout tailored for lecture halls, office hours, or grading marathons.',
      'Complete control over dashboard density and submodule visibility.',
      'Persistent local and cloud settings synchronization across all your devices.'
    ],
    proTip: 'Press Alt+E anytime for quick layout edits, or use the bottom Now Bar to reset to defaults in 1 click.'
  },

  'institutional-branding': {
    id: 'institutional-branding',
    title: 'Institutional Branding & Custom Header',
    category: 'Interface & Layout',
    summary: 'Customize university logos, course badge pills, term banners, and accent themes.',
    whatItDoes: 'Personalizes the entire PeerLens workspace with your school or department branding. Upload official SVG or PNG logos, configure course codes, and display custom semester banners.',
    whatToDo: [
      'Click the PeerLens logo in the top-left or select "Institutional Branding" in tools.',
      'Upload your institution logo or choose from pre-loaded university crests.',
      'Set your Course Code (e.g. CS-301 Senior Capstone) and Term Banner (e.g. Fall 2026).',
      'Select your department accent theme (Indigo, Emerald, Teal, Sky, Amber, Rose, Violet).'
    ],
    whatYouGet: [
      'A polished, institutional-grade appearance for classroom presentations and student audits.',
      'Customizable top dock course badge with direct navigation shortcuts.',
      'Consistent branding saved per-classroom and synced across instructor profiles.'
    ],
    proTip: 'Toggle "Show in Header" to proudly display your university department badge during lecture projector mode.'
  },

  'quicklook-hud': {
    id: 'quicklook-hud',
    title: 'Smart Peek Spacebar QuickLook HUD',
    category: 'Interface & Layout',
    summary: 'Instant Spacebar hover telemetry, math formulas, diversity mixing breakdown, and team multipliers.',
    whatItDoes: 'Provides instant contextual inspection without clicking. Hover over any student, team cohort, module slot, or action button and hold Spacebar (or press P to pin) for live analytics.',
    whatToDo: [
      'Hover your cursor over any student row, team card, module header, or action button.',
      'Hold the Spacebar to reveal the Smart Peek HUD card.',
      'Press "P" to pin the HUD in place for persistent inspection, or "Esc" to dismiss.',
      'Inspect team diversity metrics, CEFR languages, CEFR nationality mix, or student WebPA ratios.'
    ],
    whatYouGet: [
      'Zero-click access to deep student and cohort diagnostics.',
      'Instant mathematical formula standards explaining algorithmic scores.',
      'Interactive quick actions (e.g. toggle module visibility, flag for audit, open profile).'
    ],
    proTip: 'Press "P" while hovering to keep the HUD pinned on screen while comparing multiple student submissions.'
  },

  'classroom-snapshots': {
    id: 'classroom-snapshots',
    title: 'Classroom State Snapshots & Instant Rollback',
    category: 'Security',
    summary: 'Save point-in-time classroom checkpoints and restore previous states in 1 click.',
    whatItDoes: 'Takes instant snapshots of classroom enrollment, grouping configurations, rubric criteria, and evaluation marks before major administrative changes, with safe instant rollback.',
    whatToDo: [
      'Open the Tools menu or bottom Now Bar and click "Classroom Snapshots".',
      'Click "Create Snapshot" and label your checkpoint (e.g. "Pre-AutoGroup Final", "Midterm Roster").',
      'Review timestamps, student counts, and rubric versions in your snapshot timeline.',
      'Click "Restore" anytime to safely roll back the entire classroom state.'
    ],
    whatYouGet: [
      'Total peace of mind when modifying grouping rules or testing grading curves.',
      'Historical audit trail of roster changes and evaluation rounds.',
      'Safe non-destructive experimentation for multi-section university cohorts.'
    ],
    proTip: 'Always capture a quick snapshot before running AutoGroup or importing new LMS CSV files.'
  }
};

export default FEATURE_INFO_REGISTRY;
