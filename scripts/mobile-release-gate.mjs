import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const findings = [];

function resolvePath(relPath) {
  return path.join(ROOT, ...relPath.split("/"));
}

function read(relPath) {
  return readFileSync(resolvePath(relPath), "utf8");
}

function addFinding(scope, message) {
  findings.push({ scope, message });
}

function mustExist(relPath) {
  if (!existsSync(resolvePath(relPath))) {
    addFinding(relPath, "Required mobile release artifact or source file is missing.");
  }
}

function mustContain(relPath, needle, message) {
  const content = read(relPath);

  if (!content.includes(needle)) {
    addFinding(relPath, message || `Expected to include: ${needle}`);
  }
}

function mustNotContain(relPath, needle, message) {
  const content = read(relPath);

  if (content.includes(needle)) {
    addFinding(relPath, message || `Unexpected content: ${needle}`);
  }
}

function getExportedArrayBlock(content, name) {
  const match = content.match(new RegExp(`export const ${name}: AppNavItem\\[] = \\[([\\s\\S]*?)\\];`));

  return match?.[1] || "";
}

function countHrefEntries(block) {
  return (block.match(/\bhref:/g) || []).length;
}

function checkRequiredArtifacts() {
  [
    "MOBILE_RELEASE_GATE.md",
    "MOBILE_RECOVERY_AUDIT.md",
    "MOBILE_STABILIZATION_RELEASE_REPORT.md",
    "UI_PHASE_2E1_SETTINGS_NOTIFICATIONS_REPORT.md",
    "PUBLIC_BETA_BROWSER_MATRIX.md",
  ].forEach(mustExist);
}

function checkMobileNavigation() {
  const nav = read("lib/design-system/navigation.ts");
  const mobileBlock = getExportedArrayBlock(nav, "mobileNavItems");
  const moreBlock = getExportedArrayBlock(nav, "mobileMoreNavItems");

  if (countHrefEntries(mobileBlock) !== 4) {
    addFinding("lib/design-system/navigation.ts", "Mobile bottom nav must keep exactly four primary app links plus the More control.");
  }

  if (countHrefEntries(moreBlock) < 6) {
    addFinding("lib/design-system/navigation.ts", "Mobile More sheet must include secondary app destinations.");
  }

  [
    "/app/dashboard",
    "/app/discover",
    "/app/tasks",
    "/app/leads",
    "/app/pipeline",
    "/app/cadences",
    "/app/import",
    "/app/analytics",
    "/app/billing",
    "/app/support/tickets",
    "/app/settings",
  ].forEach((href) => {
    if (!nav.includes(`href: "${href}"`)) {
      addFinding("lib/design-system/navigation.ts", `Mobile/app navigation is missing ${href}.`);
    }
  });
}

function checkAppShell() {
  mustContain("components/app/AppShell.tsx", 'aria-label="Mobile bottom navigation"');
  mustContain("components/app/AppShell.tsx", "grid-cols-5");
  mustContain("components/app/AppShell.tsx", "min-h-14");
  mustContain("components/app/AppShell.tsx", "pb-[calc(0.5rem+env(safe-area-inset-bottom))]");
  mustContain("components/app/AppShell.tsx", "pt-[calc(0.75rem+env(safe-area-inset-top))]");
  mustContain("components/app/AppShell.tsx", "pb-[calc(7rem+env(safe-area-inset-bottom))]");
  mustContain("components/app/AppShell.tsx", "NotificationBell");
  mustContain("components/app/AppShell.tsx", "LanguageSwitcher");
  mustContain("components/app/AppShell.tsx", "NetworkStatusBanner");
  mustContain("components/app/AppShell.tsx", "FloatingFeedbackButton");
}

function checkDashboardMobileOrder() {
  const dashboard = read("app/app/dashboard/page.tsx");
  const todayTasksIndex = dashboard.indexOf("<TodayTasks");
  const mobileStatsIndex = dashboard.indexOf('className="lg:hidden"');
  const quickDiscoveryIndex = dashboard.indexOf("<QuickDiscoveryCard");

  if (todayTasksIndex === -1 || mobileStatsIndex === -1 || todayTasksIndex > mobileStatsIndex) {
    addFinding("app/app/dashboard/page.tsx", "Mobile dashboard must surface Today's Tasks before the mobile KPI grid.");
  }

  if (quickDiscoveryIndex === -1) {
    addFinding("app/app/dashboard/page.tsx", "Dashboard must keep the quick discovery entry point.");
  }

  mustContain("app/app/dashboard/page.tsx", "withWidgetFallback");
  mustContain("app/app/dashboard/page.tsx", "lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]");
  mustContain("app/app/dashboard/page.tsx", "BetaChecklistCard");
  mustContain("app/app/dashboard/page.tsx", "ActivationChecklist");
}

function checkSettingsAndNotifications() {
  mustContain("app/app/settings/page.tsx", "NotificationSettingsForm");
  mustContain("app/app/settings/page.tsx", 'href="/app/install"');
  mustContain("app/app/settings/page.tsx", 'href="/app/offline"');
  mustContain("app/app/settings/actions.ts", "updateNotificationSettingsAction");
  mustContain("app/app/settings/actions.ts", "revalidatePath(\"/app/notifications\")");
  mustContain("app/app/notifications/page.tsx", "markAllNotificationsAsReadAction");
  mustContain("app/app/notifications/page.tsx", "unreadOnly");
  mustContain("components/notifications/NotificationBell.tsx", 'href="/app/notifications"');
}

function checkPwaRecovery() {
  [
    'url.pathname.startsWith("/api")',
    'url.pathname.startsWith("/admin")',
    'url.pathname.startsWith("/app/billing")',
    'url.pathname.startsWith("/auth")',
    'url.pathname === "/login"',
    'url.pathname === "/register"',
  ].forEach((needle) => mustContain("public/sw.js", needle));

  mustContain("components/app/LogoutButton.tsx", "clearUserOfflineData");
  mustContain("lib/offline/clear-user-offline-data.ts", "clearUserOfflineQueue");
  mustContain("lib/offline/clear-user-offline-data.ts", "clearUserDrafts");
  mustContain("lib/offline/clear-user-offline-data.ts", "clearUserLocalCache");
  mustNotContain("public/sw.js", 'url.pathname.startsWith("/api") return false');
}

function checkMobileActionSurfaces() {
  mustContain("app/app/leads/[leadId]/page.tsx", 'data-testid="lead-mobile-action-bar"');
  mustContain("components/leads/LeadFilterBar.tsx", "mobileOpen");
  mustContain("components/tasks/TaskFilterBar.tsx", "mobileOpen");
  mustContain("components/pipeline/PipelineFilterBar.tsx", "mobileOpen");
  mustContain("components/discovery/DiscoverTabs.tsx", "mobileView");
}

[
  checkRequiredArtifacts,
  checkMobileNavigation,
  checkAppShell,
  checkDashboardMobileOrder,
  checkSettingsAndNotifications,
  checkPwaRecovery,
  checkMobileActionSurfaces,
].forEach((check) => check());

if (findings.length > 0) {
  console.error("MOBILE RELEASE GATE FAIL");
  findings.forEach((finding) => {
    console.error(`${finding.scope}: ${finding.message}`);
  });
  process.exit(1);
}

console.log("MOBILE RELEASE GATE PASS");
