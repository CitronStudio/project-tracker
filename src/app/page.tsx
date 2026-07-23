import Dashboard from "@/components/Dashboard";
import { listProjects } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default function Home() {
  const projects = listProjects();
  return <Dashboard projects={projects} />;
}
