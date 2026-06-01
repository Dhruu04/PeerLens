# Contributing to PeerLens

Thank you for your interest in contributing to **PeerLens**! We welcome community contributions to make peer-to-peer classroom assessments even better, more robust, and more accessible.

To ensure a smooth collaboration, please read and follow these guidelines.

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and professional environment for everyone. Please be supportive, constructive, and kind.

---

## How Can I Contribute?

### 1. Reporting Bugs
If you find a bug in PeerLens, please search our existing GitHub Issues to see if it has already been reported. If not, open a new issue using our **Bug Report** template:
* Describe the bug with clear, reproducible steps.
* Mention your web browser, OS version, and any console error logs.
* Attach screenshots if relevant to visual bugs in the dashboard or student portal.

### 2. Suggesting Enhancements & Features
We love ideas! If you have a suggestion for improving PeerLens:
* Check existing issues to see if the feature is already planned.
* Open a new issue using our **Feature Request** template.
* Explain the user value: *Why* is this helpful for instructors or students?

### 3. Submitting Code Changes (Pull Requests)
If you want to contribute code to fix a bug or implement a feature:
1. **Fork** the repository to your own account.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/PeerLens.git
   cd PeerLens
   ```
3. Create a descriptive **feature branch** for your work:
   ```bash
   git checkout -b feature/amazing-new-feature
   # or
   git checkout -b fix/resolve-bug-name
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Develop & Run Locally**:
   Run the Vite development server to test your changes:
   ```bash
   npm run dev
   ```
6. **Code Style & Formatting Guidelines**:
   * We use **TypeScript** and strictly enforce typings.
   * Verify linting rules before committing:
     ```bash
     npm run lint
     ```
   * Write clean, semantic HTML and standard modular CSS inside `src/index.css` or component files.
7. **Commit your changes** with a clear message:
   ```bash
   git commit -m "feat: add double-blind student verification page"
   ```
8. **Push** to your fork and submit a **Pull Request (PR)** to the main repository.

---

## PeerLens Tech Stack Review

For developers working on core files, PeerLens utilizes:
* **Frontend**: React 19 (Hooks, Context API) & TypeScript
* **Build Tool**: Vite 8
* **Styling**: Vanilla CSS (sleek glassmorphic theme designed for readability)
* **Data Layer**: Isolated localStorage admin profiles (offline mode) with optional secure **Firebase Cloud Firestore** real-time sync (transactional database state merges).
* **Spreadsheet Parsing**: `xlsx` & `pdfjs-dist` (roster wizard)
* **Email Automation**: `@emailjs/browser` integration

We thank you again for helping us shape the future of student-led team assessments!
