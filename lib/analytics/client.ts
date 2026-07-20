"use client";

import { initPostHog } from "@/instrumentation-client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

type SafePropertyValue =
  | Array<boolean | number | string>
  | boolean
  | null
  | number
  | string;

const blockedPropertyKeys = new Set([
  "email",
  "fullName",
  "mainArea",
  "message",
  "name",
  "phone",
  "phoneZalo",
  "reason",
  "referrer",
]);

function sanitizeValue(value: unknown): SafePropertyValue | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return value.slice(0, 160);
  }

  if (Array.isArray(value)) {
    const safeItems = value
      .filter(
        (item): item is boolean | number | string =>
          typeof item === "boolean" ||
          typeof item === "number" ||
          typeof item === "string",
      )
      .map((item) => (typeof item === "string" ? item.slice(0, 160) : item))
      .slice(0, 20);

    return safeItems;
  }

  return undefined;
}

function sanitizeProperties(properties?: Record<string, unknown>) {
  const safeProperties: Record<string, SafePropertyValue> = {};

  Object.entries(properties ?? {}).forEach(([key, value]) => {
    if (blockedPropertyKeys.has(key)) {
      return;
    }

    const safeValue = sanitizeValue(value);

    if (safeValue !== undefined) {
      safeProperties[key] = safeValue;
    }
  });

  return safeProperties;
}

export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>,
): void {
  try {
    if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }

    const safeProperties = sanitizeProperties(properties);
    const ready = initPostHog();

    if (!ready) {
      return;
    }

    void ready
      .then(async () => {
        const { default: posthog } = await import("posthog-js");
        posthog.capture(eventName, safeProperties);
      })
      .catch(() => {
        // Analytics must never break the landing page.
      });
  } catch {
    // Analytics must never break the landing page.
  }
}

export function trackHeroCtaClicked(): void {
  trackEvent(ANALYTICS_EVENTS.HERO_CTA_CLICKED);
}

export function trackSecondaryCtaClicked(): void {
  trackEvent(ANALYTICS_EVENTS.SECONDARY_CTA_CLICKED);
}

export function trackBetaFormStarted(): void {
  trackEvent(ANALYTICS_EVENTS.BETA_FORM_STARTED);
}

export function trackBetaFormSubmitClicked(): void {
  trackEvent(ANALYTICS_EVENTS.BETA_FORM_SUBMIT_CLICKED);
}

export function trackBetaFormSubmitted(payload: {
  betaScore?: number;
  currentRole?: string;
  desiredFeatures?: string[];
  industry?: string;
  personaLabel?: string;
  utmCampaign?: string | null;
  utmMedium?: string | null;
  utmSource?: string | null;
}): void {
  trackEvent(ANALYTICS_EVENTS.BETA_FORM_SUBMITTED, payload);
}

export function trackBetaFormFailed(errorCode?: string): void {
  trackEvent(ANALYTICS_EVENTS.BETA_FORM_FAILED, {
    errorCode: errorCode || "UNKNOWN_ERROR",
  });
}

export function trackBetaGuideViewed(): void {
  trackEvent(ANALYTICS_EVENTS.BETA_GUIDE_VIEWED);
}

export function trackBetaFeedbackOpened(): void {
  trackEvent(ANALYTICS_EVENTS.BETA_FEEDBACK_OPENED);
}

export function trackBetaFeedbackSubmitted(properties?: {
  feedbackType?: string;
  rating?: number | null;
}): void {
  trackEvent(ANALYTICS_EVENTS.BETA_FEEDBACK_SUBMITTED, properties);
}

export function trackBetaFeedbackFailed(feedbackType?: string): void {
  trackEvent(ANALYTICS_EVENTS.BETA_FEEDBACK_FAILED, { feedbackType });
}

export function trackBetaChecklistItemCompleted(properties?: {
  checklistKey?: string;
  completedCount?: number;
  totalCount?: number;
}): void {
  trackEvent(ANALYTICS_EVENTS.BETA_CHECKLIST_ITEM_COMPLETED, properties);
}

export function trackAdminDashboardViewed(): void {
  trackEvent(ANALYTICS_EVENTS.ADMIN_DASHBOARD_VIEWED);
}

export function trackAdminUsersViewed(properties?: { filterApplied?: boolean }): void {
  trackEvent(ANALYTICS_EVENTS.ADMIN_USERS_VIEWED, properties);
}

