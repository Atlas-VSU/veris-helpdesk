import "server-only";

import { getAdminSession } from "@/lib/admin-auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { Constants, type Database } from "@/types/supabase";

export type TicketStatus = Database["public"]["Enums"]["ticket_status"];
export type TicketPriority = Database["public"]["Enums"]["priority_level"];
export type TicketStatusCounts = Record<TicketStatus, number>;

export const TICKET_STATUSES: readonly TicketStatus[] =
  Constants.public.Enums.ticket_status;

export const DEFAULT_RECENT_TICKETS_LIMIT = 5;
export const MAX_RECENT_TICKETS_LIMIT = 20;

export interface DashboardRecentTicket {
  id: string;
  ticket_number: string;
  subject: string;
  full_name: string;
  service: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
}

export interface AdminDashboardData {
  totalTickets: number;
  urgentTickets: number;
  statusCounts: TicketStatusCounts;
  recentTickets: DashboardRecentTicket[];
}

export interface GetAdminDashboardDataOptions {
  recentLimit?: number;
}

export class UnauthorizedAdminError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedAdminError";
  }
}

const RECENT_TICKET_SELECT = `
  id,
  ticket_number,
  subject,
  full_name,
  service,
  priority,
  status,
  created_at
`;

function normalizeRecentLimit(recentLimit?: number): number {
  if (recentLimit === undefined) {
    return DEFAULT_RECENT_TICKETS_LIMIT;
  }

  if (!Number.isInteger(recentLimit) || recentLimit < 1 || recentLimit > MAX_RECENT_TICKETS_LIMIT) {
    throw new RangeError(
      `recentLimit must be an integer between 1 and ${MAX_RECENT_TICKETS_LIMIT}`,
    );
  }

  return recentLimit;
}

export async function getAdminDashboardData(
  options: GetAdminDashboardDataOptions = {},
): Promise<AdminDashboardData> {
  const session = await getAdminSession();
  if (!session) {
    throw new UnauthorizedAdminError();
  }

  const recentLimit = normalizeRecentLimit(options.recentLimit);
  const supabase = getSupabaseServerClient();

  const [totalResult, urgentResult, recentResult, ...statusResults] =
    await Promise.all([
      supabase.from("tickets").select("id", { count: "exact", head: true }),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("priority", "urgent"),
      supabase
        .from("tickets")
        .select(RECENT_TICKET_SELECT)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(recentLimit),
      ...TICKET_STATUSES.map((status) =>
        supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("status", status),
      ),
    ]);

  if (totalResult.error) throw totalResult.error;
  if (urgentResult.error) throw urgentResult.error;
  if (recentResult.error) throw recentResult.error;

  const statusCounts = {} as TicketStatusCounts;
  TICKET_STATUSES.forEach((status, index) => {
    const result = statusResults[index];
    if (result.error) throw result.error;
    statusCounts[status] = result.count ?? 0;
  });

  return {
    totalTickets: totalResult.count ?? 0,
    urgentTickets: urgentResult.count ?? 0,
    statusCounts,
    recentTickets: recentResult.data ?? [],
  };
}
