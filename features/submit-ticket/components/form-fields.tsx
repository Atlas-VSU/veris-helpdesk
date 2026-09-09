import { ChevronDown, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  FieldLabelProps,
  FileUploadFieldProps,
  SelectFieldProps,
  TextAreaFieldProps,
  TextFieldProps,
} from "@/features/submit-ticket/types/types";

export function FieldLabel({ id, children }: FieldLabelProps) {
  return (
    <Label htmlFor={id}>
      {children}
    </Label>
  );
}

export function TextField({ id, label, name, onChange, placeholder, type = "text", value }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel id={id}>{label}</FieldLabel>
      <Input id={id} name={name} onChange={onChange} placeholder={placeholder} required type={type} value={value} />
    </div>
  );
}

export function SelectField({ id, label, value, onChange, children }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel id={id}>{label}</FieldLabel>
      <div className="relative">
        <Select id={id} name={id} onChange={onChange} value={value}>
          {children}
        </Select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--palette-gray-olive)]" />
      </div>
    </div>
  );
}

export function TextAreaField({ id, label, onChange, placeholder, value }: TextAreaFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel id={id}>{label}</FieldLabel>
      <Textarea className="resize-none" id={id} name={id} onChange={onChange} placeholder={placeholder} required rows={5} value={value} />
    </div>
  );
}

export function FileUploadField({ fileName, onChange }: FileUploadFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel id="attachment">Attachments</FieldLabel>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--palette-stone)] bg-[var(--palette-clay)]/10 p-8 text-center transition hover:bg-[var(--palette-clay)]/20" htmlFor="attachment">
        <Upload aria-hidden="true" className="size-8 text-[var(--palette-gray-olive)]" />
        <span className="text-base text-[var(--palette-dark-olive)]">Drag and drop files here, or <span className="font-bold text-[var(--palette-dark-olive)] underline">browse</span></span>
        <span className="text-xs text-[var(--palette-gray-olive)]">{fileName || "Max file size: 10MB"}</span>
      </label>
      <input className="sr-only" id="attachment" key={fileName || "empty"} name="attachment" onChange={onChange} type="file" />
    </div>
  );
}