export function trackAdminFeedbackViewed(properties?: { filterApplied?: boolean }): void {
  trackEvent(ANALYTICS_EVENTS.ADMIN_FEEDBACK_VIEWED, properties);
}

export function trackAdminUpgradeInterestsViewed(properties?: {
  filterApplied?: boolean;
}): void {
  trackEvent(ANALYTICS_EVENTS.ADMIN_UPGRADE_INTERESTS_VIEWED, properties);
}

export function trackAdminFeedbackStatusUpdated(properties?: {
  priority?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.ADMIN_FEEDBACK_STATUS_UPDATED, properties);
}

export function trackAdminUpgradeInterestStatusUpdated(properties?: {
  planKey?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.ADMIN_UPGRADE_INTEREST_STATUS_UPDATED, properties);
}

export function trackFAQOpened(question: string): void {
  trackEvent(ANALYTICS_EVENTS.FAQ_OPENED, { question });
}

export function trackRouteSectionCtaClicked(): void {
  trackEvent(ANALYTICS_EVENTS.ROUTE_SECTION_CTA_CLICKED);
}

export function trackFinalCtaClicked(): void {
  trackEvent(ANALYTICS_EVENTS.FINAL_CTA_CLICKED);
}

export function trackUserRegistered(): void {
  trackEvent(ANALYTICS_EVENTS.USER_REGISTERED);
}

export function trackInviteCodeValidated(properties?: {
  inviteOnly?: boolean;
  label?: string | null;
}): void {
  trackEvent(ANALYTICS_EVENTS.INVITE_CODE_VALIDATED, properties);
}

export function trackInviteCodeValidationFailed(properties?: {
  errorCode?: string;
  inviteOnly?: boolean;
}): void {
  trackEvent(ANALYTICS_EVENTS.INVITE_CODE_VALIDATION_FAILED, properties);
}

export function trackInviteCodeRedeemed(properties?: {
  inviteOnly?: boolean;
}): void {
  trackEvent(ANALYTICS_EVENTS.INVITE_CODE_REDEEMED, properties);
}

type ImportAnalyticsPayload = {
  duplicateRows?: number;
  duplicateStrategy?: string;
  failedRows?: number;
  fileType?: string;
  importedRows?: number;
  invalidRows?: number;
  planKey?: string;
  totalRows?: number;
  updatedRows?: number;
  validRows?: number;
};

export function trackImportPageViewed(properties?: ImportAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.IMPORT_PAGE_VIEWED, properties);
}

export function trackImportFileSelected(properties?: ImportAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.IMPORT_FILE_SELECTED, properties);
}

export function trackImportFileUploadStarted(properties?: ImportAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.IMPORT_FILE_UPLOAD_STARTED, properties);
}

export function trackImportFileUploadCompleted(properties?: ImportAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.IMPORT_FILE_UPLOAD_COMPLETED, properties);
}

export function trackImportFileUploadFailed(properties?: ImportAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.IMPORT_FILE_UPLOAD_FAILED, properties);
}

export function trackImportMappingSaved(properties?: ImportAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.IMPORT_MAPPING_SAVED, properties);
}

export function trackImportValidationStarted(properties?: ImportAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.IMPORT_VALIDATION_STARTED, properties);
}

export function trackImportValidationCompleted(properties?: ImportAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.IMPORT_VALIDATION_COMPLETED, properties);
}

export function trackImportExecuteStarted(properties?: ImportAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.IMPORT_EXECUTE_STARTED, properties);
}

export function trackImportExecuteCompleted(properties?: ImportAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.IMPORT_EXECUTE_COMPLETED, properties);
}

export function trackImportExecuteFailed(properties?: ImportAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.IMPORT_EXECUTE_FAILED, properties);
}

export function trackImportErrorCsvDownloaded(properties?: ImportAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.IMPORT_ERROR_CSV_DOWNLOADED, properties);
}

type CleanupAnalyticsPayload = {
  actionType?: string;
  confidenceRange?: string;
  duplicateReason?: string;
  failedCount?: number;
  issueType?: string;
  leadCount?: number;
  selectedCount?: number;
  severity?: string;
  successCount?: number;
};

export function trackLeadCleanupViewed(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.LEAD_CLEANUP_VIEWED, properties);
}

export function trackDuplicateScanStarted(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.DUPLICATE_SCAN_STARTED, properties);
}

