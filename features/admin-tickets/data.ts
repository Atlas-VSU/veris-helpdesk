// features/admin-tickets/data.ts
// Fetch helpers that call GET /api/admin/tickets.
// All params are optional; only those explicitly provided are forwarded.

import type { AdminTicketsQuery, AdminTicketsResponse } from "./types";

export async function fetchAdminTickets(
  query: AdminTicketsQuery = {}
): Promise<AdminTicketsResponse> {
  const params = new URLSearchParams();

  if (query.status) params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  if (query.page != null) params.set("page", String(query.page));
  if (query.pageSize != null) params.set("pageSize", String(query.pageSize));

  const qs = params.toString();
  const url = `/api/admin/tickets${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { credentials: "include" });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<AdminTicketsResponse>;
}
