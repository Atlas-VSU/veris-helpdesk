import { ChangeEvent, ReactNode } from "react";
import { ChevronDown, Upload } from "lucide-react";

export const inputClassName =
  "w-full rounded-lg border border-[#DED8CF] bg-[#E6DCCD]/20 px-3 py-3 text-base text-[#2C2C24] outline-none transition focus:border-[#45573B] focus:ring-4 focus:ring-[#5D7052]/15";

type BaseFieldProps = {
  id: string;
  label: string;
};

export function FieldLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <label className="text-xs font-bold uppercase tracking-[0.04em] text-[#2C2C24]" htmlFor={id}>
      {children}
    </label>
  );
}

type TextFieldProps = BaseFieldProps & {
  name: string;
  value: string;
  placeholder: string;
  type?: "text" | "email";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function TextField({ id, label, name, onChange, placeholder, type = "text", value }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel id={id}>{label}</FieldLabel>
      <input className={inputClassName} id={id} name={name} onChange={onChange} placeholder={placeholder} required type={type} value={value} />
    </div>
  );
}

type SelectFieldProps = BaseFieldProps & {
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
};

export function SelectField({ id, label, value, onChange, children }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel id={id}>{label}</FieldLabel>
      <div className="relative">
        <select className={`${inputClassName} appearance-none pr-10`} id={id} name={id} onChange={onChange} value={value}>
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#78786C]" />
      </div>
    </div>
  );
}

type TextAreaFieldProps = BaseFieldProps & {
  value: string;
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

export function TextAreaField({ id, label, onChange, placeholder, value }: TextAreaFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel id={id}>{label}</FieldLabel>
      <textarea className={`${inputClassName} resize-none`} id={id} name={id} onChange={onChange} placeholder={placeholder} required rows={5} value={value} />
    </div>
  );
}

type FileUploadFieldProps = {
  fileName: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function FileUploadField({ fileName, onChange }: FileUploadFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel id="attachment">Attachments</FieldLabel>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#DED8CF] bg-[#E6DCCD]/10 p-8 text-center transition hover:bg-[#E6DCCD]/20" htmlFor="attachment">
        <Upload aria-hidden="true" className="size-8 text-[#78786C]" />
        <span className="text-base text-[#4A4A40]">Drag and drop files here, or <span className="font-bold text-[#45573B] underline">browse</span></span>
        <span className="text-xs text-[#78786C]">{fileName || "Max file size: 10MB"}</span>
      </label>
      <input className="sr-only" id="attachment" key={fileName || "empty"} name="attachment" onChange={onChange} type="file" />
    </div>
  );
}