export function trackDuplicateScanCompleted(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.DUPLICATE_SCAN_COMPLETED, properties);
}

export function trackDuplicateGroupViewed(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.DUPLICATE_GROUP_VIEWED, properties);
}

export function trackDuplicateGroupDismissed(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.DUPLICATE_GROUP_DISMISSED, properties);
}

export function trackLeadMergeStarted(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.LEAD_MERGE_STARTED, properties);
}

export function trackLeadMergeCompleted(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.LEAD_MERGE_COMPLETED, properties);
}

export function trackLeadMergeFailed(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.LEAD_MERGE_FAILED, properties);
}

export function trackDataQualityScanStarted(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.DATA_QUALITY_SCAN_STARTED, properties);
}

export function trackDataQualityScanCompleted(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.DATA_QUALITY_SCAN_COMPLETED, properties);
}

export function trackDataQualityIssueResolved(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.DATA_QUALITY_ISSUE_RESOLVED, properties);
}

export function trackDataQualityIssueDismissed(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.DATA_QUALITY_ISSUE_DISMISSED, properties);
}

export function trackBulkActionStarted(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.BULK_ACTION_STARTED, properties);
}

export function trackBulkActionCompleted(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.BULK_ACTION_COMPLETED, properties);
}

export function trackBulkActionFailed(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.BULK_ACTION_FAILED, properties);
}

export function trackBulkSelectUsed(properties?: CleanupAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.BULK_SELECT_USED, properties);
}

type PipelineAnalyticsPayload = {
  filterCount?: number;
  fromStatus?: string | null;
  leadCountBucket?: string;
  sortBy?: string;
  sortDirection?: string;
  toStatus?: string;
  viewKey?: string | null;
  viewType?: string | null;
};

export function trackPipelineViewed(properties?: PipelineAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PIPELINE_VIEWED, properties);
}

export function trackPipelineStatusChangeStarted(properties?: PipelineAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PIPELINE_STATUS_CHANGE_STARTED, properties);
}

export function trackPipelineStatusChanged(properties?: PipelineAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PIPELINE_STATUS_CHANGED, properties);
}

export function trackPipelineStatusChangeFailed(properties?: PipelineAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PIPELINE_STATUS_CHANGE_FAILED, properties);
}

export function trackSavedViewsViewed(properties?: PipelineAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SAVED_VIEWS_VIEWED, properties);
}

export function trackSavedViewOpened(properties?: PipelineAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SAVED_VIEW_OPENED, properties);
}

export function trackSmartViewOpened(properties?: PipelineAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SMART_VIEW_OPENED, properties);
}

export function trackAdvancedFilterApplied(properties?: PipelineAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.ADVANCED_FILTER_APPLIED, properties);
}

type SalesAnalyticsPayload = {
  activeGoalsCount?: number;
  goalPeriodType?: string;
  hasGoals?: boolean;
  metricKey?: string;
  period?: string;
  progressBucket?: string;
  sourceKey?: string;
  targetValueBucket?: string;
};

export function trackSalesAnalyticsViewed(properties?: SalesAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SALES_ANALYTICS_VIEWED, properties);
}

export function trackSalesAnalyticsPeriodChanged(properties?: SalesAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SALES_ANALYTICS_PERIOD_CHANGED, properties);
}

export function trackSalesFunnelViewed(properties?: SalesAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SALES_FUNNEL_VIEWED, properties);
}

export function trackSalesSourceBreakdownViewed(properties?: SalesAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SALES_SOURCE_BREAKDOWN_VIEWED, properties);
}

export function trackSalesGoalCreated(properties?: SalesAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SALES_GOAL_CREATED, properties);
}

export function trackSalesGoalUpdated(properties?: SalesAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SALES_GOAL_UPDATED, properties);
}

export function trackSalesGoalCompleted(properties?: SalesAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SALES_GOAL_COMPLETED, properties);
}

export function trackSalesGoalPinned(properties?: SalesAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SALES_GOAL_PINNED, properties);
}

export function trackSalesGoalUnpinned(properties?: SalesAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SALES_GOAL_UNPINNED, properties);
}

export function trackSalesGoalArchived(properties?: SalesAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SALES_GOAL_ARCHIVED, properties);
}

export function trackSalesGoalTemplateUsed(properties?: SalesAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SALES_GOAL_TEMPLATE_USED, properties);
}

