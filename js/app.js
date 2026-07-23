// ハッシュルーティングと画面描画（読み取り専用。データは data/tasks.json から取得）
const app = document.getElementById("app");

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function statusBadge(status) {
  const color = CONFIG.STATUS_COLORS[status] || "#9aa0a6";
  return `<span class="badge" style="--badge-color:${color}">${escapeHtml(status)}</span>`;
}

async function route() {
  const hash = location.hash.replace(/^#/, "") || "/";
  updateNavHighlight(hash);

  if (hash === "/" || hash.startsWith("/?")) {
    await renderList();
  } else if (hash.startsWith("/task/")) {
    const id = decodeURIComponent(hash.slice("/task/".length));
    await renderDetail(id);
  } else {
    app.innerHTML = `<p class="empty">ページが見つかりません</p>`;
  }
}

function updateNavHighlight(hash) {
  document.querySelectorAll(".bottom-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === "/" ? hash === "/" : hash.startsWith(a.dataset.route));
  });
}

// ---------- 一覧 ----------
async function renderList() {
  app.innerHTML = `<p class="empty">読み込み中…</p>`;
  const tasks = await Data.load();
  const projects = [...new Set(tasks.map((t) => t.project).filter(Boolean))].sort();

  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const statusFilter = params.get("status") || "";
  const projectFilter = params.get("project") || "";
  const q = params.get("q") || "";

  const filtered = tasks.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (projectFilter && t.project !== projectFilter) return false;
    if (q) {
      const hay = `${t.title} ${t.project} ${t.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  filtered.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const statusTabs = ["", ...CONFIG.STATUSES]
    .map((s) => {
      const active = s === statusFilter ? "active" : "";
      const label = s || "すべて";
      const p = new URLSearchParams(location.hash.split("?")[1] || "");
      s ? p.set("status", s) : p.delete("status");
      return `<a class="tab ${active}" href="#/?${p.toString()}">${escapeHtml(label)}</a>`;
    })
    .join("");

  const projectOptions = projects
    .map((p) => `<option value="${escapeHtml(p)}" ${p === projectFilter ? "selected" : ""}>${escapeHtml(p)}</option>`)
    .join("");

  const cards = filtered.length
    ? filtered.map(taskCard).join("")
    : `<p class="empty">該当するタスクがありません</p>`;

  app.innerHTML = `
    <div class="filter-bar">
      <div class="tabs">${statusTabs}</div>
      <div class="filter-row">
        <select id="project-filter">
          <option value="">プロジェクト: すべて</option>
          ${projectOptions}
        </select>
        <input type="search" id="q-filter" placeholder="タイトル・タグで検索" value="${escapeHtml(q)}">
      </div>
    </div>
    <div class="task-list">${cards}</div>
  `;

  document.getElementById("project-filter").addEventListener("change", (e) => {
    const p = new URLSearchParams(location.hash.split("?")[1] || "");
    e.target.value ? p.set("project", e.target.value) : p.delete("project");
    location.hash = `/?${p.toString()}`;
  });
  document.getElementById("q-filter").addEventListener("input", (e) => {
    const p = new URLSearchParams(location.hash.split("?")[1] || "");
    e.target.value ? p.set("q", e.target.value) : p.delete("q");
    history.replaceState(null, "", `#/?${p.toString()}`);
    renderList();
  });

  filtered
    .filter((t) => t.repo)
    .forEach((t) => loadCommitsInto(t));
}

// ---------- タスクに紐づくリポジトリの最新コミット ----------
function commitsBlockHtml(t) {
  if (!t.repo) return "";
  return `<div class="commits-block" id="commits-${t.id}"><p class="empty small">コミット読み込み中…</p></div>`;
}

async function loadCommitsInto(t) {
  const el = document.getElementById(`commits-${t.id}`);
  if (!el) return;
  try {
    const commits = await loadRecentCommits(t.repo, 3);
    el.innerHTML = commits.length
      ? `<ul class="commit-list">${commits
          .map((c) => `<li><span class="date">${formatDate(c.date)}</span><span class="msg">${escapeHtml(c.message)}</span></li>`)
          .join("")}</ul>`
      : `<p class="empty small">コミットがありません</p>`;
  } catch (e) {
    el.innerHTML = `<p class="empty small">コミット履歴を取得できませんでした</p>`;
  }
}

function taskCard(t) {
  const lastUpdate = t.history.find((h) => h.note !== "作成");
  const tags = t.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  return `
    <a class="card" href="#/task/${encodeURIComponent(t.id)}">
      <div class="card-top">
        <span class="title">${escapeHtml(t.title)}</span>
        ${statusBadge(t.status)}
      </div>
      <div class="card-meta">
        ${t.project ? `<span class="project">${escapeHtml(t.project)}</span>` : ""}
        ${tags}
      </div>
      ${lastUpdate ? `<div class="card-history">
        <span class="date">${formatDate(lastUpdate.date)}</span>
        <span class="note">${escapeHtml(lastUpdate.note)}</span>
      </div>` : ""}
      ${commitsBlockHtml(t)}
    </a>
  `;
}

// ---------- 詳細（読み取り専用） ----------
async function renderDetail(id) {
  app.innerHTML = `<p class="empty">読み込み中…</p>`;
  const tasks = await Data.load();
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    app.innerHTML = `<p class="empty">タスクが見つかりません</p>`;
    return;
  }

  const tags = task.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  const updates = task.history.filter((h) => h.note !== "作成");
  const historyItems = updates.length
    ? `<ul class="history-list">${updates
        .map((h) => `<li><span class="date">${formatDate(h.date)}</span><span class="note">${escapeHtml(h.note)}</span></li>`)
        .join("")}</ul>`
    : `<p class="empty">まだ更新履歴がありません</p>`;

  app.innerHTML = `
    <section class="task-detail">
      <div class="detail-header">
        <h2>${escapeHtml(task.title)}</h2>
        ${statusBadge(task.status)}
      </div>
      <div class="card-meta">
        ${task.project ? `<span class="project">${escapeHtml(task.project)}</span>` : ""}
        ${tags}
      </div>

      <h2 class="history-title">更新履歴</h2>
      ${historyItems}
    </section>
  `;
}

window.addEventListener("hashchange", route);
window.addEventListener("load", route);
