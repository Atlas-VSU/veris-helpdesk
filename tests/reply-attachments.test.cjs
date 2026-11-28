/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTs } = require("./helpers/load-ts.cjs");

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

const TICKET_ID = "00000000-0000-4000-8000-000000000001";
const OTHER_TICKET_ID = "00000000-0000-4000-8000-000000000002";
const ADMIN_ID = "00000000-0000-4000-8000-000000000010";
const MESSAGE_ID = "17151769-2598-45ec-99f5-141279c288a1";
const ATTACHMENT_ID = "3e2f70f2-be91-4f09-8281-f06d24922e9c";

test("FS-09 admin reply attachment validation, atomic persistence, and failure rollback", async (t) => {
  t.mock.method(console, "error", () => {});

  function setup({
    uploadError = null,
    metadataError = null,
    lostRpcResponseError = null,
    finishSaveAfterLookupError = null,
    deleteMessageError = null,
    initialMessages = [],
  } = {}) {
    let currentUploadError = uploadError;
    let currentMetadataError = metadataError;
    let currentLostRpcResponseError = lostRpcResponseError;
    let currentFinishSaveAfterLookupError = finishSaveAfterLookupError;
    let pendingLateSave = null;
    const operations = [];
    const uploadedObjects = [];
    const savedMessages = initialMessages.map((msg) => ({ ...msg }));
    const savedAttachments = [];

    const supabase = {
      storage: {
        from: (bucket) => ({
          upload: async (storagePath, file, options) => {
            operations.push({ type: "upload", bucket, storagePath, fileName: file.name, options });
            if (currentUploadError) {
              return { data: null, error: currentUploadError };
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
      rpc: async (fnName, params) => {
        if (fnName !== "create_admin_reply_with_attachment") {
          throw new Error(`Unexpected RPC: ${fnName}`);
        }
        operations.push({ type: "rpc_create_admin_reply_with_attachment", params });

        // Simulate atomic PostgreSQL transaction: if attachment metadata persistence fails,
        // neither the message row nor the attachment row is committed.
        if (currentMetadataError) {
          return { data: null, error: currentMetadataError };
        }

        const messageRecord = {
          id: params.p_message_id,
          ticket_id: params.p_ticket_id,
          sender_type: "admin",
          admin_id: params.p_admin_id ?? null,
          body: params.p_body,
          created_at: "2026-11-26T04:00:00Z",
        };

        const attachments = [];
        let attachmentRecord = null;
        if (params.p_storage_path !== null && params.p_storage_path !== undefined) {
          attachmentRecord = {
            id: ATTACHMENT_ID,
            ticket_id: messageRecord.ticket_id,
            message_id: messageRecord.id,
            file_name: params.p_file_name,
            file_type: params.p_file_type,
            file_size: params.p_file_size,
            storage_path: params.p_storage_path,
          };
          attachments.push({
            id: attachmentRecord.id,
            message_id: attachmentRecord.message_id,
            file_name: attachmentRecord.file_name,
            file_type: attachmentRecord.file_type,
            file_size: attachmentRecord.file_size,
          });
        }

        const commitRecords = () => {
          savedMessages.push(messageRecord);
          if (attachmentRecord) {
            savedAttachments.push(attachmentRecord);
          }
        };

        if (currentFinishSaveAfterLookupError) {
          pendingLateSave = commitRecords;
          return { data: null, error: currentFinishSaveAfterLookupError };
        }

        commitRecords();

        if (currentLostRpcResponseError) {
          return { data: null, error: currentLostRpcResponseError };
        }

        return {
          data: {
            id: messageRecord.id,
            ticket_id: messageRecord.ticket_id,
            sender_type: messageRecord.sender_type,
            body: messageRecord.body,
            created_at: messageRecord.created_at,
            attachments,
          },
          error: null,
        };
      },
      from: (table) => {
        if (table === "messages") {
          return {
            select: (columns) => ({
              eq: (col, val) => ({
                maybeSingle: async () => {
                  operations.push({ type: "select_message", columns, filters: { [col]: val } });
                  const found = savedMessages.find((item) => item[col] === val) ?? null;
                  if (pendingLateSave) {
                    const finalizeSave = pendingLateSave;
                    pendingLateSave = null;
                    finalizeSave();
                  }
                  return { data: found, error: null };
                },
              }),
            }),
            delete: () => ({
              eq: (col1, val1) => ({
                eq: async (col2, val2) => {
                  operations.push({
                    type: "delete_message",
                    filters: { [col1]: val1, [col2]: val2 },
                  });
                  if (deleteMessageError) {
                    return { error: deleteMessageError };
                  }
                  const idx = savedMessages.findIndex(
                    (item) => item[col1] === val1 && item[col2] === val2,
                  );
                  if (idx !== -1) savedMessages.splice(idx, 1);
                  return { error: null };
                },
              }),
            }),
          };
        }

        if (table === "attachments") {
          return {
            select: (columns) => ({
              eq: (col, val) => ({
                maybeSingle: async () => {
                  operations.push({ type: "select_attachment", columns, filters: { [col]: val } });
                  const found = savedAttachments.find((item) => item[col] === val) ?? null;
                  return { data: found, error: null };
                },
              }),
            }),
            insert: (payload) => ({
              select: (columns) => ({
                single: async () => {
                  operations.push({ type: "insert_attachment", payload, columns });
                  if (currentMetadataError) {
                    return { data: null, error: currentMetadataError };
                  }
                  const linkedMessage = savedMessages.find((msg) => msg.id === payload.message_id);
                  if (!linkedMessage || linkedMessage.ticket_id !== payload.ticket_id) {
                    return {
                      data: null,
                      error: new Error("attachments_message_ticket_fkey violation"),
                    };
                  }
                  const record = {
                    id: ATTACHMENT_ID,
                    message_id: payload.message_id,
                    file_name: payload.file_name,
                    file_type: payload.file_type,
                    file_size: payload.file_size,
                  };
                  savedAttachments.push({
                    ...record,
                    ticket_id: payload.ticket_id,
                    storage_path: payload.storage_path,
                  });
                  return { data: record, error: null };
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
      savedMessages,
      savedAttachments,
      setUploadError: (err) => {
        currentUploadError = err;
      },
      setMetadataError: (err) => {
        currentMetadataError = err;
      },
    };
  }

  await t.test("a close or deletion during upload removes the file and returns the ticket error", async () => {
    for (const [code, status] of [["VR400", 400], ["VR404", 404]]) {
      const ctx = setup({ metadataError: { code } });
      await assert.rejects(ctx.persistAdminReplyWithAttachment({
        ticketId: TICKET_ID, adminId: ADMIN_ID, body: "Reply",
        file: new File([PDF_BYTES], "reply.pdf", { type: "application/pdf" }),
      }), (error) => error.status === status);
      assert.deepEqual(ctx.operations.map(({ type }) => type), ["upload", "rpc_create_admin_reply_with_attachment", "remove"]);
      assert.deepEqual(ctx.uploadedObjects, []);
      assert.deepEqual(ctx.savedMessages, []);
      assert.deepEqual(ctx.savedAttachments, []);
    }
  });

  await t.test("uploads file first, then atomically saves the reply and attachment metadata", async () => {
    const validFiles = [
      new File([JPEG_BYTES], "receipt photo.jpg", { type: "image/jpeg" }),
      new File([PNG_BYTES], "screenshot.png", { type: "image/png" }),
      new File([PDF_BYTES], "refund-confirmation.pdf", { type: "application/pdf" }),
    ];

    for (const file of validFiles) {
      const ctx = setup();
      const savedReply = await ctx.persistAdminReplyWithAttachment({
        ticketId: TICKET_ID,
        adminId: ADMIN_ID,
        messageId: MESSAGE_ID,
        body: "  I've attached the refund confirmation.  ",
        file,
      });

      assert.deepEqual(savedReply, {
        id: MESSAGE_ID,
        sender_type: "admin",
        body: "I've attached the refund confirmation.",
        created_at: "2026-11-26T04:00:00Z",
        attachments: [
          {
            id: ATTACHMENT_ID,
            message_id: MESSAGE_ID,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
          },
        ],
      });

      assert.deepEqual(
        ctx.operations.map((op) => op.type),
        ["upload", "rpc_create_admin_reply_with_attachment"],
      );
      assert.equal(ctx.uploadedObjects.length, 1);
      assert.ok(ctx.uploadedObjects[0].startsWith(`${TICKET_ID}/${MESSAGE_ID}/`));
      assert.equal(ctx.savedMessages.length, 1);
      assert.equal(ctx.savedMessages[0].id, MESSAGE_ID);
      assert.equal(ctx.savedMessages[0].ticket_id, TICKET_ID);
      assert.equal(ctx.savedAttachments.length, 1);
      assert.equal(ctx.savedAttachments[0].ticket_id, TICKET_ID);
      assert.equal(ctx.savedAttachments[0].message_id, MESSAGE_ID);
      assert.equal(ctx.savedAttachments[0].storage_path, ctx.uploadedObjects[0]);
    }
  });

  await t.test("saves text-only admin reply with an empty attachments array when no file is provided", async () => {
    const ctx = setup();
    const savedReply = await ctx.persistAdminReplyWithAttachment({
      ticketId: TICKET_ID,
      adminId: ADMIN_ID,
      messageId: MESSAGE_ID,
      body: "Could you confirm the statement date?",
      file: null,
    });

    assert.deepEqual(savedReply, {
      id: MESSAGE_ID,
      sender_type: "admin",
      body: "Could you confirm the statement date?",
      created_at: "2026-11-26T04:00:00Z",
      attachments: [],
    });
    assert.equal(ctx.uploadedObjects.length, 0);
    assert.equal(ctx.savedMessages.length, 1);
    assert.equal(ctx.savedAttachments.length, 0);
  });

  await t.test("rejects empty, oversized, unsupported MIME, and spoofed signature files without uploading or creating a reply", async () => {
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
          ctx.persistAdminReplyWithAttachment({
            ticketId: TICKET_ID,
            messageId: MESSAGE_ID,
            body: "Here is the file.",
            file,
          }),
        (err) => err.status === 400 && err.message === expectedMessage,
      );
      assert.equal(ctx.operations.length, 0);
      assert.equal(ctx.uploadedObjects.length, 0);
      assert.equal(ctx.savedMessages.length, 0);
      assert.equal(ctx.savedAttachments.length, 0);
    }
  });

  await t.test("regression: failed upload leaves no visible reply in the thread even if message delete would also fail, preventing duplicate replies on retry", async () => {
    const ctx = setup({
      uploadError: new Error("Storage bucket unreachable"),
      deleteMessageError: new Error("Cleanup delete also failed"),
    });
    const file = new File([PDF_BYTES], "refund-confirmation.pdf", { type: "application/pdf" });

    await assert.rejects(
      () =>
        ctx.persistAdminReplyWithAttachment({
          ticketId: TICKET_ID,
          adminId: ADMIN_ID,
          messageId: MESSAGE_ID,
          body: "I've attached the refund confirmation.",
          file,
        }),
      (err) => err.status === 500 && err.message === "Failed to upload attachment. Please try again.",
    );

    // Because upload happens before database persistence, the reply was never inserted.
    assert.equal(ctx.uploadedObjects.length, 0);
    assert.equal(ctx.savedMessages.length, 0);
    assert.equal(ctx.savedAttachments.length, 0);

    // When the admin retries after storage recovers, the reply appears once in the thread.
    ctx.setUploadError(null);
    const retryReply = await ctx.persistAdminReplyWithAttachment({
      ticketId: TICKET_ID,
      adminId: ADMIN_ID,
      messageId: MESSAGE_ID,
      body: "I've attached the refund confirmation.",
      file,
    });

    assert.equal(retryReply.id, MESSAGE_ID);
    assert.equal(ctx.savedMessages.length, 1);
    assert.equal(ctx.savedAttachments.length, 1);
  });

  await t.test("regression: simulated transaction/metadata save failure leaves no partial reply in the thread and removes the uploaded file", async () => {
    const ctx = setup({ metadataError: new Error("Transaction rolled back") });
    const file = new File([PDF_BYTES], "refund-confirmation.pdf", { type: "application/pdf" });

    await assert.rejects(
      () =>
        ctx.persistAdminReplyWithAttachment({
          ticketId: TICKET_ID,
          adminId: ADMIN_ID,
          messageId: MESSAGE_ID,
          body: "I've attached the refund confirmation.",
          file,
        }),
      (err) => err.status === 500 && err.message === "Failed to save attachment info. Please try again.",
    );

    assert.equal(ctx.uploadedObjects.length, 0);
    assert.equal(ctx.savedMessages.length, 0);
    assert.equal(ctx.savedAttachments.length, 0);
    assert.deepEqual(
      ctx.operations.map((op) => op.type),
      ["upload", "rpc_create_admin_reply_with_attachment", "select_message", "remove"],
    );
  });

  await t.test("regression: returns saved reply and preserves uploaded file when the database saves the reply and attachment but the RPC response is lost", async () => {
    const ctx = setup({
      lostRpcResponseError: new Error("Network response lost after database commit"),
    });
    const file = new File([PDF_BYTES], "refund-confirmation.pdf", { type: "application/pdf" });

    const savedReply = await ctx.persistAdminReplyWithAttachment({
      ticketId: TICKET_ID,
      adminId: ADMIN_ID,
      messageId: MESSAGE_ID,
      body: "  I've attached the refund confirmation.  ",
      file,
    });

    assert.deepEqual(savedReply, {
      id: MESSAGE_ID,
      sender_type: "admin",
      body: "I've attached the refund confirmation.",
      created_at: "2026-11-26T04:00:00Z",
      attachments: [
        {
          id: ATTACHMENT_ID,
          message_id: MESSAGE_ID,
          file_name: "refund-confirmation.pdf",
          file_type: "application/pdf",
          file_size: file.size,
        },
      ],
    });
    assert.equal(ctx.savedMessages.length, 1);
    assert.equal(ctx.savedMessages[0].id, MESSAGE_ID);
    assert.equal(ctx.savedAttachments.length, 1);
    assert.equal(ctx.uploadedObjects.length, 1);
    assert.equal(ctx.uploadedObjects[0], ctx.savedAttachments[0].storage_path);
    assert.deepEqual(
      ctx.operations.map((op) => op.type),
      [
        "upload",
        "rpc_create_admin_reply_with_attachment",
        "select_message",
        "select_attachment",
      ],
    );
  });

  await t.test("regression: does not delete uploaded file when the database is still saving during the lookup and the save finishes after the lookup (including unknown-outcome codes 40003 and 08007)", async () => {
    const unknownOutcomeErrors = [
      new Error("RPC timed out while database was still saving"),
      Object.assign(new Error("statement_completion_unknown"), { code: "40003" }),
      Object.assign(new Error("transaction_resolution_unknown"), { code: "08007" }),
    ];

    for (const unknownError of unknownOutcomeErrors) {
      const ctx = setup({
        finishSaveAfterLookupError: unknownError,
      });
      const file = new File([PDF_BYTES], "refund-confirmation.pdf", { type: "application/pdf" });

      assert.equal(ctx.isConfirmedTransactionRollback(unknownError), false);

      await assert.rejects(
        () =>
          ctx.persistAdminReplyWithAttachment({
            ticketId: TICKET_ID,
            adminId: ADMIN_ID,
            messageId: MESSAGE_ID,
            body: "I've attached the refund confirmation.",
            file,
          }),
        (err) =>
          err.status === 500 &&
          err.message === "Failed to save attachment info. Please try again.",
      );

      // The save completed after the lookup returned an empty result, and the file it references is preserved.
      assert.equal(ctx.savedMessages.length, 1);
      assert.equal(ctx.savedMessages[0].id, MESSAGE_ID);
      assert.equal(ctx.savedAttachments.length, 1);
      assert.equal(ctx.uploadedObjects.length, 1);
      assert.equal(ctx.uploadedObjects[0], ctx.savedAttachments[0].storage_path);
      assert.deepEqual(
        ctx.operations.map((op) => op.type),
        ["upload", "rpc_create_admin_reply_with_attachment", "select_message"],
      );
    }

    for (const code of ["40003", "08007"]) {
      const unknownSqlStateError = Object.assign(
        new Error(`Transaction rollback outcome unknown (${code})`),
        { code },
      );
      const ctx = setup({
        metadataError: unknownSqlStateError,
      });
      const file = new File([PDF_BYTES], "refund-confirmation.pdf", { type: "application/pdf" });

      assert.equal(ctx.isConfirmedTransactionRollback(unknownSqlStateError), false);

      await assert.rejects(
        () =>
          ctx.persistAdminReplyWithAttachment({
            ticketId: TICKET_ID,
            adminId: ADMIN_ID,
            messageId: MESSAGE_ID,
            body: "I've attached the refund confirmation.",
            file,
          }),
        (err) =>
          err.status === 500 &&
          err.message === "Failed to save attachment info. Please try again.",
      );

      // Even when the lookup finds no row yet, 40003 and 08007 mean the save outcome is unknown, so the file is kept.
      assert.equal(ctx.uploadedObjects.length, 1);
      assert.deepEqual(
        ctx.operations.map((op) => op.type),
        ["upload", "rpc_create_admin_reply_with_attachment", "select_message"],
      );
    }
  });

  await t.test("verifies the reply belongs to the ticket and derives ticket_id from the saved reply before saving attachment", async () => {
    const file = new File([PDF_BYTES], "refund-confirmation.pdf", { type: "application/pdf" });

    // 1. Rejects when the message belongs to a different ticket
    const mismatchCtx = setup({
      initialMessages: [
        {
          id: MESSAGE_ID,
          ticket_id: OTHER_TICKET_ID,
          sender_type: "admin",
          body: "Reply on another ticket",
          created_at: "2026-11-26T04:00:00Z",
        },
      ],
    });

    await assert.rejects(
      () =>
        mismatchCtx.persistAdminReplyAttachment({
          ticketId: TICKET_ID,
          messageId: MESSAGE_ID,
          file,
        }),
      (err) =>
        err.status === 400 &&
        err.message === "Reply message does not belong to the specified ticket.",
    );
    assert.equal(mismatchCtx.uploadedObjects.length, 0);
    assert.equal(mismatchCtx.savedAttachments.length, 0);

    // 2. Rejects when the message does not exist
    const missingCtx = setup({ initialMessages: [] });
    await assert.rejects(
      () =>
        missingCtx.persistAdminReplyAttachment({
          ticketId: TICKET_ID,
          messageId: MESSAGE_ID,
          file,
        }),
      (err) => err.status === 400 && err.message === "Reply message not found.",
    );
    assert.equal(missingCtx.uploadedObjects.length, 0);
    assert.equal(missingCtx.savedAttachments.length, 0);

    // 3. Derives ticket_id directly from the saved reply when ticketId is omitted or matches
    const matchCtx = setup({
      initialMessages: [
        {
          id: MESSAGE_ID,
          ticket_id: TICKET_ID,
          sender_type: "admin",
          body: "Reply on matching ticket",
          created_at: "2026-11-26T04:00:00Z",
        },
      ],
    });

    const savedAttachment = await matchCtx.persistAdminReplyAttachment({
      messageId: MESSAGE_ID,
      file,
    });
    assert.equal(savedAttachment.id, ATTACHMENT_ID);
    assert.equal(savedAttachment.message_id, MESSAGE_ID);
    assert.equal(matchCtx.savedAttachments.length, 1);
    assert.equal(matchCtx.savedAttachments[0].ticket_id, TICKET_ID);
  });

  await t.test("extractOptionalReplyAttachment handles missing, empty input, valid File, invalid string, and rejects multiple attachment fields", () => {
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

    const multipleAttachmentsForm = new FormData();
    multipleAttachmentsForm.append(
      "attachment",
      new File([PDF_BYTES], "first.pdf", { type: "application/pdf" }),
    );
    multipleAttachmentsForm.append(
      "attachment",
      new File([PNG_BYTES], "second.png", { type: "image/png" }),
    );
    assert.throws(
      () => ctx.extractOptionalReplyAttachment(multipleAttachmentsForm),
      (err) => err.status === 400 && err.message === "Only one attachment is allowed.",
    );
  });
});
