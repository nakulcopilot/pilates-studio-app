import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashData } from "./data";
import type { StudioClass, StudioSettings } from "./types";
import { formatDate, timeLabel } from "./utils";

export interface StudentCue {
  studentId: string;
  name: string;
  level: string;
  attendancePct: number;
  reason: string;
  cue: string;
  why: string;
}

export function isAIEnabled(settings: StudioSettings | null): boolean {
  return settings?.data?.ai?.enabled ?? false;
}

export async function callAI(
  supabase: SupabaseClient,
  system: string,
  user: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-proxy", {
      body: {
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
    });
    if (error) return null;
    return typeof data?.content === "string" ? data.content : null;
  } catch {
    return null;
  }
}

export async function generateWithFallback(
  supabase: SupabaseClient,
  settings: StudioSettings | null,
  system: string,
  user: string,
  fallback: string,
): Promise<string> {
  if (isAIEnabled(settings)) {
    const ai = await callAI(supabase, system, user);
    if (ai && ai.trim()) return ai.trim();
  }
  return fallback;
}

const KEYWORD_RE =
  /shoulder|knee|back|hip|neck|ankle|wrist|core|pelvic|sciatic|lower back|tight/i;

function recentNotes(data: DashData, studentId: string, limit = 3) {
  return data.studentNotes
    .filter((n) => n.student_id === studentId)
    .slice(0, limit)
    .map((n) => n.text);
}

function activeInjuries(data: DashData, studentId: string) {
  return data.injuries.filter((i) => i.student_id === studentId && i.status === "active");
}

function attendancePct(data: DashData, studentId: string) {
  const rows = data.attendance.filter((a) => a.student_id === studentId);
  if (rows.length === 0) return 100;
  const present = rows.filter((a) => a.status !== "absent").length;
  return Math.round((present / rows.length) * 100);
}

export function buildPreClassBrief(data: DashData, c: StudioClass): string {
  const inst = data.instructors.find((i) => i.id === c.instructor);
  const roster = data.students.filter((s) => c.enrolled.includes(s.id));
  const watch = roster.filter(
    (s) => activeInjuries(data, s.id).length > 0 || recentNotes(data, s.id).some((n) => KEYWORD_RE.test(n)),
  );

  const lines: string[] = [];
  lines.push(`PRE-CLASS BRIEF — ${c.id}`);
  lines.push(`• ${c.type.charAt(0).toUpperCase() + c.type.slice(1)} · ${c.level} · ${formatDate(c.date)} at ${timeLabel(c.time)} · ${c.duration} min`);
  lines.push(`• Instructor: ${inst?.name ?? "Unassigned"}`);
  lines.push(`• Enrolled: ${c.enrolled.length}/${c.max_students}`);
  lines.push("");
  lines.push(`ROSTER (${roster.length})`);
  roster.forEach((s) => {
    const inj = activeInjuries(data, s.id);
    const injTxt = inj.length ? ` · 🩹 ${inj.map((i) => i.injury).join(", ")}` : "";
    lines.push(`  - ${s.name} (${s.level})${injTxt}`);
  });
  lines.push("");
  if (watch.length > 0) {
    lines.push("WATCH LIST — students needing attention");
    watch.forEach((s) => {
      const inj = activeInjuries(data, s.id).map((i) => i.injury).join(", ");
      const notes = recentNotes(data, s.id, 2).join(" | ");
      lines.push(`  • ${s.name}: ${inj ? `injury (${inj}); ` : ""}${notes || "monitor form"}`);
    });
    lines.push("");
  } else {
    lines.push("WATCH LIST — none flagged.");
    lines.push("");
  }
  lines.push("FOCUS");
  lines.push(`  • Keep cueing simple and consistent for ${c.level} level.`);
  lines.push("  • Give individual corrections to any student on the watch list.");
  return lines.join("\n");
}

export function buildStudentCues(data: DashData, limit = 5): StudentCue[] {
  const scored: Array<{ cue: StudentCue; score: number }> = data.students
    .filter((s) => s.active)
    .map((s) => {
      const pct = attendancePct(data, s.id);
      const inj = activeInjuries(data, s.id);
      const notes = recentNotes(data, s.id, 3);
      const flagged = notes.filter((n) => KEYWORD_RE.test(n));

      let score = 0;
      const reasons: string[] = [];
      if (inj.length) {
        score += 2;
        reasons.push(`active injury: ${inj.map((i) => i.injury).join(", ")}`);
      }
      if (pct < 80) {
        score += 2;
        reasons.push(`attendance ${pct}%`);
      } else if (pct < 90) {
        score += 1;
        reasons.push(`attendance ${pct}%`);
      }
      if (flagged.length) {
        score += 1;
        reasons.push(`repeated ${flagged[0].toLowerCase()}`);
      }

      let cue = "Keep cues short, positive and consistent.";
      let why = "Regular reinforcement helps movement quality.";
      if (inj.length) {
        cue = `Modify range for the ${inj[0].injury} — keep load light and check in before each set.`;
        why = `${s.name.split(" ")[0]} has an active ${inj[0].injury.toLowerCase()} marker; a quick pre-class check avoids aggravation.`;
      } else if (pct < 80) {
        cue = `Reconnect early — ask how ${s.name.split(" ")[0]} is feeling before the warm-up.`;
        why = `Attendance has dipped to ${pct}%; a personal check-in builds consistency.`;
      } else if (flagged.length) {
        cue = `Reinforce ${flagged[0].toLowerCase()} alignment twice during the flow.`;
        why = `Recent notes keep returning to this area, so repeated gentle cueing will help it stick.`;
      } else if (pct < 90) {
        cue = "Acknowledge their consistency with a quick word of encouragement.";
        why = `Attendance at ${pct}% is good but shows slight gaps; encouragement keeps them coming.`;
      }

      return {
        score,
        cue: {
          studentId: s.id,
          name: s.name,
          level: s.level,
          attendancePct: pct,
          reason: reasons.length ? reasons.join("; ") : "steady progress",
          cue,
          why,
        },
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((x) => x.cue);
}

export async function aiEnrichCue(
  supabase: SupabaseClient,
  settings: StudioSettings | null,
  cue: StudentCue,
): Promise<StudentCue> {
  if (!isAIEnabled(settings)) return cue;
  const system =
    "You are a senior Pilates coach. Write ONE concise coaching cue (max 40 words) and a one-sentence reason for it. Format: CUE: ...\nWHY: ...";
  const user = `Student: ${cue.name} (${cue.level}). Attendance: ${cue.attendancePct}%. Flags: ${cue.reason}. Base cue: ${cue.cue}. Base reason: ${cue.why}.`;
  const text = await callAI(supabase, system, user);
  if (!text) return cue;
  const cueMatch = text.match(/CUE:\s*([^\n]+)/i);
  const whyMatch = text.match(/WHY:\s*(.+)/i);
  if (!cueMatch && !whyMatch) return cue;
  return {
    ...cue,
    cue: cueMatch?.[1]?.trim() || cue.cue,
    why: whyMatch?.[1]?.trim() || cue.why,
  };
}
