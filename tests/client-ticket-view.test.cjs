/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const { loadTs } = require("./helpers/load-ts.cjs");

const {
  fetchClientTicketDetail,
  TicketDetailRequestError,
} = loadTs("features/client-ticket/services/ticket-detail-api.ts");

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

const ticket = {
  id: "00000000-0000-4000-8000-000000000001",
  ticket_number: "TCK-2026-00001",
  full_name: "Test Client",
  email: "client@example.com",
  user_type: "subscriber",
  service: "Internet",
  subject: "Connection issue",
  description: "Connection drops during video calls.",
  priority: "high",
  status: "open",
  consent_given: true,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-02T00:00:00Z",
};

test("ticket detail client normalizes omitted optional relations", async () => {
  global.fetch = async () => Response.json({ data: ticket });

  const result = await fetchClientTicketDetail(ticket.ticket_number);

  assert.deepEqual(result.messages, []);
  assert.deepEqual(result.attachments, []);
});

test("ticket detail client preserves valid relation data", async () => {
  const messages = [
    {
      sender_type: "admin",
      body: "We are investigating the issue.",
      created_at: "2026-10-01T01:00:00Z",
    },
  ];
  const attachments = [
    {
      file_name: "router-log.txt",
      file_type: "text/plain",
      file_size: 512,
    },
  ];
  global.fetch = async () => Response.json({ data: { ...ticket, messages, attachments } });

  const result = await fetchClientTicketDetail(ticket.ticket_number);

  assert.deepEqual(result.messages, messages);
  assert.deepEqual(result.attachments, attachments);
});

test("ticket detail client rejects malformed relation data", async () => {
  global.fetch = async () =>
    Response.json({ data: { ...ticket, messages: "invalid", attachments: [] } });

  await assert.rejects(
    fetchClientTicketDetail(ticket.ticket_number),
    (error) =>
      error instanceof TicketDetailRequestError &&
      error.kind === "server" &&
      error.status === 200,
  );
});

test("ticket detail client maps documented response statuses", async (t) => {
  const cases = [
    { status: 400, kind: "unavailable" },
    { status: 401, kind: "unauthorized" },
    { status: 404, kind: "unavailable" },
    { status: 500, kind: "server" },
  ];

  for (const { status, kind } of cases) {
    await t.test(`${status} maps to ${kind}`, async () => {
      global.fetch = async () => Response.json({ error: "Request failed" }, { status });

      await assert.rejects(
        fetchClientTicketDetail(ticket.ticket_number),
        (error) =>
          error instanceof TicketDetailRequestError &&
          error.kind === kind &&
          error.status === status,
      );
    });
  }
});

test("ticket detail client distinguishes network failures and cancellations", async (t) => {
  await t.test("network failure", async () => {
    global.fetch = async () => {
      throw new TypeError("Failed to fetch");
    };

    await assert.rejects(
      fetchClientTicketDetail(ticket.ticket_number),
      (error) => error instanceof TicketDetailRequestError && error.kind === "network",
    );
  });

  await t.test("request cancellation", async () => {
    global.fetch = async () => {
      throw new DOMException("The operation was aborted", "AbortError");
    };

    await assert.rejects(
      fetchClientTicketDetail(ticket.ticket_number),
      (error) => error instanceof Error && error.name === "AbortError",
    );
  });
});
