/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTs } = require("./helpers/load-ts.cjs");

const ticketNumber = "TCK-2026-00001";
const context = (number = ticketNumber) => ({ params: Promise.resolve({ ticketNumber: number }) });
const url = "https://helpdesk.example";
const owner = "owner@example.com";
const ticket = { id: "ticket-id", email: owner, status: "open" };
const saved = { id: "reply-id", ticket_id: ticket.id, body: "Hello", created_at: "2026-11-28T00:00:00Z" };
const json = (value) => new Request(url, {
  method: "POST", body: JSON.stringify(value), headers: { "Content-Type": "application/json" },
});
function multipart(entries) {
  const form = new FormData();
  for (const [key, value] of entries) form.append(key, value);
  return new Request(url, { method: "POST", body: form });
}

function setup({ signedIn = true, limited = false, savedRow = saved, saveError = null,
  target = ticket, deliveryFails = false } = {}) {
  const calls = [];
  const afterResponse = [];
  async function deliver(kind, ...args) {
    calls.push([kind, ...args]);
    if (deliveryFails) throw new Error("delivery failed");
  }
  const apiErrors = loadTs("lib/api-error.ts");
  const { extractOptionalReplyAttachment } = loadTs("lib/reply-attachments.ts", { "@/lib/api-error": apiErrors });
  const mocks = {
    "next/server": { NextResponse: require("next/server").NextResponse, after: (callback) => afterResponse.push(callback) },
    "@/lib/api-error": apiErrors,
    "@/lib/client-auth": { getClientEmail: async () => signedIn ? owner : null },
    "@/lib/admin-auth": { getAdminSession: async () => signedIn ? { adminId: "admin-id" } : null },
    "@/lib/rate-limit": {
      clientReplyRateLimit: "reply-quota",
      checkAuthRateLimit: async (...args) => { calls.push(["limit", ...args]); return { success: !limited }; },
    },
    "@/lib/supabase-server": { getSupabaseServerClient: () => ({
      rpc(name, args) {
        calls.push([name, args]);
        return { maybeSingle: async () => ({ data: savedRow, error: saveError }) };
      },
      from(table) {
        assert.equal(table, "tickets");
        return { select: () => ({ eq: (key, value) => {
          assert.equal(key, "ticket_number");
          assert.equal(value, ticketNumber);
          calls.push(["lookup", value]);
          return { maybeSingle: async () => ({ data: target, error: null }) };
        } }) };
      },
    }) },
    "@/lib/reply-attachments": {
      extractOptionalReplyAttachment,
      persistAdminReplyWithAttachment: async (input) => {
        calls.push(["adminSave", input]);
        if (saveError) throw apiErrors.ApiError.internal("Failed to save attachment.");
        return { id: saved.id, body: input.body, sender_type: "admin", created_at: saved.created_at, attachments: [] };
      },
    },
    "@/lib/notifications": { recordClientReplyNotification: (...args) => deliver("inbox", ...args) },
    "@/lib/ticket-email": {
      sendClientReplyAdminAlert: (...args) => deliver("alert", ...args),
      sendAdminReplyNotice: (...args) => deliver("notice", ...args),
      getTicketEmailFailureReason: () => "Delivery failed",
    },
  };
  return {
    calls, afterResponse,
    client: loadTs("app/api/tickets/[ticketNumber]/messages/route.ts", mocks).POST,
    admin: loadTs("app/api/admin/tickets/[ticketNumber]/messages/route.ts", mocks).POST,
  };
}

test("missing sessions and malformed ticket numbers stop both routes before any database calls", async () => {
  for (const signedIn of [false, true]) {
    const api = setup({ signedIn });
    for (const post of [api.client, api.admin]) {
      const response = await post(json({}), context("invalid"));
      assert.equal(response.status, signedIn ? 400 : 401);
    }
    assert.deepEqual(api.calls, []);
    assert.equal(api.afterResponse.length, 0);
  }
});

test("client reply quota uses the verified email independently of the ticket", async () => {
  const api = setup({ limited: true });
  for (const number of [ticketNumber, "TCK-2026-00002"]) {
    const response = await api.client(json({ body: "Hello" }), context(number));
    assert.equal(response.status, 429);
    assert.deepEqual(await response.json(), { error: "Too many requests. Please try again later." });
  }
  assert.deepEqual(api.calls, Array(2).fill(["limit", "reply-quota", owner]));
});

