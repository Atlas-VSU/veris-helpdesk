import type { TicketFormData } from "@/features/submit-ticket/types/types";
import type { TicketPriority, UserType } from "@/types/database";

export const TICKET_FORM_DRAFT_KEY = "veris:submit-ticket-draft";

export const INITIAL_TICKET_FORM_DATA: TicketFormData = {
  fullName: "",
  email: "",
  userType: "subscriber",
  service: "",
  subject: "",
  description: "",
  priority: "low",
  consent: false,
};

const VALID_USER_TYPES: ReadonlySet<UserType> = new Set(["subscriber", "student"]);
const VALID_PRIORITIES: ReadonlySet<TicketPriority> = new Set(["low", "medium", "high", "urgent"]);

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSnapshot: TicketFormData = INITIAL_TICKET_FORM_DATA;

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function parseDraft(raw: string | null, fallback: TicketFormData): TicketFormData | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

    const record = parsed as Record<string, unknown>;
    return {
      fullName: typeof record.fullName === "string" ? record.fullName : fallback.fullName,
      email: typeof record.email === "string" ? record.email : fallback.email,
      userType:
        typeof record.userType === "string" && VALID_USER_TYPES.has(record.userType as UserType)
          ? (record.userType as UserType)
          : fallback.userType,
      service: typeof record.service === "string" ? record.service : fallback.service,
      subject: typeof record.subject === "string" ? record.subject : fallback.subject,
      description: typeof record.description === "string" ? record.description : fallback.description,
      priority:
        typeof record.priority === "string" && VALID_PRIORITIES.has(record.priority as TicketPriority)
          ? (record.priority as TicketPriority)
          : fallback.priority,
      consent: typeof record.consent === "boolean" ? record.consent : fallback.consent,
    };
  } catch {
    return null;
  }
}

export function readTicketFormDraft(fallback: TicketFormData = INITIAL_TICKET_FORM_DATA): TicketFormData | null {
  if (typeof window === "undefined") return null;

  try {
    return parseDraft(window.sessionStorage.getItem(TICKET_FORM_DRAFT_KEY), fallback);
  } catch {
    return null;
  }
}

export function subscribeToTicketFormDraft(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTicketFormDraftServerSnapshot(): TicketFormData {
  return INITIAL_TICKET_FORM_DATA;
}

export function getTicketFormDraftSnapshot(): TicketFormData {
  if (typeof window === "undefined") return INITIAL_TICKET_FORM_DATA;

  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(TICKET_FORM_DRAFT_KEY);
  } catch {
    return cachedSnapshot;
  }

  if (raw === cachedRaw) return cachedSnapshot;

  cachedRaw = raw;
  cachedSnapshot = parseDraft(raw, INITIAL_TICKET_FORM_DATA) ?? INITIAL_TICKET_FORM_DATA;
  return cachedSnapshot;
}

export function writeTicketFormDraft(data: TicketFormData): void {
  const serialized = JSON.stringify(data);
  cachedRaw = serialized;
  cachedSnapshot = data;

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(TICKET_FORM_DRAFT_KEY, serialized);
    } catch {
      // Ignore storage quota or private browsing errors.
    }
  }

  notifyListeners();
}

export function clearTicketFormDraft(): void {
  cachedRaw = null;
  cachedSnapshot = INITIAL_TICKET_FORM_DATA;

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(TICKET_FORM_DRAFT_KEY);
    } catch {
      // Ignore storage access errors.
    }
  }

  notifyListeners();
}
