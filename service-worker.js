const CACHE_NAME = "m62-public-v1";

const STATIC_ALLOWLIST = [
    "/offline.html",
    "/manifest.webmanifest",
    "/assets/icons/pwa-192.png",
    "/assets/icons/pwa-512.png",
    "/assets/icons/pwa-512-maskable.png"
];

const OFFLINE_NAV_ALLOWLIST = new Set([
    "/",
    "/index.html",
    "/about.html",
    "/faq.html",
    "/privacy.html"
]);

const EXACT_DENY_PATHS = new Set([
    "/admin",
    "/admin/",
    "/api",
    "/api/",
    "/login",
    "/login.html",
    "/dashboard.html",
    "/news.html",
    "/videos.html",
    "/livetv.html",
    "/comments.html",
    "/users.html",
    "/statistics.html",
    "/settings.html"
]);

function normalizePath(pathname) {
    if (!pathname) {
        return "/";
    }

    if (pathname.length > 1 && pathname.endsWith("/")) {
        return pathname.replace(/\/+$/, "/");
    }

    return pathname;
}

function isDeniedRequest(request, url) {
    if (request.method !== "GET") {
        return true;
    }

    if (request.headers.has("Authorization") || request.headers.has("authorization")) {
        return true;
    }

    if (request.headers.has("x-admin-key")) {
        return true;
    }

    const path = normalizePath(url.pathname);

    if (path.startsWith("/admin/")) {
        return true;
    }

    if (path.startsWith("/api/")) {
        return true;
    }

    if (EXACT_DENY_PATHS.has(path)) {
        return true;
    }

    return false;
}

function canCacheResponse(response) {
    return Boolean(response) && response.ok && response.status < 400;
}

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ALLOWLIST))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => {
                if (key.startsWith("m62-public-") && key !== CACHE_NAME) {
                    return caches.delete(key);
                }
                return Promise.resolve(false);
            })
        ))
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    if (isDeniedRequest(request, url)) {
        return;
    }

    const path = normalizePath(url.pathname);
    const isNavigation = request.mode === "navigate";

    if (isNavigation) {
        if (!OFFLINE_NAV_ALLOWLIST.has(path)) {
            return;
        }

        event.respondWith((async () => {
            try {
                const networkResponse = await fetch(request);
                return networkResponse;
            } catch (error) {
                const cache = await caches.open(CACHE_NAME);
                const offlinePage = await cache.match("/offline.html");
                return offlinePage || Response.error();
            }
        })());
        return;
    }

    if (!STATIC_ALLOWLIST.includes(path)) {
        return;
    }

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);

        const networkPromise = fetch(request)
            .then((response) => {
                if (canCacheResponse(response)) {
                    cache.put(request, response.clone());
                }
                return response;
            })
            .catch(() => null);

        if (cached) {
            return cached;
        }

        const networkResponse = await networkPromise;
        return networkResponse || Response.error();
    })());
});
