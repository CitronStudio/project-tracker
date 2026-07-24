// タスクに紐づくGitHubリポジトリ（"owner/repo"、公開リポジトリのみ）の最新コミットを取得する
async function loadRecentCommits(repo, count = 3) {
  const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=${count}`);
  if (!res.ok) return [];
  const commits = await res.json();
  return commits.map(mapCommit);
}

// 詳細ページの更新履歴用に、リポジトリの全コミットをページングして取得する。
// 単一リポジトリ・未認証API（60req/時間）を想定し、上限500件で打ち切る。
async function loadAllCommits(repo) {
  const perPage = 100;
  const maxPages = 5;
  let all = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=${perPage}&page=${page}`);
    if (!res.ok) break;
    const commits = await res.json();
    if (!Array.isArray(commits) || commits.length === 0) break;
    all = all.concat(commits.map(mapCommit));
    if (commits.length < perPage) break;
  }
  return all;
}

function mapCommit(c) {
  return {
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0],
    date: c.commit.author.date,
  };
}
