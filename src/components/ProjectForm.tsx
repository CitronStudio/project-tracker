"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PROJECT_STATUSES, Project, ProjectStatus } from "@/lib/types";

interface Props {
  mode: "create" | "edit";
  initial?: Project;
  onSaved?: (project: Project) => void;
  onCancel?: () => void;
}

export default function ProjectForm({ mode, initial, onSaved, onCancel }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [repoUrl, setRepoUrl] = useState(initial?.repo_url ?? "");
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? "未着手");
  const [todo, setTodo] = useState(initial?.todo ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("プロジェクト名は必須です");
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      name: name.trim(),
      category: category.trim() || null,
      repo_url: repoUrl.trim() || null,
      status,
      todo: todo.trim() || null,
      memo: memo.trim() || null,
    };

    const url = mode === "create" ? "/api/projects" : `/api/projects/${initial!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "保存に失敗しました");
      return;
    }

    const project: Project = await res.json();
    if (onSaved) {
      onSaved(project);
    } else {
      router.push(`/projects/${project.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Field label="プロジェクト名 *">
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: りさだむ杯"
          required
        />
      </Field>

      <Field label="カテゴリ">
        <input
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="例: イベント運営"
        />
      </Field>

      <Field label="関連リポジトリ / URL">
        <input
          className="input"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/..."
        />
      </Field>

      <Field label="ステータス">
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field label="次にやること・TODO">
        <textarea
          className="input"
          rows={3}
          value={todo}
          onChange={(e) => setTodo(e.target.value)}
        />
      </Field>

      <Field label="自由メモ">
        <textarea
          className="input"
          rows={5}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </Field>

      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "保存中..." : "保存"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-black/70 dark:text-white/70">{label}</span>
      {children}
    </label>
  );
}
