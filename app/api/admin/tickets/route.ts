import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { adminTicketsQuerySchema } from "@/features/admin/schemas/ticket";
import { errorResponse, handleApiError } from "@/lib/api-error";

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return errorResponse(401, "Unauthorized");
  }

  const params = new URL(request.url).searchParams;
  const result = adminTicketsQuerySchema.safeParse(Object.fromEntries(params));
  if (!result.success) {
    return errorResponse(400, "Invalid ticket filters or pagination");
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
    if (error) throw error;
    return NextResponse.json({ data: data ?? [], page, pageSize, total: count ?? 0 });
  } catch (error) {
    return handleApiError(error, {
      context: "Admin ticket list error",
      fallbackMessage: "Unable to load tickets",
    });
  }
}
