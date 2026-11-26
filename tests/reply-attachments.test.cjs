/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTs } = require("./helpers/load-ts.cjs");

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

const TICKET_ID = "00000000-0000-4000-8000-000000000001";
const MESSAGE_ID = "17151769-2598-45ec-99f5-141279c288a1";
const ATTACHMENT_ID = "3e2f70f2-be91-4f09-8281-f06d24922e9c";

test("FS-09 admin reply attachment validation, persistence, and failure rollback", async (t) => {
  t.mock.method(console, "error", () => {});

  function setup({
    uploadError = null,
    metadataError = null,
  } = {}) {
    const operations = [];
    const uploadedObjects = [];
    const savedAttachments = [];
    const deletedMessages = [];

    const supabase = {
      storage: {
        from: (bucket) => ({
          upload: async (storagePath, file, options) => {
            operations.push({ type: "upload", bucket, storagePath, fileName: file.name, options });
            if (uploadError) {
              return { data: null, error: uploadError };
            }
            uploadedObjects.push(storagePath);
            return { data: { path: storagePath }, error: null };
          },
          remove: async (paths) => {
            operations.push({ type: "remove", bucket, paths });
            for (const path of paths) {
              const idx = uploadedObjects.indexOf(path);
              if (idx !== -1) uploadedObjects.splice(idx, 1);
            }
            return { data: paths, error: null };
          },
        }),
      },
      from: (table) => {
        if (table === "attachments") {
          return {
            insert: (payload) => ({
              select: (columns) => ({
                single: async () => {
                  operations.push({ type: "insert_attachment", payload, columns });
                  if (metadataError) {
                    return { data: null, error: metadataError };
                  }
                  const record = {
                    id: ATTACHMENT_ID,
                    message_id: payload.message_id,
                    file_name: payload.file_name,
                    file_type: payload.file_type,
                    file_size: payload.file_size,
                  };
                  savedAttachments.push({ ...record, ticket_id: payload.ticket_id, storage_path: payload.storage_path });
                  return { data: record, error: null };
                },
              }),
            }),
          };
        }

        if (table === "messages") {
          return {
            delete: () => ({
              eq: (col1, val1) => ({
                eq: async (col2, val2) => {
                  operations.push({
                    type: "delete_message",
                    filters: { [col1]: val1, [col2]: val2 },
                  });
                  deletedMessages.push({ [col1]: val1, [col2]: val2 });
                  return { error: null };
                },
              }),
            }),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    };

    const replyAttachments = loadTs("lib/reply-attachments.ts", {
      "@/lib/supabase-server": {
        getSupabaseServerClient: () => supabase,
      },
    });

    return {
      ...replyAttachments,
      operations,
      uploadedObjects,
      savedAttachments,
      deletedMessages,
    };
  }

  await t.test("persists valid JPG, PNG, and PDF files and links them via ticket_id and message_id", async () => {
    const validFiles = [
      new File([JPEG_BYTES], "receipt photo.jpg", { type: "image/jpeg" }),
      new File([PNG_BYTES], "screenshot.png", { type: "image/png" }),
      new File([PDF_BYTES], "refund-confirmation.pdf", { type: "application/pdf" }),
    ];

    for (const file of validFiles) {
      const ctx = setup();
      const result = await ctx.persistAdminReplyAttachment({
        ticketId: TICKET_ID,
        messageId: MESSAGE_ID,
        file,
      });

      assert.deepEqual(result, {
        id: ATTACHMENT_ID,
        message_id: MESSAGE_ID,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });
      assert.equal(ctx.uploadedObjects.length, 1);
      assert.ok(ctx.uploadedObjects[0].startsWith(`${TICKET_ID}/${MESSAGE_ID}/`));
      assert.equal(ctx.savedAttachments.length, 1);
      assert.equal(ctx.savedAttachments[0].ticket_id, TICKET_ID);
      assert.equal(ctx.savedAttachments[0].message_id, MESSAGE_ID);
      assert.equal(ctx.savedAttachments[0].storage_path, ctx.uploadedObjects[0]);
      assert.equal(ctx.deletedMessages.length, 0);
    }
  });

  await t.test("rejects empty, oversized, unsupported MIME, and spoofed signature files without uploading", async () => {
    const { MAX_ATTACHMENT_SIZE_BYTES } = loadTs("features/submit-ticket/attachment-validation.ts");
    const invalidFiles = [
      [
        new File([], "empty.pdf", { type: "application/pdf" }),
        "The selected file is empty. Please choose a valid JPG, PNG, or PDF file.",
      ],
      [
        new File([new Uint8Array(MAX_ATTACHMENT_SIZE_BYTES + 1)], "oversized.png", { type: "image/png" }),
        "File size exceeds the 10 MB limit.",
      ],
      [
        new File(["plain text"], "notes.txt", { type: "text/plain" }),
        "Please upload a JPG, PNG, or PDF file.",
      ],
      [
        new File(["fake gif"], "anim.gif", { type: "image/gif" }),
        "Please upload a JPG, PNG, or PDF file.",
      ],
      [
        new File(["not a real pdf"], "spoofed.pdf", { type: "application/pdf" }),
        "The file contents do not match its declared type.",
      ],
      [
        new File(["not a real png"], "spoofed.png", { type: "image/png" }),
        "The file contents do not match its declared type.",
      ],
    ];

    for (const [file, expectedMessage] of invalidFiles) {
      const ctx = setup();
      await assert.rejects(
        () =>
          ctx.persistAdminReplyAttachment({
            ticketId: TICKET_ID,
            messageId: MESSAGE_ID,
            file,
          }),
        (err) => err.status === 400 && err.message === expectedMessage,
      );
      assert.equal(ctx.operations.length, 0);
      assert.equal(ctx.uploadedObjects.length, 0);
      assert.equal(ctx.savedAttachments.length, 0);
    }
  });

  await t.test("simulated storage upload failure rolls back the partial reply message and leaves no attachment", async () => {
    const ctx = setup({ uploadError: new Error("Storage bucket unreachable") });
    const file = new File([PDF_BYTES], "refund-confirmation.pdf", { type: "application/pdf" });
    let callbackCalled = false;

    await assert.rejects(
      () =>
        ctx.persistAdminReplyAttachment({
          ticketId: TICKET_ID,
          messageId: MESSAGE_ID,
          file,
          onRollback: () => {
            callbackCalled = true;
          },
        }),
      (err) => err.status === 500 && err.message === "Failed to upload attachment. Please try again.",
    );

    assert.equal(ctx.uploadedObjects.length, 0);
    assert.equal(ctx.savedAttachments.length, 0);
    assert.deepEqual(ctx.deletedMessages, [{ id: MESSAGE_ID, ticket_id: TICKET_ID }]);
    assert.equal(callbackCalled, true);
  });

  await t.test("simulated metadata insert failure removes uploaded object and rolls back the partial reply", async () => {
    const ctx = setup({ metadataError: new Error("Foreign key violation") });
    const file = new File([PDF_BYTES], "refund-confirmation.pdf", { type: "application/pdf" });

    await assert.rejects(
      () =>
        ctx.persistAdminReplyAttachment({
          ticketId: TICKET_ID,
          messageId: MESSAGE_ID,
          file,
        }),
      (err) => err.status === 500 && err.message === "Failed to save attachment info. Please try again.",
    );

    assert.equal(ctx.uploadedObjects.length, 0);
    assert.equal(ctx.savedAttachments.length, 0);
    assert.deepEqual(
      ctx.operations.map((op) => op.type),
      ["upload", "insert_attachment", "remove", "delete_message"],
    );
    assert.deepEqual(ctx.deletedMessages, [{ id: MESSAGE_ID, ticket_id: TICKET_ID }]);
  });

  await t.test("extractOptionalReplyAttachment handles missing, empty input, valid File, and invalid string entries", () => {
    const ctx = setup();

    const emptyForm = new FormData();
    assert.equal(ctx.extractOptionalReplyAttachment(emptyForm), null);

    const unselectedFileForm = new FormData();
    unselectedFileForm.set("attachment", new File([], "", { type: "application/octet-stream" }));
    assert.equal(ctx.extractOptionalReplyAttachment(unselectedFileForm), null);

    const namedEmptyFileForm = new FormData();
    const namedEmpty = new File([], "empty.pdf", { type: "application/pdf" });
    namedEmptyFileForm.set("attachment", namedEmpty);
    assert.equal(ctx.extractOptionalReplyAttachment(namedEmptyFileForm)?.name, "empty.pdf");

    const invalidStringForm = new FormData();
    invalidStringForm.set("attachment", "not-a-file");
    assert.throws(
      () => ctx.extractOptionalReplyAttachment(invalidStringForm),
      (err) => err.status === 400 && err.message === "Please upload a JPG, PNG, or PDF file.",
    );
  });
});
