import { ChevronDown, Upload, X } from "lucide-react";
import Image from "next/image";
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

export function FileUploadField({ fileName, previewUrl, error, onChange, onClear, onDrop }: FileUploadFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold uppercase tracking-[0.04em] text-foreground" htmlFor="attachment">Attachments <span className="font-normal normal-case text-[var(--palette-gray-olive)]">(optional)</span></label>
      <div
        aria-describedby={error ? "attachment-error" : "attachment-help"}
        className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--palette-stone)] bg-[var(--palette-clay)]/10 p-8 text-center transition hover:bg-[var(--palette-clay)]/20"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <Upload aria-hidden="true" className="size-8 text-[var(--palette-gray-olive)]" />
        <label className="cursor-pointer text-base text-[var(--palette-dark-olive)]" htmlFor="attachment">
          Drag and drop a file here, or <span className="font-bold underline">browse</span>
        </label>
        <span className="text-xs text-[var(--palette-gray-olive)]" id="attachment-help">
          JPG, PNG, or PDF · maximum 10 MB
        </span>
        {fileName && (
          <div className="flex items-center gap-3 text-sm font-medium text-[var(--palette-dark-olive)]">
            {previewUrl && <Image alt={`Preview of ${fileName}`} className="h-14 w-20 rounded-md border border-[var(--palette-stone)] object-cover" height={56} src={previewUrl} unoptimized width={80} />}
            <span className="max-w-56 break-all text-left">{fileName}</span>
            <button aria-label={`Remove ${fileName}`} className="rounded p-1 hover:bg-[var(--palette-clay)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--palette-moss)]" onClick={onClear} type="button">
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}
      </div>
      <input accept="image/jpeg,image/png,application/pdf" className="sr-only" id="attachment" key={fileName || "empty"} name="attachment" onChange={(event) => onChange(event.target.files?.item(0) ?? null)} type="file" />
      {error && <p className="text-xs text-red-700" id="attachment-error" role="alert">{error}</p>}
    </div>
  );
}
