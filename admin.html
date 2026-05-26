<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>📊 Admin — الدخيل</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@400;600;700;800&display=swap');

  :root {
    --bg:       #0a0a0b;
    --bg2:      #111114;
    --bg3:      #1a1a1f;
    --border:   rgba(255,255,255,0.07);
    --red:      #e74c3c;
    --red-dim:  rgba(231,76,60,0.15);
    --red-glow: rgba(231,76,60,0.35);
    --green:    #2ecc71;
    --blue:     #3498db;
    --yellow:   #f39c12;
    --text:     #e8e8ea;
    --muted:    rgba(232,232,234,0.45);
    --mono:     'JetBrains Mono', monospace;
    --display:  'Syne', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--display);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── Grid noise background ────────────── */
  body::before {
    content: '';
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(231,76,60,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(231,76,60,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  /* ══════════════════════════════════════
     LOGIN SCREEN
  ══════════════════════════════════════ */
  #login-screen {
    position: fixed; inset: 0; z-index: 100;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg);
  }

  .login-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 48px 40px;
    width: 100%; max-width: 400px;
    box-shadow: 0 0 60px rgba(231,76,60,0.08), 0 24px 60px rgba(0,0,0,0.5);
    position: relative;
    overflow: hidden;
  }
  .login-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--red), transparent);
  }

  .login-logo { font-size: 36px; text-align: center; margin-bottom: 8px; }

  .login-title {
    font-size: 20px; font-weight: 800; text-align: center;
    letter-spacing: -0.5px; margin-bottom: 4px;
  }
  .login-sub {
    font-size: 12px; color: var(--muted); text-align: center;
    font-family: var(--mono); margin-bottom: 32px;
  }

  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 11px; font-family: var(--mono);
    color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
  .field input {
    width: 100%; padding: 12px 14px;
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text);
    font-family: var(--mono); font-size: 14px;
    outline: none; transition: border-color 0.2s;
  }
  .field input:focus { border-color: var(--red); }

  .login-btn {
    width: 100%; padding: 13px;
    background: var(--red); border: none;
    border-radius: 8px; color: #fff;
    font-family: var(--display); font-size: 15px; font-weight: 700;
    cursor: pointer; transition: opacity 0.2s, transform 0.15s;
    margin-top: 8px;
  }
  .login-btn:hover { opacity: 0.9; }
  .login-btn:active { transform: scale(0.98); }
  .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .login-err {
    margin-top: 12px; font-size: 13px; color: var(--red);
    font-family: var(--mono); text-align: center; min-height: 20px;
  }

  /* ══════════════════════════════════════
     DASHBOARD
  ══════════════════════════════════════ */
  #dashboard { display: none; position: relative; z-index: 1; }

  /* ── Top bar ───────────────────────────────── */
  .topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 32px;
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
    position: sticky; top: 0; z-index: 50;
    backdrop-filter: blur(12px);
  }
  .topbar-left { display: flex; align-items: center; gap: 12px; }
  .topbar-logo { font-size: 22px; }
  .topbar-title { font-size: 18px; font-weight: 800; letter-spacing: -0.4px; }
  .topbar-tag {
    font-size: 10px; font-family: var(--mono); letter-spacing: 1.5px;
    padding: 3px 8px; border-radius: 4px;
    background: var(--red-dim); color: var(--red); border: 1px solid var(--red-glow);
  }

  .topbar-right { display: flex; align-items: center; gap: 16px; }
  .refresh-btn {
    padding: 7px 14px; background: var(--bg3); border: 1px solid var(--border);
    border-radius: 6px; color: var(--muted); font-family: var(--mono); font-size: 12px;
    cursor: pointer; transition: all 0.2s;
  }
  .refresh-btn:hover { border-color: var(--red); color: var(--text); }
  .logout-btn {
    padding: 7px 14px; background: var(--red-dim); border: 1px solid var(--red-glow);
    border-radius: 6px; color: var(--red); font-family: var(--mono); font-size: 12px;
    cursor: pointer; transition: all 0.2s;
  }
  .logout-btn:hover { background: rgba(231,76,60,0.25); }

  .last-updated { font-size: 11px; font-family: var(--mono); color: var(--muted); }

  /* ── Main content ────────────────────────────── */
  .main { padding: 32px; max-width: 1400px; margin: 0 auto; }

  .section-label {
    font-size: 10px; font-family: var(--mono); letter-spacing: 2px;
    color: var(--muted); text-transform: uppercase;
    border-left: 2px solid var(--red);
    padding-left: 10px; margin-bottom: 16px;
  }

  /* ── Stat cards ─────────────────────────────── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px; margin-bottom: 32px;
  }

  .stat-card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px 20px 16px;
    position: relative; overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .stat-card:hover { border-color: rgba(231,76,60,0.3); box-shadow: 0 0 20px var(--red-dim); }
  .stat-card::after {
    content: attr(data-icon);
    position: absolute; bottom: -4px; right: 10px;
    font-size: 48px; opacity: 0.06; pointer-events: none;
    line-height: 1;
  }

  .stat-label { font-size: 10px; font-family: var(--mono); color: var(--muted);
    letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
  .stat-value { font-size: 32px; font-weight: 800; letter-spacing: -1px; line-height: 1; }
  .stat-sub { font-size: 11px; font-family: var(--mono); color: var(--muted); margin-top: 6px; }

  .stat-card.accent .stat-value { color: var(--red); }
  .stat-card.green  .stat-value { color: var(--green); }
  .stat-card.blue   .stat-value { color: var(--blue); }
  .stat-card.yellow .stat-value { color: var(--yellow); }

  /* ── Charts grid ─────────────────────────────── */
  .charts-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px; margin-bottom: 28px;
  }
  @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }

  .charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px; margin-bottom: 28px;
  }
  @media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }

  .chart-card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px;
    position: relative;
  }
  .chart-card .chart-title {
    font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
    margin-bottom: 16px; color: var(--text);
  }
  .chart-card .chart-wrap { position: relative; height: 200px; }
  .chart-card.tall .chart-wrap { height: 260px; }
  .chart-card.short .chart-wrap { height: 160px; }

  /* ── Tables grid ─────────────────────────────── */
  .tables-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px; margin-bottom: 28px;
  }
  @media (max-width: 900px) { .tables-grid { grid-template-columns: 1fr; } }

  .table-card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden;
  }
  .table-header {
    padding: 14px 20px; border-bottom: 1px solid var(--border);
    font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .table-count { font-family: var(--mono); font-size: 11px; color: var(--muted); }

  table { width: 100%; border-collapse: collapse; }
  th {
    padding: 10px 16px; text-align: left;
    font-size: 10px; font-family: var(--mono); letter-spacing: 1.5px;
    color: var(--muted); text-transform: uppercase;
    border-bottom: 1px solid var(--border);
    background: var(--bg3);
  }
  td {
    padding: 10px 16px; font-size: 13px; font-family: var(--mono);
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(255,255,255,0.02); }

  .pill {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-size: 10px; font-family: var(--mono); letter-spacing: 0.5px;
    font-weight: 600;
  }
  .pill-win   { background: rgba(46,204,113,0.15); color: var(--green); }
  .pill-lose  { background: rgba(231,76,60,0.15);  color: var(--red); }
  .pill-live  { background: rgba(52,152,219,0.15); color: var(--blue); }
  .pill-tn    { background: rgba(243,156,18,0.15); color: var(--yellow); }
  .pill-x18   { background: rgba(231,76,60,0.15);  color: var(--red); }
  .pill-mobile  { background: rgba(52,152,219,0.15); color: var(--blue); }
  .pill-desktop { background: rgba(46,204,113,0.15); color: var(--green); }
  .pill-tablet  { background: rgba(243,156,18,0.15); color: var(--yellow); }

  /* ── Loading spinner ─────────────────────────── */
  .loading {
    display: flex; align-items: center; justify-content: center;
    gap: 10px; padding: 40px; color: var(--muted);
    font-size: 13px; font-family: var(--mono);
  }
  .spinner {
    width: 18px; height: 18px;
    border: 2px solid var(--border);
    border-top-color: var(--red);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Full-width recent games table ───────────── */
  .full-table-card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden; margin-bottom: 28px;
  }

  /* ── Bar with label (top words) ──────────────── */
  .bar-row {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 16px; border-bottom: 1px solid rgba(255,255,255,0.03);
  }
  .bar-row:last-child { border-bottom: none; }
  .bar-word { min-width: 140px; font-size: 13px; font-family: var(--mono); }
  .bar-track { flex: 1; height: 6px; background: var(--bg3); border-radius: 3px; overflow: hidden; }
  .bar-fill  { height: 100%; background: var(--red); border-radius: 3px; transition: width 0.6s ease; }
  .bar-count { font-size: 11px; font-family: var(--mono); color: var(--muted); min-width: 30px; text-align: right; }

  /* ── Scrollable table wrapper ─────────────────── */
  .table-scroll { max-height: 320px; overflow-y: auto; }
  .table-scroll::-webkit-scrollbar { width: 4px; }
  .table-scroll::-webkit-scrollbar-track { background: var(--bg3); }
  .table-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* Main-game inspired skin */
  :root {
    --bg: #faf7f2;
    --bg2: #fffdf9;
    --bg3: rgba(82,140,113,0.08);
    --border: rgba(82,140,113,0.15);
    --red: #d46b5a;
    --red-dim: rgba(212,107,90,0.12);
    --red-glow: rgba(212,107,90,0.24);
    --green: #528c71;
    --blue: #4f7fa6;
    --yellow: #f1c051;
    --text: #2d2a26;
    --muted: #8a8782;
    --mono: 'Baloo Bhaijaan 2', cursive;
    --display: 'Baloo Bhaijaan 2', cursive;
    --shadow-soft: 0 12px 30px rgba(82,140,113,0.08);
    --shadow-btn: 0 8px 20px rgba(82,140,113,0.22);
    --radius-lg: 32px;
    --radius-md: 20px;
    --radius-sm: 12px;
    --radius-pill: 99px;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #151413;
      --bg2: #1e1d1b;
      --bg3: rgba(69,120,96,0.18);
      --border: rgba(69,120,96,0.22);
      --red: #b85244;
      --red-dim: rgba(184,82,68,0.14);
      --red-glow: rgba(184,82,68,0.28);
      --green: #457860;
      --blue: #5f8eb5;
      --yellow: #dcae42;
      --text: #f5f2eb;
      --muted: #8c8983;
      --shadow-soft: 0 12px 35px rgba(0,0,0,0.32);
      --shadow-btn: 0 8px 20px rgba(69,120,96,0.28);
    }
  }

  body {
    font-family: var(--display);
    background: var(--bg);
    color: var(--text);
  }

  body::before {
    background: radial-gradient(circle at top right, rgba(82,140,113,0.11), transparent 34%),
                radial-gradient(circle at bottom left, rgba(241,192,81,0.12), transparent 30%);
    background-size: auto;
  }

  #login-screen { background: var(--bg); padding: 24px; }

  .login-card,
  .chart-card,
  .table-card,
  .full-table-card,
  .stat-card {
    background: var(--bg2);
    border-color: var(--border);
    box-shadow: var(--shadow-soft);
  }

  .login-card {
    border-radius: var(--radius-lg);
    max-width: 420px;
    padding: 40px 30px;
  }

  .login-card::before {
    height: 4px;
    background: linear-gradient(90deg, var(--green), var(--yellow));
  }

  .login-logo { font-size: 3rem; }
  .login-title { font-size: 1.6rem; letter-spacing: 0; }
  .login-sub, .field label, .stat-label, .stat-sub, .last-updated, .table-count, th, td, .bar-word, .bar-count {
    font-family: var(--display);
    letter-spacing: 0;
  }

  .field input {
    background: var(--bg);
    border-color: rgba(45,42,38,0.12);
    border-radius: var(--radius-sm);
    color: var(--text);
    font-family: var(--display);
    font-size: 1rem;
    padding: 13px 14px;
  }

  @media (prefers-color-scheme: dark) {
    .field input { border-color: rgba(245,242,235,0.13); }
  }

  .field input:focus { border-color: var(--green); }

  .login-btn,
  .refresh-btn {
    background: var(--green);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-btn);
    font-family: var(--display);
    font-size: 1rem;
    font-weight: 700;
  }

  .logout-btn {
    background: var(--red-dim);
    color: var(--red);
    border-color: var(--red-glow);
    border-radius: var(--radius-md);
    font-family: var(--display);
    font-size: 1rem;
    font-weight: 700;
  }

  .topbar {
    background: color-mix(in srgb, var(--bg2) 92%, transparent);
    border-color: var(--border);
    padding: 18px 24px;
    box-shadow: 0 8px 22px rgba(82,140,113,0.06);
  }

  .topbar-title { font-size: 1.45rem; letter-spacing: 0; }
  .topbar-tag {
    background: rgba(82,140,113,0.1);
    color: var(--green);
    border-color: var(--border);
    border-radius: var(--radius-pill);
    font-family: var(--display);
    letter-spacing: 0;
    padding: 4px 10px;
  }

  .main { padding: 28px 22px; }

  .section-label {
    color: var(--green);
    border-left-color: var(--green);
    font-family: var(--display);
    font-size: .9rem;
    font-weight: 800;
    letter-spacing: 0;
  }

  .stat-card,
  .chart-card,
  .table-card,
  .full-table-card {
    border-radius: var(--radius-md);
  }

  .stat-card:hover {
    border-color: rgba(82,140,113,0.3);
    box-shadow: 0 14px 34px rgba(82,140,113,0.12);
  }

  .stat-label { font-size: .85rem; color: var(--muted); }
  .stat-value { font-size: 2.2rem; letter-spacing: 0; color: var(--text); }
  .stat-card.accent .stat-value, .stat-card.green .stat-value { color: var(--green); }
  .stat-card.yellow .stat-value { color: var(--yellow); }
  .stat-card.blue .stat-value { color: var(--blue); }

  .chart-card .chart-title,
  .table-header {
    color: var(--text);
    font-size: 1rem;
    letter-spacing: 0;
  }

  .table-header { padding: 14px 18px; }
  th { background: var(--bg3); color: var(--muted); font-size: .78rem; }
  td { color: var(--text); font-size: .92rem; }
  tr:hover td { background: rgba(82,140,113,0.05); }

  .bar-track { background: var(--bg3); border-radius: var(--radius-pill); }
  .bar-fill { background: var(--green); border-radius: var(--radius-pill); }

  .pill {
    border-radius: var(--radius-pill);
    font-family: var(--display);
    font-size: .8rem;
  }

  .loading {
    color: var(--muted);
    font-family: var(--display);
    font-size: 1rem;
  }

  .spinner {
    border-color: var(--border);
    border-top-color: var(--green);
  }

  @media (max-width: 720px) {
    .topbar { align-items: flex-start; flex-direction: column; gap: 12px; }
    .topbar-right { width: 100%; flex-wrap: wrap; gap: 10px; }
    .refresh-btn, .logout-btn { flex: 1; min-width: 120px; }
    .main { padding: 20px 14px; }
  }
