import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowDown, ArrowUp, Minus, TrendingUp, TrendingDown } from "lucide-react";

export function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`premium-surface rounded-2xl border border-prootech-line bg-white shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, action, subtitle }: { title: string; action?: ReactNode; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-2 h-1 w-8 rounded-full bg-prootech-violet" />
        <h2 className="text-[0.98rem] font-semibold tracking-[-0.02em] text-prootech-black">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-xs leading-5 text-prootech-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  tone
}: {
  label: string;
  value: string;
  delta: string;
  tone: string;
}) {
  const isDown = delta.trim().startsWith("-");

  const toneConfig = {
    good: {
      badge: "bg-emerald-50 text-emerald-700 border border-emerald-100",
      glow: "from-emerald-500/10 to-transparent",
      dot: "bg-emerald-500",
      icon: TrendingUp
    },
    risk: {
      badge: "bg-red-50 text-red-700 border border-red-100",
      glow: "from-red-500/10 to-transparent",
      dot: "bg-red-500",
      icon: TrendingDown
    },
    watch: {
      badge: "bg-amber-50 text-amber-700 border border-amber-100",
      glow: "from-amber-400/10 to-transparent",
      dot: "bg-amber-400",
      icon: isDown ? ArrowDown : ArrowUp
    },
    neutral: {
      badge: "bg-zinc-50 text-zinc-600 border border-zinc-100",
      glow: "from-prootech-violet/8 to-transparent",
      dot: "bg-prootech-violet",
      icon: Minus
    }
  } as const;

  const config = toneConfig[tone as keyof typeof toneConfig] ?? toneConfig.neutral;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="card-interactive premium-surface group relative min-h-[132px] overflow-hidden rounded-2xl border border-prootech-line bg-white p-5 shadow-card"
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${config.glow} opacity-70`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${config.dot} shadow-sm`} />
          <p className="text-[0.72rem] font-medium leading-5 text-prootech-text-muted">{label}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[0.62rem] font-medium ${config.badge}`}>
          <Icon size={10.5} strokeWidth={2.4} />
          {delta}
        </span>
      </div>
      <div className="relative mt-6 flex items-end justify-between gap-3">
        <strong className="block text-[1.72rem] font-semibold leading-none tracking-[-0.035em] text-prootech-black">
          {value}
        </strong>
        <div className="h-px w-10 bg-gradient-to-l from-prootech-violet/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </motion.div>
  );
}

export function RiskItem({ title, severity }: { title: string; severity: "low" | "medium" | "high" }) {
  const config = {
    low: { colors: "text-zinc-600 bg-zinc-100 border-zinc-200", dot: "bg-zinc-400" },
    medium: { colors: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-500" },
    high: { colors: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500" }
  };

  const { colors, dot } = config[severity];

  return (
    <div className="group flex items-start gap-3 rounded-2xl border border-prootech-line/80 bg-white/80 p-4 transition-all hover:-translate-y-0.5 hover:border-prootech-violet/15 hover:bg-white hover:shadow-card">
      <span className={`mt-0.5 flex shrink-0 items-center justify-center rounded-xl border p-2.5 ${colors}`}>
        <AlertTriangle size={14} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start gap-2.5">
          <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
          <p className="text-sm leading-6 text-prootech-black">{title}</p>
        </div>
      </div>
    </div>
  );
}

export function StatusPill({ value }: { value: unknown }) {
  const text = String(value ?? "active");
  const lower = text.toLowerCase();

  const isNeg = lower.includes("overdue") || lower.includes("red") || lower.includes("reject") || lower.includes("failed");
  const isWarn = lower.includes("pending") || lower.includes("amber") || lower.includes("review") || lower.includes("draft");
  const isGood = lower.includes("active") || lower.includes("approved") || lower.includes("sent") || lower.includes("green") || lower.includes("paid") || lower.includes("completed");

  const cls = isNeg
    ? "bg-red-50/90 text-red-700 border border-red-100"
    : isWarn
      ? "bg-amber-50/90 text-amber-700 border border-amber-100"
      : isGood
        ? "bg-emerald-50/90 text-emerald-700 border border-emerald-100"
        : "bg-prootech-muted text-zinc-600 border border-prootech-line";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.66rem] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,.6)] ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isNeg ? "bg-red-500" : isWarn ? "bg-amber-500" : isGood ? "bg-emerald-500" : "bg-zinc-400"}`} />
      {text}
    </span>
  );
}

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "violet" | "success" | "warning" | "danger" }) {
  const cls = {
    default: "bg-prootech-muted text-zinc-600 border-prootech-line",
    violet: "bg-prootech-violet-soft text-prootech-violet border-prootech-violet/15",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    danger: "bg-red-50 text-red-700 border-red-100"
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.66rem] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,.55)] ${cls[variant]}`}>
      {children}
    </span>
  );
}
