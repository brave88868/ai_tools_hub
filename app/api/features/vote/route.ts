import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { feature_id } = await req.json();

    if (!feature_id) {
      return NextResponse.json({ error: "feature_id required" }, { status: 400 });
    }

    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Login required to vote" }, { status: 401 });
    }

    const admin = createAdminClient();

    // 插入投票（unique 约束防重复）
    const { error: voteError } = await admin.from("feature_votes").insert({
      feature_id,
      user_id: user.id,
    });

    if (voteError) {
      if (voteError.code === "23505") {
        return NextResponse.json({ error: "Already voted" }, { status: 409 });
      }
      return NextResponse.json({ error: "Vote failed" }, { status: 500 });
    }

    // votes +1
    const { data: feature } = await admin
      .from("features")
      .select("votes")
      .eq("id", feature_id)
      .single();

    await admin
      .from("features")
      .update({ votes: (feature?.votes ?? 0) + 1 })
      .eq("id", feature_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[features/vote]", err);
    return NextResponse.json({ error: "Vote failed" }, { status: 500 });
  }
}
