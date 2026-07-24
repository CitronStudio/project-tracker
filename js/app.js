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

// history は先頭が最新（新しい変更をunshiftで追加）なので、"作成"以外で最初に
// 見つかったものが直近の実更新。無ければ null（＝まだ更新なし）。
function lastRealUpdate(t) {
  return t.history.find((h) => h.note !== "作成") || null;
}

// リポジトリの最新コミットは同一ページ滞在中はキャッシュし、フィルタ操作の
// たびにGitHub APIを叩き直さないようにする（ページを開き直せば最新が取れる）。
const commitsCache = new Map();
async function getCommits(repo) {
  if (commitsCache.has(repo)) return commitsCache.get(repo);
  const promise = loadRecentCommits(repo, 3).catch(() => null);
  commitsCache.set(repo, promise);
  return promise;
}

// タスクの並び替えに使う「直近の活動日時」。history上の実更新と、
// 連携リポジトリの最新コミット日時のうち、より新しい方を採用する。
function latestActivityDate(t, commits) {
  const dates = [];
  const update = lastRealUpdate(t);
  if (update) dates.push(update.date);
  if (commits && commits.length) dates.push(commits[0].date);
  if (!dates.length) return null;
  return dates.reduce((max, d) => (d > max ? d : max));
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

  // 並び替え・カード表示のため、連携リポジトリの最新コミットを先に取得する。
  const commitsByTaskId = {};
  await Promise.all(
    filtered
      .filter((t) => t.repo)
      .map(async (t) => {
        commitsByTaskId[t.id] = await getCommits(t.repo);
      })
  );

  // 更新時間の降順（history上の更新・連携リポジトリのコミットいずれか新しい方）。
  // 実更新がないタスクは日時を問わず末尾に置く。
  filtered.sort((a, b) => {
    const da = latestActivityDate(a, commitsByTaskId[a.id]);
    const db = latestActivityDate(b, commitsByTaskId[b.id]);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da < db ? 1 : da > db ? -1 : 0;
  });

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
    ? filtered.map((t) => taskCard(t, commitsByTaskId[t.id])).join("")
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
}

// ---------- タスクに紐づくリポジトリの最新コミット ----------
function commitsBlockHtml(t, commits) {
  if (!t.repo) return "";
  if (commits === null) {
    return `<div class="commits-block"><p class="empty small">コミット履歴を取得できませんでした</p></div>`;
  }
  if (!commits.length) {
    return `<div class="commits-block"><p class="empty small">コミットがありません</p></div>`;
  }
  return `<div class="commits-block"><ul class="commit-list">${commits
    .map((c) => `<li><span class="date">${formatDate(c.date)}</span><span class="msg">${escapeHtml(c.message)}</span></li>`)
    .join("")}</ul></div>`;
}

function taskCard(t, commits) {
  const lastUpdate = lastRealUpdate(t);
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
      ${commitsBlockHtml(t, commits)}
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