export function trackSalesAnalyticsRebuildClicked(properties?: SalesAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.SALES_ANALYTICS_REBUILD_CLICKED, properties);
}

export function trackDashboardGoalCardClicked(properties?: SalesAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.DASHBOARD_GOAL_CARD_CLICKED, properties);
}

export function trackFeatureFlagDisabledViewed(flagKey: string): void {
  trackEvent(ANALYTICS_EVENTS.FEATURE_FLAG_DISABLED_VIEWED, { flagKey });
}

export function trackBetaStatusViewed(): void {
  trackEvent(ANALYTICS_EVENTS.BETA_STATUS_VIEWED);
}

export function trackQaChecklistUpdated(properties?: {
  checklistKey?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.QA_CHECKLIST_UPDATED, properties);
}

export function trackFirstRunGuideViewed(): void {
  trackEvent(ANALYTICS_EVENTS.FIRST_RUN_GUIDE_VIEWED);
}

export function trackFirstRunGuideCtaClicked(actionType: string): void {
  trackEvent(ANALYTICS_EVENTS.FIRST_RUN_GUIDE_CTA_CLICKED, { actionType });
}

export function trackUserLoggedIn(): void {
  trackEvent(ANALYTICS_EVENTS.USER_LOGGED_IN);
}

export function trackOnboardingCompleted(properties?: {
  goalsCount?: number;
  industry?: string;
  roleType?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, properties);
}

export function trackAppDashboardViewed(): void {
  trackEvent(ANALYTICS_EVENTS.DASHBOARD_VIEWED);
}

export function trackLeadDetailViewed(properties?: {
  priority?: string | null;
  status?: string | null;
}): void {
  trackEvent(ANALYTICS_EVENTS.LEAD_DETAIL_VIEWED, properties);
}

export function trackTemplateCopied(category?: string): void {
  trackEvent(ANALYTICS_EVENTS.TEMPLATE_COPIED, { category });
}

export function trackExportPageViewed(): void {
  trackEvent(ANALYTICS_EVENTS.EXPORT_PAGE_VIEWED);
}

export function trackExportLeadsClicked(properties?: {
  selectedFieldCount?: number;
  sourceFilter?: string;
  statusFilter?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.EXPORT_LEADS_CLICKED, properties);
}

export function trackExportLeadsCompleted(properties?: {
  rowCount?: number;
  selectedFieldCount?: number;
  sourceFilter?: string;
  statusFilter?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.EXPORT_LEADS_COMPLETED, properties);
}

export function trackExportLeadsFailed(properties?: {
  sourceFilter?: string;
  statusFilter?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.EXPORT_LEADS_FAILED, properties);
}

export function trackBillingPageViewed(): void {
  trackEvent(ANALYTICS_EVENTS.BILLING_PAGE_VIEWED, {
    currentPlan: "free_beta",
  });
}

export function trackBillingHistoryViewed(properties?: {
  currentPlan?: string;
  requestCount?: number;
}): void {
  trackEvent(ANALYTICS_EVENTS.BILLING_HISTORY_VIEWED, properties);
}

type AIAnalyticsPayload = {
  channel?: string;
  hasLeadId?: boolean;
  hasTemplateId?: boolean;
  remainingQuota?: number;
  requestType?: string;
  status?: string;
  tone?: string;
};

export function trackAIAssistantViewed(properties?: AIAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.AI_ASSISTANT_VIEWED, properties);
}

export function trackAIGenerateClicked(properties?: AIAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.AI_GENERATE_CLICKED, properties);
}

export function trackAIGenerateCompleted(properties?: AIAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.AI_GENERATE_COMPLETED, properties);
}

export function trackAIGenerateFailed(properties?: AIAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.AI_GENERATE_FAILED, properties);
}

export function trackAIOutputCopied(properties?: AIAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.AI_OUTPUT_COPIED, properties);
}

export function trackAIOutputSaved(properties?: AIAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.AI_OUTPUT_SAVED, properties);
}

export function trackAIOutputSavedToNote(properties?: AIAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.AI_OUTPUT_SAVED_TO_NOTE, properties);
}

export function trackAIQuotaReached(properties?: AIAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.AI_QUOTA_REACHED, properties);
}

export function trackAITemplatePersonalized(properties?: AIAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.AI_TEMPLATE_PERSONALIZED, properties);
}