</style>
</head>
<body>

<!-- ══════════════════════════════════════════════════════
     LOGIN SCREEN
══════════════════════════════════════════════════════ -->
<div id="login-screen">
  <div class="login-card">
    <div class="login-logo">🕵️‍♂️</div>
    <div class="login-title">Admin Dashboard</div>
    <div class="login-sub">الدخيل · analytics</div>

    <div class="field">
      <label>Email</label>
      <input type="email" id="login-email" placeholder="admin@example.com" autocomplete="email">
    </div>
    <div class="field">
      <label>Password</label>
      <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password">
    </div>
    <button class="login-btn" id="login-btn">Sign In →</button>
    <div class="login-err" id="login-err"></div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════
     DASHBOARD
══════════════════════════════════════════════════════ -->
<div id="dashboard">

  <div class="topbar">
    <div class="topbar-left">
      <div class="topbar-logo">📊</div>
      <div class="topbar-title">Analytics</div>
      <div class="topbar-tag">ADMIN</div>
    </div>
    <div class="topbar-right">
      <span class="last-updated" id="last-updated"></span>
      <button class="refresh-btn" id="refresh-btn">↻ Refresh</button>
      <button class="logout-btn" id="logout-btn">Sign Out</button>
    </div>
  </div>

  <div class="main" id="main-content">
    <div class="loading"><div class="spinner"></div> Loading analytics…</div>
  </div>

