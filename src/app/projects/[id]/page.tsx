import { notFound } from "next/navigation";
import ProjectDetail from "@/components/ProjectDetail";
import { getProject, listLogs } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  const logs = listLogs(id);

  return <ProjectDetail initialProject={project} initialLogs={logs} />;
}
