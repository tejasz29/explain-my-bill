"use client";

import type { ComponentType } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  CircleAlert,
  FileText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
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

const CHART_COLORS = ["#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#3b82f6", "#f97316"];

export function ResultsDashboard({ analysis }: ResultsDashboardProps) {
  const flaggedItems = analysis.items.filter((item) => item.flagged);
  const flaggedAmount = flaggedItems.reduce((sum, item) => sum + item.amount, 0);
  const largestItem =
    analysis.items.length > 0
      ? [...analysis.items].sort((left, right) => right.amount - left.amount)[0]
      : null;

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
              <h2
                className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl"
                style={{ fontFamily: "var(--font-sans), sans-serif" }}
              >
                {formatCurrency(analysis.total_amount, analysis.currency)}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
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

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <InsightCard
            label="Largest charge"
            value={largestItem ? largestItem.name : "No items found"}
            detail={
              largestItem ? formatCurrency(largestItem.amount, analysis.currency) : "No charge data"
            }
            icon={TrendingUp}
          />
          <InsightCard
            label="Flagged amount"
            value={formatCurrency(flaggedAmount, analysis.currency)}
            detail={
              flaggedItems.length > 0
                ? "Total amount connected to suspicious-looking fees"
                : "No flagged charges in this bill"
            }
            icon={flaggedItems.length > 0 ? CircleAlert : ShieldCheck}
            tone={flaggedItems.length > 0 ? "warning" : "safe"}
          />
          <InsightCard
            label="What to do next"
            value={flaggedItems.length > 0 ? "Review flagged items" : "Bill looks straightforward"}
            detail={
              flaggedItems.length > 0
                ? "Double-check these line items with your statement or provider."
                : "You can still inspect the charge breakdown below."
            }
            icon={Sparkles}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-panel rounded-2xl p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3
                className="text-2xl font-bold text-slate-950"
                style={{ fontFamily: "var(--font-sans), sans-serif" }}
              >
                Charges by line item
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Visual breakdown of where the bill total comes from.
              </p>
            </div>
          </div>
          <div className="h-80 rounded-xl bg-white/55 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.items} margin={{ top: 12, right: 12, left: 0, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.12)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  angle={analysis.items.length > 5 ? -18 : 0}
                  textAnchor={analysis.items.length > 5 ? "end" : "middle"}
                  height={analysis.items.length > 5 ? 70 : 40}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(245, 158, 11, 0.08)" }}
                  formatter={(value: number | undefined) =>
                    formatCurrency(value ?? 0, analysis.currency)
                  }
                  contentStyle={{
                    borderRadius: 18,
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.12)",
                  }}
                />
                <Bar dataKey="amount" radius={[16, 16, 6, 6]}>
                  {analysis.items.map((item, index) => (
                    <Cell
                      key={`${item.name}-${index}`}
                      fill={item.flagged ? "#ef4444" : CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3
              className="text-2xl font-bold text-slate-950"
              style={{ fontFamily: "var(--font-sans), sans-serif" }}
            >
              Flagged items
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Anything that looks unclear, excessive, or worth double-checking.
            </p>

            <div className="mt-5 space-y-4">
              {flaggedItems.length > 0 ? (
                flaggedItems.map((item) => (
                  <article
                    key={`${item.name}-${item.amount}`}
                    className="rounded-2xl border border-red-200 bg-red-50/80 p-5"
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
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 text-sm text-emerald-900">
                  No suspicious charges were flagged in this bill.
                </div>
              )}
            </div>
          </div>

          {analysis.anomalies.length > 0 && (
            <div className="glass-panel rounded-2xl p-6">
              <h3
                className="text-2xl font-bold text-slate-950"
                style={{ fontFamily: "var(--font-sans), sans-serif" }}
              >
                Model notes
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {analysis.anomalies.map((anomaly, index) => (
                  <li
                    key={`${anomaly}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white/75 px-4 py-3"
                  >
                    {anomaly}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h3
          className="text-2xl font-bold text-slate-950"
          style={{ fontFamily: "var(--font-sans), sans-serif" }}
        >
          Full item explanations
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          A plain-English explanation for each charge on the bill.
        </p>
        <div className="mt-5 space-y-4">
          {analysis.items.map((item) => (
            <article
              key={`${item.name}-${item.amount}-${item.explanation}`}
              className="rounded-2xl border border-slate-200 bg-white/75 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-slate-950">{item.name}</h4>
                    {item.flagged && (
                      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                        Flagged
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.explanation}</p>
                </div>
                <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
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

type InsightCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "default" | "warning" | "safe";
};

function InsightCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: InsightCardProps) {
  const toneClasses =
    tone === "warning"
      ? "border-red-200 bg-red-50/85 text-red-950"
      : tone === "safe"
        ? "border-emerald-200 bg-emerald-50/85 text-emerald-950"
        : "border-slate-200 bg-white/82 text-slate-950";
  const iconClasses =
    tone === "warning"
      ? "text-red-700"
      : tone === "safe"
        ? "text-emerald-700"
        : "text-amber-700";

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${iconClasses}`} />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{label}</span>
      </div>
      <p className="mt-3 text-lg font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-6 opacity-80">{detail}</p>
    </div>
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
      className={`rounded-2xl border px-4 py-4 ${
        danger
          ? "border-red-200 bg-red-50/90 text-red-900"
          : "border-slate-200 bg-white/80 text-slate-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${danger ? "text-red-700" : "text-amber-700"}`} />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
          {label}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}