import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const { name, email, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email, message });

  if (error) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "noreply@aitoolsstation.com",
        to: "temporary202509@gmail.com",
        subject: `New Contact: ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      });
    } catch (e) {
      console.error("Email send failed:", e);
    }
  }

  return NextResponse.json({ success: true });
}
