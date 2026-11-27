import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { errorResponse, handleApiError } from "@/lib/api-error";
import { listAdminNotifications } from "@/lib/notifications";

export async function GET() {
  if (!(await getAdminSession())) {
    return errorResponse(401, "Unauthorized");
  }

  try {
    const data = await listAdminNotifications();
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error, {
      context: "Admin notifications list error",
      fallbackMessage: "Unable to load notifications",
    });
  }
}
