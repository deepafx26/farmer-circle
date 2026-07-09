import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
let clientPromise;

async function supabaseClient() {
  if (clientPromise) return clientPromise;
  clientPromise = fetch(`./app.js?v=${Date.now()}`, { cache: "no-store" })
    .then((r) => r.text())
    .then((src) => {
      const url = src.match(/const\s+SUPABASE_URL\s*=\s*"([^"]+)"/)?.[1];
      const key = src.match(/const\s+SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/)?.[1];
      if (!url || !key) throw new Error("Konfigurasi Supabase tidak ditemukan.");
      return createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    });
  return clientPromise;
}

function esc(v = "") {
  const d = document.createElement("div");
  d.textContent = v ?? "";
  return d.innerHTML;
}

function todayLocalInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function injectStyle() {
  if ($("#attendance-style")) return;
  const st = document.createElement("style");
  st.id = "attendance-style";
  st.textContent = `
    @media (min-width: 781px) {
      .dashboard-layout { align-items: start !important; height: 100vh !important; min-height: 100vh !important; overflow: hidden !important; }
      .sidebar { position: sticky !important; top: 0 !important; height: 100vh !important; max-height: 100vh !important; overflow: auto !important; }
      .content-area { height: 100vh !important; min-height: 0 !important; overflow-x: hidden !important; overflow-y: auto !important; }
      .sidebar .ghost-button { position: sticky; bottom: 0; margin-top: auto; }
    }
    .attendance-wrap { display: grid; gap: 22px; }
    .attendance-hero, .attendance-card { border: 1px solid var(--line); border-radius: 16px; background: rgba(16,22,42,.74); box-shadow: var(--shadow); }
    .attendance-hero { display:flex; justify-content:space-between; gap:18px; padding:22px; background:linear-gradient(135deg,rgba(117,92,246,.14),rgba(37,212,206,.08)); }
    .attendance-hero p { margin: 8px 0 0; color: var(--muted); line-height: 1.65; }
    .attendance-badge { align-self:flex-start; padding:9px 12px; border:1px solid rgba(37,212,206,.24); border-radius:999px; color:var(--cyan); background:rgba(37,212,206,.08); font-family:"JetBrains Mono",monospace; font-size:.7rem; font-weight:900; text-transform:uppercase; letter-spacing:.12em; white-space:nowrap; }
    .attendance-grid { display:grid; grid-template-columns:minmax(320px,440px) minmax(0,1fr); gap:22px; align-items:start; }
    .attendance-card { padding:20px; }
    .attendance-form { display:grid; gap:16px; }
    .attendance-upload { min-height:120px; display:grid; place-items:center; gap:6px; padding:18px; border:1px dashed rgba(37,212,206,.35); border-radius:13px; background:rgba(255,255,255,.035); text-align:center; cursor:pointer; }
    .attendance-upload:hover { border-color:rgba(198,255,0,.55); background:rgba(198,255,0,.045); }
    .attendance-upload i { color:#c6ff00; filter:drop-shadow(0 0 12px rgba(198,255,0,.4)); }
    .attendance-upload b { color:var(--text); text-transform:uppercase; }
    .attendance-upload small { color:var(--muted); line-height:1.45; }
    .attendance-actions { display:flex; gap:12px; flex-wrap:wrap; }
    .attendance-actions .primary-button, .attendance-actions .ghost-button { width:auto; flex:1 1 190px; }
    .attendance-list { display:grid; gap:12px; max-height:640px; overflow:auto; padding-right:4px; }
    .attendance-item { padding:14px; border:1px solid var(--line); border-radius:13px; background:rgba(255,255,255,.035); }
    .attendance-item strong { display:block; margin-bottom:4px; }
    .attendance-item span, .attendance-item small { color:var(--muted); }
    .attendance-item a { color:var(--cyan); font-weight:800; }
    @media(max-width:900px){ .attendance-grid, .attendance-hero { grid-template-columns:1fr; display:grid; } .attendance-badge{white-space:normal;} }
  `;
  document.head.appendChild(st);
}

