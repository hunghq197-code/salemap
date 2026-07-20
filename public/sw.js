const CACHE_NAME = "salemap-app-shell-v1";
const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "0.0.0.0"];
const IS_LOCALHOST = LOCAL_HOSTNAMES.includes(self.location.hostname);

const APP_SHELL_URLS = [
  "/",
  "/app/dashboard",
  "/app/pipeline",
  "/app/analytics",
  "/app/analytics/goals",
  "/app/leads",
  "/app/leads/views",
  "/app/leads/cleanup",
  "/app/leads/cleanup/duplicates",
  "/app/leads/cleanup/quality",
  "/app/leads/bulk-actions",
  "/app/reminders",
  "/app/templates",
  "/app/import",
  "/app/settings",
  "/app/install",
  "/app/offline",
  "/beta-status",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-icon-192.png",
  "/icons/maskable-icon-512.png",
];

if (IS_LOCALHOST) {
  self.addEventListener("install", (event) => {
    event.waitUntil(clearSaleMapCaches());
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      clearSaleMapCaches()
        .then(() => self.registration.unregister())
        .then(() => self.clients.matchAll({ type: "window" }))
        .then((clients) => {
          clients.forEach((client) => client.navigate(client.url));
        }),
    );
  });

  self.addEventListener("fetch", () => {
    // Never intercept local development requests. Stale cached Next.js chunks
    // can otherwise cause hydration mismatches while iterating on UI.
  });
} else {

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function shouldSkip(request) {
  const url = new URL(request.url);

  if (request.method !== "GET") return true;
  if (!isSameOrigin(request)) return true;
  if (url.pathname.startsWith("/api")) return true;
  if (url.pathname.startsWith("/admin")) return true;
  if (url.pathname.startsWith("/app/billing/payment")) return true;
  if (url.pathname === "/login") return true;
  if (url.pathname === "/register") return true;
  if (url.pathname.startsWith("/_next/webpack-hmr")) return true;
  if (url.pathname.includes("webpack.hot-update")) return true;
  if (url.searchParams.has("__nextDataReq")) return true;

  return false;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(APP_SHELL_URLS.map((url) => cache.add(url)));
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "SALMAP_CLEAR_RUNTIME_CACHE" && event.data?.type !== "SALEMAP_CLEAR_RUNTIME_CACHE") {
    return;
  }

  event.waitUntil(caches.delete(CACHE_NAME));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (shouldSkip(request)) return;

  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
}

async function clearSaleMapCaches() {
  const keys = await caches.keys();

  await Promise.all(
    keys
      .filter((key) => key.startsWith("salemap-"))
      .map((key) => caches.delete(key)),
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);

  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }

  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
      const fallback = await caches.match("/offline.html");
      if (fallback) return fallback;
    }

    throw error;
  }
}
