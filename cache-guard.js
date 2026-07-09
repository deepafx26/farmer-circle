const FTC_CACHE_GUARD_VERSION = "20260708-absensi-static-section";
const RELOAD_FLAG = "ftc_sw_reload_once";

function refreshStylesheets() {
  document.querySelectorAll('link[rel="stylesheet"][href]').forEach((link) => {
    try {
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      url.searchParams.set("ftc_v", FTC_CACHE_GUARD_VERSION);
      url.searchParams.set("ftc_t", String(Date.now()));
      const fresh = link.cloneNode(true);
      fresh.href = url.toString();
      fresh.addEventListener("load", () => link.remove(), { once: true });
      link.after(fresh);
    } catch {
      // Abaikan stylesheet eksternal atau URL yang tidak valid.
    }
  });
}

async function installFreshnessGuard() {
  refreshStylesheets();

  if (!("serviceWorker" in navigator)) return;

  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading || sessionStorage.getItem(RELOAD_FLAG) === "1") return;
    reloading = true;
    sessionStorage.setItem(RELOAD_FLAG, "1");
    location.reload();
  });

  try {
    const registration = await navigator.serviceWorker.register("./sw.js", {
      scope: "./",
      updateViaCache: "none",
    });
    await registration.update();

    if (navigator.serviceWorker.controller) {
      sessionStorage.removeItem(RELOAD_FLAG);
    }
  } catch (error) {
    console.warn("FTC cache guard gagal aktif:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installFreshnessGuard, { once: true });
} else {
  installFreshnessGuard();
}
