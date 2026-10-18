"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClientTicketDetail } from "@/features/client-ticket/schemas/ticket-detail";
import {
  fetchClientTicketDetail,
  TicketDetailRequestError,
} from "@/features/client-ticket/services/ticket-detail-api";

type TicketDetailState =
  | { kind: "loading" }
  | { kind: "ready"; ticket: ClientTicketDetail }
  | { kind: "unauthorized" }
  | { kind: "unavailable" }
  | { kind: "error"; reason: "network" | "server" };

export function useClientTicketDetail(ticketNumber: string) {
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState<TicketDetailState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    let isCurrentRequest = true;

    fetchClientTicketDetail(ticketNumber, controller.signal)
      .then((ticket) => {
        if (isCurrentRequest) setState({ kind: "ready", ticket });
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest || (error instanceof Error && error.name === "AbortError")) {
          return;
        }

        if (error instanceof TicketDetailRequestError) {
          if (error.kind === "unauthorized") {
            setState({ kind: "unauthorized" });
            return;
          }

          if (error.kind === "unavailable") {
            setState({ kind: "unavailable" });
            return;
          }

          setState({ kind: "error", reason: error.kind });
          return;
        }

        setState({ kind: "error", reason: "server" });
      });

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [requestVersion, ticketNumber]);

  const retry = useCallback(() => {
    setState({ kind: "loading" });
    setRequestVersion((version) => version + 1);
  }, []);

  return { state, retry };
}
