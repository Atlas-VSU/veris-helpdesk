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
          const call = { url: new URL(url), method: options.method, body: options.body, headers: new Headers(options.headers) };
          calls.push(call);
          const body = typeof reply.body === "function" ? reply.body(call) : reply.body;
          return new Response(JSON.stringify(body), {
            status: reply.status,
            headers: { "Content-Type": "application/json", "Content-Range": `0-0/${reply.total}` },
          });
        },
      },
    });
    const mocks = {
      "server-only": {},
      "next/headers": {
        cookies: async () => new NextRequest("https://helpdesk.example", {
          headers: token ? { cookie: `${cookieName}=${token}` } : {},
        }).cookies,
      },
      "@/lib/supabase-server": { getSupabaseServerClient: () => client },
    };
    const detail = loadTs("app/api/admin/tickets/[ticketNumber]/route.ts", mocks);
    return {
      GET: loadTs("app/api/admin/tickets/route.ts", mocks).GET,
      getDetail: detail.GET,
      PATCH: detail.PATCH,
      calls, reply,
    };
  }
  const listRequest = (query = "") => new Request(`https://helpdesk.example/api/admin/tickets${query ? `?${query}` : ""}`);
  const patchRequest = (body) => new Request(`https://helpdesk.example/api/admin/tickets/${ticket.ticket_number}`, {
    method: "PATCH", body: JSON.stringify(body),
  });
  const context = (ticketNumber = ticket.ticket_number) => ({ params: Promise.resolve({ ticketNumber }) });
  const detailRequest = () => new Request(`https://helpdesk.example/api/admin/tickets/${ticket.ticket_number}`);

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
      const detail = await api.getDetail(detailRequest(), context("bad"));
      assert.equal(detail.status, 401);
      assert.deepEqual(await detail.json(), { error: "Unauthorized" });
      const patch = await api.PATCH(new Request("https://helpdesk.example", { method: "PATCH", body: "bad JSON" }), context("bad"));
      assert.equal(patch.status, 401);
      assert.deepEqual(await patch.json(), { error: "Unauthorized" });
      assert.equal(api.calls.length, 0);
    }
    const clientCookie = setup(adminToken, "client_session");
    assert.equal((await clientCookie.GET(listRequest())).status, 401);
    assert.equal((await clientCookie.getDetail(detailRequest(), context())).status, 401);
    assert.equal((await clientCookie.PATCH(patchRequest({ status: "open" }), context())).status, 401);
    assert.equal(clientCookie.calls.length, 0);
  });

  await t.test("detail selects the chronological thread and associates files with their replies", async () => {
    const api = setup();
    const message = {
      id: "565fa917-be6e-4ddd-a0c8-def4628aeb6e", sender_type: "admin",
      body: "Refund attached.", created_at: "2026-10-02T00:00:00Z",
    };
    const file = {
      id: "cf101adb-d35d-4052-a418-6c359189156a", message_id: null,
      file_name: "statement.pdf", file_type: "application/pdf", file_size: 512,
    };
    const detail = { ...ticket, messages: [message], attachments: [
      file, { ...file, id: "3e2f70f2-be91-4f09-8281-f06d24922e9c", message_id: message.id },
    ] };
    api.reply.body = [detail];
    const response = await api.getDetail(detailRequest(), context());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.deepEqual(await response.json(), { data: detail });
    assert.equal(api.calls.length, 1);
    const [call] = api.calls;
    assert.equal(call.method, "GET");
    assert.equal(call.url.pathname, "/rest/v1/tickets");
    const params = call.url.searchParams;
    assert.equal(params.get("ticket_number"), `eq.${ticket.ticket_number}`);
    assert.equal(params.has("email"), false);
    assert.equal(params.get("messages.order"), "created_at.asc,id.asc");
    assert.equal(params.get("select"), Object.keys(ticket).join(",") +
      ",messages(id,sender_type,body,created_at),attachments(id,message_id,file_name,file_type,file_size)");
  });

  await t.test("detail distinguishes invalid numbers, missing tickets and tickets without replies", async () => {
    const api = setup();
    const invalid = await api.getDetail(detailRequest(), context("TCK-26-00001"));
    assert.equal(invalid.status, 400);
    assert.deepEqual(await invalid.json(), { error: "Invalid ticket number" });
    assert.equal(api.calls.length, 0);

    api.reply.body = [];
    const missing = await api.getDetail(detailRequest(), context());
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: "Ticket not found" });

    const detail = { ...ticket, messages: [], attachments: [] };
    api.reply.body = [detail];
    const empty = await api.getDetail(detailRequest(), context());
    assert.equal(empty.status, 200);
    assert.deepEqual(await empty.json(), { data: detail });
  });

  await t.test("detail reads beyond the database row limit on either embedded relation", async () => {
    for (const relation of ["messages", "attachments"]) {
      const api = setup();
      const rows = Array.from({ length: 1001 }, (_, i) => ({ id: String(i) }));
      const thread = { messages: [], attachments: [], [relation]: rows };
      api.reply.body = ({ url }) => {
        const offset = Number(url.searchParams.get(`${relation}.offset`));
        const limit = Number(url.searchParams.get(`${relation}.limit`));
        assert.equal(url.searchParams.get(`${relation}.order`), "created_at.asc,id.asc");
        return [{ ...ticket, ...thread, [relation]: rows.slice(offset, offset + limit) }];
      };
      const response = await api.getDetail(detailRequest(), context());
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { data: { ...ticket, ...thread } });
      assert.equal(api.calls.length, 2);
    }
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
    for (const response of [await api.GET(listRequest()), await api.getDetail(detailRequest(), context()), await api.PATCH(patchRequest({ status: "open" }), context())]) {
      assert.equal(response.status, 500);
      const body = await response.json();
      assert.equal(typeof body.error, "string");
      assert.equal(JSON.stringify(body).includes("Private database details"), false);
    }
  });
});
