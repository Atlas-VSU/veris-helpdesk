/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const jwt = require("jsonwebtoken");
const { NextRequest } = require("next/server");
const { createClient } = require("@supabase/supabase-js");
const { loadTs } = require("./helpers/load-ts.cjs");

const KNOWN_TICKETS = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    ticket_number: "TCK-2026-00001",
    subject: "First ticket",
    full_name: "Alice Santos",
    email: "alice@example.com",
    description: "Sensitive description that should not be selected",
    service: "Billing",
    priority: "low",
    status: "closed",
    created_at: "2026-11-20T08:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    ticket_number: "TCK-2026-00002",
    subject: "Second ticket",
    full_name: "Ben Cruz",
    email: "ben@example.com",
    description: "Second description",
    service: "Technical Support",
    priority: "medium",
    status: "resolved",
    created_at: "2026-11-21T08:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    ticket_number: "TCK-2026-00003",
    subject: "Third ticket",
    full_name: "Cara Lim",
    email: "cara@example.com",
    description: "Third description",
    service: "General Inquiry",
    priority: "urgent",
    status: "waiting_for_client",
    created_at: "2026-11-22T08:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    ticket_number: "TCK-2026-00004",
    subject: "Fourth ticket",
    full_name: "Dan Reyes",
    email: "dan@example.com",
    description: "Fourth description",
    service: "Billing",
    priority: "high",
    status: "in_progress",
    created_at: "2026-11-23T08:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    ticket_number: "TCK-2026-00005",
    subject: "Fifth ticket",
    full_name: "Eva Tan",
    email: "eva@example.com",
    description: "Fifth description",
    service: "Technical Support",
    priority: "medium",
    status: "open",
    created_at: "2026-11-24T08:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    ticket_number: "TCK-2026-00006",
    subject: "Sixth ticket",
    full_name: "Frank Go",
    email: "frank@example.com",
    description: "Sixth description",
    service: "Billing",
    priority: "urgent",
    status: "new",
    created_at: "2026-11-25T08:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000007",
    ticket_number: "TCK-2026-00007",
    subject: "Seventh ticket",
    full_name: "Grace Sy",
    email: "grace@example.com",
    description: "Seventh description",
    service: "Technical Support",
    priority: "high",
    status: "open",
    created_at: "2026-11-26T08:00:00Z",
  },
];

const EXPECTED_RECENT_COLUMNS = [
  "id",
  "ticket_number",
  "subject",
  "full_name",
  "service",
  "priority",
  "status",
  "created_at",
];

function computeCountsRow(dataset) {
  return {
    total_tickets: dataset.length,
    urgent_tickets: dataset.filter((row) => row.priority === "urgent").length,
    new_count: dataset.filter((row) => row.status === "new").length,
    open_count: dataset.filter((row) => row.status === "open").length,
    in_progress_count: dataset.filter((row) => row.status === "in_progress")
      .length,
    waiting_for_client_count: dataset.filter(
      (row) => row.status === "waiting_for_client",
    ).length,
    resolved_count: dataset.filter((row) => row.status === "resolved").length,
    closed_count: dataset.filter((row) => row.status === "closed").length,
  };
}

