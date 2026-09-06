# PeerLens Omni Search Bar & Quick Action Pill: Complete Operational Guide

## Table of Contents
1. [Executive Overview](#1-executive-overview)
2. [Omni Search & Command Palette (`Ctrl+K` / `/`)](#2-omni-search--command-palette-ctrlk---)
   - [Prefix Filter Syntax (`@`, `#`, `>`, `?`)](#prefix-filter-syntax)
   - [Natural Language Intent Parser](#natural-language-intent-parser)
   - [Live Split Dossier Inspector](#live-split-dossier-inspector)
3. [Excused Absence & Medical Exemption Architecture](#3-excused-absence--medical-exemption-architecture)
   - [Pedagogical & Statistical Rationale](#pedagogical--statistical-rationale)
   - [Mathematical Formula & Denominator Neutralization](#mathematical-formula--denominator-neutralization)
   - [Instructor Workflow & Visual Verification](#instructor-workflow--visual-verification)
4. [Student Grade Dispute Office Hours Dossier](#4-student-grade-dispute-office-hours-dossier)
   - [Objective Dispute Resolution Workflow](#objective-dispute-resolution-workflow)
   - [Self vs. Peer Criteria Gap Table](#self-vs-peer-criteria-gap-table)
   - [Inter-Rater Consensus Variance ($\sigma$)](#inter-rater-consensus-variance-)
   - [Retaliatory Downgrade Audit](#retaliatory-downgrade-audit)
   - [Automated 1-Click Office Hours Response Generator](#automated-1-click-office-hours-response-generator)
5. [Smart Multi-Format Export Studio](#5-smart-multi-format-export-studio)
   - [Interactive Export Dialog Configuration](#interactive-export-dialog-configuration)
   - [Supported Formats & LMS Compatibility](#supported-formats--lms-compatibility)
   - [Target Cohort & Sub-Team Scoping](#target-cohort--sub-team-scoping)
6. [Quick Action Pill (Persistent Floating Dock)](#6-quick-action-pill-persistent-floating-dock)
   - [Workflow Section Jumpers](#workflow-section-jumpers)
   - [Ambient Live Status Ticker (Toggleable)](#ambient-live-status-ticker-toggleable)
   - [Master Section Folding & Expanders](#master-section-folding--expanders)
   - [Modular Interface Manager & Custom Presets](#modular-interface-manager--custom-presets)
7. [Comprehensive Keyboard Shortcuts & Command Reference](#7-comprehensive-keyboard-shortcuts--command-reference)

---

## 1. Executive Overview

PeerLens provides two central operational hubs designed to eliminate navigation latency, automate repetitive administrative tasks, and give instructors instant data transparency during live classes and office hours:

1. **The Omni Search & Command Palette**: A keyboard-first, universal search and execution interface accessible from any screen via `Ctrl+K` (or `Cmd+K` on macOS) or pressing `/`.
2. **The Quick Action Pill**: A persistent, unobtrusive floating dock anchored at the bottom of the viewport that provides instantaneous workflow jumping, live status telemetry, master layout folding, and granular module visibility control.

Both tools work in real-time, synchronizing state with local storage and Firebase Cloud Firestore, without requiring page reloads or interrupting student sessions.

---

## 2. Omni Search & Command Palette (`Ctrl+K` / `/`)

### Invocation
- Keyboard: Press `Ctrl + K` (Windows/Linux) or `Cmd + K` (macOS).
- Quick Key: Press `/` while not typing in a text field.
- Mouse: Click the search input located in the top navigation bar.

### Prefix Filter Syntax
Typing a single trigger character at the start of your query filters the search space instantaneously:

| Trigger | Mode | Target Entity | Example Queries |
|---|---|---|---|
| `@` | **Student Filter** | Queries enrolled students by name, email, student ID, or assigned group | `@sarah`, `@team b`, `@unsubmitted` |
| `#` | **Team Filter** | Queries project teams, displaying member count, submission rate, and consensus spread | `#team 3`, `#alpha`, `#team c` |
| `>` | **Action Filter** | Queries administrative functions, exports, modal launchers, and view settings | `>canvas`, `>dark mode`, `>reset` |
| `?` | **Help & Manual** | Queries pedagogical guides, math formula derivations, and keyboard shortcuts | `?webpa`, `?fudge`, `?johari` |

> If no prefix is typed, the search engine searches across all categories simultaneously using fuzzy keyword scoring.

### Natural Language Intent Parser
The Omni Search engine includes intent-matching algorithms that interpret instructor synonyms:
- **Exporting**: `export`, `excel`, `sheet`, `canvas`, `moodle`, `blackboard`, `brightspace`, `pdf`, `csv`
- **Grading Controls**: `fudge 25%`, `target 100`, `scale likert`, `base grade 85`
- **Roster Management**: `add student`, `import csv`, `join qr`, `clear roster`, `autogroup`
- **Filtering**: `unsubmitted`, `pending`, `duplicates`, `anomalies`, `collusion`
- **System Actions**: `dark mode`, `light mode`, `tour`, `manual`, `reset reviews`

### Live Split Dossier Inspector
Selecting any search item displays a live split-pane inspector on the right side of the palette:
- **For Students**: Displays team name, submission state, peer average, calibrated WebPA multiplier, adjusted grade, and action buttons (`Dispute Dossier`, `Mark Excused`, `Delete Record`).
- **For Teams**: Displays member roster with individual submission badges, aggregate team average score, and consensus standard deviation.
- **For Actions**: Displays a description of the operation, hotkeys, and safety warnings (e.g. for destructive actions like roster wipe).

---

## 3. Excused Absence & Medical Exemption Architecture

### Pedagogical & Statistical Rationale
In collaborative group work, students occasionally experience verified medical emergencies, bereavement, university-sanctioned athletic travel, or late add/drop adjustments. In traditional peer assessment systems:
- An absent student fails to submit reviews, artificially skewing team statistics.
- Teammates may penalize the absent peer unfairly, or the absence may distort the team rater denominator, causing teammates' WebPA scores to plunge or inflate erratically.

PeerLens resolves this through an **academic-grade Medical Exemption System**.

### Mathematical Formula & Denominator Neutralization
When a student is marked as **Excused**:
1. **Factor Neutralization**: The student's individual WebPA factor is held at exactly unity:
   $$\text{WebPA Factor } R_{\text{excused}} = 1.000$$
2. **Grade Protection**: The student receives the team's base assignment mark without penalty:
   $$G_{\text{excused}} = G_{\text{base}} \cdot [ (1 - f) + f \cdot 1.00 ] = G_{\text{base}}$$
3. **Denominator Isolation**: 
   - The excused student is excluded from the team's active submitter count.
   - Teammates do not have their peer average skewed by missing incoming or outgoing ratings from the excused student.
   - If an excused student submitted partial evaluations prior to being excused, their ratings are neutrally omitted from consensus calculations to prevent bias.

### Instructor Workflow & Visual Verification
1. Open the Omni Search Bar (`Ctrl+K`).
2. Search for the student (`@student name`).
3. In the student preview pane, click **"Mark Excused"** (or select the `Excuse / Medical Exemption` action from the list).
4. The student record immediately displays the visual badge:
   `[Excused Absence]` with a protective shield icon.
5. The WebPA Calibrator and Gradebook instantly update with no reload required.
6. To revoke the exemption (e.g., if medical documentation was denied), click the button again to toggle back to standard status.

---

## 4. Student Grade Dispute Office Hours Dossier

### Objective Dispute Resolution Workflow
When a student challenges their grade or peer score during office hours, instructors need objective, multi-rater evidence to resolve the inquiry diplomatically. The **Student Grade Dispute Dossier** provides an instant, audit-grade evaluation breakdown.

### Invocation
- In Omni Search, type `dispute <student name>` and press `Enter`.
- Or search `@student name` and click the **"Dispute Dossier"** button in the preview pane.

### What the Dispute Dossier Displays

#### 1. Self vs. Peer Criteria Gap Table
Every rubric criterion is compared side-by-side:
- **Criterion Name & Weight**: e.g., *Technical Execution (25%)*, *Communication (25%)*.
- **Self-Rating**: The score the student awarded themselves.
- **Peer Consensus Average**: The average score awarded by all evaluating teammates.
- **Gap ($\Delta$)**: The mathematical difference ($Self - Peer$).
  - A large positive gap ($+1.5$ or higher) highlights an inflated self-perception (blind spot).
  - A negative gap indicates the student was more critical of themselves than teammates were (hidden façade).

#### 2. Inter-Rater Consensus Variance ($\sigma$)
PeerLens computes the sample standard deviation across teammate ratings for each criterion:
$$\sigma = \sqrt{\frac{1}{M-1} \sum_{j=1}^{M} (x_j - \bar{x})^2}$$
- $\sigma \le 0.75$: **High Consensus** (all teammates agree on performance).
- $0.75 < \sigma \le 1.25$: **Moderate Variation**.
- $\sigma > 1.25$: **High Friction Warning** (raters strongly disagree; indicates interpersonal conflict or divergent teamwork experiences).

#### 3. Retaliatory Downgrade Audit
The dossier checks whether the student engaged in retaliatory grading:
- Compares the scores the student awarded to their peers against the team average.
- If the student rated all teammates significantly below the group consensus, the dossier flags:
  `Retaliation Check: Significant negative rater bias detected.`

#### 4. Recognition Praise Badges & Constructive Comments
- Summarizes the praise badges awarded by teammates (e.g. *Creative Problem Solver*, *Reliable & Punctual*).
- Aggregates constructive feedback under **Strengths** and **Growth Areas**, fully anonymized to protect team relationships.

#### 5. Automated 1-Click Office Hours Response Generator
Clicking **"Copy Response Draft"** copies a professionally structured institutional email response directly to your clipboard:
```text
Dear [Student Name],

Thank you for meeting during office hours regarding your peer evaluation score for [Class Name].

Below is the objective breakdown of your peer evaluation results:
- Assigned Team: [Team Name]
- Team Base Assignment Mark: [Base Grade]
- Peer Average Score: [Score] / [Max]
- Calibrated WebPA Factor: [WebPA Ratio]
- Final Scaled Grade: [Final Grade]

Rubric Dimension Breakdown:
- [Criterion 1]: Self = X.X | Peer Consensus = Y.Y (Gap: +Z.Z, Consensus StdDev: 0.32)
- [Criterion 2]: Self = X.X | Peer Consensus = Y.Y (Gap: -Z.Z, Consensus StdDev: 0.45)

Teammate Recognition:
- Recognized Strengths: [Praise Badges]
- Areas for Growth: [Growth Themes]

Please let me know if you would like to discuss strategies for collaborative communication in future milestones.

Best regards,
[Instructor Name / Course Staff]
```

---

## 5. Smart Multi-Format Export Studio

### Interactive Export Dialog Configuration
Typing `export` into the Omni Search bar opens the **Smart Export Studio**. Instructors can customize:
1. **Target File Format**:
   - Excel (`.xlsx` 2-sheet master workbook)
   - Canvas SIS CSV
   - Moodle Grade CSV / XML
   - Blackboard Learn Ultra CSV
   - Brightspace / D2L CSV
   - Results Summary CSV
   - Batch Student PDF Report Cards
2. **Cohort Scope**:
   - Entire Classroom (all enrolled students)
   - Specific Project Team (e.g. *Team 4 only*)
   - Completed Submissions Only (filters out pending students)
3. **Grading Scheme**:
   - Calibrated WebPA Grades (factored by fudge weight)
   - Raw Peer Average (unweighted peer consensus)
   - Base Team Mark (unfactored)

---

## 6. Quick Action Pill (Persistent Floating Dock)

### Workflow Section Jumpers
The dock provides single-click navigation between the 3 core workflow stages:
- **Section 1**: Student Enrollment & Team Formation (Key `1`)
- **Section 2**: Review System, Rubrics & Team Health Pulse (Key `2`)
- **Section 3**: Grading, WebPA Calibrator & Performance Analytics (Key `3`)

### Ambient Live Status Ticker (Toggleable)
The Quick Action Pill features an ambient live telemetry ticker:
- Displays current submission completion rate: `87% Submitted (26/30)`
- Displays unsubmitted count alert: `4 Pending`
- Displays anomaly detection badge: `1 Anomaly Flagged`
- **Optional Minimal Mode**: Instructors who prefer an ultra-minimal dock can click `Ticker: ON / OFF` in the dock header or switch to minimal mode, rendering a compact, streamlined pill.
- **Toggle Visibility**: Press `Q` (or `Alt + P`) to show or hide the floating Quick Action Pill.

### Master Section Folding & Expanders
Quickly manage vertical scroll space when lecturing or grading:
- **Expand All**: Expands all accordion cards and detailed tables across the dashboard (`⤓ Expand`).
- **Collapse All**: Collapses all sections into compact summary headers (`⤒ Collapse`).

### Modular Interface Manager & Custom Presets
Expanding the Quick Action Pill reveals the **Interface Density Studio**:
- **Filter Tabs**: Filter modules by *All Modules*, *Pinned*, *Visible*, or *Hidden*.
- **Pinning**: Pin frequently used modules (such as WebPA Calibrator or Team Health Pulse) to the top of the pill for immediate access.
- **Toggle Visibility**: Individually show or hide any of the 52+ dashboard cards with immediate persistence. Press `V` to open the full modules manager.
- **Layout Presets**:
  - *Standard Mode*: Balanced view with progress metrics and primary grading tools.
  - *Minimal Mode*: Stripped-down layout designed for distraction-free grading.
  - *Full Studio*: All diagnostic radars, Johari windows, and simulation decks active.
  - *Custom Views*: Save tailored view configurations via `+ Save View`.

---

## 7. Comprehensive Keyboard Shortcuts & Command Reference

| Action / Feature | Shortcut (Windows/Linux) | Shortcut (macOS) | Description |
|---|---|---|---|
| **Open Omni Search & Command Finder** | `Ctrl + K` | `Cmd + K` | Launch spotlight command palette to search students, teams, or actions |
| **Close Modal / Escape** | `Esc` | `Esc` | Dismiss any open dialog, modal, or dropdown |
| **Navigate Search Results** | `↑` / `↓` Arrow keys | `↑` / `↓` Arrow keys | Move selection through search results |
| **Select / Execute Item** | `Enter` | `Return` | Trigger selected command or inspect student/team |
| **Classroom Hub Overview** | `H` | `H` | Return to main classroom hub and overview screen |
| **Jump to Section 1 (Enrollment & Teams)** | `1` | `1` | Jump to student roster, group manager, and enrollment portal |
| **Jump to Section 2 (Review System & Rubrics)** | `2` | `2` | Jump to multi-criteria rubric editor and weight auto-balancer |
| **Jump to Section 3 (Grading & Analytics)** | `3` | `3` | Jump to WebPA calculation matrix, Johari perception & results |
| **Toggle Floating Quick Action Pill** | `Q` *(or `Alt + P`)* | `Q` *(or `Option + P`)* | Toggle floating Quick Action Pill docked at viewport bottom |
| **Customize View (Modules Manager)** | `V` | `V` | Open modular interface toggles to show/hide sections |
| **Academic Guidance Center & Manual** | `M` | `M` | Open algorithm manuals, spotlight tours, and feature library |
| **Settings Hub** | `S` | `S` | Open preferences, cloud sync, and email credentials |
| **Launch Student Simulator** | `J` | `J` | Simulate smartphone evaluation experience from student perspective |
| **Toggle Dark / Light Theme** | `F` | `F` | Switch interface aesthetic between dark and light modes |
| **Interactive Guided Tour** | `T` | `T` | Start step-by-step interactive walkthrough |
| **Auto-Group Diversity Studio** | `G` | `G` | Open intelligent team formation and diversity studio |
| **Classroom Email & Link Dispatcher** | `E` | `E` | Open cohort email composer and evaluation link transmitter |
| **Launch Live Projector View** | `P` | `P` | Open full-screen classroom QR code and live submission hub |
| **Create New Classroom** | `C` | `C` | Open new classroom group creation modal |
| **Add New Student** | `N` | `N` | Open quick student manual enrollment dialog |
| **Open Import Wizard** | `I` | `I` | Open CSV/Excel/PDF spreadsheet onboarding wizard |
| **Add Rubric Criterion** | `A` | `A` | Add a new custom evaluation criterion to active rubric |
| **Export Gradebook Data** | `X` | `X` | Export assessment results to CSV, Excel, LMS, or PDF |
| **Undo Last Action (30s Safety Net)** | `Ctrl + Z` | `Cmd + Z` | Restore deleted students, cleared rosters, or reset evaluations |
| **Keyboard Shortcuts Cheat-Sheet** | `?` | `?` | Display live reference cheat-sheet for all shortcuts |
| **Cycle Previous / Next Classroom** | `[` / `]` | `[` / `]` | Switch between course sections in active workspace |
| **Scroll to Top of Page** | `Home` | `Home` | Smoothly scroll back to the top of the dashboard |

---

*PeerLens Documentation — Institutional Operational Manual — Published for Academic Integrity and Assessment Excellence.*
