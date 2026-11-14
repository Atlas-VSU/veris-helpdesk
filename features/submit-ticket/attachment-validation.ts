export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export const ACCEPTED_ATTACHMENT_INPUT_TYPES = ACCEPTED_ATTACHMENT_TYPES.join(",");

export function validateAttachmentMetadata(file: File) {
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return "File size exceeds the 10 MB limit.";
  }

  if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type as (typeof ACCEPTED_ATTACHMENT_TYPES)[number])) {
    return "Please upload a JPG, PNG, or PDF file.";
  }

  return null;
}

export async function hasAcceptedAttachmentSignature(file: File) {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());

  if (file.type === "image/jpeg") {
    return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  }

  if (file.type === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (byte, index) => header[index] === byte,
    );
  }

  if (file.type === "application/pdf") {
    return [0x25, 0x50, 0x44, 0x46].every((byte, index) => header[index] === byte);
  }

  return false;
}
