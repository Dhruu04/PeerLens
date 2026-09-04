![PeerLens Header Banner](public/PeerGradingBanner.png)

# PeerLens

### *Intelligent Peer Assessment, Simplified.*

**PeerLens** is an educational peer evaluation platform designed to bring fairness, transparency, and collaborative accountability to team-based university coursework.

In higher education, collaborative group projects are vital for student learning, yet assessing individual contributions within a shared team deliverable remains a significant pedagogical challenge. PeerLens addresses this problem by providing instructors with psychometrically validated evaluation rubrics, passwordless double-blind student portals, real-time classroom presentation monitors, multi-dimensional auto-grouping studios, and an automated grade-adjustment engine powered by the internationally recognized **WebPA algorithm**.

---

## Peer Assessment Lifecycle

The double-blind evaluation lifecycle in PeerLens operates through five structured phases:

```mermaid
graph TD
    classDef instructor fill:#4f46e5,stroke:#312e81,stroke-width:2px,color:#fff;
    classDef student fill:#0d9488,stroke:#115e59,stroke-width:2px,color:#fff;
    classDef engine fill:#db2777,stroke:#9d174d,stroke-width:2px,color:#fff;
    classDef file fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;

    subgraph "Phase 1: Setup and Roster Onboarding"
        A[Create Course Workspace] --> B[Configure Evaluation Rubric / IPAF Preset]
        B --> C[Enroll Students and Form Teams]
        C1["Spreadsheet Import, Syllabus PDF, or QR Self-Enrollment"] -.->|Roster Onboarding| C
        C --> C2["Auto-Group Diversity Studio: Simulated Annealing Optimizer"]
    end
    
    subgraph "Phase 2: Token Dispatch and Invitations"
        C --> D[Generate Deterministic URL Tokens]
        D --> E[Invitation Distribution]
        E1["Integrated Brevo API, EmailJS, or Batch Clipboard Export"] -.->|Send Invites| E
    end
    
    subgraph "Phase 3: Teammate Review and Live Monitoring"
        E --> F[Student Portal Access via Private Link]
        F --> G[Double-Blind Anonymous Evaluations]
        G1["Rubric Sliders, Praise Badges, and SBI Growth Feedback"] -.->|Teammate Peer Review| G
        G --> G2["Live Projector Monitor: Real-Time Team Matrix and Demographics Dock"]
    end

    subgraph "Phase 4: Algorithmic Grading Engine"
        G --> H[Consensus and Variance Calculation]
        H --> I[WebPA Grade Scaling Engine]
        H --> J[Conflict and Anomaly Audit Engine]
        I1["Individual and Team Performance Ratios"] -.->|Adjusts Individual Marks| I
        J1["Flags Lazy Grading, Spiteful Outliers, or Reciprocal Collusion"] -.->|Highlights Actionable Issues| J
    end

    subgraph "Phase 5: Insights, Archival and Reporting"
        I --> K[Instructor Analytics Dashboard and Johari Matrix]
        J --> K
        K --> L[Export Gradebooks to Canvas, Moodle, Blackboard, and Excel]
        K --> M[Generate Personalized Student PDF Reports]
        K --> N[Freeze Milestone Snapshots for Multi-Stage Projects]
    end

    class A,B,C,C2,D,E,K,L,M,N instructor;
    class F,G,G2 student;
    class H,I,J engine;
    class C1,E1,G1,I1,J1 file;
```

---

## Core Capabilities and Architecture

PeerLens is structured around three sequential operational sections and a suite of productivity tools:

### Section 1: Student Enrollment and AutoGroup Studio
* **Multi-Format Roster Ingestion**: Drag-and-drop Excel (`.xlsx`), CSV, or syllabus PDF rosters. The heuristic column matcher auto-associates columns for Student Name, Email, Team, Student ID, Nationality, Gender, and CEFR English level.
* **Live Classroom QR Self-Enrollment**: Project a high-contrast QR code during lecture sessions for students to register with their mobile devices, capturing geographic origin, exchange status, and degree details.
* **AutoGroup Diversity Studio**: Combinatorial team formation powered by a **Simulated Annealing** multi-objective optimizer. Simultaneously balances gender parity, cross-cultural representation across 195+ countries, CEFR language skills, and historical partner avoidance to prevent insular cliques.
* **Automated Collision Protection**: Scans incoming enrollments for duplicate IDs or emails, providing single-click options to update existing records, merge profiles, or discard duplicate rows safely.

### Section 2: Review System and Evaluation Simulator
* **Integrated Peer Assessment Framework (IPAF)**: Research-synthesized rubric combining observable task deliverables with interpersonal process metrics across six dimensions: Contribution Quality (20%), Reliability (20%), Problem-Solving (15%), Communication (15%), Initiative (15%), and Quality Drive (15%).
* **Behaviorally Anchored Rating Scales (BARS)**: Clear performance descriptors across four levels (Unsatisfactory, Developing, Competent, Exemplary) to guide objective student grading.
* **100% Weight Auto-Balancing**: Proportional normalization ensuring criteria weights always sum to exactly 100%.
* **Target Scale Conversion**: Automatic conversion of raw rubric ratings to standard institutional systems, including Percentage (0 - 100%), European / French (0 - 20), US GPA (0.0 - 4.0), or direct unscaled sums.
* **Interactive Evaluation Simulator**: In-dashboard student experience preview allowing instructors to verify rubric clarity and mobile viewport behavior before dispatching invitations.