test("admin dashboard data module", async (t) => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "admin-dashboard-test-secret";
  t.after(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const adminToken = jwt.sign(
    { adminId: "admin-123" },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  function setup({
    token = adminToken,
    cookieName = "admin_session",
    dataset = KNOWN_TICKETS,
    respondWith = null,
  } = {}) {
    const calls = [];
    const client = createClient("https://database.example", "test-key", {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: async (url, options) => {
          const parsedUrl = new URL(url);
          const headers = new Headers(options.headers);
          calls.push({
            url: parsedUrl,
            method: options.method,
            headers,
          });

          if (typeof respondWith === "function") {
            const customResponse = respondWith(parsedUrl, options);
            if (customResponse) return customResponse;
          }

          if (parsedUrl.pathname === "/rest/v1/rpc/get_admin_dashboard_counts") {
            return new Response(JSON.stringify([computeCountsRow(dataset)]), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          let rows = [...dataset];
          const order = parsedUrl.searchParams.get("order");
          if (order === "created_at.desc,id.desc") {
            rows.sort((a, b) => {
              const dateDiff =
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime();
              return dateDiff !== 0 ? dateDiff : b.id.localeCompare(a.id);
            });
          }

          const limitParam = parsedUrl.searchParams.get("limit");
          if (limitParam) {
            rows = rows.slice(0, Number(limitParam));
          }

          const selectParam = parsedUrl.searchParams.get("select");
          if (selectParam && selectParam !== "*") {
            const columns = selectParam.split(",");
            rows = rows.map((row) =>
              Object.fromEntries(columns.map((column) => [column, row[column]])),
            );
          }

          return new Response(JSON.stringify(rows), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
      },
    });

    const mocks = {
      "server-only": {},
      "next/headers": {
        cookies: async () =>
          new NextRequest("https://helpdesk.example", {
            headers: token ? { cookie: `${cookieName}=${token}` } : {},
          }).cookies,
      },
      "@/lib/supabase-server": { getSupabaseServerClient: () => client },
    };

    return {
      ...loadTs("features/admin/server/get-admin-dashboard-data.ts", mocks),
      calls,
    };
  }

  await t.test(
    "rejects missing, invalid, expired, and client sessions before validating options or querying Supabase",
    async () => {
      const invalidTokens = [
        "",
        "invalid",
        jwt.sign({ adminId: "admin-123" }, "wrong-secret"),
        jwt.sign({ adminId: "admin-123" }, process.env.JWT_SECRET, {
          expiresIn: -1,
        }),
        jwt.sign(
          { email: "client@example.com", role: "client" },
          process.env.JWT_SECRET,
        ),
        jwt.sign(
          { adminId: "admin-123", role: "client" },
          process.env.JWT_SECRET,
        ),
      ];

      for (const token of invalidTokens) {
        const mod = setup({ token });
        await assert.rejects(
          () => mod.getAdminDashboardData({ recentLimit: 0 }),
          mod.UnauthorizedAdminError,
        );
        assert.equal(mod.calls.length, 0);
      }

      const wrongCookie = setup({
        token: adminToken,
        cookieName: "client_session",
      });
      await assert.rejects(
        () => wrongCookie.getAdminDashboardData(),
        wrongCookie.UnauthorizedAdminError,
      );
      assert.equal(wrongCookie.calls.length, 0);
    },
  );

  await t.test(
    "fetches all counts in one SQL RPC request and returns bounded newest-first recent tickets",
    async () => {
      const mod = setup();
      const data = await mod.getAdminDashboardData();

      assert.equal(data.totalTickets, 7);
      assert.equal(data.urgentTickets, 2);
      assert.deepEqual(data.statusCounts, {
        new: 1,
        open: 2,
        in_progress: 1,
        waiting_for_client: 1,
        resolved: 1,
        closed: 1,
      });

      assert.equal(data.recentTickets.length, mod.DEFAULT_RECENT_TICKETS_LIMIT);
      assert.deepEqual(
        data.recentTickets.map((ticket) => ticket.ticket_number),
        [
          "TCK-2026-00007",
          "TCK-2026-00006",
          "TCK-2026-00005",
          "TCK-2026-00004",
          "TCK-2026-00003",
        ],
      );

      for (const recent of data.recentTickets) {
        assert.deepEqual(Object.keys(recent), EXPECTED_RECENT_COLUMNS);
      }

      assert.equal(mod.calls.length, 2);

      const rpcCalls = mod.calls.filter(
        (call) => call.url.pathname === "/rest/v1/rpc/get_admin_dashboard_counts",
      );
      assert.equal(rpcCalls.length, 1);
      assert.equal(rpcCalls[0].method, "POST");

      const recentCall = mod.calls.find(
        (call) => call.url.pathname === "/rest/v1/tickets",
      );
      assert.ok(recentCall, "Expected a GET request for recent tickets");
      assert.equal(recentCall.method, "GET");
      assert.equal(
        recentCall.url.searchParams.get("select"),
        EXPECTED_RECENT_COLUMNS.join(","),
      );
      assert.equal(
        recentCall.url.searchParams.get("order"),
        "created_at.desc,id.desc",
      );
      assert.equal(recentCall.url.searchParams.get("limit"), "5");
    },
  );

  await t.test(
    "zero-fills absent statuses and breaks created_at ties by id descending",
    async () => {
      const sparseDataset = [
        {
          ...KNOWN_TICKETS[0],
          id: "00000000-0000-0000-0000-000000000010",
          ticket_number: "TCK-2026-00010",
          status: "new",
          priority: "urgent",
          created_at: "2026-11-26T10:00:00Z",
        },
        {
          ...KNOWN_TICKETS[1],
          id: "00000000-0000-0000-0000-000000000012",
          ticket_number: "TCK-2026-00012",
          status: "new",
          priority: "high",
          created_at: "2026-11-26T10:00:00Z",
        },
      ];

      const mod = setup({ dataset: sparseDataset });
      const data = await mod.getAdminDashboardData();

      assert.equal(data.totalTickets, 2);
      assert.equal(data.urgentTickets, 1);
      assert.deepEqual(data.statusCounts, {
        new: 2,
        open: 0,
        in_progress: 0,
        waiting_for_client: 0,
        resolved: 0,
        closed: 0,
      });
      assert.deepEqual(
        data.recentTickets.map((ticket) => ticket.ticket_number),
        ["TCK-2026-00012", "TCK-2026-00010"],
      );
    },
  );

  await t.test(
    "returns zero counts and an empty recent list for an empty dataset",
    async () => {
      const mod = setup({ dataset: [] });
      const data = await mod.getAdminDashboardData();

      assert.deepEqual(data, {
        totalTickets: 0,
        urgentTickets: 0,
        statusCounts: {
          new: 0,
          open: 0,
          in_progress: 0,
          waiting_for_client: 0,
          resolved: 0,
          closed: 0,
        },
        recentTickets: [],
      });
    },
  );

  await t.test(
    "supports custom recentLimit and rejects invalid or out-of-range values",
    async () => {
      const mod = setup();
      const data = await mod.getAdminDashboardData({ recentLimit: 3 });
      assert.equal(data.recentTickets.length, 3);
      assert.deepEqual(
        data.recentTickets.map((ticket) => ticket.ticket_number),
        ["TCK-2026-00007", "TCK-2026-00006", "TCK-2026-00005"],
      );

      for (const invalidLimit of [0, -1, 2.5, Number.NaN, 21]) {
        await assert.rejects(
          () => mod.getAdminDashboardData({ recentLimit: invalidLimit }),
          RangeError,
        );
      }
    },
  );

  await t.test(
    "throws instead of defaulting to zero when a request returns 404 with an empty body",
    async () => {
      const missingCounts404 = setup({
        respondWith: (url) =>
          url.pathname === "/rest/v1/rpc/get_admin_dashboard_counts"
            ? new Response(null, { status: 404 })
            : null,
      });
      await assert.rejects(() => missingCounts404.getAdminDashboardData(), {
        message: "Dashboard counts query returned an invalid or empty response",
      });

      const missingRecent404 = setup({
        respondWith: (url) =>
          url.pathname === "/rest/v1/tickets"
            ? new Response(null, { status: 404 })
            : null,
      });
      await assert.rejects(() => missingRecent404.getAdminDashboardData(), {
        message: "Recent tickets query returned an invalid or empty response",
      });
    },
  );

  await t.test(
    "throws when the counts RPC returns an empty array or missing count field",
    async () => {
      const emptyRpcRows = setup({
        respondWith: (url) =>
          url.pathname === "/rest/v1/rpc/get_admin_dashboard_counts"
            ? new Response(JSON.stringify([]), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              })
            : null,
      });
      await assert.rejects(() => emptyRpcRows.getAdminDashboardData(), {
        message: "Dashboard counts query returned an invalid or empty response",
      });

      const missingOpenCount = setup({
        respondWith: (url) =>
          url.pathname === "/rest/v1/rpc/get_admin_dashboard_counts"
            ? new Response(
                JSON.stringify([
                  { ...computeCountsRow(KNOWN_TICKETS), open_count: null },
                ]),
                {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                },
              )
            : null,
      });
      await assert.rejects(() => missingOpenCount.getAdminDashboardData(), {
        message: "Missing or invalid dashboard count: open_count",
      });
    },
  );

  await t.test("propagates database errors from either query", async () => {
    const rpcError = setup({
      respondWith: (url) =>
        url.pathname === "/rest/v1/rpc/get_admin_dashboard_counts"
          ? new Response(
              JSON.stringify({ message: "Counts RPC failed", code: "500" }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              },
            )
          : null,
    });
    await assert.rejects(() => rpcError.getAdminDashboardData(), {
      message: "Counts RPC failed",
    });

    const recentError = setup({
      respondWith: (url) =>
        url.pathname === "/rest/v1/tickets"
          ? new Response(
              JSON.stringify({
                message: "Recent tickets query failed",
                code: "500",
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              },
            )
          : null,
    });
    await assert.rejects(() => recentError.getAdminDashboardData(), {
      message: "Recent tickets query failed",
    });
  });
});
