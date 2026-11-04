/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTs } = require("./helpers/load-ts.cjs");
const jwt = require("jsonwebtoken");
const { NextRequest } = require("next/server");
const { unstable_doesMiddlewareMatch: doesProxyMatch } = require("next/experimental/testing/server");

test("admin route and server authentication", async (t) => {
  const originalSecret = process.env.JWT_SECRET;
  const secret = "admin-auth-regression-test-secret";
  process.env.JWT_SECRET = secret;
  t.after(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });
  const {
    ADMIN_COOKIE_NAME,
    ADMIN_SESSION_SECONDS,
    getAdminCookieOptions,
    signAdminToken,
    verifyAdminToken,
  } = loadTs("lib/admin-token.ts");
  const { proxy, config } = loadTs("proxy.ts", {
    "@/lib/rate-limit": { ticketSubmissionRateLimit: null, otpRequestRateLimit: null, otpVerifyRateLimit: null },
  });
  const sign = (payload, options = {}) => jwt.sign(payload, secret, options);
  const adminToken = sign({ adminId: "admin-123" }, { expiresIn: "24h" });
  const cases = [
    ["missing session", undefined],
    ["malformed JWT", "invalid"],
    ["wrong signature", jwt.sign({ adminId: "admin-123" }, "wrong-secret")],
    ["expired JWT", sign({ adminId: "admin-123" }, { expiresIn: -1 })],
    ["missing expiration claim", sign({ adminId: "admin-123" })],
    ["excessive session lifetime (>24h)", sign({ adminId: "admin-123" }, { expiresIn: "48h" })],
    ["future JWT", sign({ adminId: "admin-123" }, { notBefore: "1h", expiresIn: "24h" })],
    ["missing adminId", sign({ email: "admin@example.com" }, { expiresIn: "24h" })],
    ["empty adminId", sign({ adminId: "" }, { expiresIn: "24h" })],
    ["blank adminId", sign({ adminId: "  " }, { expiresIn: "24h" })],
    ["non-string adminId", sign({ adminId: 123 }, { expiresIn: "24h" })],
    ["client token", sign({ role: "client", email: "client@example.com" }, { expiresIn: "2h" })],
    ["client token containing adminId", sign({ role: "client", adminId: "admin-123" }, { expiresIn: "24h" })],
    ["string payload", sign("admin-123")],
    ["disallowed algorithm", sign({ adminId: "admin-123" }, { algorithm: "HS384", expiresIn: "24h" })],
    ["unsigned JWT", sign({ adminId: "admin-123" }, { algorithm: "none" })],
  ];
  const request = (url, token, cookieName = "admin_session") => new NextRequest(`https://helpdesk.example${url}`, {
    headers: token ? { cookie: `${cookieName}=${token}` } : {},
  });
  const serverGuard = (token, cookieName) => loadTs("lib/admin-auth.ts", {
    "next/headers": { cookies: async () => request("/", token, cookieName).cookies },
  }).getAdminSession();

  for (const [name, token] of cases) {
    await t.test(name, async () => {
      if (token) assert.equal(verifyAdminToken(token), null);
      const pageResponse = await proxy(request("/admin/dashboard", token));
      assert.equal(pageResponse.status, 307);
      assert.equal(pageResponse.headers.get("location"), "https://helpdesk.example/admin/login");
      const apiResponse = await proxy(request("/api/admin/tickets", token));
      assert.equal(apiResponse.status, 401);
      assert.deepEqual(await apiResponse.json(), { error: "Unauthorized" });
      assert.equal(await serverGuard(token), null);
    });
  }
  await t.test("valid admin session passes all checks", async () => {
    assert.equal(verifyAdminToken(adminToken).adminId, "admin-123");
    assert.equal((await serverGuard(adminToken)).adminId, "admin-123");
    for (const url of ["/admin", "/admin/tickets/TCK-2026-00001", "/api/admin/tickets"]) {
      assert.equal((await proxy(request(url, adminToken))).headers.get("x-middleware-next"), "1");
    }
  });
  await t.test("signAdminToken and cookie options enforce 24-hour session timeout", () => {
    assert.equal(ADMIN_COOKIE_NAME, "admin_session");
    assert.equal(ADMIN_SESSION_SECONDS, 86400);
    const signed = signAdminToken({ adminId: "admin-456", email: "admin@example.com" });
    const verified = verifyAdminToken(signed);
    assert.equal(verified.adminId, "admin-456");
    assert.equal(verified.email, "admin@example.com");
    assert.equal(verified.exp - verified.iat, 86400);
    assert.deepEqual(getAdminCookieOptions(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });
    assert.equal(getAdminCookieOptions(0).maxAge, 0);
  });
  await t.test("client cookie cannot authenticate admin", async () => {
    assert.equal((await proxy(request("/api/admin/tickets", adminToken, "client_session"))).status, 401);
    assert.equal(await serverGuard(adminToken, "client_session"), null);
  });
  await t.test("public exceptions apply only to exact routes", async () => {
    for (const url of ["/admin/login", "/api/admin/login", "/api/admin/logout"]) {
      assert.equal((await proxy(request(url, "invalid"))).headers.get("x-middleware-next"), "1");
    }
    for (const url of ["/api/admin/login/extra", "/api/admin/logout/extra"]) {
      assert.equal((await proxy(request(url))).status, 401);
    }
    assert.equal((await proxy(request("/admin/login/extra"))).status, 307);
  });
  await t.test("matcher covers admin roots, nested paths, and existing routes", () => {
    for (const url of ["/admin", "/admin/dashboard", "/api/admin", "/api/admin/tickets/TCK-2026-00001", "/api/tickets", "/submit-ticket", "/api/otp/verify", "/verify"]) {
      assert.equal(doesProxyMatch({ config, nextConfig: {}, url }), true, url);
    }
    assert.equal(doesProxyMatch({ config, nextConfig: {}, url: "/administrator" }), false);
  });
  await t.test("missing JWT secret fails closed", async () => {
    delete process.env.JWT_SECRET;
    assert.equal(verifyAdminToken(adminToken), null);
    assert.equal(await serverGuard(adminToken), null);
    assert.equal((await proxy(request("/api/admin/tickets", adminToken))).status, 401);
  });
});
