"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

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
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  async function handleFileUpload(file: File) {
    setSelectedFileName(file.name);
    setError(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-bill`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || "Bill analysis failed.");
      }

      setAnalysis(payload);
    } catch (caughtError) {
      setAnalysis(null);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while analyzing your bill.",
      );
    } finally {
      setIsLoading(false);
    }
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

          <UploadZone disabled={isLoading} onSelectFile={handleFileUpload} />

          {selectedFileName ? (
            <div className="rounded-full border border-stone-200 bg-white/70 px-4 py-3 text-sm text-stone-700 shadow-sm backdrop-blur">
              Current file: <span className="font-semibold text-stone-950">{selectedFileName}</span>
            </div>
          ) : null}

          {isLoading ? <LoadingSkeleton /> : null}
          {!isLoading && analysis ? <ResultsDashboard analysis={analysis} /> : null}
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
