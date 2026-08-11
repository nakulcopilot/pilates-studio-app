import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  accent = "#7c3aed",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="stat-card flex items-center gap-3">
      {icon && (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
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
    neutral: { background: "#f3f4f6", color: "#4b5563" },
    green: { background: "#ecfdf5", color: "#047857" },
    red: { background: "#fef2f2", color: "#b91c1c" },
    amber: { background: "#fffbeb", color: "#b45309" },
    purple: { background: "#f5f3ff", color: "#6d28d9" },
    blue: { background: "#eff6ff", color: "#1d4ed8" },
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
      <div className="text-3xl mb-2">🗂️</div>
      <p className="text-sm text-gray-500">{message}</p>
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
      <h3 className="text-base font-bold text-[#1a1a2e] m-0">{children}</h3>
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
        background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
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
