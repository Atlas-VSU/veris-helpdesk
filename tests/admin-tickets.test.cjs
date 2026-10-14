/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const jwt = require("jsonwebtoken");
const { NextRequest } = require("next/server");
const { createClient } = require("@supabase/supabase-js");
const { loadTs } = require("./helpers/load-ts.cjs");

const ticket = {
  id: "00000000-0000-0000-0000-000000000001",
  ticket_number: "TCK-2026-00001", full_name: "Test Client", email: "client@example.com",
  user_type: "subscriber", service: "Internet", subject: "Connection issue",
  description: "Connection drops", priority: "high", status: "open", consent_given: true,
  created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z",
};

test("admin ticket API contract and database requests", async (t) => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "admin-ticket-api-test-secret";
  t.after(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });
  t.mock.method(console, "error", () => {});
  const adminToken = jwt.sign({ adminId: "admin-123" }, process.env.JWT_SECRET, { expiresIn: "24h" });

  function setup(token = adminToken, cookieName = "admin_session") {
    const calls = [];
    const reply = { body: [ticket], status: 200, total: 27 };
    // Use the real Supabase query builder and intercept only its network transport.
    const client = createClient("https://database.example", "test-key", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: async (url, options) => {
          calls.push({ url: new URL(url), method: options.method, body: options.body, headers: new Headers(options.headers) });
          return new Response(JSON.stringify(reply.body), {
            status: reply.status,
            headers: { "Content-Type": "application/json", "Content-Range": `0-0/${reply.total}` },
          });
        },
      },
    });
    const mocks = {
      "next/headers": {
        cookies: async () => new NextRequest("https://helpdesk.example", {
          headers: token ? { cookie: `${cookieName}=${token}` } : {},
        }).cookies,
      },
      "@/lib/supabase-server": { getSupabaseServerClient: () => client },
    };
    return {
      ...loadTs("app/api/admin/tickets/route.ts", mocks),
      ...loadTs("app/api/admin/tickets/[ticketNumber]/route.ts", mocks),
      calls, reply,
    };
  }
  const listRequest = (query = "") => new Request(`https://helpdesk.example/api/admin/tickets${query ? `?${query}` : ""}`);
  const patchRequest = (body) => new Request(`https://helpdesk.example/api/admin/tickets/${ticket.ticket_number}`, {
    method: "PATCH", body: JSON.stringify(body),
  });
  const context = (ticketNumber = ticket.ticket_number) => ({ params: Promise.resolve({ ticketNumber }) });

  await t.test("direct handler calls reject missing, invalid, expired, and client sessions", async () => {
    const tokens = [
      "", "invalid", jwt.sign({ adminId: "admin-123" }, "wrong-secret"),
      jwt.sign({ adminId: "admin-123" }, process.env.JWT_SECRET, { expiresIn: -1 }),
      jwt.sign({ email: "client@example.com", role: "client" }, process.env.JWT_SECRET),
      jwt.sign({ adminId: "admin-123", role: "client" }, process.env.JWT_SECRET),
      jwt.sign({ email: "admin@example.com" }, process.env.JWT_SECRET),
    ];
    for (const token of tokens) {
      const api = setup(token);
      const list = await api.GET(listRequest("page=bad"));
      assert.equal(list.status, 401);
      assert.deepEqual(await list.json(), { error: "Unauthorized" });
      const patch = await api.PATCH(new Request("https://helpdesk.example", { method: "PATCH", body: "bad JSON" }), context("bad"));
      assert.equal(patch.status, 401);
      assert.deepEqual(await patch.json(), { error: "Unauthorized" });
      assert.equal(api.calls.length, 0);
    }
    const clientCookie = setup(adminToken, "client_session");
    assert.equal((await clientCookie.GET(listRequest())).status, 401);
    assert.equal((await clientCookie.PATCH(patchRequest({ status: "open" }), context())).status, 401);
    assert.equal(clientCookie.calls.length, 0);
  });

  await t.test("list uses contract defaults, exact count, and stable newest-first ordering", async () => {
    const api = setup();
    const response = await api.GET(listRequest());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: [ticket], page: 1, pageSize: 10, total: 27 });
    const call = api.calls[0];
    assert.equal(call.method, "GET");
    assert.equal(call.url.pathname, "/rest/v1/tickets");
    assert.equal(call.url.searchParams.get("order"), "created_at.desc,id.desc");
    assert.equal(call.url.searchParams.get("offset"), "0");
    assert.equal(call.url.searchParams.get("limit"), "10");
    assert.ok(call.headers.get("prefer").includes("count=exact"));
  });

  await t.test("filters combine with search and pagination; maximum page size is accepted", async () => {
    const api = setup();
    const response = await api.GET(listRequest("status=open&priority=high&q=connection&page=2&pageSize=50"));
    assert.deepEqual(await response.json(), { data: [ticket], page: 2, pageSize: 50, total: 27 });
    const params = api.calls[0].url.searchParams;
    assert.equal(params.get("status"), "eq.open");
    assert.equal(params.get("priority"), "eq.high");
    assert.equal(params.get("or"), '(subject.imatch."connection",ticket_number.imatch."connection")');
    assert.equal(params.get("offset"), "50");
    assert.equal(params.get("limit"), "50");
  });

  await t.test("search treats regex, wildcards, quotes, and filter syntax as literal text", async () => {
    const api = setup();
    const search = 'TCK-2026.*,priority.eq.urgent)%_"\\[a]+$';
    await api.GET(listRequest(new URLSearchParams({ q: search }).toString()));
    const condition = api.calls[0].url.searchParams.get("or");
    const match = condition.match(/^\(subject\.imatch\.("(?:[^"\\]|\\.)*"),ticket_number\.imatch\.("(?:[^"\\]|\\.)*")\)$/s);
    assert.ok(match, "Search must remain inside two quoted filter values");
    assert.equal(match[1], match[2]);
    const regex = new RegExp(JSON.parse(match[1]), "i");
    assert.equal(regex.test(`prefix ${search.toLowerCase()} suffix`), true);
    assert.equal(regex.test("TCK-2026-anything"), false);
  });

  await t.test("invalid filters and pagination return 400 without database access", async () => {
    const api = setup();
    for (const query of ["status=invalid", "priority=invalid", "page=0", "page=-1", "page=1.5", "page=", "page=nope", "page=0x10", "pageSize=0", "pageSize=51", "pageSize=2.5", "pageSize=", "page=9007199254740992", "page=9007199254740991&pageSize=50"]) {
      const response = await api.GET(listRequest(query));
      assert.equal(response.status, 400, query);
      assert.equal(typeof (await response.json()).error, "string");
    }
    assert.equal(api.calls.length, 0);
  });

  await t.test("no matching tickets returns an empty page with zero total", async () => {
    const api = setup();
    api.reply.body = [];
    api.reply.total = 0;
    const response = await api.GET(listRequest("status=closed"));
    assert.deepEqual(await response.json(), { data: [], page: 1, pageSize: 10, total: 0 });
  });

  await t.test("database range errors use the contract's 400 response", async () => {
    const api = setup();
    api.reply.status = 416;
    api.reply.body = { code: "PGRST103", message: "Requested range not satisfiable" };
    assert.equal((await api.GET(listRequest("page=100"))).status, 400);
  });

  await t.test("PATCH supports status, priority, and both without changing other fields", async () => {
    for (const body of [{ status: "resolved" }, { priority: "urgent" }, { status: "in_progress", priority: "low" }]) {
      const api = setup();
      api.reply.body = [{ ...ticket, ...body }];
      const response = await api.PATCH(patchRequest(body), context());
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { data: { ...ticket, ...body } });
      const call = api.calls[0];
      assert.equal(call.method, "PATCH");
      assert.equal(call.url.searchParams.get("ticket_number"), `eq.${ticket.ticket_number}`);
      assert.deepEqual(JSON.parse(call.body), body);
      assert.ok(call.headers.get("prefer").includes("return=representation"));
    }
  });

  await t.test("PATCH rejects invalid JSON, ticket numbers, empty and unauthorized fields", async () => {
    const api = setup();
    for (const body of [{}, [], null, { status: "bad" }, { priority: "bad" }, { status: null }, { priority: null }, { email: "attacker@example.com" }, { status: "open", subject: "changed" }]) {
      assert.equal((await api.PATCH(patchRequest(body), context())).status, 400, JSON.stringify(body));
    }
    for (const number of ["bad", "TCK-2026-00001-extra", "TCK-26-00001"]) {
      assert.equal((await api.PATCH(patchRequest({ status: "open" }), context(number))).status, 400);
    }
    assert.equal((await api.PATCH(new Request("https://helpdesk.example", { method: "PATCH", body: "bad JSON" }), context())).status, 400);
    assert.equal(api.calls.length, 0);
  });

  await t.test("PATCH returns the documented 404 for a missing ticket", async () => {
    const api = setup();
    api.reply.body = [];
    const response = await api.PATCH(patchRequest({ status: "closed" }), context());
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "Ticket not found" });
  });

  await t.test("database failures return JSON 500 without exposing database details", async () => {
    const api = setup();
    api.reply.status = 500;
    api.reply.body = { code: "XX000", message: "Private database details" };
    for (const response of [await api.GET(listRequest()), await api.PATCH(patchRequest({ status: "open" }), context())]) {
      assert.equal(response.status, 500);
      const body = await response.json();
      assert.equal(typeof body.error, "string");
      assert.equal(JSON.stringify(body).includes("Private database details"), false);
    }
  });
});
