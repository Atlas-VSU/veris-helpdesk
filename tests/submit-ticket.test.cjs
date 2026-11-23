/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTs } = require("./helpers/load-ts.cjs");

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

function createValidFormData(attachment) {
  const formData = new FormData();
  formData.set("fullName", "Jane Doe");
  formData.set("email", "jane@example.com");
  formData.set("userType", "subscriber");
  formData.set("service", "Technical Support");
  formData.set("subject", "Cannot sign in");
  formData.set("description", "Getting an error when signing in.");
  formData.set("priority", "medium");
  formData.set("consent", "on");
  formData.set("cf-turnstile-response", "valid-token");
  if (attachment) formData.set("attachment", attachment);
  return formData;
}

test("attachment metadata and signature validation", async (t) => {
  const {
    MAX_ATTACHMENT_SIZE_BYTES,
    validateAttachmentMetadata,
    hasAcceptedAttachmentSignature,
  } = loadTs("features/submit-ticket/attachment-validation.ts");

  await t.test("rejects zero-byte files", () => {
    const emptyPdf = new File([], "empty.pdf", { type: "application/pdf" });
    assert.equal(
      validateAttachmentMetadata(emptyPdf),
      "The selected file is empty. Please choose a valid JPG, PNG, or PDF file.",
    );
  });

  await t.test("rejects oversized and unsupported files", () => {
    const oversized = new File([new Uint8Array(MAX_ATTACHMENT_SIZE_BYTES + 1)], "huge.png", { type: "image/png" });
    assert.equal(validateAttachmentMetadata(oversized), "File size exceeds the 10 MB limit.");

    const unsupported = new File(["hello"], "notes.txt", { type: "text/plain" });
    assert.equal(validateAttachmentMetadata(unsupported), "Please upload a JPG, PNG, or PDF file.");
  });

  await t.test("accepts valid JPG, PNG, and PDF signatures and rejects spoofed files", async () => {
    const validPng = new File([PNG_BYTES], "screen.png", { type: "image/png" });
    const validJpg = new File([JPEG_BYTES], "photo.jpg", { type: "image/jpeg" });
    const validPdf = new File([PDF_BYTES], "invoice.pdf", { type: "application/pdf" });
    const spoofedPng = new File(["not actually a png"], "fake.png", { type: "image/png" });
    const spoofedPdf = new File(["<html>bad</html>"], "fake.pdf", { type: "application/pdf" });

    assert.equal(validateAttachmentMetadata(validPng), null);
    assert.equal(await hasAcceptedAttachmentSignature(validPng), true);
    assert.equal(await hasAcceptedAttachmentSignature(validJpg), true);
    assert.equal(await hasAcceptedAttachmentSignature(validPdf), true);
    assert.equal(await hasAcceptedAttachmentSignature(spoofedPng), false);
    assert.equal(await hasAcceptedAttachmentSignature(spoofedPdf), false);
  });
});

test("ticket form draft storage", async (t) => {
  const {
    TICKET_FORM_DRAFT_KEY,
    readTicketFormDraft,
    writeTicketFormDraft,
    clearTicketFormDraft,
  } = loadTs("features/submit-ticket/draft-storage.ts");

  const fallback = {
    fullName: "",
    email: "",
    userType: "subscriber",
    service: "",
    subject: "",
    description: "",
    priority: "low",
    consent: false,
  };

  const store = new Map();
  const originalWindow = globalThis.window;
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
  };
  t.after(() => {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  });

  await t.test("writes, reads, and clears valid drafts", () => {
    const draft = {
      ...fallback,
      fullName: "Jane Doe",
      email: "jane@example.com",
      userType: "student",
      service: "Billing",
      subject: "Refund",
      description: "Need help with billing.",
      priority: "high",
      consent: true,
    };

    writeTicketFormDraft(draft);
    assert.deepEqual(readTicketFormDraft(fallback), draft);

    clearTicketFormDraft();
    assert.equal(readTicketFormDraft(fallback), null);
  });

  await t.test("sanitizes invalid enum values and ignores corrupted JSON", () => {
    store.set(
      TICKET_FORM_DRAFT_KEY,
      JSON.stringify({ fullName: "Jane", userType: "hacker", priority: "critical", consent: "yes" }),
    );
    assert.deepEqual(readTicketFormDraft(fallback), {
      ...fallback,
      fullName: "Jane",
      userType: "subscriber",
      priority: "low",
      consent: false,
    });

    store.set(TICKET_FORM_DRAFT_KEY, "{not-valid-json");
    assert.equal(readTicketFormDraft(fallback), null);
  });
});

test("submitTicketAction rate limiting and zero-byte attachment security", async (t) => {
  t.mock.method(console, "error", () => {});

  function loadAction({ forwardedFor = "203.0.113.5, 10.0.0.1", rateLimitResult = { success: true }, rateLimitThrows = false, turnstileValid = true } = {}) {
    const rateLimitCalls = [];
    let turnstileCalls = 0;
    let dbCalls = 0;

    const { submitTicketAction } = loadTs("features/submit-ticket/actions.ts", {
      "next/headers": {
        headers: async () => new Headers(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
      },
      "@/lib/rate-limit": {
        ticketSubmissionRateLimit: {
          limit: async (identifier) => {
            rateLimitCalls.push(identifier);
            if (rateLimitThrows) throw new Error("Redis unavailable");
            return rateLimitResult;
          },
        },
      },
      "@/features/submit-ticket/turnstile": {
        verifyTurnstileToken: async () => {
          turnstileCalls += 1;
          return turnstileValid;
        },
      },
      "@/lib/supabase-server": {
        getSupabaseServerClient: () => ({
          from: () => {
            dbCalls += 1;
            return {
              insert: () => ({
                select: () => ({
                  single: async () => ({
                    data: { id: "ticket-id-1", ticket_number: "TCK-2026-00001" },
                    error: null,
                  }),
                }),
              }),
            };
          },
        }),
      },
    });

    return {
      submitTicketAction,
      getStats: () => ({ rateLimitCalls, turnstileCalls, dbCalls }),
    };
  }

  await t.test("uses first IP from x-forwarded-for and returns rate-limit error without hitting Turnstile or DB", async () => {
    const { submitTicketAction, getStats } = loadAction({
      forwardedFor: " 203.0.113.99 , 198.51.100.2 ",
      rateLimitResult: { success: false },
    });

    const result = await submitTicketAction(createValidFormData());
    assert.deepEqual(result, { error: "Too many ticket submissions. Please try again later." });
    assert.deepEqual(getStats(), {
      rateLimitCalls: ["203.0.113.99"],
      turnstileCalls: 0,
      dbCalls: 0,
    });
  });

  await t.test("rejects named zero-byte attachment instead of silently skipping it", async () => {
    const { submitTicketAction, getStats } = loadAction();
    const emptyAttachment = new File([], "empty.png", { type: "image/png" });

    const result = await submitTicketAction(createValidFormData(emptyAttachment));
    assert.deepEqual(result, {
      error: "The selected file is empty. Please choose a valid JPG, PNG, or PDF file.",
    });
    assert.equal(getStats().dbCalls, 0);
  });

  await t.test("allows submission when Redis throws (existing fallback) and no attachment is provided", async () => {
    const { submitTicketAction, getStats } = loadAction({
      forwardedFor: "",
      rateLimitThrows: true,
    });

    const result = await submitTicketAction(createValidFormData());
    assert.deepEqual(result, { success: true, ticketNumber: "TCK-2026-00001" });
    assert.deepEqual(getStats().rateLimitCalls, ["127.0.0.1"]);
  });
});
