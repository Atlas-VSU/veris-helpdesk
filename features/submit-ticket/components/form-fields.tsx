import { ChevronDown, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { FieldWithLabelProps, FileUploadFieldProps } from "@/features/submit-ticket/types/types";

export function FieldWithLabel({ id, label, children, withSelectIcon = false }: FieldWithLabelProps) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      {withSelectIcon ? (
        <div className="relative">
          {children}
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      ) : children}
    </div>
  );
}

export function FileUploadField({ fileName, onChange }: FileUploadFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold uppercase tracking-[0.04em] text-foreground" htmlFor="attachment">Attachments</label>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--palette-stone)] bg-[var(--palette-clay)]/10 p-8 text-center transition hover:bg-[var(--palette-clay)]/20" htmlFor="attachment">
        <Upload aria-hidden="true" className="size-8 text-[var(--palette-gray-olive)]" />
        <span className="text-base text-[var(--palette-dark-olive)]">Drag and drop files here, or <span className="font-bold text-[var(--palette-dark-olive)] underline">browse</span></span>
        <span className="text-xs text-[var(--palette-gray-olive)]">{fileName || "Max file size: 10MB"}</span>
      </label>
      <input className="sr-only" id="attachment" key={fileName || "empty"} name="attachment" onChange={onChange} type="file" />
    </div>
  );
}