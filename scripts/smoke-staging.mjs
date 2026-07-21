const DEFAULT_BASE_URL = "http://localhost:3013";

const baseUrl = normalizeBaseUrl(
  process.argv[2] || process.env.STAGING_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_BASE_URL,
);
const vercelBypassSecret =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET || process.env.VERCEL_PROTECTION_BYPASS || "";

const requiredPublicRoutes = [
  "/",
  "/login",
  "/register",
  "/cam-on",
  "/status",
  "/chinh-sach-bao-mat",
  "/dieu-khoan-su-dung",
  "/manifest.webmanifest",
  "/sw.js",
  "/offline.html",
];

const optionalPublicRoutes = ["/pricing", "/privacy", "/terms", "/beta-status"];

const protectedRoutes = [
  "/app/dashboard",
  "/app/leads",
  "/app/reminders",
  "/app/templates",
  "/app/discover",
  "/app/import",
  "/app/export",
  "/app/pipeline",
  "/app/leads/views",
  "/app/analytics",
  "/app/settings",
];

const adminRoutes = [
  "/admin",
  "/admin/users",
  "/admin/beta-signups",
  "/admin/feedback",
  "/admin/usage",
  "/admin/imports",
  "/admin/data-quality",
  "/admin/lead-views",
  "/admin/sales-analytics",
];

const requiredSecurityHeaders = [
  "content-security-policy",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
];

const failures = [];
const warnings = [];

console.log(`SaleMap staging smoke test: ${baseUrl}`);
console.log("");

await runSection("Public routes", requiredPublicRoutes, checkPublicRoute);
await runSection("Optional public routes", optionalPublicRoutes, checkOptionalRoute);
await runSection("Protected app routes", protectedRoutes, checkProtectedRoute);
await runSection("Admin routes", adminRoutes, checkProtectedRoute);
await checkSecurityHeaders();
await checkManifest();

console.log("");

if (warnings.length > 0) {
  console.log("Warnings:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
  console.log("");
}

if (failures.length > 0) {
  console.error("Smoke test failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("Smoke test passed.");
}

function normalizeBaseUrl(value) {
  try {
    const parsed = new URL(value);
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    console.error(`Invalid staging URL: ${value}`);
    process.exit(1);
  }
}

async function runSection(label, routes, checker) {
  console.log(label);
  for (const route of routes) {
    await checker(route);
  }
  console.log("");
}

async function fetchRoute(route) {
  const url = new URL(route, baseUrl);
  return fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: {
      "User-Agent": "SaleMap-Staging-Smoke-Test/1.0",
      ...(vercelBypassSecret
        ? {
            "x-vercel-protection-bypass": vercelBypassSecret,
          }
        : {}),
    },
  });
}

async function checkPublicRoute(route) {
  try {
    const response = await fetchRoute(route);
    const location = response.headers.get("location") || "";
    if (isVercelSsoRedirect(location)) {
      failures.push(
        `${route} is blocked by Vercel Deployment Protection. Disable protection for staging or set VERCEL_AUTOMATION_BYPASS_SECRET.`,
      );
      console.log(`  FAIL ${route} -> Vercel SSO`);
      return;
    }

    if (response.status >= 200 && response.status < 400) {
      console.log(`  OK ${route} -> ${response.status}`);
      return;
    }

    failures.push(`${route} returned ${response.status}, expected 2xx/3xx.`);
    console.log(`  FAIL ${route} -> ${response.status}`);
  } catch (error) {
    failures.push(`${route} failed: ${getErrorMessage(error)}`);
    console.log(`  FAIL ${route}`);
  }
}

