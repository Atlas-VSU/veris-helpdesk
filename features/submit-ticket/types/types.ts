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

export type BaseFieldProps = {
  id: string;
  label: string;
};

export type FieldLabelProps = {
  id: string;
  children: ReactNode;
};

export type TextFieldProps = BaseFieldProps & {
  name: string;
  value: string;
  placeholder: string;
  type?: "text" | "email";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export type SelectFieldProps = BaseFieldProps & {
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
};

export type TextAreaFieldProps = BaseFieldProps & {
  value: string;
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

export type FileUploadFieldProps = {
  fileName: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export type TicketFormProps = {
  formData: TicketFormData;
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
  email: string;
  description: string;
  ticketNumber: string;
  onSubmitAnother: () => void;
};