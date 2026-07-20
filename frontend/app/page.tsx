"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ArrowRight, RefreshCcw, ShieldCheck, Zap } from "lucide-react";

import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorBanner } from "@/components/error-banner";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ResultsDashboard } from "@/components/results-dashboard";
import { UploadZone } from "@/components/upload-zone";
import type { BillAnalysis } from "@/types/bill";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function HomePage() {
  const [analysis, setAnalysis] = useState<BillAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState<"idle" | "preview" | "analyzing" | "success">(
    "idle",
  );

  useEffect(() => {
    if (!analysis) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setUploadStage("success");
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [analysis]);

  function handleFileSelection(file: File) {
    setSelectedFile(file);
    setAnalysis(null);
    setError(null);
    setUploadStage("preview");
  }

  async function handleFileUpload() {
    if (!selectedFile) {
      setError("Choose a bill file before starting the analysis.");
      return;
    }

    setIsLoading(true);
    setUploadStage("analyzing");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-bill`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || "Bill analysis failed.");
      }

      setAnalysis(payload.data);
    } catch (caughtError) {
      setAnalysis(null);
      setUploadStage(selectedFile ? "preview" : "idle");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while analyzing your bill.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function resetExperience() {
    setAnalysis(null);
    setError(null);
    setIsLoading(false);
    setSelectedFile(null);
    setUploadStage("idle");
    setResetSignal((currentValue) => currentValue + 1);
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 animate-float-up rounded-[36px] border border-white/70 bg-white/55 px-6 py-6 shadow-[0_24px_80px_rgba(117,97,68,0.12)] backdrop-blur-xl md:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-teal-800">
                OpenAI Build Week Demo
              </p>
              <h1
                className="mt-3 text-4xl font-bold tracking-tight text-stone-950 md:text-6xl"
                style={{ fontFamily: "var(--font-heading), sans-serif" }}
              >
                Explain My Bill
              </h1>
              <p className="mt-4 text-base leading-7 text-stone-700 md:text-lg">
                A fast bill interpreter that turns confusing charges into plain-language
                explanations and highlights anything worth disputing.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <FeaturePill label="Plain-English breakdown" icon={<ArrowRight className="h-4 w-4" />} />
              <FeaturePill label="Suspicious fee flags" icon={<ShieldCheck className="h-4 w-4" />} />
              <FeaturePill label="Instant visual dashboard" icon={<Zap className="h-4 w-4" />} />
            </div>
          </div>
        </section>

        <div className="space-y-6">
          {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

          <UploadZone
            disabled={isLoading}
            resetSignal={resetSignal}
            selectedFile={selectedFile}
            stage={uploadStage}
            onSelectFile={handleFileSelection}
            onAnalyzeFile={handleFileUpload}
            onResetSelection={resetExperience}
            onInvalidFile={setError}
          />

          {selectedFile ? (
            <div className="flex flex-col gap-3 rounded-[28px] border border-stone-200 bg-white/70 px-4 py-4 text-sm text-stone-700 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
              <div>
                Current file: <span className="font-semibold text-stone-950">{selectedFile.name}</span>
              </div>
              {(analysis || error || uploadStage === "preview") && (
                <button
                  type="button"
                  onClick={resetExperience}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Try another bill
                </button>
              )}
            </div>
          ) : null}

          {isLoading ? <LoadingSkeleton /> : null}
          {!isLoading && analysis ? (
            <ErrorBoundary resetKey={resetSignal}>
              <ResultsDashboard analysis={analysis} />
            </ErrorBoundary>
          ) : null}
          {!isLoading && !analysis && uploadStage === "idle" ? <EmptyState /> : null}
        </div>
      </div>
    </main>
  );
}

function FeaturePill({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-white/70 bg-white/75 px-4 py-4 text-sm font-medium text-stone-800 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="text-teal-700">{icon}</span>
        <span>{label}</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="grid gap-6 animate-float-up xl:grid-cols-[0.95fr_1.05fr]">
      <div className="glass-panel rounded-[32px] p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-600">
          What you will get
        </p>
        <h2
          className="mt-3 text-3xl font-bold tracking-tight text-stone-950"
          style={{ fontFamily: "var(--font-heading), sans-serif" }}
        >
          A fast, human-readable audit of a confusing bill.
        </h2>
        <div className="mt-6 space-y-4">
          <ExpectationStep
            title="1. Extract charges"
            body="We pull out the total, currency, and itemized line items from the uploaded bill."
          />
          <ExpectationStep
            title="2. Explain each fee"
            body="Every charge gets rewritten in plain English so the bill is easier to understand."
          />
          <ExpectationStep
            title="3. Highlight red flags"
            body="Anything unusual, duplicative, or vague gets surfaced in a dedicated warning section."
          />
        </div>
      </div>

      <div className="glass-panel rounded-[32px] p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-600">
          Demo preview
        </p>
        <div className="mt-4 rounded-[28px] border border-stone-200 bg-white/80 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-stone-600">Expected dashboard summary</p>
              <h3
                className="mt-2 text-3xl font-bold text-stone-950"
                style={{ fontFamily: "var(--font-heading), sans-serif" }}
              >
                $184.27
              </h3>
            </div>
            <div className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
              2 charges flagged
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <PreviewLineItem label="Base service plan" amount="$89.99" tone="neutral" />
            <PreviewLineItem label="Regulatory recovery fee" amount="$11.50" tone="warning" />
            <PreviewLineItem label="Device protection add-on" amount="$19.99" tone="warning" />
            <PreviewLineItem label="Local taxes and surcharges" amount="$7.79" tone="neutral" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ExpectationStep({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-[24px] border border-stone-200 bg-white/75 p-5">
      <h3 className="text-base font-semibold text-stone-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-700">{body}</p>
    </article>
  );
}

function PreviewLineItem({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: string;
  tone: "neutral" | "warning";
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-[22px] border px-4 py-3 ${
        tone === "warning"
          ? "border-red-200 bg-red-50/80 text-red-900"
          : "border-stone-200 bg-stone-50/80 text-stone-800"
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm font-semibold">{amount}</span>
    </div>
  );
}
