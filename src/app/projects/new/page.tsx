import ProjectForm from "@/components/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6">新規プロジェクト</h1>
      <ProjectForm mode="create" />
    </div>
  );
}
