"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function confirmUnsubscribeAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    redirect("/unsubscribe?status=invalid");
  }

  const supabase = createAdminClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, unsubscribed")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (error || !customer) {
    redirect("/unsubscribe?status=invalid");
  }

  if (customer.unsubscribed) {
    redirect(`/unsubscribe?token=${encodeURIComponent(token)}&done=already`);
  }

  const { error: updateError } = await supabase
    .from("customers")
    .update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
      status: "unsubscribed",
    })
    .eq("id", customer.id);

  if (updateError) {
    redirect(`/unsubscribe?token=${encodeURIComponent(token)}&done=error`);
  }

  redirect(`/unsubscribe?token=${encodeURIComponent(token)}&done=success`);
}
