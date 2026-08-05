# プロジェクト管理

関わっている案件・プロジェクトを横断してタスクを管理する、ビルド不要の静的サイト（HTML / CSS / 素のJavaScriptのみ）。

## 使い方

- **タスクの閲覧**: このサイト（GitHub Pages）を開いて一覧・詳細・更新履歴を見る。
- **タスクの追加・更新・完了報告**: サイト上のフォームではなく、Claude Codeにこのリポジトリを開いてもらい、会話で伝える。
  - 例:「りさだむ杯の更新終わった」「新しく〇〇のタスク追加して」
  - Claude が `data/tasks.json` を編集し、コミット・pushまで行う。運用ルールは [CLAUDE.md](./CLAUDE.md) を参照。

サイト自体はデータの参照専用（read-only）。GitHub Pagesは静的ホスティングのため、ブラウザから直接データを書き戻すことはできない。

## データ形式

`data/tasks.json` に配列でタスクを保持する。

```json
[
  {
    "id": "一意なID",
    "title": "タスク名",
    "type": "task | incident（省略可。既定はtask。taskは緑文字、incidentは赤文字でタイトル表示）",
    "project": "プロジェクト名（例: りさだむ杯ポータル）",
    "repo": "owner/repo（省略可。公開GitHubリポジトリなら一覧に最新コミット3件を自動表示）",
    "tags": ["タグ1", "タグ2"],
    "status": "未着手 | 進行中 | 完了",
    "createdAt": "ISO日時",
    "updatedAt": "ISO日時",
    "history": [
      { "date": "ISO日時", "note": "何をしたか" }
    ]
  }
]
```

`history` は新しい変更を先頭（unshift）に追加する。

`repo` を指定したタスクは、一覧のカード下にGitHub APIから取得した最新コミット3件（日時・コミットメッセージ1行目）を表示する。ページを開くたびに直接GitHub APIを叩くため、コミットが増えれば自動で反映される（ビルドや手動更新は不要）。公開リポジトリのみ対応。

## ファイル構成

```
index.html      エントリーポイント
css/style.css   スタイル一式（モバイルファースト、ダークモード対応）
js/config.js    ステータス一覧・配色・データURLなどの設定
js/data.js      data/tasks.json を fetch するだけの読み取り層
js/commits.js   task.repo に紐づくGitHubリポジトリの最新コミットを取得
js/app.js       ハッシュルーティングと画面描画（読み取り専用）
data/tasks.json タスクデータ本体（Claude Codeが編集・コミットする）
CLAUDE.md       Claude Code向けの運用ルール
```

## ローカルでの確認方法

```
python3 -m http.server 8000
```

その後ブラウザで `http://localhost:8000/` を開く。

## data/tasks.json のバリデーション

`data/tasks.json` はコミット前に以下で構文・必須フィールドをチェックできる（`main`へのpush時にも
GitHub Actionsで自動実行される。JSONが壊れているとサイトが「取得に失敗して何も表示されない」
状態になるため、壊れていないかにすぐ気づけるようにする目的）。

```
python3 scripts/validate_tasks_json.py data/tasks.json
```

## 公開（GitHub Pages）

リポジトリの Settings → Pages で「Deploy from a branch」→ ブランチ `main` / フォルダ `/ (root)` を選べば公開できる。
リポジトリはpublicにしてある（タスク内容も公開される点に注意）。
