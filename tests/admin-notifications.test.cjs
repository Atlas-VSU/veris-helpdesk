/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const jwt = require("jsonwebtoken");
const { NextRequest } = require("next/server");
const { createClient } = require("@supabase/supabase-js");
const { loadTs } = require("./helpers/load-ts.cjs");

const TICKET_ID = "00000000-0000-4000-8000-000000000001";
const TICKET_NUMBER = "TCK-2026-00001";
const NOTIFICATION_ID_1 = "50165ed7-7cdf-4de9-a64f-9368a30b1238";
const NOTIFICATION_ID_2 = "60165ed7-7cdf-4de9-a64f-9368a30b1239";

test("FS-11 notification event writer and admin inbox operations", async (t) => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "admin-notifications-test-secret";
  t.after(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });
  t.mock.method(console, "error", () => {});

  const adminToken = jwt.sign(
    { adminId: "admin-123", email: "admin@example.com" },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  function setup({
    token = adminToken,
    cookieName = "admin_session",
    initialRows = [],
    dbErrorStatus = null,
  } = {}) {
    const calls = [];
    const store = initialRows.map((row) => ({ ...row }));
    let generatedCount = 0;

    const client = createClient("https://database.example", "test-key", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: async (url, options) => {
          const parsedUrl = new URL(url);
          const method = options.method || "GET";
          const rawBody = options.body ? JSON.parse(options.body) : null;
          calls.push({
            url: parsedUrl,
            method,
            body: rawBody,
            headers: new Headers(options.headers),
          });

          if (dbErrorStatus) {
            return new Response(
              JSON.stringify({ code: "XX000", message: "Sensitive database failure details" }),
              { status: dbErrorStatus, headers: { "Content-Type": "application/json" } },
            );
          }

          if (!parsedUrl.pathname.endsWith("/notifications")) {
            throw new Error(`Unexpected path: ${parsedUrl.pathname}`);
          }

          if (method === "POST") {
            const payload = Array.isArray(rawBody) ? rawBody[0] : rawBody;
            generatedCount += 1;
            const id =
              generatedCount === 1
                ? NOTIFICATION_ID_1
                : generatedCount === 2
                  ? NOTIFICATION_ID_2
                  : `00000000-0000-4000-8000-${String(generatedCount).padStart(12, "0")}`;
            const createdRow = {
              id,
              ticket_id: payload.ticket_id ?? null,
              message: payload.message,
              is_read: Boolean(payload.is_read),
              created_at: `2026-11-26T03:30:0${generatedCount}Z`,
              tickets: payload.ticket_id ? { ticket_number: TICKET_NUMBER } : null,
            };
            store.unshift(createdRow);
            return new Response(JSON.stringify(createdRow), {
              status: 201,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (method === "GET") {
            return new Response(JSON.stringify(store), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const idFilter = parsedUrl.searchParams.get("id");
          const targetId = idFilter?.startsWith("eq.") ? idFilter.slice(3) : null;
          const index = store.findIndex((item) => item.id === targetId);

          if (method === "PATCH") {
            if (index === -1) {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            store[index] = { ...store[index], ...rawBody };
            return new Response(JSON.stringify([store[index]]), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (method === "DELETE") {
            if (index === -1) {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
            const [removed] = store.splice(index, 1);
            return new Response(JSON.stringify([{ id: removed.id }]), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          throw new Error(`Unsupported HTTP method: ${method}`);
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
      "@/lib/supabase-server": {
        getSupabaseServerClient: () => client,
      },
    };

    return {
      listRoute: loadTs("app/api/admin/notifications/route.ts", mocks),
      itemRoute: loadTs("app/api/admin/notifications/[notificationId]/route.ts", mocks),
      writer: loadTs("lib/notifications.ts", mocks),
      calls,
      store,
    };
  }

  const context = (notificationId = NOTIFICATION_ID_1) => ({
    params: Promise.resolve({ notificationId }),
  });

  await t.test("direct handler calls reject missing, invalid, expired, and client sessions with 401", async () => {
    const invalidTokens = [
      "",
      "invalid",
      jwt.sign({ adminId: "admin-123" }, "wrong-secret", { expiresIn: "24h" }),
      jwt.sign({ adminId: "admin-123" }, process.env.JWT_SECRET, { expiresIn: -1 }),
      jwt.sign({ email: "client@example.com", role: "client" }, process.env.JWT_SECRET, { expiresIn: "2h" }),
      jwt.sign({ adminId: "admin-123", role: "client" }, process.env.JWT_SECRET, { expiresIn: "24h" }),
      jwt.sign({ email: "admin@example.com" }, process.env.JWT_SECRET, { expiresIn: "24h" }),
    ];

    for (const token of invalidTokens) {
      const api = setup({ token });
      const getRes = await api.listRoute.GET();
      assert.equal(getRes.status, 401);
      assert.deepEqual(await getRes.json(), { error: "Unauthorized" });

      const patchRes = await api.itemRoute.PATCH(
        new Request("https://helpdesk.example", { method: "PATCH", body: "bad-json" }),
        context("not-a-uuid"),
      );
      assert.equal(patchRes.status, 401);
      assert.deepEqual(await patchRes.json(), { error: "Unauthorized" });

      const deleteRes = await api.itemRoute.DELETE(
        new Request("https://helpdesk.example", { method: "DELETE" }),
        context("not-a-uuid"),
      );
      assert.equal(deleteRes.status, 401);
      assert.deepEqual(await deleteRes.json(), { error: "Unauthorized" });
      assert.equal(api.calls.length, 0);
    }

    const clientCookieApi = setup({ token: adminToken, cookieName: "client_session" });
    assert.equal((await clientCookieApi.listRoute.GET()).status, 401);
    assert.equal(
      (
        await clientCookieApi.itemRoute.PATCH(
          new Request("https://helpdesk.example", {
            method: "PATCH",
            body: JSON.stringify({ is_read: true }),
          }),
          context(),
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await clientCookieApi.itemRoute.DELETE(
          new Request("https://helpdesk.example", { method: "DELETE" }),
          context(),
        )
      ).status,
      401,
    );
    assert.equal(clientCookieApi.calls.length, 0);
  });

  await t.test("records both new-ticket and client-reply events and reads them back with ticket reference", async () => {
    const api = setup();

    const newTicketNotification = await api.writer.recordNewTicketNotification({
      ticketId: TICKET_ID,
      ticketNumber: TICKET_NUMBER,
    });
    assert.deepEqual(newTicketNotification, {
      id: NOTIFICATION_ID_1,
      message: `New ticket ${TICKET_NUMBER} submitted.`,
      is_read: false,
      created_at: "2026-11-26T03:30:01Z",
      ticket_number: TICKET_NUMBER,
    });

    const clientReplyNotification = await api.writer.recordClientReplyNotification(
      TICKET_ID,
      TICKET_NUMBER,
    );
    assert.deepEqual(clientReplyNotification, {
      id: NOTIFICATION_ID_2,
      message: `Client replied to ${TICKET_NUMBER}.`,
      is_read: false,
      created_at: "2026-11-26T03:30:02Z",
      ticket_number: TICKET_NUMBER,
    });

    const listRes = await api.listRoute.GET();
    assert.equal(listRes.status, 200);
    assert.deepEqual(await listRes.json(), {
      data: [clientReplyNotification, newTicketNotification],
    });

    const getCall = api.calls.find((call) => call.method === "GET");
    assert.equal(getCall.url.pathname, "/rest/v1/notifications");
    assert.equal(getCall.url.searchParams.get("order"), "created_at.desc,id.desc");
    assert.equal(getCall.url.searchParams.get("limit"), "50");
  });

  await t.test("writer rejects invalid ticketId or ticketNumber before hitting the database", async () => {
    const api = setup();
    await assert.rejects(() =>
      api.writer.recordNewTicketNotification({
        ticketId: "not-a-uuid",
        ticketNumber: TICKET_NUMBER,
      }),
    );
    await assert.rejects(() =>
      api.writer.recordClientReplyNotification({
        ticketId: TICKET_ID,
        ticketNumber: "INVALID-123",
      }),
    );
    assert.equal(api.calls.length, 0);
  });

  await t.test("marks a notification read, persists across reload, and deletes it with 204", async () => {
    const api = setup({
      initialRows: [
        {
          id: NOTIFICATION_ID_1,
          ticket_id: TICKET_ID,
          message: `Client replied to ${TICKET_NUMBER}.`,
          is_read: false,
          created_at: "2026-11-26T03:30:01Z",
          tickets: { ticket_number: TICKET_NUMBER },
        },
        {
          id: NOTIFICATION_ID_2,
          ticket_id: null,
          message: `New ticket ${TICKET_NUMBER} submitted.`,
          is_read: false,
          created_at: "2026-11-26T03:00:00Z",
          tickets: null,
        },
      ],
    });

    const patchRes = await api.itemRoute.PATCH(
      new Request(`https://helpdesk.example/api/admin/notifications/${NOTIFICATION_ID_1}`, {
        method: "PATCH",
        body: JSON.stringify({ is_read: true }),
      }),
      context(NOTIFICATION_ID_1),
    );
    assert.equal(patchRes.status, 200);
    assert.deepEqual(await patchRes.json(), {
      data: {
        id: NOTIFICATION_ID_1,
        message: `Client replied to ${TICKET_NUMBER}.`,
        is_read: true,
        created_at: "2026-11-26T03:30:01Z",
        ticket_number: TICKET_NUMBER,
      },
    });

    const reloadAfterPatch = await api.listRoute.GET();
    assert.equal(reloadAfterPatch.status, 200);
    assert.deepEqual(await reloadAfterPatch.json(), {
      data: [
        {
          id: NOTIFICATION_ID_1,
          message: `Client replied to ${TICKET_NUMBER}.`,
          is_read: true,
          created_at: "2026-11-26T03:30:01Z",
          ticket_number: TICKET_NUMBER,
        },
        {
          id: NOTIFICATION_ID_2,
          message: `New ticket ${TICKET_NUMBER} submitted.`,
          is_read: false,
          created_at: "2026-11-26T03:00:00Z",
          ticket_number: null,
        },
      ],
    });

    const deleteRes = await api.itemRoute.DELETE(
      new Request(`https://helpdesk.example/api/admin/notifications/${NOTIFICATION_ID_1}`, {
        method: "DELETE",
      }),
      context(NOTIFICATION_ID_1),
    );
    assert.equal(deleteRes.status, 204);
    assert.equal(await deleteRes.text(), "");

    const reloadAfterDelete = await api.listRoute.GET();
    assert.equal(reloadAfterDelete.status, 200);
    assert.deepEqual(await reloadAfterDelete.json(), {
      data: [
        {
          id: NOTIFICATION_ID_2,
          message: `New ticket ${TICKET_NUMBER} submitted.`,
          is_read: false,
          created_at: "2026-11-26T03:00:00Z",
          ticket_number: null,
        },
      ],
    });
  });

  await t.test("PATCH and DELETE reject invalid notification IDs and invalid bodies with 400", async () => {
    const api = setup();

    for (const invalidId of ["bad-id", "12345", "50165ed7-7cdf-4de9-a64f-9368a30b1238-extra"]) {
      const patchRes = await api.itemRoute.PATCH(
        new Request("https://helpdesk.example", {
          method: "PATCH",
          body: JSON.stringify({ is_read: true }),
        }),
        context(invalidId),
      );
      assert.equal(patchRes.status, 400);

      const deleteRes = await api.itemRoute.DELETE(
        new Request("https://helpdesk.example", { method: "DELETE" }),
        context(invalidId),
      );
      assert.equal(deleteRes.status, 400);
    }

    for (const invalidBody of [
      {},
      [],
      null,
      { is_read: false },
      { is_read: "true" },
      { is_read: 1 },
      { is_read: true, extra: "disallowed" },
    ]) {
      const res = await api.itemRoute.PATCH(
        new Request("https://helpdesk.example", {
          method: "PATCH",
          body: JSON.stringify(invalidBody),
        }),
        context(NOTIFICATION_ID_1),
      );
      assert.equal(res.status, 400, JSON.stringify(invalidBody));
    }

    const malformedJsonRes = await api.itemRoute.PATCH(
      new Request("https://helpdesk.example", {
        method: "PATCH",
        body: "{bad-json",
      }),
      context(NOTIFICATION_ID_1),
    );
    assert.equal(malformedJsonRes.status, 400);
    assert.equal(api.calls.length, 0);
  });

  await t.test("PATCH and DELETE return 404 when the notification does not exist", async () => {
    const api = setup({ initialRows: [] });

    const patchRes = await api.itemRoute.PATCH(
      new Request("https://helpdesk.example", {
        method: "PATCH",
        body: JSON.stringify({ is_read: true }),
      }),
      context(NOTIFICATION_ID_1),
    );
    assert.equal(patchRes.status, 404);
    assert.deepEqual(await patchRes.json(), { error: "Notification not found" });

    const deleteRes = await api.itemRoute.DELETE(
      new Request("https://helpdesk.example", { method: "DELETE" }),
      context(NOTIFICATION_ID_1),
    );
    assert.equal(deleteRes.status, 404);
    assert.deepEqual(await deleteRes.json(), { error: "Notification not found" });
  });

  await t.test("database failures return 500 without leaking internal error details", async () => {
    const api = setup({ dbErrorStatus: 500 });

    const responses = [
      await api.listRoute.GET(),
      await api.itemRoute.PATCH(
        new Request("https://helpdesk.example", {
          method: "PATCH",
          body: JSON.stringify({ is_read: true }),
        }),
        context(NOTIFICATION_ID_1),
      ),
      await api.itemRoute.DELETE(
        new Request("https://helpdesk.example", { method: "DELETE" }),
        context(NOTIFICATION_ID_1),
      ),
    ];

    for (const response of responses) {
      assert.equal(response.status, 500);
      const body = await response.json();
      assert.equal(typeof body.error, "string");
      assert.equal(JSON.stringify(body).includes("Sensitive"), false);
    }
  });
});
