/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const jwt = require("jsonwebtoken");
const { NextRequest } = require("next/server");
const { createClient } = require("@supabase/supabase-js");
const { loadTs } = require("./helpers/load-ts.cjs");

const attachmentRow = {
  id: "00000000-0000-4000-8000-000000000099",
  ticket_id: "00000000-0000-4000-8000-000000000001",
  file_name: "invoice.pdf",
  file_type: "application/pdf",
  file_size: 24576,
  storage_path: "00000000-0000-4000-8000-000000000001/1700000000_invoice.pdf",
};

test("attachment signed-URL download route (admin + client)", async (t) => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "attachment-download-test-secret";
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
  const clientToken = jwt.sign(
    { email: "client@example.com", role: "client" },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  );

  function setup({
    cookiesHeader = "",
    attachmentResult = [attachmentRow],
    ticketResult = [{ id: attachmentRow.ticket_id }],
    attachmentStatus = 200,
    ticketStatus = 200,
    signedUrl = "https://storage.example/signed/invoice.pdf?token=abc",
    signedUrlThrows = false,
  } = {}) {
    const calls = [];
    const client = createClient("https://database.example", "test-key", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: async (url, options) => {
          const parsedUrl = new URL(url);
          calls.push({ url: parsedUrl, method: options.method });
          if (parsedUrl.pathname.endsWith("/attachments")) {
            return new Response(JSON.stringify(attachmentResult), {
              status: attachmentStatus,
              headers: { "Content-Type": "application/json" },
            });
          }
          if (parsedUrl.pathname.endsWith("/tickets")) {
            return new Response(JSON.stringify(ticketResult), {
              status: ticketStatus,
              headers: { "Content-Type": "application/json" },
            });
          }
          throw new Error(`Unexpected request to ${parsedUrl.pathname}`);
        },
      },
    });

    const mocks = {
      "next/headers": {
        cookies: async () =>
          new NextRequest("https://helpdesk.example", {
            headers: cookiesHeader ? { cookie: cookiesHeader } : {},
          }).cookies,
      },
      "@/lib/supabase-server": {
        getSupabaseServerClient: () => client,
        getAttachmentSignedUrl: async (storagePath) => {
          calls.push({ signedUrlPath: storagePath });
          if (signedUrlThrows) {
            throw new Error("Failed to generate signed URL: private bucket error");
          }
          return signedUrl;
        },
      },
    };

    return {
      ...loadTs("app/api/attachments/[attachmentId]/route.ts", mocks),
      calls,
    };
  }

  const context = (attachmentId = attachmentRow.id) => ({
    params: Promise.resolve({ attachmentId }),
  });

  await t.test("rejects unauthenticated or invalid sessions with 401", async () => {
    for (const cookiesHeader of ["", "admin_session=invalid", "client_session=invalid"]) {
      const api = setup({ cookiesHeader });
      const response = await api.GET(new Request("https://helpdesk.example"), context());
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { error: "Unauthorized" });
      assert.equal(api.calls.length, 0);
    }
  });

  await t.test("rejects invalid attachment UUID with 400", async () => {
    const api = setup({ cookiesHeader: `admin_session=${adminToken}` });
    const response = await api.GET(new Request("https://helpdesk.example"), context("not-a-uuid"));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid attachment ID" });
    assert.equal(api.calls.length, 0);
  });

  await t.test("allows admin to generate signed URL for any attachment without ticket email check", async () => {
    const api = setup({ cookiesHeader: `admin_session=${adminToken}` });
    const response = await api.GET(new Request("https://helpdesk.example"), context());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await response.json(), {
      data: {
        id: attachmentRow.id,
        file_name: attachmentRow.file_name,
        file_type: attachmentRow.file_type,
        file_size: attachmentRow.file_size,
        url: "https://storage.example/signed/invoice.pdf?token=abc",
      },
    });
    assert.equal(api.calls.length, 2);
    assert.equal(api.calls[0].url.pathname, "/rest/v1/attachments");
    assert.equal(api.calls[1].signedUrlPath, attachmentRow.storage_path);
  });

  await t.test("allows verified client to generate signed URL for their own ticket attachment", async () => {
    const api = setup({ cookiesHeader: `client_session=${clientToken}` });
    const response = await api.GET(new Request("https://helpdesk.example"), context());
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data.url, "https://storage.example/signed/invoice.pdf?token=abc");
    assert.equal(api.calls.length, 3);
    assert.equal(api.calls[0].url.pathname, "/rest/v1/attachments");
    assert.equal(api.calls[1].url.pathname, "/rest/v1/tickets");
    assert.equal(api.calls[1].url.searchParams.get("id"), `eq.${attachmentRow.ticket_id}`);
    assert.equal(api.calls[1].url.searchParams.get("email"), "ilike.client@example.com");
  });

  await t.test("returns 404 when client requests attachment belonging to another email", async () => {
    const api = setup({
      cookiesHeader: `client_session=${clientToken}`,
      ticketResult: [],
    });
    const response = await api.GET(new Request("https://helpdesk.example"), context());
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "Attachment not found" });
    assert.equal(api.calls.length, 2);
  });

  await t.test("returns 404 when attachment does not exist", async () => {
    const api = setup({
      cookiesHeader: `admin_session=${adminToken}`,
      attachmentResult: [],
    });
    const response = await api.GET(new Request("https://helpdesk.example"), context());
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "Attachment not found" });
  });

  await t.test("returns 500 without leaking details when storage signed URL fails", async () => {
    const api = setup({
      cookiesHeader: `admin_session=${adminToken}`,
      signedUrlThrows: true,
    });
    const response = await api.GET(new Request("https://helpdesk.example"), context());
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.deepEqual(body, { error: "Unable to generate download link" });
    assert.equal(JSON.stringify(body).includes("private bucket"), false);
  });
});
