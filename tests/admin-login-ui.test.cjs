/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
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

test("AdminLoginForm initial rendered HTML prevents GET credential leak and disables submit", () => {
  const { AdminLoginForm } = loadTs("features/admin/components/AdminLoginForm.tsx", {
    "next/navigation": { useRouter: () => ({ replace: () => {}, refresh: () => {} }) },
  });

  const html = renderToStaticMarkup(React.createElement(AdminLoginForm));

  // Form must specify method="post" to prevent browser defaulting to GET if JS fails
  assert.match(html, /<form[^>]*method="post"[^>]*>/i);

  // Submit button must be disabled in initial static HTML until hydration enables it
  assert.match(html, /<button[^>]*type="submit"[^>]*disabled=""[^>]*>/i);
});

test("use-admin-login preserves email lowercasing on submit", () => {
  const hookSource = fs.readFileSync(
    path.resolve(__dirname, "../features/admin/hooks/use-admin-login.ts"),
    "utf8",
  );

  // Verify explicit trimming and lowercasing logic before validation/submission
  assert.ok(
    hookSource.includes("email.trim().toLowerCase()"),
    "use-admin-login must lowercase and trim email on submit",
  );
});
