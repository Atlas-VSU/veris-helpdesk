/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { z } = require("zod");
const { loadTs } = require("./helpers/load-ts.cjs");

test("centralized API error handling", async (t) => {
  t.mock.method(console, "error", () => {});
  const {
    ApiError,
    errorResponse,
    handleApiError,
    parseJsonBody,
  } = loadTs("lib/api-error.ts");

  await t.test("errorResponse formats error payload and optional code/details", async () => {
    const res = errorResponse(429, "Please wait 45 seconds.", {
      code: "OTP_RESEND_WAIT",
      details: { retryAfterSeconds: 45 },
      headers: { "Cache-Control": "private, no-store" },
    });
    assert.equal(res.status, 429);
    assert.equal(res.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await res.json(), {
      error: "Please wait 45 seconds.",
      code: "OTP_RESEND_WAIT",
      retryAfterSeconds: 45,
    });
  });

  await t.test("parseJsonBody parses valid JSON and throws 400 ApiError on invalid JSON", async () => {
    const validReq = new Request("https://helpdesk.example/api/test", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com" }),
    });
    assert.deepEqual(await parseJsonBody(validReq), { email: "user@example.com" });

    const invalidReq = new Request("https://helpdesk.example/api/test", {
      method: "POST",
      body: "{bad json",
    });
    await assert.rejects(
      parseJsonBody(invalidReq),
      (err) => err instanceof ApiError && err.status === 400 && err.message === "Invalid request body",
    );
  });

  await t.test("handleApiError maps ApiError, ZodError, PGRST103, and unexpected errors", async () => {
    const unauthorizedRes = handleApiError(ApiError.unauthorized());
    assert.equal(unauthorizedRes.status, 401);
    assert.deepEqual(await unauthorizedRes.json(), { error: "Unauthorized" });

    const schema = z.object({ email: z.string().email("Invalid email address") });
    const parsed = schema.safeParse({ email: "not-an-email" });
    const zodRes = handleApiError(parsed.error);
    assert.equal(zodRes.status, 400);
    assert.deepEqual(await zodRes.json(), { error: "Invalid email address" });

    const rangeRes = handleApiError({ code: "PGRST103", message: "Range not satisfiable" });
    assert.equal(rangeRes.status, 400);
    assert.deepEqual(await rangeRes.json(), { error: "Page is out of range" });

    const internalRes = handleApiError(new Error("Sensitive database connection string"), {
      context: "Test failure",
      fallbackMessage: "Unable to process request",
    });
    assert.equal(internalRes.status, 500);
    const body = await internalRes.json();
    assert.deepEqual(body, { error: "Unable to process request" });
    assert.equal(JSON.stringify(body).includes("Sensitive"), false);
  });
});