function addNavButton() {
  const menu = $(".nav-dropdown-menu") || $(".side-nav");
  if (!menu || $("[data-section='attendance-section']", menu)) return;
  const btn = document.createElement("button");
  btn.className = "nav-item";
  btn.type = "button";
  btn.dataset.section = "attendance-section";
  btn.dataset.label = "Absensi Pembelajaran";
  btn.dataset.icon = "clipboard-check";
  btn.innerHTML = '<i data-lucide="clipboard-check"></i><span>Absensi</span>';
  const before = $("[data-section='calendar-section']", menu);
  before ? menu.insertBefore(btn, before) : menu.appendChild(btn);
}

function sectionHTML() {
  return `<section id="attendance-section" class="workspace-section hidden">
    <div class="attendance-wrap">
      <div class="attendance-hero"><div><p class="eyebrow small-eyebrow">Learning Attendance</p><h3>Absensi Pembelajaran</h3><p>Member tinggal klik absen, isi materi/sesi, lalu upload screenshot bukti ikut pembelajaran. Data disiapkan agar mudah diekspor ke Excel.</p></div><div class="attendance-badge">Excel Ready CSV</div></div>
      <div class="attendance-grid">
        <form id="attendance-form" class="attendance-card attendance-form" novalidate>
          <div class="section-heading"><h3>Form Absen Member</h3><span class="mini-label">Bukti wajib</span></div>
          <label><span>Materi / Kelas</span><input id="attendance-topic" maxlength="120" placeholder="Contoh: Candlestick Pattern - Sesi 1" required></label>
          <label><span>Waktu Pembelajaran</span><input id="attendance-time" type="datetime-local" required></label>
          <label><span>Catatan</span><textarea id="attendance-note" rows="4" maxlength="400" placeholder="Opsional: ringkasan materi / kendala"></textarea></label>
          <label class="attendance-upload" for="attendance-proof"><i data-lucide="image-up"></i><b>Upload Screenshot Bukti</b><small>PNG, JPG, atau WebP. Screenshot akan disimpan sebagai bukti absen.</small></label>
          <input id="attendance-proof" type="file" accept="image/png,image/jpeg,image/webp" required>
          <p id="attendance-message" class="form-message"></p><p id="attendance-error" class="form-error"></p>
          <div class="attendance-actions"><button class="primary-button" type="submit"><i data-lucide="check-circle-2"></i><span>Absen Sekarang</span></button><button id="attendance-export" class="ghost-button" type="button"><i data-lucide="file-spreadsheet"></i><span>Export CSV</span></button></div>
        </form>
        <div class="attendance-card"><div class="section-heading"><h3>Riwayat Absensi</h3><button id="attendance-refresh" class="icon-button" type="button" aria-label="Refresh"><i data-lucide="refresh-cw"></i></button></div><div id="attendance-list" class="attendance-list"><div class="empty-state">Belum ada data absensi.</div></div></div>
      </div>
    </div>
  </section>`;
}

function injectSection() {
  const area = $(".content-area");
  if (!area || $("#attendance-section")) return;
  area.insertAdjacentHTML("beforeend", sectionHTML());
  const time = $("#attendance-time");
  if (time && !time.value) time.value = todayLocalInput();
}

function switchSection(id) {
  $$(".workspace-section").forEach((s) => s.classList.toggle("hidden", s.id !== id));
  $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.section === id));
  const active = $(`[data-section='${id}']`);
  const label = id === "attendance-section" ? "Absensi Pembelajaran" : active?.dataset.label || "Dashboard";
  if ($("#welcome-title")) $("#welcome-title").textContent = label;
  if ($("#active-nav-label")) $("#active-nav-label").textContent = label;
  $(".compact-nav")?.classList.remove("open");
  window.lucide?.createIcons();
}

function localRows() {
  try { return JSON.parse(localStorage.getItem("farmer_attendance_rows") || "[]"); } catch { return []; }
}

function saveLocal(row) {
  const rows = localRows();
  rows.unshift(row);
  localStorage.setItem("farmer_attendance_rows", JSON.stringify(rows.slice(0, 200)));
}

async function currentUser(client) {
  const { data } = await client.auth.getSession();
  return data.session?.user || null;
}

