/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTs } = require("./helpers/load-ts.cjs");

const { getAdminLoginErrorMessage } = loadTs("features/admin/login-api.ts");
const { adminLoginSchema } = loadTs("features/admin/schemas/admin.ts");

test("getAdminLoginErrorMessage maps API status codes to clear messages", () => {
  assert.equal(
    getAdminLoginErrorMessage(400, { error: "Invalid email address" }),
    "Invalid email address",
  );
  assert.equal(
    getAdminLoginErrorMessage(401, { error: "Invalid email or password" }),
    "Invalid email or password",
  );
  assert.equal(
    getAdminLoginErrorMessage(429, { error: "Too many login attempts. Please try again later" }),
    "Too many login attempts. Please try again later",
  );
  assert.equal(
    getAdminLoginErrorMessage(500, { error: "Internal server error" }),
    "We couldn't sign you in right now. Please try again.",
  );
  assert.equal(
    getAdminLoginErrorMessage(401, null),
    "Invalid email or password.",
  );
});

test("adminLoginSchema validates email and non-empty password", () => {
  assert.equal(adminLoginSchema.safeParse({ email: "bad", password: "secret" }).success, false);
  assert.equal(adminLoginSchema.safeParse({ email: "admin@veris.org", password: "" }).success, false);
  assert.equal(adminLoginSchema.safeParse({ email: "admin@veris.org", password: "secret" }).success, true);
});
