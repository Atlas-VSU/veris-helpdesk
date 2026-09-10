import { createTicketSchema } from "@/features/tickets/schemas/ticket";
import type { TicketFormData } from "@/features/submit-ticket/types/types";

export async function submitTicket(formData: TicketFormData) {
  const ticketPayload = {
    full_name: formData.fullName,
    email: formData.email,
    user_type: formData.userType,
    service: formData.service,
    subject: formData.subject,
    description: formData.description,
    priority: formData.priority,
    consent_given: formData.consent,
  };
  const validation = createTicketSchema.safeParse(ticketPayload);

  if (!validation.success) {
    throw new Error(validation.error.issues[0]?.message ?? "Please check your ticket details");
  }

  const response = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validation.data),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "Unable to submit ticket");
  }

  return result.ticketNumber as string;
}
