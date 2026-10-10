// features/admin-tickets/services/mock.ts
// Static mock data used when the API is unavailable or for Storybook.
// Matches the Ticket shape from openapi.yaml.

import type { Ticket } from "../types";

export const MOCK_TICKETS: Ticket[] = [
    {
        id: "a1b2c3d4-0001-0000-0000-000000000001",
        ticket_number: "TCK-2026-00042",
        full_name: "Eleanor Vance",
        email: "eleanor.vance@example.com",
        user_type: "subscriber",
        service: "Billing Portal",
        subject: "Cannot access billing portal after password reset",
        description:
            "I reset my password yesterday but it still says invalid credentials when I try to log in to the billing portal.",
        priority: "high",
        status: "open",
        consent_given: true,
        created_at: "2026-10-09T13:10:00Z",
        updated_at: "2026-10-09T13:20:00Z",
    },
    {
        id: "a1b2c3d4-0002-0000-0000-000000000002",
        ticket_number: "TCK-2026-00041",
        full_name: "TechCorp Inc.",
        email: "devops@techcorp.example.com",
        user_type: "subscriber",
        service: "API Integration",
        subject: "API integration failing on endpoint /v2/users",
        description:
            "Getting a 500 internal server error consistently since this morning's update.",
        priority: "medium",
        status: "in_progress",
        consent_given: true,
        created_at: "2026-10-09T11:00:00Z",
        updated_at: "2026-10-09T13:00:00Z",
    },
    {
        id: "a1b2c3d4-0003-0000-0000-000000000003",
        ticket_number: "TCK-2026-00039",
        full_name: "John Doe",
        email: "john.doe@example.com",
        user_type: "student",
        service: "Finance",
        subject: "Requesting copy of Q3 invoice",
        description: "Please send the final invoice for Q3 services.",
        priority: "low",
        status: "resolved",
        consent_given: true,
        created_at: "2026-10-08T08:00:00Z",
        updated_at: "2026-10-08T15:30:00Z",
    },
    {
        id: "a1b2c3d4-0004-0000-0000-000000000004",
        ticket_number: "TCK-2026-00038",
        full_name: "Maria Santos",
        email: "m.santos@example.com",
        user_type: "student",
        service: "Account Access",
        subject: "Account locked after multiple failed login attempts",
        description:
            "I tried to log in several times and now my account is locked. I need urgent access.",
        priority: "urgent",
        status: "new",
        consent_given: true,
        created_at: "2026-10-09T12:45:00Z",
        updated_at: "2026-10-09T12:45:00Z",
    },
    {
        id: "a1b2c3d4-0005-0000-0000-000000000005",
        ticket_number: "TCK-2026-00037",
        full_name: "Carlos Mendez",
        email: "c.mendez@example.com",
        user_type: "subscriber",
        service: "Technical Support",
        subject: "Dashboard widgets not loading on Safari",
        description:
            "The analytics widgets on the dashboard refuse to render on Safari 17. Works on Chrome.",
        priority: "medium",
        status: "waiting_for_client",
        consent_given: true,
        created_at: "2026-10-07T09:00:00Z",
        updated_at: "2026-10-09T10:00:00Z",
    },
    {
        id: "a1b2c3d4-0006-0000-0000-000000000006",
        ticket_number: "TCK-2026-00036",
        full_name: "Aisha Bello",
        email: "aisha.bello@example.com",
        user_type: "student",
        service: "General Inquiry",
        subject: "How to update billing address",
        description:
            "I recently moved and need to update my billing address for future invoices.",
        priority: "low",
        status: "closed",
        consent_given: true,
        created_at: "2026-10-06T14:00:00Z",
        updated_at: "2026-10-07T09:00:00Z",
    },
];

export const MOCK_TOTAL = MOCK_TICKETS.length;

import type { AdminTicketsQuery, AdminTicketsResponse } from "../types";

/** Helper to filter and paginate mock tickets for offline development */
export function getMockTickets(query: AdminTicketsQuery = {}): AdminTicketsResponse {
    let filtered = [...MOCK_TICKETS];

    if (query.status) {
        filtered = filtered.filter((t) => t.status === query.status);
    }
    if (query.priority) {
        filtered = filtered.filter((t) => t.priority === query.priority);
    }
    if (query.q) {
        const q = query.q.toLowerCase();
        filtered = filtered.filter(
            (t) =>
                t.ticket_number.toLowerCase().includes(q) ||
                t.subject.toLowerCase().includes(q) ||
                t.full_name.toLowerCase().includes(q) ||
                t.email.toLowerCase().includes(q)
        );
    }

    const total = filtered.length;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
        data,
        page,
        pageSize,
        total,
    };
}