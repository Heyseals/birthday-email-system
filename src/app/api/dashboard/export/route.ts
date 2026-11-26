import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  const [{ data: customers }, { data: cards }] = await Promise.all([
    adminClient
      .from("customers")
      .select(
        "id, full_name, email, birth_month, birth_day, status, custom_message, sender_name, card_id, personalized_card_path, created_at, updated_at"
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    adminClient
      .from("cards")
      .select("id, title, image_path, is_public, created_at, updated_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const customerIds = (customers ?? []).map((c) => c.id);
  let emailLogs: unknown[] = [];
  if (customerIds.length > 0) {
    const { data: logs } = await adminClient
      .from("email_log")
      .select("id, customer_id, recipient_email, sent_year, status, is_test, sent_at")
      .in("customer_id", customerIds)
      .order("sent_at", { ascending: false });
    emailLogs = logs ?? [];
  }

  const exportPayload = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    customers: customers ?? [],
    cards: cards ?? [],
    email_log: emailLogs,
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="my-birthday-data.json"',
    },
  });
}
