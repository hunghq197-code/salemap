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
    addFinding(relPath, "Required Phase 2E2 file is missing.");
  }
}

function mustContain(relPath, needle, message) {
  const content = read(relPath);

  if (!content.includes(needle)) {
    addFinding(relPath, message || `Expected to include: ${needle}`);
  }
}

function mustNotMatch(relPath, pattern, message) {
  const content = read(relPath);

  if (pattern.test(content)) {
    addFinding(relPath, message || `Unexpected match: ${pattern}`);
  }
}

function mustContainInOrder(relPath, needles, message) {
  const content = read(relPath);
  let cursor = -1;

  needles.forEach((needle) => {
    const nextIndex = content.indexOf(needle, cursor + 1);

    if (nextIndex === -1) {
      addFinding(relPath, message || `Missing ordered item: ${needle}`);
      return;
    }

    if (nextIndex < cursor) {
      addFinding(relPath, message || `Out of order item: ${needle}`);
      return;
    }

    cursor = nextIndex;
  });
}

function checkRequiredFiles() {
  [
    "ADMIN_CRM_CATALOG_TICKETS_CMS_AUDIT.md",
    "PRICING_AND_FEATURE_PACK_RECOMMENDATION.md",
    "ADMIN_CRM_SUBPHASE_B_REPORT.md",
    "ORDERS_CATALOG_SUBPHASE_C_REPORT.md",
    "SUPPORT_TICKETS_SUBPHASE_D_REPORT.md",
    "SEO_CMS_SUBPHASE_E_REPORT.md",
    "supabase/admin-customer-crm.sql",
    "supabase/orders-product-catalog.sql",
    "supabase/support-tickets.sql",
    "supabase/seo-cms.sql",
    "app/admin/customers/page.tsx",
    "app/admin/customers/[userId]/page.tsx",
    "app/admin/catalog/page.tsx",
    "app/admin/orders/page.tsx",
    "app/admin/orders/[orderId]/page.tsx",
    "app/admin/tickets/page.tsx",
    "app/admin/tickets/[ticketId]/page.tsx",
    "app/admin/cms/page.tsx",
    "app/admin/cms/posts/page.tsx",
    "app/admin/cms/posts/new/page.tsx",
    "app/admin/cms/posts/[postId]/page.tsx",
    "app/admin/cms/pages/page.tsx",
    "app/admin/cms/categories/page.tsx",
    "app/admin/cms/tags/page.tsx",
    "app/admin/cms/media/page.tsx",
    "app/admin/cms/redirects/page.tsx",
    "app/app/billing/add-ons/page.tsx",
    "app/app/billing/orders/page.tsx",
    "app/app/support/tickets/page.tsx",
    "app/app/support/tickets/[ticketId]/page.tsx",
    "app/blog/page.tsx",
    "app/blog/[slug]/page.tsx",
    "app/rss.xml/route.ts",
    "app/api/cron/cms-publish/route.ts",
  ].forEach(mustExist);
}

function checkMigrationSetupOrder() {
  mustContainInOrder(
    "SUPABASE_SQL_SETUP.md",
    [
      "28. `supabase/admin-customer-crm.sql`",
      "29. `supabase/orders-product-catalog.sql`",
      "30. `supabase/support-tickets.sql`",
      "31. `supabase/seo-cms.sql`",
    ],
    "Phase 2E2 SQL files must be listed in setup order 28-31.",
  );
}

function checkNoBroadRlsPolicies() {
  [
    "supabase/admin-customer-crm.sql",
    "supabase/orders-product-catalog.sql",
    "supabase/support-tickets.sql",
    "supabase/seo-cms.sql",
  ].forEach((relPath) => {
    mustNotMatch(relPath, /\busing\s*\(\s*true\s*\)/i, "New Phase 2E2 RLS must not use `using (true)`.");
    mustNotMatch(
      relPath,
      /\bwith\s+check\s*\(\s*true\s*\)/i,
      "New Phase 2E2 RLS must not use `with check (true)`.",
    );
  });
}

function checkAdminCrmPrivacy() {
  mustContain("supabase/admin-customer-crm.sql", "visibility = 'internal'");
  mustContain("supabase/admin-customer-crm.sql", "customer_tags_color_token_check");
  mustContain("supabase/admin-customer-crm.sql", "alter table public.customer_notes enable row level security");
  mustContain("lib/validators/customer-admin.ts", "customerLifecycleValues");
  mustContain("lib/validators/customer-admin.ts", "customerColorTokenValues");
  mustContain("lib/admin/data/customers.ts", 'getCountsByUser("leads"');
  mustNotMatch(
    "lib/admin/data/customers.ts",
    /from\("leads"\)[\s\S]{0,220}\b(phone|email|address|note|content)\b/i,
    "Admin CRM must not select private lead PII/content from user leads.",
  );
}

function checkOrdersAndEntitlements() {
  mustContain("supabase/orders-product-catalog.sql", "amount = 0 or amount >= 50000");
  mustContain("supabase/orders-product-catalog.sql", "total_amount = 0 or total_amount >= 50000");
  mustContain("supabase/orders-product-catalog.sql", "alter table public.orders enable row level security");
  mustContain("supabase/orders-product-catalog.sql", "Users can view own orders");
  mustContain("supabase/orders-product-catalog.sql", "Users can view own entitlement grants");
  mustContain("lib/orders/order-status.ts", "isValidOrderTransition");
  mustContain("lib/orders/orders.ts", "const MIN_PAID_ORDER_AMOUNT = 50000");
  mustContain("lib/orders/orders.ts", "isValidOrderTransition");
  mustContain("lib/orders/orders.ts", "idempotency_key: `order_item:${item.id}:${featureKey}`");
  mustContain("lib/validators/orders.ts", "priceId: z.string().uuid()");
  mustNotMatch(
    "lib/validators/orders.ts",
    /\b(amount|discount|totalAmount|entitlement)\s*:/,
    "Add-on order creation schema must not accept client amount, discount, total, or entitlement.",
  );
}

