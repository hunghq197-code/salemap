import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INCLUDE_DIRS = ["app", "components", "hooks", "lib", "scripts"];
const SKIP_DIRS = new Set([".git", ".next", ".turbo", "coverage", "node_modules"]);
const CLIENT_SECRET_ENVS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_MAPS_API_KEY",
  "PAYOS_API_KEY",
  "PAYOS_CHECKSUM_KEY",
  "PAYOS_CLIENT_ID",
  "AI_API_KEY",
  "RESEND_API_KEY",
  "CRON_SECRET",
];
const FINDINGS = [];

function walk(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir).flatMap((entry) => {
    const filePath = path.join(dir, entry);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      return SKIP_DIRS.has(entry) ? [] : walk(filePath);
    }

    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) {
      return [];
    }

    return [filePath];
  });
}

function relative(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, "/");
}

function isClientFile(relPath, content) {
  const header = content.slice(0, 200).trimStart();

  return (
    header.startsWith('"use client"') ||
    header.startsWith("'use client'") ||
    relPath.startsWith("components/")
  );
}

function addFinding(filePath, rule, message) {
  FINDINGS.push({
    file: relative(filePath),
    message,
    rule,
  });
}

function scanFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const relPath = relative(filePath);
  const clientFile = isClientFile(relPath, content);
  const isApiRoute = /^app\/api\/.*\/route\.(ts|js)$/.test(relPath);
  const hasMutationHandler =
    /export\s+(?:async\s+)?function\s+(POST|PUT|PATCH|DELETE)\b/.test(content) ||
    /export\s+const\s+(POST|PUT|PATCH|DELETE)\b/.test(content);
  const isExternallyAuthenticatedRoute =
    /^app\/api\/(cron|webhooks)\//.test(relPath);
  const hasMutationGuard =
    content.includes("guardMutationRequest") ||
    (content.includes("enforceSameOrigin") && content.includes("rateLimit")) ||
    content.includes("handleAdminApi");

  if (clientFile && /createSupabaseAdminClient|service_role|serviceRole/i.test(content)) {
    addFinding(
      filePath,
      "client-service-role",
      "Client/component file appears to import or reference service role/admin client.",
    );
  }

  if (clientFile) {
    CLIENT_SECRET_ENVS.forEach((envName) => {
      if (content.includes(envName)) {
        addFinding(
          filePath,
          "client-secret-env",
          `Client/component file references server-only env ${envName}.`,
        );
      }
    });

    const envMatches = content.match(/process\.env\.([A-Z0-9_]+)/g) ?? [];
    envMatches.forEach((match) => {
      const envName = match.replace("process.env.", "");

      if (!envName.startsWith("NEXT_PUBLIC_") && envName !== "NODE_ENV") {
        addFinding(
          filePath,
          "client-private-env",
          `Client/component file references private env ${envName}.`,
        );
      }
    });
  }

  if (
    clientFile &&
    /from\s+["']@\/lib\/billing\/(entitlements|payments|providers|subscriptions)\b/.test(
      content,
    )
  ) {
    addFinding(
      filePath,
      "client-billing-server-import",
      "Client/component file imports server-only billing module.",
    );
  }

  if (
    relPath === "app/api/billing/create-payment/route.ts" &&
    /amount\??\s*:\s*z\./.test(content)
  ) {
    addFinding(
      filePath,
      "create-payment-accepts-amount",
      "Create payment API schema must not accept amount from client.",
    );
  }

  if (
    isApiRoute &&
    hasMutationHandler &&
    !isExternallyAuthenticatedRoute &&
    !hasMutationGuard
  ) {
    addFinding(
      filePath,
      "mutation-route-missing-guard",
      "Mutation API route must enforce same-origin and rate limiting.",
    );
  }

  if (
    relPath === "lib/admin/api-guard.ts" &&
    !content.includes("enforceSameOrigin(request)")
  ) {
    addFinding(
      filePath,
      "admin-api-missing-origin-guard",
      "Admin mutation gateway must enforce same-origin requests.",
    );
  }

  if (
    /^app\/api\/cron\/.*\/route\.(ts|js)$/.test(relPath) &&
    hasMutationHandler &&
    !content.includes("CRON_SECRET")
  ) {
    addFinding(
      filePath,
      "cron-route-missing-secret",
      "Cron mutation route must authenticate with CRON_SECRET.",
    );
  }

  if (
    /^app\/api\/webhooks\/payos\/route\.(ts|js)$/.test(relPath) &&
    (
      !content.includes("InvalidPayOSWebhookSignatureError") ||
      !content.includes("rateLimitByIp")
    )
  ) {
    addFinding(
      filePath,
      "payos-webhook-missing-verification",
      "payOS webhook must verify its signature and apply IP rate limiting.",
    );
  }

  if (
    /(app\/app\/billing\/success\/page\.tsx|app\/app\/billing\/cancel\/page\.tsx|app\/app\/billing\/payment\/return\/page\.tsx|app\/app\/billing\/payment\/cancel\/page\.tsx)$/.test(
      relPath,
    ) &&
    /syncPayOSGatewayTransaction|processPaymentPaid|activateSubscriptionForUser|activateSubscriptionFromPayment|renewSubscriptionForUser|cancelPayOSGatewayTransactionForCurrentUser/.test(
      content,
    )
  ) {
    addFinding(
      filePath,
      "return-page-mutates-billing",
      "Billing return/cancel page must not update payment/subscription state.",
    );
  }

  if (/console\.(log|debug|info)\s*\(\s*process\.env/.test(content)) {
    addFinding(filePath, "log-env", "Source logs process.env.");
  }

  if (/console\.(log|debug|info)\s*\([^)]*(raw_webhook|rawWebhook|rawPlace|raw_place)/i.test(content)) {
    addFinding(filePath, "log-raw-sensitive", "Source logs raw webhook/place payload.");
  }

  if (/AIza[0-9A-Za-z_-]{20,}/.test(content)) {
    addFinding(filePath, "hardcoded-google-key", "Potential hardcoded Google API key.");
  }

  if (/sk_(live|test)_[0-9A-Za-z]{20,}/.test(content)) {
    addFinding(filePath, "hardcoded-secret-key", "Potential hardcoded payment/provider key.");
  }
}

INCLUDE_DIRS.flatMap((dir) => walk(path.join(ROOT, dir))).forEach(scanFile);

const envExamplePath = path.join(ROOT, ".env.example");
if (existsSync(envExamplePath)) {
  const envExample = readFileSync(envExamplePath, "utf8");

  if (/NEXT_PUBLIC_PAYOS_(API_KEY|CHECKSUM_KEY)/.test(envExample)) {
    addFinding(
      envExamplePath,
      "public-payos-secret-env",
      ".env.example must not define NEXT_PUBLIC payOS secret variables.",
    );
  }
}

if (FINDINGS.length > 0) {
  console.error("SECURITY SCAN FAIL");
  FINDINGS.forEach((finding) => {
    console.error(`${finding.file} [${finding.rule}] ${finding.message}`);
  });
  process.exit(1);
}

console.log("SECURITY SCAN PASS");
