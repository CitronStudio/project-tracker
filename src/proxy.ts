import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  // No password configured (e.g. local dev) -> auth disabled.
  if (!password) return NextResponse.next();

  const username = process.env.APP_USERNAME || "admin";
  const header = req.headers.get("authorization");

  if (header?.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    const user = decoded.slice(0, separatorIndex);
    const pass = decoded.slice(separatorIndex + 1);
    if (user === username && pass === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="project-tracker"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
