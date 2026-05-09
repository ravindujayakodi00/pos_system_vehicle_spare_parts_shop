import { NextRequest, NextResponse } from "next/server";

const EMAIL_MODE = process.env.EMAIL_MODE ?? "development";

export async function POST(request: NextRequest) {
  const { to, subject, html } = await request.json();

  if (!to || !subject || !html) {
    return NextResponse.json(
      { error: "Missing required fields: to, subject, html" },
      { status: 400 }
    );
  }

  if (EMAIL_MODE === "development") {
    console.log("[Email - Dev mode]", { to, subject });
    return NextResponse.json({ success: true, mode: "development" });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
