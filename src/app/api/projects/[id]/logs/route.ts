import { NextRequest, NextResponse } from "next/server";
import { addLog, getProject, listLogs } from "@/lib/repo";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(listLogs(id));
}

// Called both from the web UI (manual log entry) and from the Claude Code
// session hook in other repos (auto log entry) — see scripts/claude-hook-report.sh.
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.summary !== "string" || !body.summary.trim()) {
    return NextResponse.json({ error: "summary is required" }, { status: 400 });
  }
  const source = body.source === "claude-code" ? "claude-code" : "manual";
  const log = addLog(id, body.summary.trim(), source);
  return NextResponse.json(log, { status: 201 });
}
