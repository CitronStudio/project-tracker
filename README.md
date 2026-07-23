# project-tracker

Claudeで並行して進めている複数プロジェクト（「りさだむ杯」「wilberryホームページ管理」
「家計簿関連」など）の進捗・ステータス・最終更新履歴を一元管理するための、個人用ダッシュボードです。

## 機能

- プロジェクト一覧（カテゴリ・ステータスで絞り込み）
- プロジェクトごとに: 名前 / カテゴリ / 関連リポジトリ・URL / ステータス
  （未着手・進行中・一時停止・完了）/ 次にやること・TODO / 自由メモ
- 更新履歴（手動追加 + Claude Codeセッション終了時の自動記録）
- Claude Codeの `Stop` フックから叩けるAPIを用意しており、他のリポジトリで
  Claude Codeセッションが終わるたびに、そのプロジェクトの「最終更新」が自動更新されます
  （詳細は [docs/claude-code-hook.md](./docs/claude-code-hook.md)）

データはSQLite（`better-sqlite3`）にファイルとして保存します。外部DBは不要です。

## セットアップ

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開くとダッシュボードが表示されます。
初回起動時に `data/project-tracker.db` が自動作成されます。

## 環境変数

`.env.example` を参照してください。

- `DATABASE_PATH`: SQLiteファイルの保存先（デフォルト: `./data/project-tracker.db`）
- `APP_USERNAME` / `APP_PASSWORD`: 設定すると、ダッシュボードとAPI全体がHTTP Basic認証で
  保護されます。個人利用でも、公開URLにデプロイする場合は設定を推奨します。ローカル開発中は
  未設定のままで構いません。

## デプロイについて

Vercelなどのサーバーレス環境はファイルシステムが読み取り専用/一時的なため、
`better-sqlite3` によるファイル保存とは相性がよくありません。デプロイする場合は、
永続ボリュームが使える環境（例: Fly.io、Railway、自宅サーバー、VPS上でのDocker常駐など）を
推奨します。ローカルPCで `npm run build && npm start` して手元だけで使う運用でも問題ありません。

## Claude Codeとの連携

他のリポジトリでの作業（Claude Codeセッション終了時）を、このトラッカーに自動記録できます。
設定方法は [docs/claude-code-hook.md](./docs/claude-code-hook.md) を参照してください。

## API

- `GET /api/projects` / `POST /api/projects`
- `GET /api/projects/:id` / `PATCH /api/projects/:id` / `DELETE /api/projects/:id`
- `GET /api/projects/:id/logs` / `POST /api/projects/:id/logs`
  （`{ "summary": "...", "source": "manual" | "claude-code" }`）

`APP_PASSWORD` を設定している場合、すべてのAPIリクエストにHTTP Basic認証が必要です。
