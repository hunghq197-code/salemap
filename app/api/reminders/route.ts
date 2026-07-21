import { NextResponse } from "next/server";
import { createReminder } from "@/lib/data/reminders";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reminderFormSchema } from "@/lib/validators/reminder";

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "reminder-create",
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reminderFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const reminderId = await createReminder(parsed.data);

  return NextResponse.json({ ok: true, reminderId });
}
