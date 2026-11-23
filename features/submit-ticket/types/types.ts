import type { TicketPriority, UserType } from "@/types/database";
import type { ChangeEvent, DragEvent, FormEvent, ReactNode } from "react";

export type TicketFormData = {
  fullName: string;
  email: string;
  userType: UserType;
  service: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  consent: boolean;
};

export type TicketFormErrors = Partial<Record<
  "fullName" | "email" | "service" | "subject" | "description" | "priority" | "attachment" | "consent" | "captcha",
  string
>>;

export type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileWidgetProps = {
  onError: (message: string) => void;
  onTokenChange: (token: string) => void;
  resetKey: number;
};

export type TurnstileVerificationResult = {
  success: boolean;
  action?: string;
};

export type RejectedAttachment = {
  name: string;
  error: string;
};

export type SubmitTicketActionResult =
  | {
      success: true;
      ticketNumber: string;
      error?: undefined;
      captchaError?: undefined;
    }
  | {
      success?: false;
      error: string;
      captchaError?: boolean;
      ticketNumber?: undefined;
    };

export type UserTypeOption = {
  value: UserType;
  label: string;
};

export type PriorityOption = {
  value: TicketPriority;
  label: string;
  description: string;
  dotClassName: string;
  selectedClassName: string;
};

export type FileUploadFieldProps = {
  fileName: string;
  fileSize: number | null;
  fileInputKey: number;
  isRejected: boolean;
  isValidating?: boolean;
  previewUrl: string | null;
  error?: string;
  onChange: (file: File | null) => void;
  onClear: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

export type TicketFormProps = {
  formData: TicketFormData;
  errors: TicketFormErrors;
  attachmentPreviewUrl: string | null;
  fileName: string;
  fileSize: number | null;
  fileInputKey: number;
  hasDraftContent: boolean;
  isAttachmentRejected: boolean;
  isValidatingAttachment: boolean;
  isSubmitting: boolean;
  onInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: "userType" | "service" | "priority", value: string | null) => void;
  onConsentChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (file: File | null) => void;
  onClearFile: () => void;
  onDropFile: (event: DragEvent<HTMLDivElement>) => void;
  captchaResetKey: number;
  onCaptchaError: (message: string) => void;
  onCaptchaTokenChange: (token: string) => void;
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
