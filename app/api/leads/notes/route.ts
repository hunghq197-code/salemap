import { NextResponse } from "next/server";
import { createLeadNote } from "@/lib/data/lead-notes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { leadNoteFormSchema } from "@/lib/validators/lead-note";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = leadNoteFormSchema.safeParse({
    ...(typeof body === "object" && body ? body : {}),
    createReminder: Boolean(
      typeof body === "object" && body && "createReminder" in body
        ? body.createReminder
        : false,
    ),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  await createLeadNote(parsed.data);

  return NextResponse.json({ ok: true });
}