type PWAAnalyticsPayload = {
  actionType?: string;
  deviceType?: string;
  formName?: string;
  isStandalone?: boolean;
  installSource?: string;
  mode?: string;
  pendingCount?: number;
  queueCount?: number;
  route?: string;
  status?: string;
};

export function trackPWAInstallPromptShown(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PWA_INSTALL_PROMPT_SHOWN, properties);
}

export function trackPWAInstallClicked(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PWA_INSTALL_CLICKED, properties);
}

export function trackPWAInstallAccepted(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PWA_INSTALL_ACCEPTED, properties);
}

export function trackPWAInstallDismissed(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PWA_INSTALL_DISMISSED, properties);
}

export function trackPWAOfflineDetected(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PWA_OFFLINE_DETECTED, properties);
}

export function trackPWAOnlineRestored(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PWA_ONLINE_RESTORED, properties);
}

export function trackPWAServiceWorkerReady(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PWA_SERVICE_WORKER_READY, properties);
}

export function trackPWAOfflineDraftSaved(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PWA_OFFLINE_DRAFT_SAVED, properties);
}

export function trackPWAOfflineQueueSaved(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PWA_OFFLINE_QUEUE_SAVED, properties);
}

export function trackPWAInstallGuideViewed(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.PWA_INSTALL_GUIDE_VIEWED, properties);
}

export function trackOfflineCacheUsed(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.OFFLINE_CACHE_USED, properties);
}

export function trackOfflineActionEnqueued(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.OFFLINE_ACTION_ENQUEUED, properties);
}

export function trackOfflineActionSynced(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.OFFLINE_ACTION_SYNCED, properties);
}

export function trackOfflineActionSyncFailed(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.OFFLINE_ACTION_SYNC_FAILED, properties);
}

export function trackOfflineDraftRestored(properties?: PWAAnalyticsPayload): void {
  trackEvent(ANALYTICS_EVENTS.OFFLINE_DRAFT_RESTORED, properties);
}

export function trackPaymentRequestCreated(properties?: {
  amountVnd?: number;
  planKey?: string;
  sourcePage?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.PAYMENT_REQUEST_CREATED, properties);
}

export function trackPaymentInstructionViewed(properties?: {
  amountVnd?: number;
  planKey?: string;
  requestType?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.PAYMENT_INSTRUCTION_VIEWED, properties);
}

export function trackPaymentMarkedTransferred(properties?: {
  planKey?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.PAYMENT_MARKED_TRANSFERRED, properties);
}

export function trackPayOSPaymentLinkCreated(properties?: {
  amountVnd?: number;
  planKey?: string;
  provider?: "payos";
  requestType?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.PAYOS_PAYMENT_LINK_CREATED, properties);
}

export function trackPayOSPaymentLinkCreateFailed(properties?: {
  amountVnd?: number;
  planKey?: string;
  provider?: "payos";
  requestType?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.PAYOS_PAYMENT_LINK_CREATE_FAILED, properties);
}

export function trackPayOSCheckoutRedirected(properties?: {
  amountVnd?: number;
  planKey?: string;
  provider?: "payos";
  requestType?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.PAYOS_CHECKOUT_REDIRECTED, properties);
}

export function trackPayOSPaymentReturnViewed(properties?: {
  amountVnd?: number;
  planKey?: string;
  provider?: "payos";
  requestType?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.PAYOS_PAYMENT_RETURN_VIEWED, properties);
}

export function trackPayOSPaymentCancelled(properties?: {
  amountVnd?: number;
  planKey?: string;
  provider?: "payos";
  requestType?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.PAYOS_PAYMENT_CANCELLED, properties);
}

export function trackPaymentRequestApproved(properties?: {
  amountVnd?: number;
  planKey?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.PAYMENT_REQUEST_APPROVED, properties);
}

export function trackPaymentRequestRejected(properties?: {
  amountVnd?: number;
  planKey?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.PAYMENT_REQUEST_REJECTED, properties);
}

export function trackSubscriptionActivated(properties?: {
  planKey?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.SUBSCRIPTION_ACTIVATED, properties);
}

export function trackRenewalPaymentRequestCreated(properties?: {
  amountVnd?: number;
  months?: number;
  planKey?: string;
  requestType?: string;
  sourcePage?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.RENEWAL_PAYMENT_REQUEST_CREATED, properties);
}

export function trackSubscriptionRenewed(properties?: {
  daysRemaining?: number;
  planKey?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.SUBSCRIPTION_RENEWED, properties);
}

