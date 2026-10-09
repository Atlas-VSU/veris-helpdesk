// features/admin-tickets/utils/format.ts
// Formatting utilities for the admin tickets feature.

import { formatDistanceToNow } from "date-fns";

/** Derive initials for avatar fallback */
export function initials(name: string): string {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

/** Format a date string as a relative time (e.g., "2 hours ago") */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
}

/** Format a date string as a full locale string for tooltip */
export function formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
}