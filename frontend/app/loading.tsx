"use client";

import {
  AlertTriangle,
  BadgeDollarSign,
  CircleAlert,
  FileText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export default function Loading() {
  return (
    <section className="animate-float-up space-y-6">
      <div className="glass-panel relative overflow-hidden rounded-2xl p-6 lg:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-violet-500 to-emerald-500" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
              <Sparkles className="h-4 w-4 text-amber-700" />
              Bill Summary
            </span>
            <div>
              <div className="h-10 w-48 skeleton rounded" />
              <div className="mt-3 max-w-2xl h-6 w-full skeleton rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <InsightSkeleton />
          <InsightSkeleton />
          <InsightSkeleton />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-panel rounded-2xl p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <div className="h-7 w-40 skeleton rounded" />
              <div className="mt-2 h-4 w-60 skeleton rounded" />
            </div>
          </div>
          <div className="h-80 rounded-xl bg-white/55 p-4 skeleton" />
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <div className="h-7 w-32 skeleton rounded" />
            <div className="mt-2 h-4 w-72 skeleton rounded" />
            <div className="mt-5 space-y-4">
              <FlaggedItemSkeleton />
              <FlaggedItemSkeleton />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <div className="h-7 w-28 skeleton rounded" />
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li className="h-8 w-full skeleton rounded-xl" />
              <li className="h-8 w-full skeleton rounded-xl" />
            </ul>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <div className="h-7 w-44 skeleton rounded" />
        <div className="mt-2 h-4 w-64 skeleton rounded" />
        <div className="mt-5 space-y-4">
          <ExplanationItemSkeleton />
          <ExplanationItemSkeleton />
          <ExplanationItemSkeleton />
          <ExplanationItemSkeleton />
        </div>
      </div>
    </section>
  );
}

function MetricSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 skeleton rounded" />
        <div className="h-3 w-20 skeleton rounded" />
      </div>
      <div className="mt-3 h-8 w-20 skeleton rounded" />
    </div>
  );
}

function InsightSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 skeleton rounded" />
        <div className="h-3 w-20 skeleton rounded" />
      </div>
      <div className="mt-3 h-6 w-24 skeleton rounded" />
      <div className="mt-2 h-4 w-32 skeleton rounded" />
    </div>
  );
}

function FlaggedItemSkeleton() {
  return (
    <article className="rounded-2xl border border-red-200 bg-red-50/80 p-5 skeleton" />
  );
}

function ExplanationItemSkeleton() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/75 p-5 skeleton" />
  );
}