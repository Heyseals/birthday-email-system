"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMaxDaysInMonth } from "@/types/database";

export type CustomerMutationState = {
  error: string | null;
  successId: string | null;
};

async function requireAdminClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub || claims.is_anonymous === true) {
    return null;
  }

  return supabase;
}

function parseCustomerFormData(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const birthMonth = Number(formData.get("birth_month"));
  const birthDay = Number(formData.get("birth_day"));
  const consentGiven = formData.get("consent_given") === "on";
  const unsubscribed = formData.get("unsubscribed") === "on";

  if (!fullName) {
    return { error: "กรุณากรอกชื่อ-นามสกุลลูกค้า" } as const;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "กรุณากรอกรูปแบบอีเมลให้ถูกต้อง" } as const;
  }

  if (!Number.isInteger(birthMonth) || birthMonth < 1 || birthMonth > 12) {
    return { error: "กรุณาเลือกเดือนเกิดให้ถูกต้อง (1–12)" } as const;
  }

  const maxDays = getMaxDaysInMonth(birthMonth);
  if (!Number.isInteger(birthDay) || birthDay < 1 || birthDay > maxDays) {
    return {
      error: `วันที่เกิดไม่ถูกต้องสำหรับเดือนที่เลือก (1–${maxDays})`,
    } as const;
  }

  return {
    data: {
      full_name: fullName,
      email,
      birth_month: birthMonth,
      birth_day: birthDay,
      consent_given: consentGiven,
      unsubscribed,
    },
  } as const;
}

export async function createCustomerAction(
  _prevState: CustomerMutationState,
  formData: FormData
): Promise<CustomerMutationState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return {
      error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
      successId: null,
    };
  }

  const parsed = parseCustomerFormData(formData);
  if ("error" in parsed) {
    return { error: parsed.error ?? "ข้อมูลไม่ถูกต้อง", successId: null };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      ...parsed.data,
      consent_at: parsed.data.consent_given ? now : null,
      unsubscribed_at: parsed.data.unsubscribed ? now : null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "อีเมลนี้มีอยู่ในระบบแล้ว", successId: null };
    }
    return { error: "ไม่สามารถเพิ่มลูกค้าได้ กรุณาลองใหม่", successId: null };
  }

  revalidatePath("/admin");
  return { error: null, successId: data.id };
}

export async function updateCustomerAction(
  _prevState: CustomerMutationState,
  formData: FormData
): Promise<CustomerMutationState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return {
      error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
      successId: null,
    };
  }

  const customerId = String(formData.get("id") ?? "").trim();
  if (!customerId) {
    return { error: "ไม่พบรหัสลูกค้าที่ต้องการแก้ไข", successId: null };
  }

  const parsed = parseCustomerFormData(formData);
  if ("error" in parsed) {
    return { error: parsed.error ?? "ข้อมูลไม่ถูกต้อง", successId: null };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("customers")
    .select("consent_given, consent_at, unsubscribed, unsubscribed_at")
    .eq("id", customerId)
    .single();

  if (fetchError || !existing) {
    return { error: "ไม่พบข้อมูลลูกค้าในระบบ", successId: null };
  }

  const now = new Date().toISOString();
  const consentAt = parsed.data.consent_given
    ? existing.consent_at ?? now
    : null;
  const unsubscribedAt = parsed.data.unsubscribed
    ? existing.unsubscribed_at ?? now
    : null;

  const { error } = await supabase
    .from("customers")
    .update({
      ...parsed.data,
      consent_at: consentAt,
      unsubscribed_at: unsubscribedAt,
    })
    .eq("id", customerId);

  if (error) {
    if (error.code === "23505") {
      return { error: "อีเมลนี้ถูกใช้งานโดยลูกค้ารายอื่นแล้ว", successId: null };
    }
    return { error: "ไม่สามารถบันทึกการแก้ไขได้ กรุณาลองใหม่", successId: null };
  }

  revalidatePath("/admin");
  return { error: null, successId: `${customerId}-${Date.now()}` };
}

export async function deleteCustomerAction(
  customerId: string
): Promise<{ error: string | null }> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง" };
  }

  if (!customerId) {
    return { error: "ไม่พบรหัสลูกค้าที่ต้องการลบ" };
  }

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) {
    return { error: "ไม่สามารถลบข้อมูลลูกค้าได้ กรุณาลองใหม่" };
  }

  revalidatePath("/admin");
  return { error: null };
}
