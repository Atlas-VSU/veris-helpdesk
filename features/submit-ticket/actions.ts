"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { createTicketSchema } from "@/features/tickets/schemas/ticket";

export async function submitTicketAction(formData: FormData) {
  const supabase = getSupabaseServerClient();

  const rawData = {
    full_name: formData.get("fullName") as string,
    email: formData.get("email") as string,
    user_type: formData.get("userType") as string,
    service: formData.get("service") as string,
    subject: formData.get("subject") as string,
    description: formData.get("description") as string,
    priority: formData.get("priority") as string,
    consent_given: formData.get("consent") === "on",
  };

  // 1. Validate ticket fields (Zod)
  const parsed = createTicketSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Invalid ticket data." };
  }
  const ticketDataParsed = parsed.data;

  // 2. Validate file (size and type)
  const file = formData.get("attachment") as File | null;
  const hasFile = file && file.size > 0;
  
  if (hasFile) {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return { error: "File size exceeds 10MB limit." };
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return { error: "File type not allowed. Please upload an image or PDF." };
    }
  }

  // 3. Insert ticket to database
  const { data: ticketData, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      full_name: ticketDataParsed.full_name,
      email: ticketDataParsed.email,
      user_type: ticketDataParsed.user_type,
      service: ticketDataParsed.service,
      subject: ticketDataParsed.subject,
      description: ticketDataParsed.description,
      priority: ticketDataParsed.priority,
      consent_given: ticketDataParsed.consent_given,
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

  // 4. Upload file to storage
  if (hasFile) {
    const timestamp = Date.now();
    const storagePath = `${ticketId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      
      // Delete the ticket to prevent duplicate tickets on failure
      await supabase.from("tickets").delete().eq("id", ticketId);
      
      return { error: "Failed to upload attachment. Please try again." };
    }

    // 5. Insert attachment record
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
      await supabase.storage.from("attachments").remove([storagePath]);
      await supabase.from("tickets").delete().eq("id", ticketId);
      return { error: "Failed to save attachment info. Please try again." };
    }
  }

  return { success: true, ticketNumber };
}
