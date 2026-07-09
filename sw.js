const FTC_SW_VERSION = "20260708-absensi-static-section";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const freshAsset =
    request.mode === "navigate" ||
    ["script", "style", "worker", "sharedworker"].includes(request.destination);

  if (!freshAsset) return;

  event.respondWith(
    fetch(new Request(request, { cache: "no-store" })).catch(() => fetch(request))
  );
});