export function trackSubscriptionExpired(properties?: {
  planKey?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.SUBSCRIPTION_EXPIRED, properties);
}

export function trackSubscriptionCancelRequested(properties?: {
  daysRemaining?: number;
  planKey?: string;
  reasonType?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.SUBSCRIPTION_CANCEL_REQUESTED, properties);
}

export function trackCancellationReasonSubmitted(properties?: {
  planKey?: string;
  reasonType?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.CANCELLATION_REASON_SUBMITTED, properties);
}

export function trackAdminRevenueViewed(properties?: {
  filterApplied?: boolean;
}): void {
  trackEvent(ANALYTICS_EVENTS.ADMIN_REVENUE_VIEWED, properties);
}

export function trackAdminSubscriptionExtended(properties?: {
  planKey?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.ADMIN_SUBSCRIPTION_EXTENDED, properties);
}

export function trackAdminSubscriptionDowngraded(properties?: {
  planKey?: string;
  status?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.ADMIN_SUBSCRIPTION_DOWNGRADED, properties);
}

export function trackRevenueSnapshotCreated(properties?: {
  activePaidUsers?: number;
  mrrVnd?: number;
}): void {
  trackEvent(ANALYTICS_EVENTS.REVENUE_SNAPSHOT_CREATED, properties);
}

export function trackUpgradeInterestClicked(properties?: {
  actionType?: string;
  planKey?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.UPGRADE_INTEREST_CLICKED, {
    currentPlan: "free_beta",
    ...properties,
  });
}

export function trackUpgradeInterestSubmitted(properties?: {
  expectedPrice?: string;
  mainFeatureInterest?: string;
  planKey?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.UPGRADE_INTEREST_SUBMITTED, {
    currentPlan: "free_beta",
    ...properties,
  });
}

export function trackUpgradeInterestFailed(properties?: {
  errorCode?: string;
  expectedPrice?: string;
  mainFeatureInterest?: string;
  planKey?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.UPGRADE_INTEREST_FAILED, {
    currentPlan: "free_beta",
    ...properties,
  });
}

export function trackQuotaCardViewed(properties?: { sourcePage?: string }): void {
  trackEvent(ANALYTICS_EVENTS.QUOTA_CARD_VIEWED, properties);
}

export function trackQuotaLimitWarningViewed(properties?: {
  actionType?: string;
  limit?: number;
  remaining?: number;
  used?: number;
}): void {
  trackEvent(ANALYTICS_EVENTS.QUOTA_LIMIT_WARNING_VIEWED, properties);
}

export function trackQuotaLimitReached(properties?: {
  actionType?: string;
  limit?: number;
  remaining?: number;
  used?: number;
}): void {
  trackEvent(ANALYTICS_EVENTS.QUOTA_LIMIT_REACHED, properties);
}

export function trackTemplateLibraryViewed(): void {
  trackEvent(ANALYTICS_EVENTS.TEMPLATE_LIBRARY_VIEWED);
}

export function trackTemplateSearched(): void {
  trackEvent(ANALYTICS_EVENTS.TEMPLATE_SEARCHED);
}

export function trackTemplateFiltered(properties?: {
  categorySlug?: string;
  templateType?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.TEMPLATE_FILTERED, properties);
}

export function trackTemplateViewed(properties?: {
  categorySlug?: string;
  channel?: string;
  templateType?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.TEMPLATE_VIEWED, properties);
}

export function trackTemplateFavorited(properties?: {
  categorySlug?: string;
  channel?: string;
  templateType?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.TEMPLATE_FAVORITED, properties);
}

export function trackTemplateUnfavorited(properties?: {
  categorySlug?: string;
  channel?: string;
  templateType?: string;
}): void {
  trackEvent(ANALYTICS_EVENTS.TEMPLATE_UNFAVORITED, properties);
}

export function trackMapEvent(
  eventName: string,
  properties?: {
    bufferMeters?: number;
    category?: string;
    hasRouteDistance?: boolean;
    hasRouteDuration?: boolean;
    hasPhone?: boolean;
    hasWebsite?: boolean;
    keyword?: string;
    radiusMeters?: number;
    remainingQuota?: number;
    resultCount?: number;
    source?: string;
  },
): void {
  trackEvent(eventName, properties);
}

export function trackLogoutClicked(): void {
  trackEvent(ANALYTICS_EVENTS.LOGOUT_CLICKED);
}
