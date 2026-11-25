import { Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SupportNotice() {
  return (
    <Card className="mx-auto max-w-2xl rounded-3xl border-border bg-muted py-5 text-center shadow-none">
      <CardContent className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-6">
        <Clock3
          aria-hidden="true"
          className="size-5 shrink-0 text-primary"
        />
        <p className="font-sans text-base leading-6 text-muted-foreground">
          <strong className="text-primary">
            Expected response time:
          </strong>{" "}
          Within 6-12 hours.
        </p>
      </CardContent>
    </Card>
  );
}
