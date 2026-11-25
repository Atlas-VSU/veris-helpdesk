export function getAdminLoginErrorMessage(status: number, payload: unknown): string {
  const apiError =
    payload !== null &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string" &&
    payload.error.trim().length > 0
      ? payload.error.trim()
      : null;

  if (status === 400) {
    return apiError ?? "Please enter a valid email address and password.";
  }

  if (status === 401) {
    return apiError ?? "Invalid email or password.";
  }

  if (status === 429) {
    return apiError ?? "Too many login attempts. Please try again later.";
  }

  if (status >= 500) {
    return "We couldn't sign you in right now. Please try again.";
  }

  return apiError ?? "Sign-in failed. Please try again.";
}
