/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const jwt = require("jsonwebtoken");
const { NextRequest } = require("next/server");
const { createClient } = require("@supabase/supabase-js");
const { loadTs } = require("./helpers/load-ts.cjs");

const OPENAPI_TICKET_FIELDS = [
  "id",
  "ticket_number",
  "full_name",
  "email",
  "user_type",
  "service",
  "subject",
  "description",
  "priority",
  "status",
  "consent_given",
  "created_at",
  "updated_at",
];

const clientTicketNewest = {
  id: "00000000-0000-4000-8000-000000000002",
  ticket_number: "TCK-2026-00002",
  full_name: "Alex Reyes",
  email: "alex@example.com",
  user_type: "subscriber",
  service: "Billing",
  subject: "Duplicate charge",
  description: "My subscription was charged twice.",
  priority: "medium",
  status: "open",
  consent_given: true,
  created_at: "2026-11-26T03:00:00Z",
  updated_at: "2026-11-26T03:10:00Z",
};

const clientTicketOlder = {
  id: "00000000-0000-4000-8000-000000000001",
  ticket_number: "TCK-2026-00001",
  full_name: "Alex Reyes",
  email: "alex@example.com",
  user_type: "subscriber",
  service: "Technical Support",
  subject: "Router setup",
  description: "Need help configuring Wi-Fi.",
  priority: "low",
  status: "open",
  consent_given: true,
  created_at: "2026-11-20T03:00:00Z",
  updated_at: "2026-11-20T03:10:00Z",
};

test("client ticket list API contract and query behavior", async (t) => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "client-ticket-list-test-secret";
  t.after(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const clientToken = jwt.sign(
    { email: "alex@example.com", role: "client" },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  );

  function setup(token = clientToken, cookieName = "client_session") {
    const calls = [];
    const reply = { body: [clientTicketNewest, clientTicketOlder], status: 200 };
    const client = createClient("https://database.example", "test-key", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: async (url, options) => {
          calls.push({ url: new URL(url), method: options.method });
          return new Response(JSON.stringify(reply.body), {
            status: reply.status,
            headers: { "Content-Type": "application/json" },
          });
        },
      },
    });
    const mocks = {
      "next/headers": {
        cookies: async () =>
          new NextRequest("https://helpdesk.example", {
            headers: token ? { cookie: `${cookieName}=${token}` } : {},
          }).cookies,
      },
      "@/lib/supabase-server": { getSupabaseServerClient: () => client },
    };
    return {
      ...loadTs("app/api/tickets/route.ts", mocks),
      calls,
      reply,
    };
  }

  const listRequest = (query = "") =>
    new Request(`https://helpdesk.example/api/tickets${query ? `?${query}` : ""}`);

  await t.test("returns 401 without a valid client session", async () => {
    const tokens = [
      "",
      "invalid",
      jwt.sign({ email: "alex@example.com", role: "client" }, "wrong-secret"),
      jwt.sign({ email: "alex@example.com", role: "client" }, process.env.JWT_SECRET, {
        expiresIn: -1,
      }),
      jwt.sign({ adminId: "admin-123" }, process.env.JWT_SECRET),
    ];

    for (const token of tokens) {
      const api = setup(token);
      const response = await api.GET(listRequest());
      assert.equal(response.status, 401);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.deepEqual(await response.json(), { error: "Unauthorized" });
      assert.equal(api.calls.length, 0);
    }
  });

  await t.test("returns 400 for an invalid status filter", async () => {
    const api = setup();
    const response = await api.GET(listRequest("status=invalid_status"));

    assert.equal(response.status, 400);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await response.json(), { error: "Invalid ticket status" });
    assert.equal(api.calls.length, 0);
  });

  await t.test("selects all OpenAPI Ticket fields scoped to client email newest first", async () => {
    const api = setup();
    const response = await api.GET(listRequest());

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    const body = await response.json();
    assert.deepEqual(body, { data: [clientTicketNewest, clientTicketOlder] });
    for (const field of OPENAPI_TICKET_FIELDS) {
      assert.ok(field in body.data[0], `missing OpenAPI Ticket field: ${field}`);
    }

    assert.equal(api.calls.length, 1);
    const params = api.calls[0].url.searchParams;
    assert.deepEqual(
      params.get("select").split(","),
      OPENAPI_TICKET_FIELDS,
    );
    assert.equal(params.get("email"), "ilike.alex@example.com");
    assert.equal(params.get("order"), "created_at.desc");
  });

  await t.test("combines status filter and case-insensitive q search on subject and ticket_number", async () => {
    const api = setup();

    const bySubject = await api.GET(listRequest("status=open&q=DUPLICATE"));
    assert.equal(bySubject.status, 200);
    assert.deepEqual(await bySubject.json(), { data: [clientTicketNewest] });
    assert.equal(api.calls[0].url.searchParams.get("status"), "eq.open");

    const byNumber = await api.GET(listRequest("status=open&q=tck-2026-00001"));
    assert.equal(byNumber.status, 200);
    assert.deepEqual(await byNumber.json(), { data: [clientTicketOlder] });
  });
});
