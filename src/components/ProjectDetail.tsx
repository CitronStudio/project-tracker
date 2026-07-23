"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import StatusBadge from "./StatusBadge";
import ProjectForm from "./ProjectForm";
import { Project, UpdateLog } from "@/lib/types";

export default function ProjectDetail({
  initialProject,
  initialLogs,
}: {
  initialProject: Project;
  initialLogs: UpdateLog[];
}) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [logs, setLogs] = useState(initialLogs);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newLog, setNewLog] = useState("");
  const [submittingLog, setSubmittingLog] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleDelete() {
    if (!confirm(`「${project.name}」を削除します。よろしいですか?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setDeleting(false);
      alert("削除に失敗しました");
    }
  }

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault();
    if (!newLog.trim()) return;
    setSubmittingLog(true);
    const res = await fetch(`/api/projects/${project.id}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: newLog.trim(), source: "manual" }),
    });
    setSubmittingLog(false);
    if (res.ok) {
      const log: UpdateLog = await res.json();
      setLogs([log, ...logs]);
      setProject({ ...project, updated_at: log.created_at });
      setNewLog("");
    } else {
      alert("追加に失敗しました");
    }
  }

  async function copyId() {
    await navigator.clipboard.writeText(project.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (editing) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-bold mb-6">プロジェクトを編集</h1>
        <ProjectForm
          mode="edit"
          initial={project}
          onSaved={(p) => {
            setProject(p);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          {project.category && (
            <p className="mt-1 text-sm text-black/50 dark:text-white/50">{project.category}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md border border-black/15 dark:border-white/15 px-3 py-1.5 text-sm font-medium"
          >
            編集
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md border border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            削除
          </button>
        </div>
      </div>

      {project.repo_url && (
        <a
          href={project.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-blue-600 dark:text-blue-400 underline"
        >
          {project.repo_url}
        </a>
      )}

      {project.todo && (
        <Section title="次にやること・TODO">
          <p className="whitespace-pre-wrap text-sm">{project.todo}</p>
        </Section>
      )}

      {project.memo && (
        <Section title="メモ">
          <p className="whitespace-pre-wrap text-sm">{project.memo}</p>
        </Section>
      )}

      <Section title="Claude Code 連携">
        <p className="text-sm text-black/60 dark:text-white/60">
          このプロジェクトIDを、対象リポジトリのフック設定 (
          <code className="text-xs bg-black/5 dark:bg-white/10 rounded px-1">
            TRACKER_PROJECT_ID
          </code>
          ) に設定すると、Claude Codeセッション終了時に自動で更新ログが記録されます。
        </p>
        <button
          onClick={copyId}
          className="mt-2 rounded-md border border-black/15 dark:border-white/15 px-2 py-1 text-xs font-mono"
        >
          {copied ? "コピーしました" : project.id}
        </button>
      </Section>

      <Section title={`更新履歴 (${logs.length})`}>
        <form onSubmit={handleAddLog} className="flex gap-2 mb-4">
          <input
            className="input flex-1"
            placeholder="更新内容を記録..."
            value={newLog}
            onChange={(e) => setNewLog(e.target.value)}
          />
          <button
            type="submit"
            disabled={submittingLog || !newLog.trim()}
            className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            追加
          </button>
        </form>

        {logs.length === 0 ? (
          <p className="text-sm text-black/40 dark:text-white/40">まだ更新履歴がありません。</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {logs.map((log) => (
              <li key={log.id} className="border-l-2 border-black/10 dark:border-white/10 pl-3">
                <div className="flex items-center gap-2 text-xs text-black/40 dark:text-white/40">
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      log.source === "claude-code"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        : "bg-black/5 dark:bg-white/10"
                    }`}
                  >
                    {log.source === "claude-code" ? "Claude Code" : "手動"}
                  </span>
                </div>
                <p className="text-sm mt-0.5">{log.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 pt-6 border-t border-black/10 dark:border-white/10">
      <h2 className="text-sm font-semibold text-black/60 dark:text-white/60 mb-2">{title}</h2>
      {children}
    </div>
  );
}
