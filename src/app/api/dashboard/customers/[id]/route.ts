import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMaxDaysInMonth } from "@/types/database";

const updateCustomerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อ")
    .max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร")
    .optional(),
  birth_month: z.number().int().min(1).max(12).optional(),
  birth_day: z.number().int().min(1).max(31).optional(),
  custom_message: z.string().trim().max(500).nullable().optional(),
  status: z.enum(["confirmed", "paused"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();
  const { data: existing, error: fetchError } = await adminClient
    .from("customers")
    .select("id, owner_id, status, birth_month, birth_day")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "ไม่พบรายการที่ต้องการ" }, { status: 404 });
  }

  if (existing.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ห้ามเปลี่ยน status จาก 'pending' หรือ 'unsubscribed' เป็น 'confirmed'
  if (parsed.data.status !== undefined) {
    if (existing.status !== "confirmed" && existing.status !== "paused") {
      return NextResponse.json(
        {
          error:
            "ไม่สามารถเปลี่ยนสถานะได้ เนื่องจากรายการนี้ยังไม่ยืนยันอีเมลหรือถูกยกเลิกไปแล้ว",
        },
        { status: 400 }
      );
    }
  }

  const nextMonth = parsed.data.birth_month ?? existing.birth_month;
  const nextDay = parsed.data.birth_day ?? existing.birth_day;
  if (nextDay > getMaxDaysInMonth(nextMonth)) {
    return NextResponse.json(
      { error: "วันเกิดไม่สอดคล้องกับเดือนที่เลือก" },
      { status: 400 }
    );
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.full_name !== undefined) {
    updatePayload.full_name = parsed.data.full_name;
  }
  if (parsed.data.birth_month !== undefined) {
    updatePayload.birth_month = parsed.data.birth_month;
  }
  if (parsed.data.birth_day !== undefined) {
    updatePayload.birth_day = parsed.data.birth_day;
  }
  if (parsed.data.custom_message !== undefined) {
    updatePayload.custom_message = parsed.data.custom_message;
  }
  if (parsed.data.status !== undefined) {
    updatePayload.status = parsed.data.status;
  }

  const { data: updated, error: updateError } = await adminClient
    .from("customers")
    .update(updatePayload)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตข้อมูลได้" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, customer: updated });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { error: deleteError } = await adminClient
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: "ไม่สามารถลบรายการได้" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
