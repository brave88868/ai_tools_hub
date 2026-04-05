import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { title, description, toolkit } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("features")
      .insert({
        title: title.trim(),
        description: description?.trim() ?? null,
        toolkit: toolkit ?? null,
        status: "open",
        votes: 0,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[features/submit]", error);
      return NextResponse.json({ error: "Submit failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("[features/submit]", err);
    return NextResponse.json({ error: "Submit failed" }, { status: 500 });
  }
}