function checkTickets() {
  mustContain("supabase/support-tickets.sql", "visibility in ('public', 'internal')");
  mustContain("supabase/support-tickets.sql", "Users can view own support tickets");
  mustContain("supabase/support-tickets.sql", "Users can view public messages on own tickets");
  mustContain("supabase/support-tickets.sql", "visibility = 'public'");
  mustContain("supabase/support-tickets.sql", "is_admin_user(array['super_admin','admin','support'])");
  mustContain("lib/validators/tickets.ts", "description: z.string().trim().min(10).max(4000)");
  mustContain("lib/validators/tickets.ts", "visibility: z.enum(ticketVisibilityValues)");
  mustContain("lib/tickets/tickets.ts", "bodyLength");
}

function checkCmsSecurityAndSeo() {
  mustContain("supabase/seo-cms.sql", "status in ('draft', 'review', 'scheduled', 'published', 'archived')");
  mustContain("supabase/seo-cms.sql", "Public can view published cms posts");
  mustContain("supabase/seo-cms.sql", "and noindex = false");
  mustContain("supabase/seo-cms.sql", "and published_at <= now()");
  mustContain("supabase/seo-cms.sql", "cms_media_mime_check");
  mustNotMatch("supabase/seo-cms.sql", /image\/svg\+xml/i, "CMS media SQL must not allow SVG uploads.");
  mustContain("supabase/seo-cms.sql", "cms_redirects_no_loop_check");
  mustContain("lib/cms/sanitize-content.ts", '"script"');
  mustContain("lib/cms/sanitize-content.ts", '"iframe"');
  mustContain("lib/validators/cms.ts", "sanitizeCmsText");
  mustContain("lib/validators/cms.ts", "regex(/^\\/[a-z0-9][a-z0-9/_-]*$/)");
  mustContain("app/sitemap.ts", "getPublishedCmsSitemapEntries");
  mustContain("app/blog/[slug]/page.tsx", "application/ld+json");
  mustContain("app/blog/[slug]/page.tsx", "JSON.stringify(jsonLd)");
  mustContain("app/[...path]/page.tsx", "getCmsRedirectForPath");
  mustContain("app/[...path]/page.tsx", "getPublishedPageBySlug");
  mustContain("app/rss.xml/route.ts", "application/rss+xml");
  mustContain("app/api/cron/cms-publish/route.ts", "CRON_SECRET");
  mustContain("app/api/cron/cms-publish/route.ts", 'headers.get("authorization")');
  mustNotMatch(
    "app/blog/page.tsx",
    /eslint-disable\s+@next\/next\/no-img-element/,
    "Blog page must not disable the Next image lint rule.",
  );
  mustNotMatch(
    "app/blog/[slug]/page.tsx",
    /eslint-disable\s+@next\/next\/no-img-element/,
    "Blog detail page must not disable the Next image lint rule.",
  );
}

function checkPermissions() {
  const permissions = read("lib/admin/admin-permissions.ts");
  const supportBlock = permissions.match(/support:\s*new Set\(\[([\s\S]*?)\]\),/)?.[1] || "";

  [
    "VIEW_CUSTOMERS",
    "VIEW_CUSTOMER_DETAIL",
    "MANAGE_CUSTOMER_LIFECYCLE",
    "MANAGE_CUSTOMER_NOTES",
    "MANAGE_CUSTOMER_TAGS",
    "VIEW_CATALOG",
    "MANAGE_CATALOG",
    "VIEW_ORDERS",
    "MANAGE_ORDERS",
    "VIEW_TICKETS",
    "MANAGE_TICKETS",
    "VIEW_CMS",
    "MANAGE_CMS",
  ].forEach((permission) => {
    if (!permissions.includes(permission)) {
      addFinding("lib/admin/admin-permissions.ts", `Missing admin permission ${permission}.`);
    }
  });

  [
    "MANAGE_CATALOG",
    "MANAGE_CMS",
    "MANAGE_ORDERS",
    "UPDATE_PAYMENT_STATUS",
    "UPDATE_SUBSCRIPTION",
    "VIEW_CMS",
  ].forEach((permission) => {
    if (supportBlock.includes(permission)) {
      addFinding("lib/admin/admin-permissions.ts", `Support role must not include ${permission}.`);
    }
  });
}

function checkSmokeCoverage() {
  mustContain("scripts/smoke.mjs", "blog page renders");
  mustContain("scripts/smoke.mjs", "RSS feed renders");
  mustContain("scripts/smoke.mjs", "CMS publish cron requires secret");
  mustContain("scripts/smoke.mjs", "support ticket create API blocks cross-origin");
  mustContain("scripts/smoke.mjs", "admin customer API blocks cross-origin");
}

checkRequiredFiles();
checkMigrationSetupOrder();
checkNoBroadRlsPolicies();
checkAdminCrmPrivacy();
checkOrdersAndEntitlements();
checkTickets();
checkCmsSecurityAndSeo();
checkPermissions();
checkSmokeCoverage();

if (findings.length > 0) {
  console.error("PHASE 2E2 REGRESSION FAIL");
  findings.forEach((finding) => {
    console.error(`${finding.scope}: ${finding.message}`);
  });
  process.exit(1);
}

console.log("PHASE 2E2 REGRESSION PASS");
