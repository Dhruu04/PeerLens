export interface FeatureToggles {
  // --- Header & Global Navigation ---
  showClassPicker: boolean;
  showDeleteClassButton: boolean;
  showNewClassButton: boolean;
  showSettingsButton: boolean;
  showThemeSwitcher: boolean;
  showProfilePill: boolean;
  showProjectorButton: boolean;
  showCommandSearch: boolean;
  showEmailButton: boolean;
  showGuideButton: boolean;
  showCloudStatus: boolean;
  showCustomizeViewButton: boolean;
  showQuickActionPill: boolean;

  // --- Sub-Header / Breadcrumb Navigation ---
  showSectionNavBreadcrumbs: boolean;
  showClassIdBadge: boolean;
  showHubOverviewBanner: boolean;
  showHubOverviewStats: boolean;
  showPresetsBanner: boolean;

  // --- Home Hub Section Cards ---
  showEnrollmentCard: boolean;
  showReviewSystemCard: boolean;
  showGradingAnalyticsCard: boolean;
  showHubCardMetrics: boolean;
  showHubQuickActions: boolean;

  // --- Section 1: Enrollment & Teams ---
  showSelfEnrollmentCard: boolean;
  showQuickActionsCard: boolean;
  showImportWizardCard: boolean;
  showAutoGroupStudio: boolean;
  showAddStudentButton: boolean;
  showExportButtons: boolean;
  showRosterSearchFilter: boolean;
  showBulkActionBar: boolean;
  showDuplicateDetector: boolean;
  showRosterTable: boolean;
  showTeamOverviewCards: boolean;

  // --- Section 2: Review System ---
  showRubricHeader: boolean;
  showRubricPresets: boolean;
  showTargetScaleCard: boolean;
  showDeadlineTimer: boolean;
  showWeightBalanceBar: boolean;
  showCustomCriterionButton: boolean;
  showCriterionCards: boolean;
  showEvaluationSimulator: boolean;
  showEvaluationFormControls: boolean;
  showTeamHealthPulse: boolean;

  // --- Section 3: Grading & Performance Analytics ---
  showResultsHeaderCard: boolean;
  showExportReportButtons: boolean;
  showSubmissionReset: boolean;
  showCompetencyRadar: boolean;
  showJohariMatrix: boolean;
  showQualitativeFeedback: boolean;
  showWebPACalibration: boolean;
  showAnomalyAudit: boolean;
  showMilestonesHistory: boolean;
  showLmsExport: boolean;
  showResultsSummarySheet: boolean;
  showGradebookSearchFilter: boolean;
  showDetailedReviewMatrix: boolean;
  showTeammateAuditLog: boolean;
}

export const DEFAULT_FEATURE_TOGGLES: FeatureToggles = {
  // Header & Top Navigation
  showClassPicker: true,
  showDeleteClassButton: true,
  showNewClassButton: true,
  showSettingsButton: true,
  showThemeSwitcher: false,
  showProfilePill: true,
  showProjectorButton: false,
  showCommandSearch: true,
  showEmailButton: false,
  showGuideButton: true,
  showCloudStatus: false,
  showCustomizeViewButton: true,
  showQuickActionPill: false,

  // Home Hub & Sub-Bar Navigation
  showPresetsBanner: true,
  showHubOverviewBanner: false,
  showHubOverviewStats: false,
  showSectionNavBreadcrumbs: false,
  showClassIdBadge: false,
  showEnrollmentCard: true,
  showReviewSystemCard: true,
  showGradingAnalyticsCard: true,
  showHubCardMetrics: true,
  showHubQuickActions: true,

  // Section 1: Enrollment & Teams
  showSelfEnrollmentCard: true,
  showQuickActionsCard: true,
  showImportWizardCard: true,
  showAutoGroupStudio: true,
  showAddStudentButton: false,
  showExportButtons: true,
  showRosterSearchFilter: true,
  showBulkActionBar: true,
  showDuplicateDetector: false,
  showRosterTable: true,
  showTeamOverviewCards: false,

  // Section 2: Review System
  showRubricHeader: true,
  showCustomCriterionButton: true,
  showRubricPresets: true,
  showTargetScaleCard: true,
  showDeadlineTimer: false,
  showWeightBalanceBar: false,
  showCriterionCards: true,
  showEvaluationSimulator: false,
  showEvaluationFormControls: false,
  showTeamHealthPulse: false,

  // Section 3: Grading & Performance Analytics
  showResultsHeaderCard: false,
  showExportReportButtons: true,
  showSubmissionReset: false,
  showCompetencyRadar: false,
  showJohariMatrix: false,
  showQualitativeFeedback: false,
  showWebPACalibration: true,
  showAnomalyAudit: false,
  showMilestonesHistory: false,
  showLmsExport: false,
  showResultsSummarySheet: true,
  showGradebookSearchFilter: true,
  showDetailedReviewMatrix: false,
  showTeammateAuditLog: false,
};

