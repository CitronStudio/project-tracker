// タスクに紐づくGitHubリポジトリ（"owner/repo"、公開リポジトリのみ）の最新コミットを取得する
async function loadRecentCommits(repo, count = 3) {
  const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=${count}`);
  if (!res.ok) return [];
  const commits = await res.json();
  return commits.map((c) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0],
    date: c.commit.author.date,
  }));
}