async function uploadProof(client, user, file) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safe = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const path = `${user.id}/${Date.now()}-attendance.${safe}`;
  const { error } = await client.storage.from("attendance-proofs").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw new Error(`Upload bukti gagal: ${error.message}. Pastikan bucket attendance-proofs sudah dibuat.`);
  const { data } = client.storage.from("attendance-proofs").getPublicUrl(path);
  return { path, url: data.publicUrl };
}

async function saveAttendance(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  const msg = $("#attendance-message"), err = $("#attendance-error");
  if (msg) msg.textContent = "";
  if (err) err.textContent = "";
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const button = form.querySelector("button[type='submit']");
  const label = button?.querySelector("span");
  if (button) button.disabled = true;
  if (label) label.textContent = "Menyimpan...";
  try {
    const client = await supabaseClient();
    const user = await currentUser(client);
    if (!user) throw new Error("Session login tidak ditemukan. Login ulang dulu.");
    const meta = user.user_metadata || {};
    const file = $("#attendance-proof")?.files?.[0];
    if (!file) throw new Error("Screenshot bukti wajib diupload.");
    const proof = await uploadProof(client, user, file);
    const row = { user_id: user.id, email: user.email || "", full_name: meta.full_name || user.email?.split("@")[0] || "Member", topic: $("#attendance-topic").value.trim(), session_time: $("#attendance-time").value, note: $("#attendance-note").value.trim() || null, proof_url: proof.url, proof_path: proof.path, created_at: new Date().toISOString() };
    const insert = await client.from("learning_attendance").insert(row);
    if (insert.error) throw new Error(`Data bukti sudah upload, tapi tabel learning_attendance belum siap: ${insert.error.message}`);
    saveLocal(row);
    if (msg) msg.textContent = "Absensi berhasil disimpan.";
    form.reset();
    $("#attendance-time").value = todayLocalInput();
    await renderAttendance();
  } catch (e) {
    if (err) err.textContent = e.message || "Gagal menyimpan absensi.";
  } finally {
    if (button) button.disabled = false;
    if (label) label.textContent = "Absen Sekarang";
  }
}

function renderRows(rows) {
  const list = $("#attendance-list");
  if (!list) return;
  if (!rows.length) { list.innerHTML = '<div class="empty-state">Belum ada data absensi.</div>'; return; }
  list.innerHTML = rows.map((r) => `<article class="attendance-item"><strong>${esc(r.topic || "Pembelajaran")}</strong><span>${esc(r.full_name || r.email || "Member")} · ${esc(r.session_time || r.created_at || "-")}</span>${r.note ? `<small><br>${esc(r.note)}</small>` : ""}${r.proof_url ? `<br><a href="${esc(r.proof_url)}" target="_blank" rel="noopener">Lihat bukti screenshot</a>` : ""}</article>`).join("");
}

async function renderAttendance() {
  try {
    const client = await supabaseClient();
    const { data, error } = await client.from("learning_attendance").select("*").order("created_at", { ascending: false }).limit(80);
    if (error) return renderRows(localRows());
    renderRows(data || []);
  } catch { renderRows(localRows()); }
}

function exportCSV() {
  const rows = localRows();
  const header = ["created_at", "session_time", "full_name", "email", "topic", "note", "proof_url"];
  const csv = [header.join(","), ...rows.map((r) => header.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `absensi-pembelajaran-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function bind() {
  if (document.body.dataset.attendanceBind === "1") return;
  document.body.dataset.attendanceBind = "1";
  document.addEventListener("click", (e) => {
    const nav = e.target.closest(".nav-item[data-section='attendance-section']");
    if (nav) { e.preventDefault(); switchSection("attendance-section"); renderAttendance(); }
    if (e.target.closest("#attendance-refresh")) renderAttendance();
    if (e.target.closest("#attendance-export")) exportCSV();
  }, true);
  document.addEventListener("submit", (e) => { if (e.target?.id === "attendance-form") saveAttendance(e); }, true);
}

function boot() {
  injectStyle(); addNavButton(); injectSection(); bind(); renderAttendance(); window.lucide?.createIcons();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
setTimeout(boot, 700); setTimeout(boot, 1600); setInterval(() => { addNavButton(); injectSection(); }, 1800);
