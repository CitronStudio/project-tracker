import { ProjectStatus } from "@/lib/types";

const STYLES: Record<ProjectStatus, string> = {
  未着手: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  進行中: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  一時停止: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  完了: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
