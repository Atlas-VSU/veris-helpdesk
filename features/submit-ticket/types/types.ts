import type { TicketPriority, UserType } from "@/types/database";

export type ContactMethod = "Email" | "Phone";

export type TicketFormData = {
  fullName: string;
  email: string;
  userType: UserType;
  service: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  contactMethod: ContactMethod;
  consent: boolean;
};