</div>

<script>
// ============================================================
// CONFIG
// ============================================================
const SUPA_URL = 'https://rcxaxblhgpauodmcfetb.supabase.co';
const SUPA_KEY = 'sb_publishable_3xg9qkdYGUoaRdflCW58rg_xRdqg6ox';

const supa = window.supabase.createClient(SUPA_URL, SUPA_KEY);

// ============================================================
// AUTH
// ============================================================
async function tryRestoreSession() {
  const { data: { session } } = await supa.auth.getSession();
  if (session) showDashboard();
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  const btn   = document.getElementById('login-btn');
  const err   = document.getElementById('login-err');

  if (!email || !pass) { err.textContent = 'Please fill in both fields.'; return; }

  btn.disabled = true; btn.textContent = 'Signing in…'; err.textContent = '';

  const { error } = await supa.auth.signInWithPassword({ email, password: pass });

  if (error) {
    err.textContent = error.message;
    btn.disabled = false; btn.textContent = 'Sign In →';
  } else {
    showDashboard();
  }
});

document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('login-btn').click();
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await supa.auth.signOut();
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-password').value = '';
});

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  loadAll();
}

// ============================================================
// DATA FETCHING
// ============================================================

async function fetchAll() {
  const LIMIT = 5000;
  const since = new Date(Date.now() - 90 * 864e5).toISOString(); // last 90 days

  const [v, g, o] = await Promise.all([
    supa.from('analytics_visits').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(LIMIT),
    supa.from('analytics_games').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(LIMIT),
    supa.from('analytics_online').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(LIMIT)
  ]);

  const failures = [
    ['visits', v.error],
    ['games', g.error],
    ['online', o.error]
  ].filter(([, error]) => error);

  if (failures.length) {
    throw new Error(failures.map(([name, error]) => `${name}: ${error.message}`).join(' | '));
  }

  return {
    visits  : v.data || [],
    games   : g.data || [],
    online  : o.data || []
  };
}

