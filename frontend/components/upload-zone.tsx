"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { FileUp, FileText, Image, UploadCloud } from "lucide-react";

type UploadZoneProps = {
  disabled: boolean;
  selectedFileName?: string | null;
  onSelectFile: (file: File) => void;
  onInvalidFile?: (message: string) => void;
};

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function UploadZone({
  disabled,
  selectedFileName,
  onSelectFile,
  onInvalidFile,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file?: File) {
    if (!file) {
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      onInvalidFile?.("Unsupported file type. Upload a PDF, JPG, PNG, or WEBP bill.");
      return;
    }

    onSelectFile(file);
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0]);
  }

  return (
    <>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={onInputChange}
        disabled={disabled}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`upload-zone glass-panel soft-grid relative w-full overflow-hidden rounded-2xl border p-6 transition-all duration-200 md:p-8 lg:p-10 ${
          disabled
            ? "cursor-wait opacity-70"
            : "cursor-pointer"
        } ${isDragging ? "dragging border-amber-500 bg-amber-50/80" : "border-slate-200 bg-white"}`}
        aria-label={disabled ? "Upload disabled while analyzing" : "Upload a bill"}
      >
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/60 to-transparent" />
        <div className="absolute right-5 top-5 rounded-full border border-white/70 bg-white/70 p-3 text-amber-700 shadow-sm">
          <UploadCloud className="h-6 w-6 icon-badge" />
        </div>

        <div className="relative z-10 grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div className="max-w-2xl space-y-5">
            <span className="feature-pill inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
              <FileUp className="h-4 w-4 text-amber-700" />
              Upload a bill
            </span>

            <div>
              <h2
                className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl animate-float-up"
                style={{ fontFamily: "var(--font-sans), sans-serif" }}
              >
                Drop in a phone, utility, or insurance bill.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 md:text-lg animate-float-up-delayed">
                We&apos;ll extract the charges, explain each line item in plain English, and call
                out fees that look suspicious.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="preview-item inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 border border-slate-200">
                <FileText className="h-4 w-4 text-amber-600" />
                PDF bills
              </span>
              <span className="preview-item inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 border border-slate-200">
                <Image className="h-4 w-4 text-sky-700" />
                JPG, PNG, WEBP
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/72 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Best results
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li className="stagger-item">Use a clear photo or readable PDF with the totals visible.</li>
              <li className="stagger-item">Phone, utility, insurance, and subscription bills work best.</li>
              <li className="stagger-item">We return a line-by-line explanation plus suspicious fee flags.</li>
            </ul>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
              {selectedFileName ? (
                <>
                  Ready to analyze:{" "}
                  <span className="font-semibold text-slate-950 animate-scale-in">{selectedFileName}</span>
                </>
              ) : (
                "Drop a file here or click anywhere in this panel to browse."
              )}
            </div>
          </div>
        </div>
      </button>
    </>
  );
}