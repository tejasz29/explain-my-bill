"use client";

import type { ComponentType } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/format";
import type { BillAnalysis } from "@/types/bill";

type ResultsDashboardProps = {
  analysis: BillAnalysis;
};

const CHART_COLORS = ["#0f766e", "#0ea5a4", "#f59e0b", "#c2410c", "#2563eb", "#7c3aed"];

export function ResultsDashboard({ analysis }: ResultsDashboardProps) {
  const flaggedItems = analysis.items.filter((item) => item.flagged);

  return (
    <section className="animate-float-up space-y-6">
      <div className="glass-panel relative overflow-hidden rounded-[32px] p-7 lg:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-700 via-amber-500 to-rose-600" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-stone-700">
              <Sparkles className="h-4 w-4 text-teal-700" />
              Bill Summary
            </span>
            <div>
              <h2
                className="text-4xl font-bold tracking-tight text-stone-950 md:text-5xl"
                style={{ fontFamily: "var(--font-heading), sans-serif" }}
              >
                {formatCurrency(analysis.total_amount, analysis.currency)}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-stone-700">
                {analysis.summary}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricCard label="Line Items" value={String(analysis.items.length)} icon={FileText} />
            <MetricCard
              label="Flagged"
              value={String(flaggedItems.length)}
              icon={AlertTriangle}
              danger={flaggedItems.length > 0}
            />
            <MetricCard
              label="Currency"
              value={analysis.currency}
              icon={BadgeDollarSign}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-panel rounded-[32px] p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3
                className="text-2xl font-bold text-stone-950"
                style={{ fontFamily: "var(--font-heading), sans-serif" }}
              >
                Charges by line item
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                Visual breakdown of where the bill total comes from.
              </p>
            </div>
          </div>
          <div className="h-80 rounded-[24px] bg-white/55 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.items} margin={{ top: 12, right: 12, left: 0, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,24,40,0.12)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={70}
                  tick={{ fill: "#525866", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#525866", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(15, 118, 110, 0.08)" }}
                  formatter={(value: number) => formatCurrency(value, analysis.currency)}
                  contentStyle={{
                    borderRadius: 18,
                    border: "1px solid rgba(16, 24, 40, 0.08)",
                    boxShadow: "0 18px 50px rgba(16, 24, 40, 0.12)",
                  }}
                />
                <Bar dataKey="amount" radius={[16, 16, 6, 6]}>
                  {analysis.items.map((item, index) => (
                    <Cell
                      key={`${item.name}-${index}`}
                      fill={item.flagged ? "#b42318" : CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[32px] p-7">
            <h3
              className="text-2xl font-bold text-stone-950"
              style={{ fontFamily: "var(--font-heading), sans-serif" }}
            >
              Flagged items
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Anything that looks unclear, excessive, or worth double-checking.
            </p>

            <div className="mt-5 space-y-4">
              {flaggedItems.length > 0 ? (
                flaggedItems.map((item) => (
                  <article
                    key={`${item.name}-${item.amount}`}
                    className="rounded-[24px] border border-red-200 bg-[var(--warning-soft)] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-semibold text-red-950">{item.name}</h4>
                        <p className="mt-2 text-sm leading-6 text-red-900">
                          {item.flag_reason || "This item was flagged for review."}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-red-800">
                        {formatCurrency(item.amount, analysis.currency)}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/90 p-5 text-sm text-emerald-900">
                  No suspicious charges were flagged in this bill.
                </div>
              )}
            </div>
          </div>

          {analysis.anomalies.length > 0 && (
            <div className="glass-panel rounded-[32px] p-7">
              <h3
                className="text-2xl font-bold text-stone-950"
                style={{ fontFamily: "var(--font-heading), sans-serif" }}
              >
                Model notes
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
                {analysis.anomalies.map((anomaly, index) => (
                  <li
                    key={`${anomaly}-${index}`}
                    className="rounded-[20px] border border-stone-200 bg-white/75 px-4 py-3"
                  >
                    {anomaly}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-[32px] p-7">
        <h3
          className="text-2xl font-bold text-stone-950"
          style={{ fontFamily: "var(--font-heading), sans-serif" }}
        >
          Full item explanations
        </h3>
        <div className="mt-5 space-y-4">
          {analysis.items.map((item) => (
            <article
              key={`${item.name}-${item.amount}-${item.explanation}`}
              className="rounded-[26px] border border-stone-200 bg-white/75 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-stone-950">{item.name}</h4>
                    {item.flagged && (
                      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                        Flagged
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-stone-700">{item.explanation}</p>
                </div>
                <span className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white">
                  {formatCurrency(item.amount, analysis.currency)}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  danger?: boolean;
};

function MetricCard({ label, value, icon: Icon, danger = false }: MetricCardProps) {
  return (
    <div
      className={`rounded-[24px] border px-4 py-4 ${
        danger
          ? "border-red-200 bg-red-50/90 text-red-900"
          : "border-stone-200 bg-white/80 text-stone-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${danger ? "text-red-700" : "text-teal-700"}`} />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
          {label}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}