// ============================================================
// HELPERS
// ============================================================

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

function dayKey(iso) { return iso.slice(0, 10); }

function last14Days() {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function countBy(arr, key) {
  return arr.reduce((acc, x) => {
    const k = x[key] || 'Unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function uniqueBy(arr, key) {
  return new Set(arr.map(x => x[key])).size;
}

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: {} } },
  scales: {}
};

const RED   = 'rgba(212,107,90,0.9)';
const REDF  = 'rgba(82,140,113,0.14)';
const GREEN = 'rgba(82,140,113,0.9)';
const BLUE  = 'rgba(79,127,166,0.9)';
const YELL  = 'rgba(241,192,81,0.9)';
const PUR   = 'rgba(138,135,130,0.9)';

function lineScale() {
  return {
    x: { grid: { color: 'rgba(82,140,113,0.08)' }, ticks: { color: '#8a8782', font: { family: 'Baloo Bhaijaan 2', size: 12 } } },
    y: { grid: { color: 'rgba(82,140,113,0.08)' }, ticks: { color: '#8a8782', font: { family: 'Baloo Bhaijaan 2', size: 12 } } }
  };
}

// ============================================================
// BUILD DASHBOARD HTML
// ============================================================

function buildHTML() {
  return `
    <!-- ── Stats row ──────────────────────────────── -->
    <div class="section-label">OVERVIEW</div>
    <div class="stats-grid" id="stats-grid">
      <div class="loading"><div class="spinner"></div></div>
    </div>

    <!-- ── Visits + Result charts ────────────────── -->
    <div class="section-label">TRAFFIC</div>
    <div class="charts-grid">
      <div class="chart-card tall">
        <div class="chart-title">📈 Daily Visits — Last 14 Days</div>
        <div class="chart-wrap"><canvas id="c-visits"></canvas></div>
      </div>
      <div class="chart-card tall">
        <div class="chart-title">🖥️ Device Breakdown</div>
        <div class="chart-wrap"><canvas id="c-device"></canvas></div>
      </div>
    </div>

    <!-- ── Game charts ───────────────────────────── -->
    <div class="section-label">GAME STATS</div>
    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-title">🏆 Game Results</div>
        <div class="chart-wrap"><canvas id="c-results"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">👥 Player Counts</div>
        <div class="chart-wrap"><canvas id="c-players"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">🃏 Word Lists</div>
        <div class="chart-wrap"><canvas id="c-wordlist"></canvas></div>
      </div>
    </div>

    <!-- ── Tables row ───────────────────────────── -->
    <div class="section-label">DETAILS</div>
    <div class="tables-grid">
      <!-- Top words -->
      <div class="table-card">
        <div class="table-header">
          <span>🔤 Top Words Used</span>
          <span class="table-count" id="word-count-label"></span>
        </div>
        <div id="word-bars"></div>
      </div>

      <!-- Timezone breakdown -->
      <div class="table-card">
        <div class="table-header">
          <span>🌍 Top Timezones</span>
          <span class="table-count" id="tz-count-label"></span>
        </div>
        <div class="table-scroll">
          <table><thead><tr>
            <th>Timezone</th><th>Visits</th><th>%</th>
          </tr></thead>
          <tbody id="tz-table"></tbody></table>
        </div>
      </div>
    </div>

    <div class="tables-grid">
      <!-- Browser breakdown -->
      <div class="table-card">
        <div class="table-header">
          <span>🌐 Browsers</span>
        </div>
        <div class="table-scroll">
          <table><thead><tr>
            <th>Browser</th><th>OS</th><th>Visits</th>
          </tr></thead>
          <tbody id="browser-table"></tbody></table>
        </div>
      </div>

      <!-- Online events -->
      <div class="table-card">
        <div class="table-header">
          <span>🌐 Online Activity</span>
          <span class="table-count" id="online-count-label"></span>
        </div>
        <div class="table-scroll">
          <table><thead><tr>
            <th>Event</th><th>Count</th>
          </tr></thead>
          <tbody id="online-table"></tbody></table>
        </div>
      </div>
    </div>

    <!-- ── Recent games full table ──────────────── -->
    <div class="section-label">RECENT GAMES</div>
    <div class="full-table-card">
      <div class="table-header">
        <span>🎮 Last 50 Games</span>
        <span class="table-count" id="games-count-label"></span>
      </div>
      <div class="table-scroll" style="max-height:420px">
        <table><thead><tr>
          <th>Time</th><th>Word</th><th>List</th>
          <th>Players</th><th>Impostors</th><th>Timer</th>
          <th>Result</th><th>Duration</th>
        </tr></thead>
        <tbody id="games-table"></tbody></table>
      </div>
    </div>
  `;
}

