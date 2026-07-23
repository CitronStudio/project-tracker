import { randomUUID } from "crypto";
import db from "./db";
import { LogSource, Project, UpdateLog } from "./types";

export function listProjects(): Project[] {
  return db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as Project[];
}

export function getProject(id: string): Project | undefined {
  return db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project | undefined;
}

export interface ProjectInput {
  name: string;
  category?: string | null;
  repo_url?: string | null;
  status?: string;
  todo?: string | null;
  memo?: string | null;
}

export function createProject(input: ProjectInput): Project {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO projects (id, name, category, repo_url, status, todo, memo, created_at, updated_at)
     VALUES (@id, @name, @category, @repo_url, @status, @todo, @memo, @created_at, @updated_at)`
  ).run({
    id,
    name: input.name,
    category: input.category ?? null,
    repo_url: input.repo_url ?? null,
    status: input.status ?? "未着手",
    todo: input.todo ?? null,
    memo: input.memo ?? null,
    created_at: now,
    updated_at: now,
  });
  return getProject(id)!;
}

export function updateProject(
  id: string,
  input: Partial<ProjectInput>
): Project | undefined {
  const existing = getProject(id);
  if (!existing) return undefined;
  const merged = {
    ...existing,
    ...input,
    id,
    updated_at: new Date().toISOString(),
  };
  db.prepare(
    `UPDATE projects SET name=@name, category=@category, repo_url=@repo_url,
       status=@status, todo=@todo, memo=@memo, updated_at=@updated_at
     WHERE id=@id`
  ).run(merged);
  return getProject(id);
}

export function deleteProject(id: string): void {
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
}

export function listLogs(projectId: string): UpdateLog[] {
  return db
    .prepare("SELECT * FROM update_logs WHERE project_id = ? ORDER BY created_at DESC")
    .all(projectId) as UpdateLog[];
}

export function addLog(
  projectId: string,
  summary: string,
  source: LogSource = "manual"
): UpdateLog {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO update_logs (id, project_id, summary, source, created_at)
     VALUES (@id, @project_id, @summary, @source, @created_at)`
  ).run({ id, project_id: projectId, summary, source, created_at: now });
  db.prepare("UPDATE projects SET updated_at = ? WHERE id = ?").run(now, projectId);
  return db.prepare("SELECT * FROM update_logs WHERE id = ?").get(id) as UpdateLog;
}

export function deleteLog(id: string): void {
  db.prepare("DELETE FROM update_logs WHERE id = ?").run(id);
}
