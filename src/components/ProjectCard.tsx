import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatRelativeTime } from "@/lib/format";
import { Project } from "@/lib/types";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg border border-black/10 dark:border-white/10 p-4 hover:border-black/30 dark:hover:border-white/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base">{project.name}</h3>
        <StatusBadge status={project.status} />
      </div>
      {project.category && (
        <p className="mt-1 text-xs text-black/50 dark:text-white/50">{project.category}</p>
      )}
      {project.todo && (
        <p className="mt-2 text-sm text-black/70 dark:text-white/70 line-clamp-2">
          次: {project.todo}
        </p>
      )}
      <p className="mt-3 text-xs text-black/40 dark:text-white/40">
        最終更新: {formatRelativeTime(project.updated_at)}
      </p>
    </Link>
  );
}
