export type AdminRow = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  created_at: string;
};

export type UserType = "subscriber" | "student";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketStatus =
  | "new"
  | "open"
  | "in_progress"
  | "waiting_for_client"
  | "resolved"
  | "closed";

export type Ticket = {
  id: string;
  ticket_number: string;
  full_name: string;
  email: string;
  user_type: UserType;
  service: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  consent_given: boolean;
  created_at: string;
  updated_at: string;
};

export type Attachment = {
  id: string;
  ticket_id: string;
  message_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
};

export type ThreadAttachment = {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
};

export type SavedAdminReply = {
  id: string;
  sender_type: "admin";
  body: string;
  created_at: string;
  attachments: ThreadAttachment[];
};

export type NotificationEventType = "new_ticket" | "client_reply";

export type NotificationRow = {
  id: string;
  ticket_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type AdminNotification = {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  ticket_number: string | null;
};




