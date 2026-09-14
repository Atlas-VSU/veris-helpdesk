"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { TicketFormData } from "./types/types";

export async function submitTicketAction(formData: FormData) {
  const supabase = getSupabaseServerClient();

  // Extract text fields
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const userType = formData.get("userType") as "subscriber" | "student";
  const service = formData.get("service") as string;
  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as "low" | "medium" | "high" | "urgent";
  const consentGiven = formData.get("consent") === "on";

  // Validate required fields (basic validation)
  if (!fullName || !email || !service || !subject || !description) {
    return { error: "Missing required fields." };
  }

  // 1. Insert ticket
  const { data: ticketData, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      full_name: fullName,
      email,
      user_type: userType,
      service,
      subject,
      description,
      priority,
      consent_given: consentGiven,
      status: "new",
      ticket_number: "PENDING", // Overwritten by database trigger
    })
    .select("id, ticket_number")
    .single();

  if (ticketError) {
    console.error("Error creating ticket:", ticketError);
    return { error: "Failed to create ticket." };
  }

  const ticketId = ticketData.id;
  const ticketNumber = ticketData.ticket_number;

  // 2. Handle file upload if present
  const file = formData.get("attachment") as File | null;
  
  if (file && file.size > 0) {
    // Basic file validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return { error: "File size exceeds 5MB limit." };
    }

    const timestamp = Date.now();
    // Path structure: ticket_id/timestamp_filename
    const storagePath = `${ticketId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return { error: "Ticket created, but failed to upload attachment." };
    }

    // Insert attachment record
    const { error: attachmentError } = await supabase
      .from("attachments")
      .insert({
        ticket_id: ticketId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
      });

    if (attachmentError) {
      console.error("Error creating attachment record:", attachmentError);
      return { error: "Ticket created, but failed to save attachment info." };
    }
  }

  return { success: true, ticketNumber };
}