### Section 3: Performance Analytics and WebPA Calibrator
* **Loughborough WebPA Scaling Algorithm**: Normalizes individual peer evaluations against team averages to derive performance multipliers ($R_i$), distinguishing leadership contributions from social loafing.
* **Stabilization Fudge Weight Slider**: Configurable damping slider ($f \in [0.0, 1.0]$) balancing team deliverable marks with individual peer differentiation. A 50% setting ($f = 0.50$) provides standard balance, while 0% preserves uniform team grading and 100% yields pure peer-driven marks.
* **Per-Team Base Project Marks**: Instructors can assign distinct baseline grades to each group deliverable; WebPA scales individual marks proportionally around each team's respective score.
* **Johari Perception Window**: Classifies self-vs-peer score alignment into four distinct quadrants using a +/-7.5% deviation threshold:
  * *Open Arena* (High Self, High Peer): Validated competence and mutual confidence.
  * *Blind Spot* (Low Self, High Peer): Under-recognized talent or impostor syndrome.
  * *Hidden Facade* (High Self, Low Peer): Over-confidence or unperceived team friction.
  * *Unknown* (Low Self, Low Peer): Group disengagement requiring instructor intervention.
* **Competency Radar Spider Overlay**: Visual multi-axis chart contrasting individual student ratings against team and cohort benchmarks.
* **Statistical Anomaly and Collusion Auditing**: Automated detection flags uniform grading (zero standard deviation), outlier rater divergence (> 30% from team consensus), and reciprocal collusion circles ($r > 0.85$ mutual score pacts).

---

## Operational Manual and Guidance Center

PeerLens includes comprehensive documentation directly integrated into the software:

* **Complete Institutional Operational Manual**: Accessible via the `/guide.html` route and new-tab launcher buttons. Contains 17 in-depth chapters covering pedagogical theory, mathematical derivations, worked numerical examples, LMS integration schemas, and diagnostic FAQs.
* **Clean Reading Experience**: Features a responsive sidebar, minimal table-of-contents toggle, floating restorer pill, reading progress indicator, dark and light theme switching, and print-to-PDF stylesheet optimization.
* **Academic Guidance Center**: Modal interface featuring spotlight interactive tours, pedagogical architecture overviews, and an indexed Feature and Help Catalog searchable via `/`.

---

## Workflow Productivity Suite

* **Smart Command Palette (`Ctrl + K` / `Cmd + K`)**: Keyboard-driven launcher featuring natural language intent detection, direct gradebook exports, mode toggles, and filter jumpers.
* **30-Second Safety Net Action Undo (`Ctrl + Z`)**: Reversible deletion safety net with animated toasts, allowing instant recovery of accidentally removed students, rubrics, or classrooms without corrupting cloud sync.
* **Layout Density Presets**: Switch instantly between *Minimal* (distraction-free baseline), *Standard* (balanced default), and *Full Power User* (all advanced analytics visible) modes.
* **Customizable View Modules**: Add or remove workspace sections with modular toggles.
* **Live Classroom Projector Mode (`P`)**: Presentation-optimized monitor displaying live submission rings, incoming student dock with auto-assignment, and cohort diversity metrics readable from over 25 meters across lecture halls.
* **1-Click Multi-Format Export Suite**:
  * *Canvas LMS Gradebook*: SIS User ID compliant CSV with assignment points.
  * *Moodle LMS*: XML and CSV formats matching grade import specifications.
  * *Blackboard Learn*: Tab-delimited batch upload format.
  * *Brightspace D2L*: Standard CSV grade item schema.
  * *Multi-Sheet Excel Workbook*: Sheet 1 containing scaled grades and multipliers; Sheet 2 detailing raw criterion evaluations.
  * *Individual Student PDF Reports*: Batch-generated personalized report cards with radar charts and anonymized qualitative peer comments.
* **Milestone Longitudinal Archival**: Freeze completed evaluation rounds for multi-sprint coursework, enabling progression tracking over consecutive project milestones.

---

## Data Privacy, Security and Governance

* **Client-Side Local Sovereignty**: All student rosters, emails, and ratings are stored in browser Web Storage. PeerLens operates fully offline without mandatory cloud dependencies.
* **Double-Blind Anonymity**: Students access private evaluation portals via HMAC-signed, deterministic URL tokens without creating passwords or third-party accounts. Qualitative feedback is anonymized and shuffled before presentation.
* **Optional Firebase Cloud Synchronization**: Instructors can configure an optional Firebase project for multi-device continuity, utilizing atomic Firestore transactions and strict user-scoped security rules.
* **GDPR Compliance**: Instant roster purging and complete data reset capabilities with zero persistent advertising cookies or tracking telemetry.

---

## Technical Stack

* **Frontend Framework**: React 19, TypeScript
* **Build Tooling**: Vite 8, Rolldown bundler
* **Styling**: Vanilla CSS design system with custom tokens (dark/light themes, zero utility-framework bloat)
* **Cloud Layer**: Optional Firebase Firestore (real-time listeners, atomic transactions)
* **Email Protocols**: Brevo REST API, EmailJS
* **Reporting Engines**: jsPDF, jsPDF-AutoTable, SheetJS (XLSX)
* **Icons**: Lucide React

---

## Quickstart and Local Development

### Prerequisites
* Node.js version 20 or later
* npm version 10 or later

### Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Dhruu04/PeerLens.git
   cd PeerLens
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Build the production bundle:
   ```bash
   npm run build
   ```

---

## Deployment Configuration

PeerLens is optimized for static hosting platforms like Netlify:
* **Build Command**: `npm run build`
* **Publish Directory**: `dist`
* **Direct Routes**: Dedicated rewrites for `/guide`, `/manual`, and `/docs` serving the documentation manual with revalidation headers, and `/*` forwarding to `/index.html` for single-page application navigation.

---

## License

Distributed under the **MIT License**. See `LICENSE` for details.