test("reply validation rejects malformed input, impersonation and extra fields before saving", async () => {
  const api = setup();
  for (const input of [{}, { body: "  " }, { body: "x".repeat(5001) }, { body: 123 },
    { body: "hi", email: owner }, { body: "hi", sender_type: "admin" }, { body: "hi", attachment: "x" }]) {
    assert.equal((await api.client(json(input), context())).status, 400);
  }
  const malformed = new Request(url, { method: "POST", body: "{", headers: { "Content-Type": "application/json" } });
  assert.equal((await api.client(malformed, context())).status, 400);
  assert.equal((await api.client(multipart([["body", "hi"]]), context())).status, 400);
  assert.equal((await api.admin(json({ body: "hi" }), context())).status, 400);
  for (const entries of [[], [["body", " "]], [["body", "one"], ["body", "two"]],
    [["body", "hi"], ["admin_id", "other"]], [["body", "hi"], ["attachment", "text"]],
    [["body", "hi"], ["attachment", new File(["x"], "x")], ["attachment", new File(["y"], "y")]]]) {
    assert.equal((await api.admin(multipart(entries), context())).status, 400);
  }
  assert.ok(api.calls.every(([name]) => name === "limit"));
});

test("owner and closed ticket failures produce no deliveries", async () => {
  for (const [status, options] of [[404, { savedRow: null, target: null }],
    [400, { saveError: { code: "VR400" }, target: { ...ticket, status: "closed" } }]]) {
    const api = setup(options);
    for (const response of [await api.client(json({body: "ok"}), context()),
      await api.admin(multipart([["body", "ok"]]), context())]) {
      assert.equal(response.status, status);
      assert.deepEqual(await response.json(), { error: status === 404 ? "Ticket not found" : "Ticket is closed." });
    }
    assert.deepEqual(api.calls.map(([name]) => name), ["limit", "create_client_ticket_reply", "lookup"]);
    assert.equal(api.afterResponse.length, 0);
  }
});

test("reply length is checked after trimming and counts Unicode characters", () => {
  const { replyBodySchema } = loadTs("features/tickets/schemas/reply.ts");
  const maxBody = String.fromCodePoint(0x1f642).repeat(5000);
  assert.equal(replyBodySchema.parse("  " + maxBody + "\n"), maxBody);
  assert.equal(replyBodySchema.safeParse(maxBody + "!").success, false);
});

test("saved replies notify the correct recipients once, even if another delivery fails", async (t) => {
  t.mock.method(console, "error", () => {});
  for (const deliveryFails of [false, true]) {
    const api = setup({ deliveryFails });
    const client = await api.client(json({ body: "  Hello\n" }), context());
    assert.equal(client.status, 201);
    assert.deepEqual((await client.json()).data, {
      id: saved.id, body: "Hello", sender_type: "client", created_at: saved.created_at, attachments: [],
    });
    assert.equal(api.afterResponse.length, 1);
    await api.afterResponse.shift()();
    assert.deepEqual(api.calls, [
      ["limit", "reply-quota", owner],
      ["create_client_ticket_reply", { p_ticket_number: ticketNumber, p_email: owner, p_body: "Hello" }],
      ["inbox", { ticketId: ticket.id, ticketNumber }], ["alert", ticketNumber],
    ]);
    api.calls.length = 0;
    const admin = await api.admin(multipart([["body", "  Hello\n"]]), context());
    assert.equal(admin.status, 201);
    assert.equal((await admin.json()).data.sender_type, "admin");
    assert.equal(api.afterResponse.length, 1);
    await api.afterResponse.shift()();
    assert.deepEqual(api.calls, [
      ["lookup", ticketNumber], ["adminSave", { body: "Hello", file: null, ticketId: ticket.id, adminId: "admin-id" }],
      ["notice", owner, ticketNumber],
    ]);
  }
});

test("FS-09 storage failures skip the client notice", async (t) => {
  t.mock.method(console, "error", () => {});
  const api = setup({ saveError: new Error("storage") });
  const file = new File(["%PDF-1.7"], "proof.pdf", { type: "application/pdf" });
  const response = await api.admin(multipart([["body", "See attached"], ["attachment", file]]), context());
  assert.equal(response.status, 500);
  assert.deepEqual(api.calls.map(([name]) => name), ["lookup", "adminSave"]);
  assert.equal(api.calls[1][1].file.name, "proof.pdf");
  assert.equal(api.afterResponse.length, 0);
});