export const MINIMAL_FEATURE_TOGGLES: FeatureToggles = {
  // Header & Top Navigation
  showClassPicker: true,
  showDeleteClassButton: false,
  showNewClassButton: true,
  showSettingsButton: true,
  showThemeSwitcher: false,
  showProfilePill: false,
  showProjectorButton: false,
  showCommandSearch: false,
  showEmailButton: false,
  showGuideButton: false,
  showCloudStatus: false,
  showCustomizeViewButton: true,
  showQuickActionPill: false,

  // Home Hub & Sub-Bar Navigation
  showPresetsBanner: true,
  showHubOverviewBanner: false,
  showHubOverviewStats: false,
  showSectionNavBreadcrumbs: false,
  showClassIdBadge: false,
  showEnrollmentCard: true,
  showReviewSystemCard: true,
  showGradingAnalyticsCard: true,
  showHubCardMetrics: false,
  showHubQuickActions: false,

  // Section 1: Enrollment & Teams
  showSelfEnrollmentCard: true,
  showQuickActionsCard: true,
  showImportWizardCard: true,
  showAutoGroupStudio: true,
  showAddStudentButton: false,
  showExportButtons: false,
  showRosterSearchFilter: true,
  showBulkActionBar: true,
  showDuplicateDetector: false,
  showRosterTable: true,
  showTeamOverviewCards: false,

  // Section 2: Review System
  showRubricHeader: true,
  showCustomCriterionButton: true,
  showRubricPresets: true,
  showTargetScaleCard: true,
  showDeadlineTimer: false,
  showWeightBalanceBar: false,
  showCriterionCards: true,
  showEvaluationSimulator: false,
  showEvaluationFormControls: false,
  showTeamHealthPulse: false,

  // Section 3: Grading & Performance Analytics
  showResultsHeaderCard: false,
  showExportReportButtons: false,
  showSubmissionReset: false,
  showCompetencyRadar: false,
  showJohariMatrix: false,
  showQualitativeFeedback: false,
  showWebPACalibration: false,
  showAnomalyAudit: false,
  showMilestonesHistory: false,
  showLmsExport: false,
  showResultsSummarySheet: true,
  showGradebookSearchFilter: true,
  showDetailedReviewMatrix: false,
  showTeammateAuditLog: false,
};

export const FULL_FEATURE_TOGGLES: FeatureToggles = {
  showClassPicker: true,
  showDeleteClassButton: true,
  showNewClassButton: true,
  showSettingsButton: true,
  showThemeSwitcher: true,
  showProfilePill: true,
  showProjectorButton: true,
  showCommandSearch: true,
  showEmailButton: true,
  showGuideButton: true,
  showCloudStatus: true,
  showCustomizeViewButton: true,
  showQuickActionPill: true,

  showSectionNavBreadcrumbs: true,
  showClassIdBadge: true,
  showHubOverviewBanner: true,
  showHubOverviewStats: true,
  showPresetsBanner: true,

  showEnrollmentCard: true,
  showReviewSystemCard: true,
  showGradingAnalyticsCard: true,
  showHubCardMetrics: true,
  showHubQuickActions: true,

  showSelfEnrollmentCard: true,
  showQuickActionsCard: true,
  showImportWizardCard: true,
  showAutoGroupStudio: true,
  showAddStudentButton: true,
  showExportButtons: true,
  showRosterSearchFilter: true,
  showBulkActionBar: true,
  showDuplicateDetector: true,
  showRosterTable: true,
  showTeamOverviewCards: true,

  showRubricHeader: true,
  showRubricPresets: true,
  showTargetScaleCard: true,
  showDeadlineTimer: true,
  showWeightBalanceBar: true,
  showCustomCriterionButton: true,
  showCriterionCards: true,
  showEvaluationSimulator: true,
  showEvaluationFormControls: true,
  showTeamHealthPulse: true,

  showResultsHeaderCard: true,
  showExportReportButtons: true,
  showSubmissionReset: true,
  showCompetencyRadar: true,
  showJohariMatrix: true,
  showQualitativeFeedback: true,
  showWebPACalibration: true,
  showAnomalyAudit: true,
  showMilestonesHistory: true,
  showLmsExport: true,
  showResultsSummarySheet: true,
  showGradebookSearchFilter: true,
  showDetailedReviewMatrix: true,
  showTeammateAuditLog: true,
};

const STORAGE_KEY = 'peerlens_feature_toggles';
const EVENT_KEY = 'peerlens_features_changed';

export const loadFeatureToggles = (): FeatureToggles => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('peer_feature_toggles_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_FEATURE_TOGGLES, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse feature toggles from storage, using defaults', e);
  }
  return { ...DEFAULT_FEATURE_TOGGLES };
};

export const saveFeatureToggles = (toggles: FeatureToggles): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles));
    localStorage.setItem('peer_feature_toggles_v2', JSON.stringify(toggles));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: toggles }));
  } catch (e) {
    console.error('Failed to save feature toggles to localStorage', e);
  }
};

export const subscribeFeatureToggles = (callback: (toggles: FeatureToggles) => void): (() => void) => {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<FeatureToggles>;
    callback(customEvent.detail || loadFeatureToggles());
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === 'peer_feature_toggles_v2') {
      callback(loadFeatureToggles());
    }
  };
  window.addEventListener(EVENT_KEY, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(EVENT_KEY, handler);
    window.removeEventListener('storage', storageHandler);
  };
};

export const saveFeatureToggle = (key: keyof FeatureToggles, value: boolean): void => {
  const current = loadFeatureToggles();
  saveFeatureToggles({ ...current, [key]: value });
};

