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

if (FINDINGS.length > 0) {
  console.error("SECURITY SCAN FAIL");
  FINDINGS.forEach((finding) => {
    console.error(`${finding.file} [${finding.rule}] ${finding.message}`);
  });
  process.exit(1);
}

console.log("SECURITY SCAN PASS");
