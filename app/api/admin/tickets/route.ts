import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { adminTicketsQuerySchema } from "@/features/admin/schemas/ticket";

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const result = adminTicketsQuerySchema.safeParse(Object.fromEntries(params));
  if (!result.success) {
    return NextResponse.json({ error: "Invalid ticket filters or pagination" }, { status: 400 });
  }

  try {
    const { status, priority, q, page, pageSize } = result.data;
    let query = getSupabaseServerClient()
      .from("tickets")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);
    if (q) {
      // Escape regex syntax to match literal text, and quote the filter value.
      const pattern = JSON.stringify(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      query = query.or(`subject.imatch.${pattern},ticket_number.imatch.${pattern}`);
    }

    const start = (page - 1) * pageSize;
    const { data, count, error } = await query.range(start, start + pageSize - 1);
    if (error?.code === "PGRST103") {
      return NextResponse.json({ error: "Page is out of range" }, { status: 400 });
    }
    if (error) throw error;
    return NextResponse.json({ data: data ?? [], page, pageSize, total: count ?? 0 });
  } catch (error) {
    console.error("Admin ticket list error:", error);
    return NextResponse.json({ error: "Unable to load tickets" }, { status: 500 });
  }
}