// ============================================================
// RENDER
// ============================================================

function renderStats(visits, games, online) {
  const today     = todayStr();
  const todayV    = visits.filter(v => v.created_at.startsWith(today)).length;
  const todayG    = games.filter(g => g.created_at.startsWith(today)).length;
  const uniqSess  = uniqueBy(visits, 'session_id');
  const onlineRms = new Set(online.filter(o => o.event === 'room_created').map(o => o.room_code)).size;
  const mobileV   = visits.filter(v => v.device_type === 'mobile').length;
  const mobPct    = visits.length ? Math.round(mobileV / visits.length * 100) : 0;
  const avgPlayers = games.length
    ? (games.reduce((s, g) => s + (g.player_count || 0), 0) / games.length).toFixed(1)
    : '—';
  const winsRate = (() => {
    const finished = games.filter(g => g.result && g.result !== 'ongoing');
    if (!finished.length) return '—';
    const wins = finished.filter(g => g.result === 'citizens_win').length;
    return Math.round(wins / finished.length * 100) + '%';
  })();

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card accent" data-icon="👁️">
      <div class="stat-label">Total Visits</div>
      <div class="stat-value">${visits.length.toLocaleString()}</div>
      <div class="stat-sub">+${todayV} today</div>
    </div>
    <div class="stat-card green" data-icon="🎮">
      <div class="stat-label">Games Played</div>
      <div class="stat-value">${games.length.toLocaleString()}</div>
      <div class="stat-sub">+${todayG} today</div>
    </div>
    <div class="stat-card blue" data-icon="🆔">
      <div class="stat-label">Unique Sessions</div>
      <div class="stat-value">${uniqSess.toLocaleString()}</div>
      <div class="stat-sub">last 90 days</div>
    </div>
    <div class="stat-card yellow" data-icon="🌐">
      <div class="stat-label">Online Rooms</div>
      <div class="stat-value">${onlineRms.toLocaleString()}</div>
      <div class="stat-sub">created</div>
    </div>
    <div class="stat-card" data-icon="📱">
      <div class="stat-label">Mobile Users</div>
      <div class="stat-value">${mobPct}%</div>
      <div class="stat-sub">of all visits</div>
    </div>
    <div class="stat-card" data-icon="👥">
      <div class="stat-label">Avg Players</div>
      <div class="stat-value">${avgPlayers}</div>
      <div class="stat-sub">per game</div>
    </div>
    <div class="stat-card" data-icon="🏆">
      <div class="stat-label">Citizens Win</div>
      <div class="stat-value">${winsRate}</div>
      <div class="stat-sub">of finished games</div>
    </div>
    <div class="stat-card accent" data-icon="✅">
      <div class="stat-label">PWA Installs</div>
      <div class="stat-value">${visits.filter(v => v.is_pwa).length}</div>
      <div class="stat-sub">standalone</div>
    </div>
  `;
}

function renderVisitsChart(visits) {
  const days = last14Days();
  const byDay = countBy(visits, v => dayKey(v.created_at));
  const data  = days.map(d => byDay[d] || 0);

  new Chart(document.getElementById('c-visits'), {
    type: 'line',
    data: {
      labels: days.map(d => d.slice(5)),
      datasets: [{
        data, fill: true,
        borderColor: RED, backgroundColor: REDF, borderWidth: 2,
        tension: 0.35, pointRadius: 3, pointBackgroundColor: RED
      }]
    },
    options: { ...CHART_DEFAULTS, scales: lineScale() }
  });
}

function renderDeviceChart(visits) {
  const counts = countBy(visits, 'device_type');
  new Chart(document.getElementById('c-device'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts),
      datasets: [{ data: Object.values(counts), backgroundColor: [BLUE, RED, YELL], borderWidth: 0 }]
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: '#8a8782', font: { family: 'Baloo Bhaijaan 2', size: 12 }, boxWidth: 10, padding: 14 } }
      }
    }
  });
}

function renderResultsChart(games) {
  const counts = countBy(games.filter(g => g.result && g.result !== 'ongoing'), 'result');
  const labels = Object.keys(counts).map(k => k === 'citizens_win' ? 'Citizens Win' : 'Impostors Win');
  new Chart(document.getElementById('c-results'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: Object.values(counts), backgroundColor: [GREEN, RED], borderWidth: 0 }]
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: '#8a8782', font: { family: 'Baloo Bhaijaan 2', size: 12 }, boxWidth: 10, padding: 14 } }
      }
    }
  });
}

function renderPlayersChart(games) {
  const raw = countBy(games, 'player_count');
  const labels = Object.keys(raw).sort((a,b) => a-b);
  new Chart(document.getElementById('c-players'), {
    type: 'bar',
    data: {
      labels: labels.map(l => l + 'p'),
      datasets: [{ data: labels.map(l => raw[l]), backgroundColor: BLUE, borderRadius: 4, borderSkipped: false }]
    },
    options: { ...CHART_DEFAULTS, scales: lineScale() }
  });
}

function renderWordListChart(games) {
  const counts = countBy(games, 'word_list');
  new Chart(document.getElementById('c-wordlist'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts).map(k => k === 'x18' ? '+18 🔞' : '🇹🇳 Tunisian'),
      datasets: [{ data: Object.values(counts), backgroundColor: [YELL, RED], borderWidth: 0 }]
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: '#8a8782', font: { family: 'Baloo Bhaijaan 2', size: 12 }, boxWidth: 10, padding: 14 } }
      }
    }
  });
}

function renderWordBars(games) {
  const words = games.map(g => g.word).filter(Boolean);
  const counts = countBy(words, w => w);
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 12);
  const max = sorted[0]?.[1] || 1;

  document.getElementById('word-count-label').textContent = Object.keys(counts).length + ' unique words';

  document.getElementById('word-bars').innerHTML = sorted.map(([word, count]) => `
    <div class="bar-row">
      <span class="bar-word">${word}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(count/max*100)}%"></div></div>
      <span class="bar-count">${count}</span>
    </div>
  `).join('');
}

function renderTzTable(visits) {
  const counts = countBy(visits, 'timezone');
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 15);
  const total  = visits.length;
  document.getElementById('tz-count-label').textContent = Object.keys(counts).length + ' regions';
  document.getElementById('tz-table').innerHTML = sorted.map(([tz, n]) => `
    <tr>
      <td>${tz || 'Unknown'}</td>
      <td>${n}</td>
      <td style="color:var(--muted)">${Math.round(n/total*100)}%</td>
    </tr>
  `).join('');
}

function renderBrowserTable(visits) {
  const rows = {};
  visits.forEach(v => {
    const k = (v.browser || 'Other') + '|' + (v.os || 'Other');
    rows[k] = (rows[k] || 0) + 1;
  });
  const sorted = Object.entries(rows).sort((a,b) => b[1]-a[1]).slice(0, 15);
  document.getElementById('browser-table').innerHTML = sorted.map(([k, n]) => {
    const [browser, os] = k.split('|');
    return `<tr><td>${browser}</td><td>${os}</td><td>${n}</td></tr>`;
  }).join('');
}

function renderOnlineTable(online) {
  const counts = countBy(online, 'event');
  document.getElementById('online-count-label').textContent = online.length + ' events';
  const labels = { room_created: '🏠 Room Created', room_joined: '🚪 Room Joined', game_started: '🚀 Game Started' };
  document.getElementById('online-table').innerHTML = Object.entries(counts).map(([k, n]) => `
    <tr>
      <td>${labels[k] || k}</td>
      <td>${n}</td>
    </tr>
  `).join('');
}

function renderGamesTable(games) {
  document.getElementById('games-count-label').textContent = games.length + ' total';
  const rows = games.slice(0, 50).map(g => {
    const resultPill = g.result === 'citizens_win'
      ? '<span class="pill pill-win">Citizens Win</span>'
      : g.result === 'impostors_win'
        ? '<span class="pill pill-lose">Impostors Win</span>'
        : '<span class="pill pill-live">—</span>';
    const wlPill = g.word_list === 'x18'
      ? '<span class="pill pill-x18">+18</span>'
      : '<span class="pill pill-tn">TN</span>';
    const dur = g.duration_secs ? Math.floor(g.duration_secs/60) + 'm ' + (g.duration_secs%60) + 's' : '—';
    return `
      <tr>
        <td style="white-space:nowrap">${fmtDate(g.created_at)}</td>
        <td>${g.word || '—'}</td>
        <td>${wlPill}</td>
        <td>${g.player_count || '—'}</td>
        <td>${g.impostor_count || '—'}</td>
        <td>${g.timer_mins ? g.timer_mins + 'm' : '—'}</td>
        <td>${resultPill}</td>
        <td>${dur}</td>
      </tr>
    `;
  }).join('');
  document.getElementById('games-table').innerHTML = rows || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px">No games yet</td></tr>';
}

// ============================================================
// MAIN LOAD
// ============================================================

async function loadAll() {
  document.getElementById('main-content').innerHTML = buildHTML();

  try {
    const { visits, games, online } = await fetchAll();

    renderStats(visits, games, online);
    renderVisitsChart(visits);
    renderDeviceChart(visits);
    renderResultsChart(games);
    renderPlayersChart(games);
    renderWordListChart(games);
    renderWordBars(games);
    renderTzTable(visits);
    renderBrowserTable(visits);
    renderOnlineTable(online);
    renderGamesTable(games);

    document.getElementById('last-updated').textContent =
      'Updated ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  } catch (err) {
    document.getElementById('main-content').innerHTML =
      `<div class="loading" style="color:var(--red)">⚠️ Error loading data: ${err.message}</div>`;
  }
}

document.getElementById('refresh-btn').addEventListener('click', loadAll);

// ── Auto-refresh every 2 minutes ─────────────────────────────
setInterval(() => {
  if (document.getElementById('dashboard').style.display !== 'none') loadAll();
}, 120_000);

// ── Try to restore existing session on load ───────────────────
tryRestoreSession();
</script>
</body>
</html>
