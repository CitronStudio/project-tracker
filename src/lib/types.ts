export type ProjectStatus = "未着手" | "進行中" | "一時停止" | "完了";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "未着手",
  "進行中",
  "一時停止",
  "完了",
];

export interface Project {
  id: string;
  name: string;
  category: string | null;
  repo_url: string | null;
  status: ProjectStatus;
  todo: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export type LogSource = "manual" | "claude-code";

export interface UpdateLog {
  id: string;
  project_id: string;
  summary: string;
  source: LogSource;
  created_at: string;
}
