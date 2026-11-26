import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const normalizedEmail = user.email.trim().toLowerCase();
  const adminClient = createAdminClient();

  const { data: claimed, error } = await adminClient
    .from("customers")
    .update({
      owner_id: user.id,
      updated_at: new Date().toISOString(),
    })
    .is("owner_id", null)
    .ilike("email", normalizedEmail)
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: "ไม่สามารถผูกข้อมูลเก่าได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    claimedCount: claimed?.length ?? 0,
  });
}
