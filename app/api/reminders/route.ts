import { NextResponse } from "next/server";
import { createReminder } from "@/lib/data/reminders";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reminderFormSchema } from "@/lib/validators/reminder";

export async function POST(request: Request) {
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
