import { NextResponse } from "next/server";
import { runDiagnostics } from "@/lib/diagnostics/run-diagnostics";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const report = await runDiagnostics({
    supabase,
    userId: user.id,
  });

  return NextResponse.json(report);
}
