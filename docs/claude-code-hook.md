# Claude Code から自動で更新履歴を記録する

`りさだむ杯` や `wilberryホームページ管理` のような、Claude Codeで作業している**他のリポジトリ**に
このフックを設定すると、Claude Codeのセッションが終わるたびに project-tracker 側の
「更新履歴」に自動で1件記録されます（記録内容は直前のgitコミットのメッセージ）。

## 1. トラッカー側の準備

1. project-tracker のダッシュボードでプロジェクトを作成する
2. プロジェクト詳細ページの「Claude Code 連携」欄からプロジェクトIDをコピーする

## 2. 記録したいリポジトリ側の設定

このリポジトリの `scripts/claude-hook-report.sh` を、記録したいリポジトリにコピーするか、
パスを直接指定します。

そのリポジトリの `.claude/settings.json` に `Stop` フックとして登録します:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash /path/to/claude-hook-report.sh"
          }
        ]
      }
    ]
  }
}
```

必要な環境変数をシェルのプロファイル（`~/.zshrc` など、gitに含まれない場所）に設定します:

```bash
export TRACKER_API_URL="https://your-tracker.example.com"   # デプロイ先のURL
export TRACKER_PROJECT_ID="ダッシュボードでコピーしたID"
# APP_PASSWORD を設定してトラッカーを保護している場合のみ:
export TRACKER_USERNAME="admin"
export TRACKER_PASSWORD="..."
```

これでそのリポジトリでのClaude Codeセッションが終了するたびに、project-tracker側の
該当プロジェクトの「最終更新」と「更新履歴」が自動で更新されます。

## 動作しないとき

- スクリプトは失敗しても Claude Code のセッションをブロックしないよう、常に正常終了します
- 反映されない場合は、環境変数の設定漏れ・`TRACKER_API_URL`の末尾スラッシュ・
  `TRACKER_PROJECT_ID`の間違いを確認してください
- 手動でテストする場合:

  ```bash
  TRACKER_API_URL=https://your-tracker.example.com \
  TRACKER_PROJECT_ID=xxxx \
  bash scripts/claude-hook-report.sh
  ```