async function checkOptionalRoute(route) {
  try {
    const response = await fetchRoute(route);
    const location = response.headers.get("location") || "";
    if (isVercelSsoRedirect(location)) {
      warnings.push(
        `${route} is blocked by Vercel Deployment Protection. Optional route was not checked.`,
      );
      console.log(`  WARN ${route} -> Vercel SSO`);
      return;
    }

    if (response.status === 404) {
      console.log(`  SKIP ${route} -> 404`);
      return;
    }

    if (response.status >= 200 && response.status < 400) {
      console.log(`  OK ${route} -> ${response.status}`);
      return;
    }

    warnings.push(`${route} returned ${response.status}. Optional route may need a friendly fallback.`);
    console.log(`  WARN ${route} -> ${response.status}`);
  } catch (error) {
    warnings.push(`${route} failed: ${getErrorMessage(error)}`);
    console.log(`  WARN ${route}`);
  }
}

async function checkProtectedRoute(route) {
  try {
    const response = await fetchRoute(route);
    const location = response.headers.get("location") || "";

    if (isVercelSsoRedirect(location)) {
      failures.push(
        `${route} is blocked by Vercel Deployment Protection. Smoke test cannot verify app auth redirects until staging is accessible.`,
      );
      console.log(`  FAIL ${route} -> Vercel SSO`);
      return;
    }

    if (response.status >= 300 && response.status < 400 && location.includes("/login")) {
      console.log(`  OK ${route} -> ${response.status} ${location}`);
      return;
    }

    if (response.status === 401 || response.status === 403) {
      console.log(`  OK ${route} -> ${response.status}`);
      return;
    }

    failures.push(`${route} returned ${response.status}; expected redirect to /login, 401, or 403 for signed-out user.`);
    console.log(`  FAIL ${route} -> ${response.status}`);
  } catch (error) {
    failures.push(`${route} failed: ${getErrorMessage(error)}`);
    console.log(`  FAIL ${route}`);
  }
}

async function checkSecurityHeaders() {
  console.log("Security headers");

  try {
    const response = await fetchRoute("/");
    const location = response.headers.get("location") || "";
    if (isVercelSsoRedirect(location)) {
      failures.push("Security headers could not be verified because Vercel Deployment Protection intercepted /.");
      console.log("  FAIL blocked by Vercel SSO");
      console.log("");
      return;
    }

    for (const header of requiredSecurityHeaders) {
      if (response.headers.has(header)) {
        console.log(`  OK ${header}`);
      } else {
        failures.push(`Missing security header: ${header}`);
        console.log(`  FAIL ${header}`);
      }
    }

    if (baseUrl.startsWith("https://") && !response.headers.has("strict-transport-security")) {
      warnings.push("Missing strict-transport-security on HTTPS staging URL.");
      console.log("  WARN strict-transport-security");
    }
  } catch (error) {
    failures.push(`Security header check failed: ${getErrorMessage(error)}`);
    console.log("  FAIL security headers");
  }

  console.log("");
}

async function checkManifest() {
  console.log("PWA manifest");

  try {
    const response = await fetchRoute("/manifest.webmanifest");
    const location = response.headers.get("location") || "";
    if (isVercelSsoRedirect(location)) {
      failures.push("Manifest could not be verified because Vercel Deployment Protection intercepted /manifest.webmanifest.");
      console.log("  FAIL manifest -> Vercel SSO");
      console.log("");
      return;
    }

    if (!response.ok) {
      failures.push(`Manifest returned ${response.status}.`);
      console.log(`  FAIL manifest -> ${response.status}`);
      console.log("");
      return;
    }

    const manifest = await response.json();
    const requiredFields = ["name", "short_name", "start_url", "display", "icons"];

    for (const field of requiredFields) {
      if (manifest[field]) {
        console.log(`  OK ${field}`);
      } else {
        failures.push(`Manifest missing field: ${field}`);
        console.log(`  FAIL ${field}`);
      }
    }

    if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
      failures.push("Manifest icons must include at least one icon.");
    }
  } catch (error) {
    failures.push(`Manifest check failed: ${getErrorMessage(error)}`);
    console.log("  FAIL manifest");
  }

  console.log("");
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function isVercelSsoRedirect(location) {
  return location.includes("vercel.com/sso-api");
}
