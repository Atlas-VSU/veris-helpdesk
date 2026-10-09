/*
    tickets/ — Contains admin-facing routes for viewing, filtering, searching, assigning, and managing support tickets.
    
    page.tsx under tickets/ — Renders the main admin ticket list or ticket management table.
*/

import { TicketsView } from "@/features/admin-tickets";

export default function AdminTicketsPage() {
  return <TicketsView />;
}
