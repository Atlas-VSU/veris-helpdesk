import type { TicketPriority, UserType } from "@/types/database";
import type { ChangeEvent, FormEvent, ReactNode } from "react";

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

export type TicketFormErrors = Partial<Record<
  "fullName" | "email" | "service" | "subject" | "description" | "priority" | "consent",
  string
>>;

export type FileUploadFieldProps = {
  fileName: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export type TicketFormProps = {
  formData: TicketFormData;
  errors: TicketFormErrors;
  fileName: string;
  isSubmitting: boolean;
  onInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onConsentChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export type TicketSuccessStateProps = {
  ticketNumber: string;
  email: string;
  subject: string;
  service: string;
  priority: TicketPriority;
  description: string;
  onSubmitAnother: () => void;
};

export type FieldWithLabelProps = {
  id: string;
  label: ReactNode;
  children: ReactNode;
  withSelectIcon?: boolean;
};
