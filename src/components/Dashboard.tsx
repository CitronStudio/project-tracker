"use client";

import { useMemo, useState } from "react";
import { PROJECT_STATUSES, Project, ProjectStatus } from "@/lib/types";
import ProjectCard from "./ProjectCard";

export default function Dashboard({ projects }: { projects: Project[] }) {
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) if (p.category) set.add(p.category);
    return Array.from(set).sort();
  }, [projects]);

  const filtered = projects.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-wrap gap-1.5">
          <FilterButton
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            label="すべて"
          />
          {PROJECT_STATUSES.map((s) => (
            <FilterButton
              key={s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              label={s}
            />
          ))}
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <FilterButton
              active={categoryFilter === "all"}
              onClick={() => setCategoryFilter("all")}
              label="全カテゴリ"
            />
            {categories.map((c) => (
              <FilterButton
                key={c}
                active={categoryFilter === c}
                onClick={() => setCategoryFilter(c)}
                label={c}
              />
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-black/50 dark:text-white/50 text-sm">
          該当するプロジェクトがありません。
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm border transition-colors ${
        active
          ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
          : "border-black/15 dark:border-white/15 hover:border-black/40 dark:hover:border-white/40"
      }`}
    >
      {label}
    </button>
  );
}
