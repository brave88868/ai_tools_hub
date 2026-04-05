import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, name } = body;

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM ?? "noreply@aitoolsstation.com";

  if (!resendKey) {
    console.log(`[send-welcome] RESEND_API_KEY not configured, skipping email to ${email}`);
    return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" });
  }

  const greeting = name ? `Hi ${name}` : "Hi there";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: "Welcome to AI Tools Hub — Your free tools are ready",
        text: `${greeting},

You now have access to 72+ free AI tools.
Get started: https://aitoolsstation.com/toolkits

You have 3 free uses per day, or upgrade to Pro for 100/day.

Best,
AI Tools Hub Team`,
        html: `<p>${greeting},</p>
<p>You now have access to <strong>72+ free AI tools</strong>.</p>
<p><a href="https://aitoolsstation.com/toolkits">Get started →</a></p>
<p>You have <strong>3 free uses per day</strong>, or <a href="https://aitoolsstation.com/pricing">upgrade to Pro</a> for 100/day.</p>
<br>
<p>Best,<br>AI Tools Hub Team</p>`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[send-welcome] Resend error:", err);
      return NextResponse.json({ sent: false, error: err }, { status: 500 });
    }

    const data = await res.json();
    console.log("[send-welcome] Sent to:", email, "id:", data.id);
    return NextResponse.json({ sent: true, id: data.id });

  } catch (err) {
    console.error("[send-welcome] fetch error:", err);
    // 静默失败，不影响注册流程
    return NextResponse.json({ sent: false }, { status: 200 });
  }
}
