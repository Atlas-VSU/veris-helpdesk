"use client";

import { DragEvent, KeyboardEvent, useRef, useState } from "react";
import { ChevronDown, FileText, Loader2, RefreshCw, Upload, X } from "lucide-react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import type { FieldWithLabelProps, FileUploadFieldProps } from "@/features/submit-ticket/types/types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function FieldWithLabel({ id, label, children, withSelectIcon = false }: FieldWithLabelProps) {
  return (
    <div className="flex flex-col gap-1.5">
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

export function FileUploadField({
  fileName,
  fileSize,
  fileInputKey,
  isRejected,
  isValidating = false,
  previewUrl,
  error,
  onChange,
  onClear,
  onDrop,
}: FileUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleZoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFilePicker();
    }
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    setIsDragging(false);
    onDrop(event);
  }

  const hasValidNonImageFile = Boolean(fileName && !previewUrl && !isRejected);
  const dropzoneStateClass = isDragging
    ? "border-primary bg-primary/5 ring-3 ring-ring/20"
    : isRejected
      ? "border-destructive/70 bg-destructive/5"
      : "border-border bg-muted/35 hover:border-input hover:bg-muted/60";

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="attachment">
        Attachments <span className="font-normal normal-case tracking-normal text-muted-foreground">(optional)</span>
      </Label>
      <div
        aria-describedby={error ? "attachment-error" : "attachment-help"}
        aria-label="Upload attachment"
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${dropzoneStateClass}`}
        id="attachment-dropzone"
        onClick={openFilePicker}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onKeyDown={handleZoneKeyDown}
        role="button"
        tabIndex={0}
      >
        {isValidating ? (
          <div className="flex items-center gap-2 py-4 text-sm font-medium text-muted-foreground">
            <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            <span>Verifying file...</span>
          </div>
        ) : previewUrl ? (
          <>
            <Image
              alt={`Preview of ${fileName}`}
              className="h-44 w-full max-w-md rounded-lg border border-border bg-card object-contain"
              height={176}
              src={previewUrl}
              unoptimized
              width={448}
            />
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="max-w-60 truncate font-semibold text-foreground" title={fileName}>{fileName}</span>
              {fileSize !== null && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {formatFileSize(fileSize)}
                </span>
              )}
              <div className="flex items-center gap-1">
                <button
                  aria-label={`Replace ${fileName}`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={(event) => {
                    event.stopPropagation();
                    openFilePicker();
                  }}
                  type="button"
                >
                  <RefreshCw aria-hidden="true" className="size-3.5" />
                  Replace
                </button>
                <button
                  aria-label={`Remove ${fileName}`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClear();
                  }}
                  type="button"
                >
                  <X aria-hidden="true" className="size-3.5" />
                  Remove
                </button>
              </div>
            </div>
          </>
        ) : hasValidNonImageFile ? (
          <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/60 text-accent-foreground">
                <FileText aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground" title={fileName}>{fileName}</p>
                {fileSize !== null && (
                  <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                aria-label={`Replace ${fileName}`}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={(event) => {
                  event.stopPropagation();
                  openFilePicker();
                }}
                type="button"
              >
                <RefreshCw aria-hidden="true" className="size-4" />
              </button>
              <button
                aria-label={`Remove ${fileName}`}
                className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={(event) => {
                  event.stopPropagation();
                  onClear();
                }}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="flex size-11 items-center justify-center rounded-full bg-card text-muted-foreground shadow-xs ring-1 ring-border">
              <Upload aria-hidden="true" className="size-5" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {isDragging ? "Drop your file here" : <>Drag and drop a file here, or <span className="font-bold text-primary underline underline-offset-2">browse</span></>}
              </p>
              <p className="text-xs text-muted-foreground" id="attachment-help">
                JPG, PNG, or PDF · maximum 10 MB
              </p>
            </div>
            {fileName && isRejected && (
              <div className="mt-1 inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-card px-3 py-1.5 text-xs font-semibold text-destructive">
                <span className="max-w-56 truncate" title={fileName}>{fileName}</span>
                <button
                  aria-label={`Remove ${fileName}`}
                  className="rounded p-0.5 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClear();
                  }}
                  type="button"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <input
        accept="image/jpeg,image/png,application/pdf"
        className="sr-only"
        id="attachment"
        key={fileInputKey}
        name="attachment"
        onChange={(event) => onChange(event.target.files?.item(0) ?? null)}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />
      {error && <p className="text-xs font-medium text-destructive" id="attachment-error" role="alert">{error}</p>}
    </div>
  );
}
