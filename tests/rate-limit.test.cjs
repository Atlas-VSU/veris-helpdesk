/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { NextRequest } = require("next/server");
const { createClient } = require("@supabase/supabase-js");
const { unstable_doesMiddlewareMatch: doesProxyMatch } = require("next/experimental/testing/server");
const { loadTs } = require("./helpers/load-ts.cjs");

const healthy = { success: true, limit: 5, remaining: 4, reset: 2000000000000 };
const ip = "203.0.113.10";
const otpPaths = ["/api/otp/request", "/api/otp/verify"];

test("authentication rate limiting and Upstash configuration", async (t) => {
  const envNames = ["NODE_ENV", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"];
  const originalEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
  t.after(() => {
    for (const name of envNames) {
      if (originalEnv[name] === undefined) delete process.env[name];
      else process.env[name] = originalEnv[name];
    }
  });
  t.mock.method(console, "error", () => {});

  function setup({ mode = "production", url = "https://redis.example", token = "test-token", response = healthy, rejects = false, invalidConfig = false } = {}) {
    process.env.NODE_ENV = mode;
    for (const [name, value] of [["UPSTASH_REDIS_REST_URL", url], ["UPSTASH_REDIS_REST_TOKEN", token]]) {
      if (value === null) delete process.env[name];
      else process.env[name] = value;
    }
    const calls = [];
    const constructors = [];
    const rateLimits = loadTs("lib/rate-limit.ts", {
      "@upstash/redis": {
        Redis: class {
          constructor(options) {
            if (invalidConfig) throw new Error("Invalid Redis config");
            this.options = options;
          }
        },
      },
      "@upstash/ratelimit": {
        Ratelimit: class {
          static slidingWindow(limit, window) { return { limit, window }; }
          constructor(options) { this.options = options; constructors.push(options); }
          async limit(identifier) {
            calls.push({ prefix: this.options.prefix, identifier });
            if (rejects) throw new Error("Redis failed: private credential details");
            return response;
          }
        },
      },
    });
    const mocks = {
      "@/lib/rate-limit": rateLimits,
      "@/lib/supabase-server": { getSupabaseServerClient: () => assert.fail("Blocked or invalid requests must not access the database") },
      "@/lib/otp-email": { sendOtpEmail: () => assert.fail("Blocked requests must not send email") },
    };
    return {
      ...loadTs("proxy.ts", mocks),
      login: loadTs("app/api/admin/login/route.ts", mocks).POST,
      rateLimits, mocks, calls, constructors,
    };
  }
  const request = (pathname, method = "POST", body = "invalid JSON") => new NextRequest(`https://helpdesk.example${pathname}`, {
    method, headers: { "x-forwarded-for": ip }, ...(method === "POST" ? { body } : {}),
  });

  async function assertBlocked(api, status) {
    let parsed = false;
    const loginResponse = await api.login({
      headers: new Headers({ "x-forwarded-for": ip }),
      json: async () => { parsed = true; assert.fail("Blocked login must not parse its body"); },
    });
    assert.equal(loginResponse.status, status);
    assert.equal(parsed, false);
    assert.equal(loginResponse.headers.get("set-cookie"), null);
    assert.equal(typeof (await loginResponse.json()).error, "string");
    for (const pathname of otpPaths) {
      const response = await api.proxy(request(pathname));
      assert.equal(response.status, status, pathname);
      assert.equal(response.headers.get("x-middleware-next"), null);
      assert.equal(response.headers.get("set-cookie"), null);
      const body = await response.json();
      assert.equal(typeof body.error, "string");
      assert.deepEqual(Object.keys(body), ["error"], "Generic OTP errors must have no OTP-specific code");
      assert.equal(JSON.stringify(body).includes("private credential"), false);
    }
  }

  await t.test("initializes separate login, OTP, and ticket quotas on one Redis client", () => {
    const api = setup({ url: " https://redis.example ", token: " test-token " });
    assert.deepEqual(api.constructors.map(({ prefix, limiter }) => [prefix, limiter]), [
      ["ratelimit:login", { limit: 5, window: "60 s" }],
      ["ratelimit:ticket", { limit: 5, window: "1 h" }],
      ["ratelimit:otp", { limit: 5, window: "5 m" }],
    ]);
    assert.equal(api.constructors[0].redis, api.constructors[2].redis);
    assert.deepEqual(api.constructors[0].redis.options, { url: "https://redis.example", token: "test-token" });
  });

  await t.test("production blocks missing, partial, blank, and invalid configuration", async () => {
    for (const options of [{ url: null, token: null }, { url: null }, { token: null }, { url: " " }, { token: " " }, { invalidConfig: true }]) {
      const api = setup(options);
      await assertBlocked(api, 500);
      assert.equal(api.calls.length, 0);
    }
  });

  await t.test("production blocks Redis errors before processing login or OTP", async () => {
    const api = setup({ rejects: true });
    await assertBlocked(api, 500);
    assert.equal(api.calls.length, 3);
  });

  await t.test("production blocks the SDK's successful timeout fallback", async () => {
    const api = setup({ response: { ...healthy, reason: "timeout" } });
    await assertBlocked(api, 500);
    assert.equal(api.calls.length, 3);
  });

  await t.test("quota exhaustion returns 429 and OTP rate-limit headers", async () => {
    const api = setup({ response: { ...healthy, success: false, remaining: 0 } });
    await assertBlocked(api, 429);
    const response = await api.proxy(request(otpPaths[0]));
    assert.equal(response.headers.get("x-ratelimit-limit"), "5");
    assert.equal(response.headers.get("x-ratelimit-remaining"), "0");
    assert.equal(response.headers.get("x-ratelimit-reset"), String(healthy.reset));
  });

  await t.test("cached blocks still return 429", async () => {
    await assertBlocked(setup({ response: { ...healthy, success: false, reason: "cacheBlock" } }), 429);
  });

  await t.test("healthy login and OTP each consume exactly one quota check", async () => {
    const api = setup();
    const loginRequest = request("/api/admin/login");
    assert.equal((await api.proxy(loginRequest)).headers.get("x-middleware-next"), "1");
    assert.equal(api.calls.length, 0, "Proxy must not duplicate login limiting");
    assert.equal((await api.login(loginRequest)).status, 400);
    assert.deepEqual(api.calls, [{ prefix: "ratelimit:login", identifier: ip }]);
    for (const pathname of otpPaths) {
      assert.equal(doesProxyMatch({ config: api.config, nextConfig: {}, url: pathname }), true);
      const otpRequest = request(pathname, "POST", JSON.stringify({ email: "client@example.com", code: "123456" }));
      const proxyResponse = await api.proxy(otpRequest);
      assert.equal(proxyResponse.headers.get("x-middleware-next"), "1");
      assert.equal(proxyResponse.headers.get("x-ratelimit-remaining"), "4");
      const checksAfterProxy = api.calls.length;
      const client = createClient("https://database.example", "test-key", {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: async () => new Response(JSON.stringify(
          pathname.endsWith("/request") ? [{ created_at: new Date().toISOString() }] : [],
        ), { headers: { "Content-Type": "application/json" } }) },
      });
      const { POST } = loadTs(`app${pathname}/route.ts`, {
        ...api.mocks, "@/lib/supabase-server": { getSupabaseServerClient: () => client },
      });
      const routeResponse = await POST(otpRequest);
      assert.equal(routeResponse.status, pathname.endsWith("/request") ? 429 : 401);
      assert.equal((await routeResponse.json()).code, pathname.endsWith("/request") ? "OTP_RESEND_WAIT" : "OTP_EXPIRED");
      assert.equal(api.calls.length, checksAfterProxy, "OTP handlers must not charge the quota again");
    }
    assert.deepEqual(api.calls.slice(1), otpPaths.map(() => ({ prefix: "ratelimit:otp", identifier: ip })));
  });

  await t.test("development retains its fallback without Redis or during failure", async () => {
    for (const options of [{ url: null }, { rejects: true }, { response: { ...healthy, reason: "timeout" } }]) {
      const api = setup({ ...options, mode: "development" });
      assert.equal((await api.login(request("/api/admin/login"))).status, 400);
      for (const pathname of otpPaths) {
        assert.equal((await api.proxy(request(pathname))).headers.get("x-middleware-next"), "1");
      }
    }
  });

  await t.test("OTP GET requests do not consume quota", async () => {
    const api = setup();
    for (const pathname of otpPaths) {
      assert.equal((await api.proxy(request(pathname, "GET"))).headers.get("x-middleware-next"), "1");
    }
    assert.equal(api.calls.length, 0);
  });

  await t.test("ticket submissions keep their existing fallback", async () => {
    for (const options of [{ url: null }, { rejects: true }]) {
      const api = setup(options);
      assert.equal((await api.proxy(request("/api/tickets"))).headers.get("x-middleware-next"), "1");
    }
  });
});
