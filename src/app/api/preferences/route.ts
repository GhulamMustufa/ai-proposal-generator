import { NextResponse } from "next/server";
import { createActionClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("default_keywords, display_name, bio, skills, hourly_rate, experience_years")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    default_keywords: data?.default_keywords ?? "",
    display_name: data?.display_name ?? "",
    bio: data?.bio ?? "",
    skills: data?.skills ?? "",
    hourly_rate: data?.hourly_rate ?? "",
    experience_years: data?.experience_years ?? null,
  });
}

export async function PUT(request: Request) {
  const supabase = await createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    default_keywords?: unknown;
    display_name?: unknown;
    bio?: unknown;
    skills?: unknown;
    hourly_rate?: unknown;
    experience_years?: unknown;
  };

  const defaultKeywords =
    typeof body.default_keywords === "string" ? body.default_keywords.trim() : undefined;
  const displayName =
    typeof body.display_name === "string" ? body.display_name.trim() : undefined;
  const bio = typeof body.bio === "string" ? body.bio.trim() : undefined;
  const skills = typeof body.skills === "string" ? body.skills.trim() : undefined;
  const hourlyRate =
    typeof body.hourly_rate === "string" ? body.hourly_rate.trim() : undefined;
  const experienceYears =
    typeof body.experience_years === "number" && Number.isFinite(body.experience_years)
      ? Math.max(0, Math.round(body.experience_years))
      : body.experience_years === null
        ? null
        : undefined;

  const updates: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };
  if (defaultKeywords !== undefined) updates.default_keywords = defaultKeywords;
  if (displayName !== undefined) updates.display_name = displayName || null;
  if (bio !== undefined) updates.bio = bio || null;
  if (skills !== undefined) updates.skills = skills || null;
  if (hourlyRate !== undefined) updates.hourly_rate = hourlyRate || null;
  if (experienceYears !== undefined) updates.experience_years = experienceYears;

  const { error } = await supabase
    .from("user_preferences")
    .upsert(updates, { onConflict: "user_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
