"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FileImage,
  FileText,
  FileUp,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";

type UploadZoneProps = {
  disabled: boolean;
  resetSignal: number;
  selectedFile: File | null;
  stage: "idle" | "preview" | "analyzing" | "success";
  onSelectFile: (file: File) => void;
  onAnalyzeFile: () => void;
  onResetSelection: () => void;
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
  selectedFile,
  stage,
  onSelectFile,
  onAnalyzeFile,
  onResetSelection,
  onInvalidFile,
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const progressMessages = useMemo(
    () => [
      "Reading your bill...",
      "Spotting the fine print...",
      "Checking for hidden fees...",
      "Building your dashboard...",
      "Almost done...",
    ],
    [],
  );

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [resetSignal]);

  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      setPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return null;
      });
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return nextPreviewUrl;
    });

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (stage !== "analyzing") {
      setProgressIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setProgressIndex((currentIndex) => (currentIndex + 1) % progressMessages.length);
    }, 2000);

    return () => window.clearInterval(interval);
  }, [progressMessages, stage]);

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

  function renderIdleState() {
    return (
      <>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/55 to-transparent" />
        <div className="absolute right-5 top-5 rounded-full border border-white/70 bg-white/70 p-3 text-teal-800 shadow-sm">
          <UploadCloud className="h-6 w-6" />
        </div>

        <div className="relative z-10 grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div className="max-w-2xl space-y-5">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-stone-700">
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
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/80 px-4 py-2">
                <FileText className="h-4 w-4 text-amber-600" />
                PDF bills
              </span>
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/80 px-4 py-2">
                <FileImage className="h-4 w-4 text-sky-700" />
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
              <li>For scanned PDFs, a phone photo or screenshot usually works better.</li>
            </ul>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="min-h-11 rounded-full border border-stone-200 bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Upload File
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderPreviewState() {
    if (!selectedFile) {
      return renderIdleState();
    }

    return (
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-stone-700">
            <FileUp className="h-4 w-4 text-teal-700" />
            Preview before analyze
          </span>
          <div>
            <h2
              className="text-3xl font-bold tracking-tight text-stone-950 md:text-4xl"
              style={{ fontFamily: "var(--font-heading), sans-serif" }}
            >
              Looks good. Ready when you are.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-stone-700">
              Review the file details, then start the bill analysis when you&apos;re ready.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onAnalyzeFile}
              disabled={disabled}
              className="min-h-11 rounded-full border border-stone-200 bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-70"
            >
              Analyze this bill
            </button>
            <button
              type="button"
              onClick={onResetSelection}
              disabled={disabled}
              className="min-h-11 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 disabled:opacity-60"
            >
              Choose different file
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="overflow-hidden rounded-[24px] border border-stone-200 bg-stone-50/90">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={`Preview of ${selectedFile.name}`}
                className="h-64 w-full object-cover"
              />
            ) : (
              <div className="flex h-64 items-center justify-center bg-stone-100 text-stone-500">
                <FileText className="h-12 w-12" />
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2 text-sm text-stone-700">
            <p>
              File: <span className="font-semibold text-stone-950">{selectedFile.name}</span>
            </p>
            <p>
              Type: <span className="font-semibold text-stone-950">{selectedFile.type || "Unknown"}</span>
            </p>
            <p>
              Size:{" "}
              <span className="font-semibold text-stone-950">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderAnalyzingState() {
    return (
      <div className="relative z-10 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-700">
            <LoaderCircle className="h-8 w-8 animate-spin" />
          </span>
          <div>
            <h2
              className="text-3xl font-bold tracking-tight text-stone-950"
              style={{ fontFamily: "var(--font-heading), sans-serif" }}
            >
              Analyzing your bill
            </h2>
            <p className="mt-3 min-h-7 text-base leading-7 text-stone-700">
              {progressMessages[progressIndex]}
            </p>
          </div>
          {selectedFile ? (
            <p className="text-sm text-stone-600">
              Working on <span className="font-semibold text-stone-900">{selectedFile.name}</span>
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  function renderSuccessState() {
    return (
      <div className="relative z-10 rounded-[28px] border border-emerald-200 bg-emerald-50/90 p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Analysis ready
        </p>
        <h2
          className="mt-3 text-3xl font-bold tracking-tight text-emerald-950"
          style={{ fontFamily: "var(--font-heading), sans-serif" }}
        >
          Your bill breakdown is ready below.
        </h2>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={onInputChange}
      />
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`group glass-panel soft-grid relative w-full overflow-hidden rounded-[36px] border px-6 py-10 text-left transition duration-200 md:px-8 md:py-12 ${
          disabled ? "cursor-wait opacity-90" : "hover:-translate-y-0.5"
        } ${isDragging ? "border-teal-500 bg-teal-50/80" : "border-stone-200"}`}
      >
        {stage === "idle" ? renderIdleState() : null}
        {stage === "preview" ? renderPreviewState() : null}
        {stage === "analyzing" ? renderAnalyzingState() : null}
        {stage === "success" ? renderSuccessState() : null}
      </div>
    </>
  );
}
