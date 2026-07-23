import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const DEFAULT_PORT = 3210;
const HOST = process.env.SMOKE_HOST || "127.0.0.1";
const PORT = Number(process.env.SMOKE_PORT || DEFAULT_PORT);
const PROVIDED_BASE_URL = process.env.SMOKE_BASE_URL?.trim();
const BASE_URL = PROVIDED_BASE_URL || `http://${HOST}:${PORT}`;
const BAD_ORIGIN = process.env.SMOKE_BAD_ORIGIN || "https://evil.example";
const START_TIMEOUT_MS = Number(process.env.SMOKE_START_TIMEOUT_MS || 120000);
const REQUEST_TIMEOUT_MS = Number(process.env.SMOKE_REQUEST_TIMEOUT_MS || 30000);

const serverLogs = [];
let serverProcess = null;

function keepRecentLog(chunk) {
  const text = chunk.toString();
  serverLogs.push(...text.split(/\r?\n/).filter(Boolean));

  if (serverLogs.length > 80) {
    serverLogs.splice(0, serverLogs.length - 80);
  }
}

function stopServer() {
  if (!serverProcess || serverProcess.killed) {
    return;
  }

  serverProcess.kill("SIGTERM");
}

async function fetchWithTimeout(pathname, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(new URL(pathname, BASE_URL), {
      ...options,
      redirect: "manual",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function waitForServer() {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < START_TIMEOUT_MS) {
    if (serverProcess?.exitCode !== null && serverProcess?.exitCode !== undefined) {
      throw new Error(`Next dev server exited early with code ${serverProcess.exitCode}.`);
    }

    try {
      const response = await fetchWithTimeout("/status", {
        headers: { Accept: "text/html" },
      });

      if (response.status < 500) {
        return;
      }

      lastError = new Error(`Server returned ${response.status} while warming up.`);
    } catch (error) {
      lastError = error;
    }

    await delay(1000);
  }

  const logTail = serverLogs.slice(-25).join("\n");
  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Timed out waiting for ${BASE_URL}. Last error: ${detail}\n${logTail}`);
}

async function startServerIfNeeded() {
  if (PROVIDED_BASE_URL) {
    console.log(`[smoke] Using existing server: ${BASE_URL}`);
    return;
  }

  console.log(`[smoke] Starting Next dev server on ${BASE_URL}`);
  serverProcess = spawn(process.execPath, [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    HOST,
    "--port",
    String(PORT),
  ], {
    env: {
      ...process.env,
      PORT: String(PORT),
    },
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverProcess.stdout.on("data", keepRecentLog);
  serverProcess.stderr.on("data", keepRecentLog);
  process.on("exit", stopServer);
  process.on("SIGINT", () => {
    stopServer();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    stopServer();
    process.exit(143);
  });

  await waitForServer();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectPage(pathname, expectedText) {
  const response = await fetchWithTimeout(pathname, {
    headers: { Accept: "text/html" },
  });
  const body = await response.text();

  assert(response.status === 200, `${pathname} expected 200, got ${response.status}`);
  assert(body.includes(expectedText), `${pathname} did not include "${expectedText}"`);

  return response;
}

async function expectSecurityHeaders(pathname) {
  const response = await fetchWithTimeout(pathname);

  assert(response.status === 200, `${pathname} expected 200, got ${response.status}`);
  assert(
    response.headers.get("x-frame-options") === "DENY",
    `${pathname} missing X-Frame-Options: DENY`,
  );
  assert(
    response.headers.get("x-content-type-options") === "nosniff",
    `${pathname} missing X-Content-Type-Options: nosniff`,
  );
  assert(
    response.headers.get("content-security-policy")?.includes("default-src 'self'"),
    `${pathname} missing Content-Security-Policy default-src`,
  );
}

async function expectManifest() {
  const response = await fetchWithTimeout("/manifest.webmanifest", {
    headers: { Accept: "application/manifest+json,application/json" },
  });
  const manifest = await response.json();

  assert(response.status === 200, `/manifest.webmanifest expected 200, got ${response.status}`);
  assert(manifest.name === "SaleMap", "/manifest.webmanifest has unexpected app name");
  assert(manifest.start_url === "/app/dashboard", "/manifest.webmanifest has unexpected start_url");
}

async function expectText(pathname, expectedText) {
  const response = await fetchWithTimeout(pathname);
  const body = await response.text();

  assert(response.status === 200, `${pathname} expected 200, got ${response.status}`);
  assert(body.includes(expectedText), `${pathname} did not include "${expectedText}"`);
}

async function expectCrossOriginBlocked({ body = {}, method = "POST", pathname }) {
  const response = await fetchWithTimeout(pathname, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Origin: BAD_ORIGIN,
    },
    method,
  });
  const payload = await response.json().catch(() => null);

  assert(response.status === 403, `${pathname} expected 403 for bad Origin, got ${response.status}`);
  assert(
    payload?.error?.code === "INVALID_REQUEST_ORIGIN",
    `${pathname} expected INVALID_REQUEST_ORIGIN`,
  );
}

async function runTest(name, fn) {
  const startedAt = Date.now();
  await fn();
  const elapsedMs = Date.now() - startedAt;
  console.log(`OK ${name} (${elapsedMs}ms)`);
}

const tests = [
  ["home page renders", () => expectPage("/", "SaleMap")],
  ["login page renders", () => expectPage("/login", "SaleMap")],
  ["status page renders", () => expectPage("/status", "SaleMap")],
  ["security headers are present", () => expectSecurityHeaders("/")],
  ["manifest renders", expectManifest],
  ["robots.txt renders", () => expectText("/robots.txt", "User-Agent")],
  ["offline fallback renders", () => expectText("/offline.html", "SaleMap")],
  [
    "AI generate API blocks cross-origin",
    () => expectCrossOriginBlocked({ pathname: "/api/ai/generate", body: { prompt: "test" } }),
  ],
  [
    "AI save-output API blocks cross-origin",
    () => expectCrossOriginBlocked({ pathname: "/api/ai/save-output" }),
  ],
  [
    "discovery area API blocks cross-origin",
    () =>
      expectCrossOriginBlocked({
        pathname: "/api/discovery/area",
        body: { areaText: "Quan 1", keyword: "cafe", radiusMeters: 1000 },
      }),
  ],
  [
    "discovery save-place API blocks cross-origin",
    () =>
      expectCrossOriginBlocked({
        pathname: "/api/discovery/save-place",
        body: { name: "Smoke", placeId: "smoke-place", source: "map_search" },
      }),
  ],
  [
    "lead export API blocks cross-origin",
    () =>
      expectCrossOriginBlocked({
        pathname: "/api/export/leads",
        body: { filters: {}, selectedFields: ["name"] },
      }),
  ],
  [
    "lead import upload API blocks cross-origin",
    () => expectCrossOriginBlocked({ pathname: "/api/import/leads/upload" }),
  ],
  [
    "lead import execute API blocks cross-origin",
    () =>
      expectCrossOriginBlocked({
        pathname: "/api/import/leads/00000000-0000-0000-0000-000000000000/execute",
      }),
  ],
  [
    "lead bulk action API blocks cross-origin",
    () => expectCrossOriginBlocked({ pathname: "/api/leads/bulk-actions" }),
  ],
  [
    "lead note API blocks cross-origin",
    () => expectCrossOriginBlocked({ pathname: "/api/leads/notes" }),
  ],
  [
    "pipeline update API blocks cross-origin",
    () => expectCrossOriginBlocked({ pathname: "/api/leads/pipeline/update-status" }),
  ],
  [
    "saved views API blocks cross-origin",
    () => expectCrossOriginBlocked({ pathname: "/api/leads/views" }),
  ],
  [
    "reminders API blocks cross-origin",
    () => expectCrossOriginBlocked({ pathname: "/api/reminders" }),
  ],
  [
    "tasks API blocks cross-origin",
    () => expectCrossOriginBlocked({ pathname: "/api/tasks" }),
  ],
  [
    "lead task API blocks cross-origin",
    () =>
      expectCrossOriginBlocked({
        pathname: "/api/leads/00000000-0000-0000-0000-000000000000/tasks",
      }),
  ],
  [
    "task complete API blocks cross-origin",
    () =>
      expectCrossOriginBlocked({
        pathname: "/api/tasks/00000000-0000-0000-0000-000000000000/complete",
      }),
  ],
  [
    "task snooze API blocks cross-origin",
    () =>
      expectCrossOriginBlocked({
        pathname: "/api/tasks/00000000-0000-0000-0000-000000000000/snooze",
      }),
  ],
  [
    "task cancel API blocks cross-origin",
    () =>
      expectCrossOriginBlocked({
        pathname: "/api/tasks/00000000-0000-0000-0000-000000000000/cancel",
      }),
  ],
  [
    "payment request API blocks cross-origin",
    () => expectCrossOriginBlocked({ pathname: "/api/payment-requests" }),
  ],
  [
    "payment request update API blocks cross-origin",
    () =>
      expectCrossOriginBlocked({
        method: "PATCH",
        pathname: "/api/payment-requests/00000000-0000-0000-0000-000000000000",
      }),
  ],
  [
    "admin payment API blocks cross-origin",
    () =>
      expectCrossOriginBlocked({
        pathname:
          "/api/admin/payments/00000000-0000-0000-0000-000000000000/cancel",
      }),
  ],
  [
    "billing create-payment API blocks cross-origin",
    () =>
      expectCrossOriginBlocked({
        pathname: "/api/billing/create-payment",
        body: { planId: "pro", provider: "manual_bank_transfer" },
      }),
  ],
  [
    "billing confirm-transfer API blocks cross-origin",
    () =>
      expectCrossOriginBlocked({
        pathname:
          "/api/billing/payments/00000000-0000-0000-0000-000000000000/confirm-transfer",
      }),
  ],
  [
    "billing cancel-payment API blocks cross-origin",
    () =>
      expectCrossOriginBlocked({
        pathname: "/api/billing/cancel-payment",
        body: { paymentId: "00000000-0000-0000-0000-000000000000" },
      }),
  ],
  [
    "payOS create-link API blocks cross-origin",
    () => expectCrossOriginBlocked({ pathname: "/api/payments/payos/create-link" }),
  ],
];

try {
  await startServerIfNeeded();
  console.log(`[smoke] Running ${tests.length} checks against ${BASE_URL}`);

  for (const [name, fn] of tests) {
    await runTest(name, fn);
  }

  console.log("[smoke] All checks passed.");
} catch (error) {
  console.error("[smoke] Failed.");
  console.error(error instanceof Error ? error.message : error);

  if (serverLogs.length > 0) {
    console.error("\n[smoke] Recent server logs:");
    console.error(serverLogs.slice(-25).join("\n"));
  }

  process.exitCode = 1;
} finally {
  stopServer();
}
