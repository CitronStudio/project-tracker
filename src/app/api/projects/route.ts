import { NextRequest, NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/repo";
import { PROJECT_STATUSES } from "@/lib/types";

export async function GET() {
  return NextResponse.json(listProjects());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (body.status && !PROJECT_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const project = createProject(body);
  return NextResponse.json(project, { status: 201 });
}
