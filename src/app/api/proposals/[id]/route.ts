import { NextResponse } from "next/server";
import { createActionClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["draft", "sent", "interview", "won", "lost"] as const;
type Status = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { status?: unknown };
  const status = body.status as Status;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { error } = await supabase
    .from("proposals")
    .update({ status })
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status });
}
