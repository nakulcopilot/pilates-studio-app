import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  accent = "#c9975a",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="stat-card">
      {icon && (
        <div
          className="stat-icon"
          style={{ background: `${accent}1a`, color: accent }}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="stat-label">{label}</div>
        <div className="stat-value truncate">{value}</div>
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "red" | "amber" | "purple" | "blue";
}) {
  const tones: Record<string, { background: string; color: string }> = {
    neutral: { background: "rgba(255,255,255,0.08)", color: "#d9cfc4" },
    green: { background: "rgba(127,191,154,0.14)", color: "#8fd3ab" },
    red: { background: "rgba(224,122,122,0.14)", color: "#f0a3a3" },
    amber: { background: "rgba(212,162,89,0.16)", color: "#e8c184" },
    purple: { background: "rgba(167,139,250,0.14)", color: "#c4b5fd" },
    blue: { background: "rgba(143,168,224,0.16)", color: "#a7bceb" },
  };
  return (
    <span className="badge" style={tones[tone]}>
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="card flex flex-col items-center justify-center py-10 text-center">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c7b9c4" strokeWidth="1.6" strokeLinecap="round" className="mb-2" aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M9 15h3" />
      </svg>
      <p className="text-sm text-[#b8a99c]">{message}</p>
    </div>
  );
}

export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h3 className="text-base font-bold text-[#f0e6dd] m-0">{children}</h3>
      {right}
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 36,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: "linear-gradient(135deg, #c9975a, #9a7338)",
      }}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function LevelTag({
  level,
}: {
  level: "beginner" | "intermediate" | "expert";
}) {
  const map = {
    beginner: { label: "Beginner", tone: "green" as const },
    intermediate: { label: "Intermediate", tone: "blue" as const },
    expert: { label: "Expert", tone: "purple" as const },
  };
  const cfg = map[level] ?? map.beginner;
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

export function ClassTypeTag({ type }: { type: "mat" | "reformer" }) {
  return (
    <Badge tone={type === "mat" ? "amber" : "blue"}>
      {type === "mat" ? "Mat" : "Reformer"}
    </Badge>
  );
}

export function cnAlt(...parts: Array<string | false | null | undefined>) {
  return cn(...parts);
}
