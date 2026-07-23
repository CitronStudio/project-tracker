// data/tasks.json を読み込むだけの層。書き込みはこのサイトからは行わない
// （タスクの追加・更新は Claude Code に依頼して data/tasks.json をコミット・pushする運用）
const Data = {
  async load() {
    const res = await fetch(`${CONFIG.DATA_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return [];
    try {
      return await res.json();
    } catch (e) {
      return [];
    }
  },
};
