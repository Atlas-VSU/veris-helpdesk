import { NextResponse } from "next/server";
import {
  notificationIdSchema,
  notificationReadInputSchema,
} from "@/features/admin/schemas/notification";
import { getAdminSession } from "@/lib/admin-auth";
import { errorResponse, handleApiError, parseJsonBody } from "@/lib/api-error";
import {
  deleteAdminNotification,
  markAdminNotificationRead,
} from "@/lib/notifications";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ notificationId: string }> },
) {
  if (!(await getAdminSession())) {
    return errorResponse(401, "Unauthorized");
  }

  const { notificationId } = await context.params;
  const parsedId = notificationIdSchema.safeParse(notificationId);
  if (!parsedId.success) {
    return errorResponse(400, "Invalid notification ID");
  }

  try {
    const body = await parseJsonBody(request);
    const result = notificationReadInputSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(400, "Invalid notification update");
    }

    const updated = await markAdminNotificationRead(parsedId.data);
    if (!updated) {
      return errorResponse(404, "Notification not found");
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error, {
      context: "Admin notification update error",
      fallbackMessage: "Unable to update notification",
    });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ notificationId: string }> },
) {
  if (!(await getAdminSession())) {
    return errorResponse(401, "Unauthorized");
  }

  const { notificationId } = await context.params;
  const parsedId = notificationIdSchema.safeParse(notificationId);
  if (!parsedId.success) {
    return errorResponse(400, "Invalid notification ID");
  }

  try {
    const deleted = await deleteAdminNotification(parsedId.data);
    if (!deleted) {
      return errorResponse(404, "Notification not found");
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, {
      context: "Admin notification delete error",
      fallbackMessage: "Unable to delete notification",
    });
  }
}
