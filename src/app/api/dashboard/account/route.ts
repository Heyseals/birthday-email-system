import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // 1. รวบรวม path รูปภาพใน Storage bucket 'cards' ที่เป็นของผู้ใช้
  const [{ data: userCards }, { data: userCustomers }] = await Promise.all([
    adminClient
      .from("cards")
      .select("id, image_path")
      .eq("owner_id", user.id),
    adminClient
      .from("customers")
      .select("id, personalized_card_path")
      .eq("owner_id", user.id),
  ]);

  const storagePaths = [
    ...(userCards ?? []).map((c) => c.image_path),
    ...(userCustomers ?? []).map((c) => c.personalized_card_path),
  ].filter((p): p is string => Boolean(p && p.trim().length > 0));

  if (storagePaths.length > 0) {
    await adminClient.storage.from("cards").remove(storagePaths);
  }

  // 2. ลบข้อมูลใน customers และ cards
  await Promise.all([
    adminClient.from("customers").delete().eq("owner_id", user.id),
    adminClient.from("cards").delete().eq("owner_id", user.id),
  ]);

  // 3. ลบบัญชีผู้ใช้ใน Supabase Auth
  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(
    user.id
  );

  if (deleteUserError) {
    return NextResponse.json(
      { error: "ไม่สามารถลบบัญชีผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
