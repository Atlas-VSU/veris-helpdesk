import {
  clientTicketDetailResponseSchema,
  type ClientTicketDetail,
} from "@/features/client-ticket/schemas/ticket-detail";

export type TicketDetailRequestErrorKind =
  | "unauthorized"
  | "unavailable"
  | "network"
  | "server";

export class TicketDetailRequestError extends Error {
  constructor(
    public readonly kind: TicketDetailRequestErrorKind,
    public readonly status?: number,
  ) {
    super(`Ticket detail request failed: ${kind}`);
    this.name = "TicketDetailRequestError";
  }
}

export async function fetchClientTicketDetail(
  ticketNumber: string,
  signal?: AbortSignal,
): Promise<ClientTicketDetail> {
  let response: Response;

  try {
    response = await fetch(`/api/tickets/${encodeURIComponent(ticketNumber)}`, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new TicketDetailRequestError("network");
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new TicketDetailRequestError("unauthorized", response.status);
    }

    if (response.status === 400 || response.status === 404) {
      throw new TicketDetailRequestError("unavailable", response.status);
    }

    throw new TicketDetailRequestError("server", response.status);
  }

  const payload: unknown = await response.json().catch(() => null);
  const result = clientTicketDetailResponseSchema.safeParse(payload);

  if (!result.success) {
    throw new TicketDetailRequestError("server", response.status);
  }

  return result.data.data;
}
