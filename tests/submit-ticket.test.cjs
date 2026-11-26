/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTs } = require("./helpers/load-ts.cjs");

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const TICKET_ID = "ticket-id-1";
const TICKET_NUMBER = "TCK-2026-00427";
const SUBMITTER = "jane@example.com";
const SHARED_MAILBOX = "helpdesk-admin@example.com";
const SMTP_SENDER = "sender@example.com";
const SMTP_PASSWORD = "mock-app-password";
const PRIVATE_FAILURE_DETAIL = "raw failure with mock-app-password and private ticket data";

function setTestEnv(t, values) {
  for (const [name, value] of Object.entries(values)) {
    const previous = process.env[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[name];
      else process.env[name] = previous;
    });
  }
}

function mockGmail(failedRecipient) {
  const messages = [];
  const transports = [];
  return {
    messages,
    transports,
    modules: {
      "server-only": {},
      nodemailer: {
        createTransport: (options) => {
          transports.push(options);
          return {
            sendMail: async (message) => {
              messages.push(message);
              if (message.to === failedRecipient) throw new Error(PRIVATE_FAILURE_DETAIL);
            },
          };
        },
      },
    },
  };
}

function createValidFormData(attachment) {
  const formData = new FormData();
  formData.set("fullName", "Jane Doe");
  formData.set("email", ` ${SUBMITTER.toUpperCase()} `);
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

test("submitTicketAction validation, persistence, and email delivery", async (t) => {
  setTestEnv(t, {
    GMAIL_USER: SMTP_SENDER,
    GMAIL_APP_PASSWORD: SMTP_PASSWORD,
    ADMIN_NOTIFICATION_EMAIL: SHARED_MAILBOX,
  });
  const errors = t.mock.method(console, "error", () => {});

  function loadAction({
    forwardedFor = "203.0.113.5, 10.0.0.1",
    rateLimitResult = { success: true },
    rateLimitThrows = false,
    turnstileValid = true,
    failedSave,
    failedRecipient,
  } = {}) {
    const rateLimitCalls = [];
    const operations = [];
    const afterCallbacks = [];
    const { messages, modules } = mockGmail(failedRecipient);
    const saveError = (operation) =>
      failedSave === operation ? new Error(PRIVATE_FAILURE_DETAIL) : null;
    let turnstileCalls = 0;
    let dbCalls = 0;
    let uploadedPath;

    const { submitTicketAction } = loadTs("features/submit-ticket/actions.ts", {
      ...modules,
      "next/headers": {
        headers: async () => new Headers(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
      },
      "next/server": {
        after: (callback) => {
          operations.push("schedule emails");
          afterCallbacks.push(callback);
        },
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
          from: (table) => {
            dbCalls += 1;
            if (table === "attachments") {
              return {
                insert: async (attachment) => {
                  assert.equal(attachment.ticket_id, TICKET_ID);
                  assert.equal(attachment.storage_path, uploadedPath);
                  operations.push("save attachment metadata");
                  return { error: saveError("metadata") };
                },
              };
            }
            assert.equal(table, "tickets");
            return {
              insert: (ticket) => {
                assert.equal(ticket.email, SUBMITTER);
                assert.equal(ticket.ticket_number, "PENDING");
                return {
                  select: () => ({
                    single: async () => {
                      operations.push("save ticket");
                      const error = saveError("ticket");
                      return { data: error ? null : { id: TICKET_ID, ticket_number: TICKET_NUMBER }, error };
                    },
                  }),
                };
              },
              delete: () => ({
                eq: async (column, value) => {
                  assert.equal(column, "id");
                  assert.equal(value, TICKET_ID);
                  operations.push("delete ticket");
                },
              }),
            };
          },
          storage: {
            from: (bucket) => {
              assert.equal(bucket, "attachments");
              return {
                upload: async (path) => {
                  operations.push("upload attachment");
                  uploadedPath = path;
                  return { error: saveError("upload") };
                },
                remove: async (paths) => {
                  assert.deepEqual(paths, [uploadedPath]);
                  operations.push("remove attachment");
                },
              };
            },
          },
        }),
      },
    });

    return {
      submitTicketAction,
      getStats: () => ({ rateLimitCalls, turnstileCalls, dbCalls }),
      messages,
      operations,
      afterCallbacks,
    };
  }

  await t.test("uses first IP from x-forwarded-for and returns rate-limit error without hitting Turnstile or DB", async () => {
    const { submitTicketAction, getStats, afterCallbacks, messages } = loadAction({
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
    assert.deepEqual(afterCallbacks, []);
    assert.deepEqual(messages, []);
  });

  await t.test("rejects named zero-byte attachment instead of silently skipping it", async () => {
    const { submitTicketAction, getStats, afterCallbacks, messages } = loadAction();
    const emptyAttachment = new File([], "empty.png", { type: "image/png" });

    const result = await submitTicketAction(createValidFormData(emptyAttachment));
    assert.deepEqual(result, {
      error: "The selected file is empty. Please choose a valid JPG, PNG, or PDF file.",
    });
    assert.equal(getStats().dbCalls, 0);
    assert.deepEqual(afterCallbacks, []);
    assert.deepEqual(messages, []);
  });

  await t.test("allows submission when Redis throws (existing fallback) and no attachment is provided", async () => {
    const { submitTicketAction, getStats, operations } = loadAction({
      forwardedFor: "",
      rateLimitThrows: true,
    });

    const result = await submitTicketAction(createValidFormData());
    assert.deepEqual(result, { success: true, ticketNumber: TICKET_NUMBER });
    assert.deepEqual(getStats().rateLimitCalls, ["127.0.0.1"]);
    assert.deepEqual(operations, ["save ticket", "schedule emails"]);
  });

  for (const withAttachment of [false, true]) {
    await t.test(`sends both emails once after a successful submission ${withAttachment ? "with" : "without"} an attachment`, async () => {
      const { submitTicketAction, operations, afterCallbacks, messages } = loadAction();
      const attachment = withAttachment ? new File([PDF_BYTES], "invoice.pdf", { type: "application/pdf" }) : undefined;

      assert.deepEqual(await submitTicketAction(createValidFormData(attachment)), { success: true, ticketNumber: TICKET_NUMBER });
      assert.deepEqual(operations, withAttachment
        ? ["save ticket", "upload attachment", "save attachment metadata", "schedule emails"]
        : ["save ticket", "schedule emails"]);
      assert.equal(afterCallbacks.length, 1);
      assert.deepEqual(messages, []);
      await afterCallbacks[0]();

      assert.deepEqual(messages.map((message) => message.to), [SUBMITTER, SHARED_MAILBOX]);
      for (const message of messages) {
        assert.ok(message.subject.includes(TICKET_NUMBER));
        assert.ok(message.text.includes(TICKET_NUMBER));
        assert.doesNotMatch(`${message.subject} ${message.text}`, /Cannot sign in|Getting an error|Jane Doe|invoice\.pdf|PENDING/);
        assert.equal(message.attachments, undefined);
      }
    });
  }

  await t.test("does not schedule email when fields or Turnstile are rejected", async () => {
    const invalidEmail = createValidFormData();
    invalidEmail.set("email", "invalid");
    const invalidTicket = loadAction();
    assert.deepEqual(await invalidTicket.submitTicketAction(invalidEmail), { error: "Invalid email address" });
    assert.equal(invalidTicket.getStats().turnstileCalls, 0);
    assert.deepEqual(invalidTicket.operations, []);
    assert.deepEqual(invalidTicket.afterCallbacks, []);
    assert.deepEqual(invalidTicket.messages, []);

    const invalidCaptcha = loadAction({ turnstileValid: false });
    assert.deepEqual(await invalidCaptcha.submitTicketAction(createValidFormData()), {
      error: "We could not verify the spam protection check. Please try again.", captchaError: true,
    });
    assert.deepEqual(invalidCaptcha.operations, []);
    assert.deepEqual(invalidCaptcha.afterCallbacks, []);
    assert.deepEqual(invalidCaptcha.messages, []);
  });

  const saveFailures = [
    ["ticket", "Failed to create ticket.", ["save ticket"]],
    ["upload", "Failed to upload attachment. Please try again.", ["save ticket", "upload attachment", "delete ticket"]],
    ["metadata", "Failed to save attachment info. Please try again.", ["save ticket", "upload attachment", "save attachment metadata", "remove attachment", "delete ticket"]],
  ];
  for (const [failedSave, error, expectedOperations] of saveFailures) {
    await t.test(`does not schedule email after a ${failedSave} save failure`, async () => {
      const { submitTicketAction, operations, afterCallbacks, messages } = loadAction({ failedSave });
      const attachment = new File([PDF_BYTES], "invoice.pdf", { type: "application/pdf" });

      assert.deepEqual(await submitTicketAction(createValidFormData(attachment)), { error });
      assert.deepEqual(operations, expectedOperations);
      assert.deepEqual(afterCallbacks, []);
      assert.deepEqual(messages, []);
    });
  }

  const adminMailboxFailures = [
    ["missing", undefined, "ADMIN_NOTIFICATION_EMAIL is missing"],
    ["invalid", `${SHARED_MAILBOX}, another@example.com`, "ADMIN_NOTIFICATION_EMAIL must contain one email address"],
  ];
  for (const [state, mailbox, reason] of adminMailboxFailures) {
    await t.test(`preserves success and sends the confirmation when the admin mailbox is ${state}`, async (t) => {
      setTestEnv(t, { ADMIN_NOTIFICATION_EMAIL: mailbox });
      errors.mock.resetCalls();
      const { submitTicketAction, afterCallbacks, messages } = loadAction();

      assert.deepEqual(await submitTicketAction(createValidFormData()), { success: true, ticketNumber: TICKET_NUMBER });
      assert.equal(afterCallbacks.length, 1);
      assert.deepEqual(messages, []);
      await afterCallbacks[0]();
      assert.deepEqual(messages.map((message) => message.to), [SUBMITTER]);
      assert.deepEqual(errors.mock.calls.map((call) => call.arguments), [
        ["Failed to send new ticket admin alert.", reason],
      ]);
    });
  }

  const smtpFailures = [
    [SUBMITTER, "ticket submission confirmation"],
    [SHARED_MAILBOX, "new ticket admin alert"],
  ];
  for (const [failedRecipient, email] of smtpFailures) {
    await t.test(`preserves success and attempts both emails when SMTP fails for the ${email}`, async () => {
      errors.mock.resetCalls();
      const { submitTicketAction, afterCallbacks, messages } = loadAction({ failedRecipient });
      const attachment = new File([PDF_BYTES], "invoice.pdf", { type: "application/pdf" });

      assert.deepEqual(await submitTicketAction(createValidFormData(attachment)), { success: true, ticketNumber: TICKET_NUMBER });
      assert.equal(afterCallbacks.length, 1);
      assert.deepEqual(messages, []);
      await afterCallbacks[0]();
      assert.deepEqual(messages.map((message) => message.to), [SUBMITTER, SHARED_MAILBOX]);
      assert.deepEqual(errors.mock.calls.map((call) => call.arguments), [
        [`Failed to send ${email}.`, "Gmail SMTP delivery failed"],
      ]);
    });
  }

  await t.test("preserves success and reports missing Gmail credentials for both emails", async (t) => {
    setTestEnv(t, { GMAIL_APP_PASSWORD: undefined });
    errors.mock.resetCalls();
    const { submitTicketAction, afterCallbacks, messages } = loadAction();

    assert.deepEqual(await submitTicketAction(createValidFormData()), { success: true, ticketNumber: TICKET_NUMBER });
    assert.equal(afterCallbacks.length, 1);
    await afterCallbacks[0]();
    assert.deepEqual(messages, []);
    assert.deepEqual(errors.mock.calls.map((call) => call.arguments), [
      ["Failed to send ticket submission confirmation.", "GMAIL_USER or GMAIL_APP_PASSWORD is missing"],
      ["Failed to send new ticket admin alert.", "GMAIL_USER or GMAIL_APP_PASSWORD is missing"],
    ]);
  });
});

test("reply email functions use Gmail and the correct recipients", async (t) => {
  setTestEnv(t, {
    GMAIL_USER: SMTP_SENDER,
    GMAIL_APP_PASSWORD: SMTP_PASSWORD,
    ADMIN_NOTIFICATION_EMAIL: ` ${SHARED_MAILBOX} `,
  });
  const { messages, transports, modules } = mockGmail();
  const { sendAdminReplyNotice, sendClientReplyAdminAlert } = loadTs("lib/ticket-email.ts", modules);

  await sendAdminReplyNotice(SUBMITTER, TICKET_NUMBER);
  await sendClientReplyAdminAlert(TICKET_NUMBER);

  assert.deepEqual(messages.map((message) => message.to), [SUBMITTER, SHARED_MAILBOX]);
  for (const message of messages) {
    assert.equal(message.from, `"Veris Helpdesk" <${SMTP_SENDER}>`);
    assert.ok(message.subject.includes(TICKET_NUMBER));
    assert.ok(message.text.includes(TICKET_NUMBER));
    assert.equal(message.attachments, undefined);
  }
  assert.match(messages[0].text, /The helpdesk replied/);
  assert.match(messages[1].text, /The client replied/);
  assert.deepEqual(transports, Array.from({ length: 2 }, () => ({
    service: "gmail", auth: { user: SMTP_SENDER, pass: SMTP_PASSWORD },
  })));

  process.env.ADMIN_NOTIFICATION_EMAIL = `${SHARED_MAILBOX}, another@example.com`;
  await assert.rejects(sendClientReplyAdminAlert(TICKET_NUMBER), { message: "ADMIN_NOTIFICATION_EMAIL must contain one email address" });
  assert.equal(messages.length, 2);
});

test("OTP shares Gmail SMTP and preserves the verification message and development fallback", async (t) => {
  setTestEnv(t, {
    GMAIL_USER: SMTP_SENDER,
    GMAIL_APP_PASSWORD: SMTP_PASSWORD,
    ADMIN_NOTIFICATION_EMAIL: "",
    NODE_ENV: "production",
  });
  const errors = t.mock.method(console, "error", () => {});
  const logs = t.mock.method(console, "log", () => {});
  const { messages, modules } = mockGmail("failed@example.com");
  const { sendOtpEmail } = loadTs("lib/otp-email.ts", modules);
  const code = "012345";

  await sendOtpEmail(SUBMITTER, code);
  assert.deepEqual(messages, [{
    from: `"Veris Helpdesk" <${SMTP_SENDER}>`,
    to: SUBMITTER,
    subject: "Your Veris Helpdesk verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes. If you did not ask for it, you can ignore this email.`,
  }]);
  assert.equal(logs.mock.callCount(), 0);

  await sendOtpEmail("failed@example.com", code);
  assert.deepEqual(errors.mock.calls[0].arguments, ["OTP email not sent:", "Gmail SMTP delivery failed"]);

  process.env.NODE_ENV = "development";
  delete process.env.GMAIL_APP_PASSWORD;
  await sendOtpEmail(SUBMITTER, code);
  assert.equal(messages.length, 2);
  assert.deepEqual(logs.mock.calls[0].arguments, [`[DEV] OTP for ${SUBMITTER}: ${code}`]);
  assert.deepEqual(errors.mock.calls[1].arguments, ["OTP email not sent:", "GMAIL_USER or GMAIL_APP_PASSWORD is missing"]);
});
