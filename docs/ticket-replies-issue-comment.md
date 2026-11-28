Gian, the client and admin reply endpoints use the following contract for UI wiring. Send the existing session cookie with each request.

| Caller | POST path | Request |
| --- | --- | --- |
| Verified ticket owner | `/api/tickets/{ticketNumber}/messages` | JSON with exactly one field, e.g. `{"body":"The issue is still happening."}` |
| Signed-in admin | `/api/admin/tickets/{ticketNumber}/messages` | `FormData` with one text field named `body` and an optional `File` named `attachment`. Use multipart for text-only admin replies too. |

Both endpoints trim the body and accept 1–5,000 characters. The server derives the sender from the session. For an admin attachment, pass one non-empty JPG, PNG, or PDF up to 10 MiB. Let the browser set the multipart boundary.

**A successful save returns HTTP 201.** This example shows an admin reply with one file.

```json
{
  "data": {
    "id": "17151769-2598-45ec-99f5-141279c288a1",
    "sender_type": "admin",
    "body": "I've attached the refund confirmation.",
    "created_at": "2026-11-26T04:00:00Z",
    "attachments": [{
      "id": "3e2f70f2-be91-4f09-8281-f06d24922e9c",
      "message_id": "17151769-2598-45ec-99f5-141279c288a1",
      "file_name": "refund-confirmation.pdf",
      "file_type": "application/pdf",
      "file_size": 24576
    }]
  }
}
```

Client replies use `sender_type: "client"`. Text-only replies return `attachments: []`. Append the saved reply using its server ID or refresh the corresponding ticket detail GET. A 201 confirms the reply was saved even if downstream email or inbox delivery failed.

| HTTP | UI handling |
| --- | --- |
| 400 | Display the returned `error` string. A closed ticket returns `Ticket is closed.` |
| 401 | Prompt for client verification or admin sign-in. |
| 404 | Show ticket unavailable. A client gets the same response for another owner's ticket. |
| 429 | Keep the draft and ask the client to retry later. The quota is 10 requests per five minutes per verified email, across tickets. |
| 500 | Keep the draft. Refresh the thread before retrying if the save outcome is unclear. |

The full request, response, and error definitions are in `docs/openapi.yaml` under `createClientTicketMessage` and `adminCreateTicketMessage`.
