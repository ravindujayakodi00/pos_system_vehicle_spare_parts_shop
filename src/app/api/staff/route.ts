import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const DEFAULT_PASSWORD = "default@123";

// POST /api/staff — Create auth user + staff row
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, role_id } = body;

    if (!name || !phone || !email || !role_id) {
      return NextResponse.json(
        { error: "Name, phone, email, and role are required" },
        { status: 400 }
      );
    }

    // 1. Create Supabase Auth user with default password
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Create staff row linked to the auth user
    const { data: staff, error: staffError } = await supabaseAdmin
      .from("staff")
      .insert({
        user_id: authData.user.id,
        name,
        phone,
        email,
        role_id,
        is_active: true,
      })
      .select("*, role:roles(*)")
      .single();

    if (staffError) {
      // Rollback: delete the auth user if staff row creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: staffError.message }, { status: 400 });
    }

    return NextResponse.json(staff, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
