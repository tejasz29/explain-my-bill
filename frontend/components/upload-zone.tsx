"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { FileUp, FileText, ImageIcon, UploadCloud } from "lucide-react";

type UploadZoneProps = {
  disabled: boolean;
  resetSignal: number;
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
  resetSignal,
  selectedFileName,
  onSelectFile,
  onInvalidFile,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [resetSignal]);

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
        className="hidden"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={onInputChange}
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
        className={`group glass-panel soft-grid relative w-full overflow-hidden rounded-[36px] border px-6 py-10 text-left transition duration-200 md:px-8 md:py-12 ${
          disabled ? "cursor-wait opacity-80" : "cursor-pointer hover:-translate-y-0.5"
        } ${isDragging ? "border-teal-500 bg-teal-50/80" : "border-stone-200"}`}
      >
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/55 to-transparent" />
        <div className="absolute right-5 top-5 rounded-full border border-white/70 bg-white/70 p-3 text-teal-800 shadow-sm">
          <UploadCloud className="h-6 w-6" />
        </div>

        <div className="relative z-10 grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div className="max-w-2xl space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-stone-700">
              <FileUp className="h-4 w-4 text-teal-700" />
              Upload a bill
            </span>

            <div>
              <h2
                className="text-3xl font-bold tracking-tight text-stone-950 md:text-5xl"
                style={{ fontFamily: "var(--font-heading), sans-serif" }}
              >
                Drop in a phone, utility, or insurance bill.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-stone-700 md:text-lg">
                We&apos;ll extract the charges, explain each line item in plain English, and call
                out fees that look suspicious.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-stone-700">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2">
                <FileText className="h-4 w-4 text-amber-600" />
                PDF bills
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2">
                <ImageIcon className="h-4 w-4 text-sky-700" />
                JPG, PNG, WEBP
              </span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/72 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-600">
              Best results
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
              <li>Use a clear photo or readable PDF with the totals visible.</li>
              <li>Phone, utility, insurance, and subscription bills work best.</li>
              <li>We return a line-by-line explanation plus suspicious fee flags.</li>
            </ul>
            <div className="mt-5 rounded-[22px] border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-700">
              {selectedFileName ? (
                <>
                  Ready to analyze:{" "}
                  <span className="font-semibold text-stone-950">{selectedFileName}</span>
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
