/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const jwt = require("jsonwebtoken");
const { NextRequest } = require("next/server");
const { unstable_doesMiddlewareMatch: doesProxyMatch } = require("next/experimental/testing/server");

const root = path.resolve(__dirname, "..");
function loadTs(relativePath, mocks = {}) {
  const filename = path.join(root, relativePath);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const nativeRequire = createRequire(filename);
  const localRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.startsWith("@/")) return loadTs(`${id.slice(2)}.ts`, mocks);
    return nativeRequire(id);
  };
  const loaded = { exports: {} };
  vm.runInThisContext(`(function(require, module, exports) { ${source}\n})`, { filename })(localRequire, loaded, loaded.exports);
  return loaded.exports;
}

test("admin route and server authentication", async (t) => {
  const originalSecret = process.env.JWT_SECRET;
  const secret = "admin-auth-regression-test-secret";
  process.env.JWT_SECRET = secret;
  t.after(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });
  const { verifyAdminToken } = loadTs("lib/admin-token.ts");
  const { proxy, config } = loadTs("proxy.ts", {
    "@/lib/rate-limit": { ticketSubmissionRateLimit: null, otpRateLimit: null },
  });
  const sign = (payload, options = {}) => jwt.sign(payload, secret, options);
  const adminToken = sign({ adminId: "admin-123" }, { expiresIn: "24h" });
  const cases = [
    ["missing session", undefined],
    ["malformed JWT", "invalid"],
    ["wrong signature", jwt.sign({ adminId: "admin-123" }, "wrong-secret")],
    ["expired JWT", sign({ adminId: "admin-123" }, { expiresIn: -1 })],
    ["future JWT", sign({ adminId: "admin-123" }, { notBefore: "1h" })],
    ["missing adminId", sign({ email: "admin@example.com" })],
    ["empty adminId", sign({ adminId: "" })],
    ["blank adminId", sign({ adminId: "  " })],
    ["non-string adminId", sign({ adminId: 123 })],
    ["client token", sign({ role: "client", email: "client@example.com" })],
    ["client token containing adminId", sign({ role: "client", adminId: "admin-123" })],
    ["string payload", sign("admin-123")],
    ["disallowed algorithm", sign({ adminId: "admin-123" }, { algorithm: "HS384" })],
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
