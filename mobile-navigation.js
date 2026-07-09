const $ = (selector, root = document) => root.querySelector(selector);
const MOBILE_BREAKPOINT = 980;

function isMobile() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function closeMenu() {
  const sidebar = $(".sidebar");
  const toggle = $("#mobile-menu-toggle");
  sidebar?.classList.remove("mobile-menu-open");
  toggle?.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
  const sidebar = $(".sidebar");
  const toggle = $("#mobile-menu-toggle");
  if (!sidebar || !toggle) return;
  const open = !sidebar.classList.contains("mobile-menu-open");
  sidebar.classList.toggle("mobile-menu-open", open);
  toggle.setAttribute("aria-expanded", String(open));
}

function injectStyles() {
  if ($("#ftc-responsive-navigation-style")) return;
  const style = document.createElement("style");
  style.id = "ftc-responsive-navigation-style";
  style.textContent = `
    /* Desktop: sidebar kiri selalu menetap di viewport dan menu tampil permanen */
    @media (min-width: 981px) {
      .dashboard-layout {
        align-items: start !important;
        height: 100vh !important;
        min-height: 100vh !important;
        overflow: hidden !important;
      }
      .sidebar {
        position: sticky !important;
        top: 0 !important;
        height: 100vh !important;
        min-height: 100vh !important;
        max-height: 100vh !important;
        overflow-y: auto !important;
        overscroll-behavior: contain !important;
      }
      .content-area {
        height: 100vh !important;
        min-height: 0 !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
      }
      .mobile-menu-toggle { display: none !important; }
      .compact-nav {
        position: static !important;
        display: grid !important;
        gap: 8px !important;
      }
      .compact-nav > .nav-dropdown-toggle { display: none !important; }
      .compact-nav > .nav-dropdown-menu {
        position: static !important;
        inset: auto !important;
        display: grid !important;
        gap: 6px !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        animation: none !important;
      }
      .compact-nav .nav-item {
        min-height: 44px !important;
        padding: 11px 12px !important;
        border-radius: 11px !important;
      }
      .sidebar > #logout-button { margin-top: auto !important; }
    }

    .mobile-menu-toggle {
      width: 46px;
      height: 46px;
      min-height: 46px;
      display: none;
      place-items: center;
      padding: 0;
      border: 1px solid rgba(150,165,210,.18);
      border-radius: 13px;
      color: var(--text);
      background: rgba(255,255,255,.035);
      transition: border-color .2s ease, background .2s ease;
    }
    .mobile-menu-toggle:hover {
      border-color: rgba(37,212,206,.45);
      background: rgba(37,212,206,.08);
    }
    .hamburger-lines { width: 20px; display: grid; gap: 4px; }
    .hamburger-lines span {
      display: block;
      width: 100%;
      height: 2px;
      border-radius: 999px;
      background: currentColor;
      transition: transform .2s ease, opacity .2s ease;
      transform-origin: center;
    }

    /* Mobile: header compact ala referensi + hamburger tiga strip */
    @media (max-width: 980px) {
      .dashboard-layout {
        display: block !important;
        min-height: 100vh !important;
      }
      .sidebar {
        position: sticky !important;
        top: 10px !important;
        z-index: 150 !important;
        min-height: auto !important;
        height: auto !important;
        max-height: calc(100vh - 20px) !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        align-items: center !important;
        gap: 10px 12px !important;
        margin: 10px 12px 0 !important;
        padding: 12px 14px !important;
        overflow-y: auto !important;
        border: 1px solid rgba(150,165,210,.18) !important;
        border-radius: 18px !important;
        background: rgba(12,14,30,.96) !important;
        box-shadow: 0 18px 55px rgba(0,0,0,.38) !important;
        backdrop-filter: blur(18px) !important;
      }
      .sidebar .brand-row { min-width: 0 !important; }
      .sidebar .brand-row > div:last-child { min-width: 0 !important; }
      .sidebar .brand-row strong,
      .sidebar .brand-row span {
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      .mobile-menu-toggle { display: grid !important; }
      .sidebar.mobile-menu-open .hamburger-lines span:nth-child(1) {
        transform: translateY(6px) rotate(45deg);
      }
      .sidebar.mobile-menu-open .hamburger-lines span:nth-child(2) { opacity: 0; }
      .sidebar.mobile-menu-open .hamburger-lines span:nth-child(3) {
        transform: translateY(-6px) rotate(-45deg);
      }
      .sidebar > .side-nav.compact-nav {
        grid-column: 1 / -1 !important;
        position: static !important;
        display: none !important;
        margin: 2px 0 0 !important;
        padding-top: 10px !important;
        border-top: 1px solid rgba(150,165,210,.14) !important;
      }
      .sidebar.mobile-menu-open > .side-nav.compact-nav { display: grid !important; }
      .compact-nav > .nav-dropdown-toggle { display: none !important; }
      .compact-nav > .nav-dropdown-menu {
        position: static !important;
        inset: auto !important;
        display: grid !important;
        gap: 5px !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        animation: none !important;
      }
      .compact-nav .nav-item {
        min-height: 44px !important;
        padding: 11px 12px !important;
        border-radius: 11px !important;
      }
      .sidebar > #logout-button {
        grid-column: 1 / -1 !important;
        display: none !important;
        margin-top: 0 !important;
      }
      .sidebar.mobile-menu-open > #logout-button { display: flex !important; }
      .content-area {
        padding-top: 18px !important;
        overflow: visible !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureToggle() {
  const sidebar = $(".sidebar");
  if (!sidebar || $("#mobile-menu-toggle")) return;
  const button = document.createElement("button");
  button.id = "mobile-menu-toggle";
  button.className = "mobile-menu-toggle";
  button.type = "button";
  button.setAttribute("aria-label", "Buka menu navigasi");
  button.setAttribute("aria-expanded", "false");
  button.innerHTML = '<span class="hamburger-lines" aria-hidden="true"><span></span><span></span><span></span></span>';
  const nav = $(".side-nav", sidebar);
  nav ? sidebar.insertBefore(button, nav) : sidebar.appendChild(button);
}

function bindEvents() {
  if (document.body.dataset.ftcMobileNavBound === "1") return;
  document.body.dataset.ftcMobileNavBound = "1";

  document.addEventListener("click", (event) => {
    if (event.target.closest("#mobile-menu-toggle")) {
      event.preventDefault();
      event.stopPropagation();
      toggleMenu();
      return;
    }
    if (isMobile() && event.target.closest(".nav-item[data-section]")) {
      closeMenu();
    }
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) closeMenu();
  });
}

function boot() {
  injectStyles();
  ensureToggle();
  bindEvents();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
setTimeout(boot, 500);
setTimeout(boot, 1200);
setInterval(ensureToggle, 1800);
