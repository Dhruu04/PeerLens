![PeerLens Header Banner](public/PeerGradingBanner.png)

# PeerLens

### *Intelligent Peer Assessment, Simplified.*

**PeerLens** is a premium, state-of-the-art educational peer evaluation platform designed to bring fairness, clarity, and trust to team-based coursework. 

In university and high school settings, group projects are vital for learning—but grading them fairly can be an instructor’s worst nightmare. PeerLens solves this by allowing instructors to establish customizable criteria, distribute secure double-blind evaluation portals, and process peer reviews using advanced grade-adjustment algorithms and conflict-detection engines.

---

## <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Peer Assessment Lifecycle

Understanding the double-blind assessment process is simple. Here is a high-level flowchart of how PeerLens facilitates the evaluation lifecycle:

```mermaid
graph TD
    %% Styling definitions
    classDef instructor fill:#4f46e5,stroke:#312e81,stroke-width:2px,color:#fff;
    classDef student fill:#0d9488,stroke:#115e59,stroke-width:2px,color:#fff;
    classDef engine fill:#db2777,stroke:#9d174d,stroke-width:2px,color:#fff;
    classDef file fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;

    subgraph "Phase 1: Setup & Roster Onboarding"
        A[Create Course Group] --> B[Customize Evaluation Rubric]
        B --> C[Import Student Roster]
        C1["Syllabus PDF, Excel CSV, or Clipboard Paste"] -.->|Roster Onboarding Wizard| C
    end
    
    subgraph "Phase 2: Evaluation Invitations"
        C --> D[Secure URL Token Generation]
        D --> E[Email Invitation Distribution]
        E1["Integrated EmailJS / Brevo / Local Simulator"] -.->|Send Invites| E
    end
    
    subgraph "Phase 3: Teammate Assessments"
        E --> F[Student Portal Login via Secure Link]
        F --> G[Double-Blind Anonymous Evaluations]
        G1["Contribution Metrics, Praise Tags & Growth Areas"] -.->|Teammate Peer Review| G
    end

    subgraph "Phase 4: Intelligent Assessment Engine"
        G --> H[Consensus & Metrics Gathering]
        H --> I[WebPA Grade Scaler]
        H --> J[Conflict & Anomaly Detector]
        I1["Individual/Team Performance Ratios"] -.->|Adjusts Roster Grades| I
        J1["Flags Outliers, Uniform Grading, or Reciprocal Collusion"] -.->|Highlights Actionable Issues| J
    end

    subgraph "Phase 5: Insights & Operations"
        I --> K[Instructor Analytics Dashboard]
        J --> K
        K --> L[Export final grades to Excel/CSV]
        K --> M[Archive Milestones & Freeze Scores]
    end

    class A,B,C,D,E,K,L,M instructor;
    class F,G student;
    class H,I,J engine;
    class C1,E1,G1,I1,J1,K file;
```

---

## <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Key Capabilities & Innovation

PeerLens is designed from the ground up to feel extremely premium, responsive, and easy to use. Here are the core pillars that set PeerLens apart:

### 1. Double-Blind Anonymity & Security
* Students access their private evaluation portals directly through a **secure, encrypted URL parameter link** sent to their email.
* No passwords to remember, no user accounts to create, and zero friction.
* Evaluations are strictly anonymous: students only see aggregated team summaries, ensuring completely honest and objective feedback.

### 2. Spreadsheet Onboarding Wizard
* Ditch manual database entries! PeerLens features an intelligent import wizard.
* Drag and drop a course syllabus PDF, an Excel spreadsheet, or **simply copy-paste spreadsheet columns** from your clipboard.
* The smart matcher maps headers (Student Name, Email, Team, ID) automatically and flags row formatting issues prior to enrollment.

### 3. WebPA Grade Scaling (Fair Adjustments)
* Applies the internationally recognized **WebPA Scaling Algorithm** to compute individual performance ratios.
* The system analyzes a student’s peer ratings in relation to the team’s average ratings.
* *Example*: If a group project receives a base score of `85/100`, hard-working students are scaled upward automatically (e.g. `92/100`), while underperforming team members are adjusted downward accordingly, promoting full group accountability.

### 4. Smart Conflict & Anomaly Auditing
Anomalies and grading bias are spotted instantly by the built-in grading audit engine, highlighting actionable concerns for the instructor:
* <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg> **Uniform/Lazy Grading**: Flags students who rate everyone on their team identically.
* <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> **Spiteful Outlier Ratings**: Flags extreme negative ratings given to a student that contradict the rest of the team's consensus.
* <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> **Reciprocal Collusion**: Automatically detects "grading circles" (e.g. two students who agree to give each other perfect scores, despite poor ratings from their other teammates).

### 5. Multi-Profile Isolated Workspaces
* Offline-first capability stores all configuration, classroom rosters, rubrics, and feedback locally.
* Switch between courses, semesters, or student types with isolated admin profiles.
* Link to a cloud-based database (**Firebase Cloud**) with real-time transactional sync to seamlessly coordinate multi-student submissions simultaneously.

---

## <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Step-by-Step Guide

### <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg> For Instructors (Admins)
1. **Create your course**: Name your workspace (e.g., *Intro to Software Engineering - Fall 2026*).
2. **Define the Rubric**: Customize the grading fields, score ranges, and weights (e.g., Quality of Contribution, Reliability, and Collaboration).
3. **Enroll Students**: Import your team rosters through CSV, PDF, or Clipboard Paste. Students are assigned to specific team groups.
4. **Distribute Portals**: Set an evaluation deadline and launch the email simulator or link your **EmailJS / Brevo** service to dispatch private student links with one click.
5. **Review Analytics & Adjust**: Inspect the real-time completion progress. Review overall averages, WebPA metrics, standard deviations, and flagged anomalies.
6. **Export Gradebooks**: Once completed, export your classroom assessment data straight into a clean, beautifully organized Excel spreadsheet for university grading records.

### <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> For Students
1. **Open Secure Link**: Click the secure link in your evaluation invitation email.
2. **Review Roster**: PeerLens automatically loads your team members using double-blind tokens.
3. **Assess Contributions**: Rate your teammates across the instructor's custom metrics using intuitive slider interfaces.
4. **Provide Context**: Select from positive praise tags (e.g., *Always Punctual*, *Great Communicator*) and write supportive notes highlighting strengths and growth opportunities.
5. **Submit**: Click submit—your grades are safely committed.

---

## <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg> Quickstart & Setup

### Live Deployment
PeerLens is fully compiled and hosted online. You can access the live service directly on **Netlify**:
* <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> **[PeerLens Live Application](http://peerlenses.netlify.app/)**

### Running Locally
To run a local copy of PeerLens for development or testing:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/PeerLens.git
   cd PeerLens
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Launch the development server**:
   ```bash
   npm run dev
   ```
4. **Build for production**:
   ```bash
   npm run build
   ```

---

## <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Trust & Privacy Guidelines

* **Local Sovereignty**: All roster lists, names, and emails are processed strictly client-side. PeerLens does not collect or sell course data.
* **Encryption by Default**: Student URLs are tokens compiled from administrative API values, keeping student information masked.
* **Transactional Reliability**: Our Firebase synchronization relies on secure Firestore database transactions, ensuring student reviews never overwrite each other even if submitted at the exact same split-second.

---

## <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg> License

Distributed under the **MIT License**. See `LICENSE` for details.
