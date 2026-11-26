/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
const { NextResponse } = require("next/server");
const { loadTs } = require("./helpers/load-ts.cjs");

const adminEmail = "admin@example.com";
const invalidCredentials = { error: "Invalid email or password" };
const serverError = { error: "Something went wrong. Please try again." };

function mockSupabase(fetch) {
  const client = createClient("https://database.example", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch },
  });
  return { getSupabaseServerClient: () => client };
}

function postRequest(path, body) {
  return new Request(`https://helpdesk.example${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function adminRows(rows) {
  return async (_url, { headers }) => {
    if (new Headers(headers).get("accept") === "application/vnd.pgrst.object+json") {
      if (rows.length === 1) return Response.json(rows[0]);
      return Response.json({ code: "PGRST116", message: "Expected one row" }, { status: 406 });
    }
    return Response.json(rows);
  };
}

function login(fetch) {
  const { POST } = loadTs("app/api/admin/login/route.ts", {
    "@/lib/supabase-server": mockSupabase(fetch),
    "@/lib/rate-limit": { checkAuthRateLimit: async () => ({ success: true }) },
  });
  return POST(postRequest("/api/admin/login", { email: adminEmail, password: "wrong-password" }));
}

test("admin login returns 401 for an unknown admin", async () => {
  const response = await login(adminRows([]));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), invalidCredentials);
});

test("admin login returns 401 for a wrong password", async () => {
  const response = await login(adminRows([{
    id: "00000000-0000-0000-0000-000000000001",
    email: adminEmail,
    full_name: "Test Admin",
    password_hash: bcrypt.hashSync("correct-password", 4),
  }]));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), invalidCredentials);
});

test("admin login returns a generic JSON 500 and logs the lookup failure", async (t) => {
  const logError = t.mock.method(console, "error", () => {});
  const cause = { code: "XX000", message: "Internal database failure details" };
  const response = await login(async () => Response.json(cause, { status: 500 }));

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), serverError);
  assert.equal(logError.mock.callCount(), 1);
  assert.deepEqual(logError.mock.calls[0].arguments[1], cause);
});

test("OTP resend lookup failure returns a generic JSON 500 before generating, writing, or scheduling", async (t) => {
  t.mock.method(console, "error", () => {});
  const cause = { code: "PGRST103", message: "Database range lookup failure details" };
  const fetch = t.mock.fn(async (_url, { method }) => {
    if (method === "GET") return Response.json(cause, { status: 416 });
    return new Response(null, { status: 204, headers: { "Content-Range": "0-0/1" } });
  });
  const generateOtpCode = t.mock.fn(() => "123456");
  const hashOtpCode = t.mock.fn(async () => "hashed-code");
  const after = t.mock.fn();
  const sendOtpEmail = t.mock.fn();
  const { POST } = loadTs("app/api/otp/request/route.ts", {
    "@/lib/supabase-server": mockSupabase(fetch),
    "@/lib/otp": { ...loadTs("lib/otp.ts"), generateOtpCode, hashOtpCode },
    "@/lib/otp-email": { sendOtpEmail },
    "next/server": { NextResponse, after },
  });
  const response = await POST(postRequest("/api/otp/request", { email: "client@example.com" }));

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), serverError);
  const requests = fetch.mock.calls.map(({ arguments: [url, { method }] }) => [method, new URL(url).pathname]);
  assert.deepEqual(requests, [["GET", "/rest/v1/otp_verifications"]]);
  assert.equal(generateOtpCode.mock.callCount(), 0);
  assert.equal(hashOtpCode.mock.callCount(), 0);
  assert.equal(after.mock.callCount(), 0);
  assert.equal(sendOtpEmail.mock.callCount(), 0);
});
