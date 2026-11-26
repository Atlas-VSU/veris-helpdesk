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

type DashboardCountsRow =
  Database["public"]["Functions"]["get_admin_dashboard_counts"]["Returns"][number];

const STATUS_COUNT_COLUMNS: Record<TicketStatus, keyof DashboardCountsRow> = {
  new: "new_count",
  open: "open_count",
  in_progress: "in_progress_count",
  waiting_for_client: "waiting_for_client_count",
  resolved: "resolved_count",
  closed: "closed_count",
};

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

  if (
    !Number.isInteger(recentLimit) ||
    recentLimit < 1 ||
    recentLimit > MAX_RECENT_TICKETS_LIMIT
  ) {
    throw new RangeError(
      `recentLimit must be an integer between 1 and ${MAX_RECENT_TICKETS_LIMIT}`,
    );
  }

  return recentLimit;
}

function requireCount(
  row: Record<string, unknown>,
  field: keyof DashboardCountsRow,
): number {
  const value = row[field];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`Missing or invalid dashboard count: ${field}`);
  }
  return value;
}

function parseDashboardCounts(data: unknown): {
  totalTickets: number;
  urgentTickets: number;
  statusCounts: TicketStatusCounts;
} {
  if (!Array.isArray(data) || data.length !== 1) {
    throw new Error(
      "Dashboard counts query returned an invalid or empty response",
    );
  }

  const row = data[0];
  if (row === null || typeof row !== "object") {
    throw new Error("Dashboard counts query returned an invalid row");
  }

  const record = row as Record<string, unknown>;
  const statusCounts = {} as TicketStatusCounts;
  for (const status of TICKET_STATUSES) {
    statusCounts[status] = requireCount(record, STATUS_COUNT_COLUMNS[status]);
  }

  return {
    totalTickets: requireCount(record, "total_tickets"),
    urgentTickets: requireCount(record, "urgent_tickets"),
    statusCounts,
  };
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

  const [countsResult, recentResult] = await Promise.all([
    supabase.rpc("get_admin_dashboard_counts"),
    supabase
      .from("tickets")
      .select(RECENT_TICKET_SELECT)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(recentLimit),
  ]);

  if (countsResult.error) throw countsResult.error;
  if (recentResult.error) throw recentResult.error;

  const { totalTickets, urgentTickets, statusCounts } = parseDashboardCounts(
    countsResult.data,
  );

  if (!Array.isArray(recentResult.data)) {
    throw new Error(
      "Recent tickets query returned an invalid or empty response",
    );
  }

  return {
    totalTickets,
    urgentTickets,
    statusCounts,
    recentTickets: recentResult.data,
  };
}
