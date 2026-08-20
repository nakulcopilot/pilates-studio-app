import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashData } from "./data";
import type { StudentNote, StudentMilestone } from "./types";
import type { StudioClass, StudioSettings } from "./types";
import { formatDate, timeLabel, formatCurrency } from "./utils";

const KEYWORD_RE = /(shoulder|knee|back|hip|neck|ankle|wrist|elbow|core|pelvic|sciatic|tight|inflammation|swelling|stiff|numbness|tingling|range of motion|flexibility|stability|balance|posture|alignment|engagement|core activation|pelvic tilt|spinal alignment|neutral spine|breathing|coordination|compression|decompression|myofascial|trigger point|muscle imbalance|overuse|rehab|recovery|postnatal|pregnant|postppartum|elderly|beginner|intermediate|expert|modification|adaptation|progression|regression|safe|caution|contraindication)/gi;

export interface StudentCue {
  studentId: string;
  name: string;
  level: string;
  attendancePct: number;
  reason: string;
  cue: string;
  why: string;
}

export interface NoteTag {
  id: string;
  text: string;
  confidence: number;
}

export interface StudentPerformance {
  studentId: string;
  name: string;
  level: string;
  attendancePct: number;
  injuryCount: number;
  noteCount: number;
  milestoneCount: number;
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
}

export interface ConsultData {
  studentId: string;
  studentName: string;
  totalClasses: number;
  attendancePct: number;
  injuries: string[];
  milestones: string[];
  recentNotes: string[];
  levelProgress: string;
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

export function activeInjuries(data: DashData, studentId: string): { injury: string }[] {
  const injuries = data.injuries.filter((i) => i.student_id === studentId && i.status === "active");
  return injuries.map((i) => ({ injury: i.injury }));
}

export function attendancePct(data: DashData, studentId: string): number {
  const studentClasses = data.classes.filter((c) => c.enrolled.includes(studentId));
  const attended = data.attendance.filter(
    (a) => a.student_id === studentId && a.status === "present",
  );
  return studentClasses.length ? Math.round((attended.length / studentClasses.length) * 100) : 0;
}

export function buildPreClassBrief(data: DashData, c: StudioClass): string {
  const inst = data.instructors.find((i) => i.id === c.instructor);
  const roster = data.students.filter((s) => c.enrolled.includes(s.id));
  const watch = roster.filter(
    (s) => activeInjuries(data, s.id).length > 0 || recentNotes(data, s.id).some((n) => KEYWORD_RE.test(n.text)),
  );

  const lines: string[] = [];
  lines.push(`PRE-CLASS BRIEF — ${c.id}`);
  lines.push(
    `• ${c.type.charAt(0).toUpperCase() + c.type.slice(1)} · ${c.level} · ${formatDate(c.date)} at ${timeLabel(c.time)} · ${c.duration} min`,
  );
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
      const flagged = notes.filter((n) => KEYWORD_RE.test(n.text));

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
        reasons.push(`repeated ${flagged[0].text.toLowerCase()}`);
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
cue = `Reinforce ${flagged[0].text.toLowerCase()} alignment twice during the flow.`;
        why = `Recent notes keep returning to this area, so repeated gentle cueing will help it stick.`;
      } else if (pct < 90) {
        cue = "Acknowledge their consistency with a quick word of encouragement.";
        why = `Attendance at ${pct}% is good but shows slight gaps; encouragement keeps them coming.`;
      } else if (pct < 80) {
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

export function autoTagNote(classId: string, studentId: string, noteText: string): NoteTag[] {
  const KEYWORDS: string[] = [
    "shoulder", "knee", "back", "hip", "neck", "ankle", "wrist", "elbow",
    "core", "pelvic", "sciatic", "tight", "inflammation", "swelling",
    "stiff", "numbness", "tingling", "range of motion", "flexibility",
    "stability", "balance", "posture", "alignment", "engagement",
    "core activation", "pelvic tilt", "spinal alignment", "neutral spine",
    "breathing", "coordination", "compression", "decompression",
    "myofascial", "trigger point", "muscle imbalance", "overuse",
    "rehab", "recovery", "postnatal", "pregnant", "postppartum",
    "elderly", "beginner", "intermediate", "expert",
    "modification", "adaptation", "progression", "regression",
    "safe", "caution", "contraindication",
  ];

  const TAGS: Record<string, string> = {
    shoulder: "Shoulder",
    knee: "Knee",
    back: "Back",
    hip: "Hip",
    neck: "Neck",
    ankle: "Ankle",
    wrist: "Wrist",
    elbow: "Elbow",
    core: "Core Stability",
    pelvic: "Pelvic Position",
    sciatic: "Sciatic Awareness",
    tight: "Muscle Tightness",
    inflammation: "Inflammation",
    swelling: "Swelling",
    stiff: "Stiffness",
    numbness: "Numbness",
    tingling: "Tingling",
    "range of motion": "Range of Motion",
    flexibility: "Flexibility Work",
    stability: "Stability Focus",
    balance: "Balance Training",
    posture: "Posture",
    alignment: "Alignment",
    engagement: "Muscle Engagement",
    "core activation": "Core Activation",
    "pelvic tilt": "Pelvic Tilt",
    "spinal alignment": "Spinal Alignment",
    "neutral spine": "Neutral Spine",
    breathing: "Breathing Cue",
    coordination: "Coordination",
    compression: "Compression Concern",
    decompression: "Decompression",
    myofascial: "Myofascial Release",
    "trigger point": "Trigger Point",
    "muscle imbalance": "Muscle Imbalance",
    overuse: "Overuse Pattern",
    rehab: "Rehabilitation",
    recovery: "Recovery Focus",
    postnatal: "Postnatal Modification",
    pregnant: "Pregnancy Modification",
    "postppartum": "Postpartum Care",
    elderly: "Senior Consideration",
    beginner: "Beginner Foundation",
    intermediate: "Intermediate Progress",
    expert: "Expert Level",
  };

  const lowerText = noteText.toLowerCase();
  const foundTags: NoteTag[] = [];

  for (const keyword of KEYWORDS) {
    if (lowerText.includes(keyword)) {
      const tag = TAGS[keyword];
      if (tag) {
        foundTags.push({ id: keyword, text: tag, confidence: 0.8 });
      }
    }
  }

  if (foundTags.length === 0) {
    foundTags.push({ id: "general", text: "General Observation", confidence: 0.5 });
  }

  return foundTags;
}

export function getStudentPerformance(data: DashData, studentId: string): StudentPerformance {
  const student = data.students.find((s) => s.id === studentId);
  if (!student) {
    return {
      studentId,
      name: "Unknown",
      level: "beginner",
      attendancePct: 0,
      injuryCount: 0,
      noteCount: 0,
      milestoneCount: 0,
      riskLevel: "low",
      recommendations: ["Student not found in data"],
    };
  }

  const injuries = activeInjuries(data, studentId);
  const notes = data.studentNotes.filter((n) => n.student_id === studentId);
  const milestones = recentMilestones(data, studentId);
  const pct = attendancePct(data, studentId);

  let riskLevel: "low" | "medium" | "high" = "low";
  const recommendations: string[] = [];

  if (injuries.length > 2) {
    riskLevel = "high";
    recommendations.push("Monitor multiple active injuries closely");
  } else if (injuries.length > 0) {
    riskLevel = "medium";
    recommendations.push("Review injury modifications regularly");
  }

  if (pct < 60) {
    riskLevel = riskLevel === "low" ? "medium" : highLevel(riskLevel);
    recommendations.push("Focus on building attendance consistency");
  } else if (pct < 80) {
    recommendations.push("Gentle encouragement to improve attendance");
  }

  if (milestones.length === 0) {
    recommendations.push("Consider setting first milestone goal");
  }

  const flaggedNotes = notes.filter((n) => KEYWORD_RE.test(n.text));
  if (flaggedNotes.length >= 3) {
    riskLevel = "high";
    recommendations.push("Pattern of repeated issues noted - review form carefully");
  }

  return {
    studentId: student.id,
    name: student.name,
    level: student.level,
    attendancePct: pct,
    injuryCount: injuries.length,
    noteCount: notes.length,
    milestoneCount: milestones.length,
    riskLevel,
    recommendations,
  };
}

function highLevel(current: "low" | "medium" | "high"): "low" | "medium" | "high" {
  const order: ("low" | "medium" | "high")[] = ["low", "medium", "high"];
  const currentIndex = order.indexOf(current);
  if (currentIndex >= order.length - 1) return current;
  return order[currentIndex + 1];
}

export function generatePriorityCue(
  data: DashData,
  studentId: string,
  classId?: string,
): { cue: string; why: string; priority: "high" | "medium" | "low" } {
  const student = data.students.find((s) => s.id === studentId);
  if (!student) {
    return { cue: "Student not found", why: "Invalid student ID", priority: "low" };
  }

  const pct = attendancePct(data, studentId);
  const inj = activeInjuries(data, studentId);
  const notes = recentNotes(data, studentId, 5);
  const flagged = notes.filter((n) => KEYWORD_RE.test(n.text));

  let cue: string;
  let why: string;
  let priority: "high" | "medium" | "low" = "low";

  if (inj.length > 0) {
    priority = "high";
    const injury = inj[0].injury;
    cue = `Modify range for the ${injury} — keep load light and check in before each set.`;
    why = `${student.name.split(" ")[0]} has an active ${injury.toLowerCase()} marker; a quick pre-class check avoids aggravation.`;
  } else if (pct < 60) {
    priority = "high";
    cue = `Reconnect early — ask how ${student.name.split(" ")[0]} is feeling before the warm-up.`;
    why = `Attendance has dipped to ${pct}%; a personal check-in builds consistency.`;
  } else if (pct < 80 || flagged.length > 0) {
    priority = "medium";
    if (flagged.length > 0) {
      cue = `Reinforce ${flagged[0].text.toLowerCase()} alignment twice during the flow.`;
      why = `Recent notes keep returning to this area, so repeated gentle cueing will help it stick.`;
    } else {
      cue = `Reconnect early — ask how ${student.name.split(" ")[0]} is feeling before the warm-up.`;
      why = `Attendance at ${pct}% shows gaps; encouragement keeps them coming.`;
    }
  } else {
    priority = "low";
    cue = "Acknowledge their consistency with a quick word of encouragement.";
    why = `Attendance at ${pct}% is good but shows slight gaps; encouragement keeps them coming.`;
  }

  return { cue, why, priority };
}

export function smartAISuggestion(
  data: DashData,
  studentId: string,
  classId?: string,
): { cue: string; why: string; confidence: number; tags: string[] } {
  const student = data.students.find((s) => s.id === studentId);
  if (!student) {
    return { cue: "Student not found", why: "Invalid student ID", confidence: 0, tags: [] };
  }

  const pct = attendancePct(data, studentId);
  const inj = activeInjuries(data, studentId);
  const notes = recentNotes(data, studentId, 5);
  const flagged = notes.filter((n) => KEYWORD_RE.test(n.text));
  const milestones = recentMilestones(data, studentId);

  let cue: string;
  let why: string;
  let confidence = 0.7;
  const tags: string[] = [];

  for (const note of notes) {
    const noteTags = autoTagNote("", studentId, note.text).map((t) => t.text);
    tags.push(...noteTags);
  }
  const uniqueTags = [...new Set(tags)];

  if (inj.length > 0) {
    confidence = 0.9;
    const injury = inj[0].injury;
    cue = `Modify range for the ${injury} — keep load light and check in before each set.`;
    why = `${student.name.split(" ")[0]} has an active ${injury.toLowerCase()} marker; a quick pre-class check avoids aggravation.`;
    tags.push("injury-modification");
  } else if (pct < 60) {
    confidence = 0.8;
    cue = `Reconnect early — ask how ${student.name.split(" ")[0]} is feeling before the warm-up.`;
    why = `Attendance has dipped to ${pct}%; a personal check-in builds consistency.`;
    tags.push("low-attendance");
  } else if (pct < 80 || flagged.length > 0) {
    confidence = 0.75;
    if (flagged.length > 0) {
      cue = `Reinforce ${flagged[0].text.toLowerCase()} alignment twice during the flow.`;
      why = `Recent notes keep returning to this area, so repeated gentle cueing will help it stick.`;
      tags.push("repeated-concern");
    } else {
      cue = `Acknowledge their consistency with a quick word of encouragement.`;
      why = `Attendance at ${pct}% shows gaps; encouragement keeps them coming.`;
      tags.push("attention-needed");
    }
  } else if (milestones.length > 0 && pct >= 80) {
    confidence = 0.8;
    const latestMilestone = milestones[milestones.length - 1];
    cue = `Congratulate ${student.name} on reaching: ${latestMilestone.title}.`;
    why = `${student.name.split(" ")[0]} has achieved ${milestones.length} milestone(s) - maintain progress with consistent practice.`;
    tags.push("milestone-achievement");
  } else {
    confidence = 0.7;
    cue = "Acknowledge their consistency with a quick word of encouragement.";
    why = `Attendance at ${pct}% is strong - keep supporting their practice.`;
    tags.push("consistent-attendance");
  }

  return { cue, why, confidence, tags: uniqueTags };
}

export function getConsultData(data: DashData, studentId: string): ConsultData {
  const student = data.students.find((s) => s.id === studentId);
  if (!student) {
    return {
      studentId: "unknown",
      studentName: "Unknown",
      totalClasses: 0,
      attendancePct: 0,
      injuries: [],
      milestones: [],
      recentNotes: [],
      levelProgress: "beginner",
    };
  }

  const injuries = activeInjuries(data, studentId).map((i) => i.injury);
  const notes = recentNotes(data, studentId, 5).map((n) => n.text);
  const milestones = recentMilestones(data, studentId).map((m) => m.title);
  const pct = attendancePct(data, studentId);
  const levelProgress = getLevelProgress(student.level, pct);

  return {
    studentId: student.id,
    studentName: student.name,
    totalClasses: _countEnrolledClasses(data, studentId),
    attendancePct: pct,
    injuries,
    milestones,
    recentNotes: notes,
    levelProgress,
  };
}

function getLevelProgress(level: "beginner" | "intermediate" | "expert", attendancePct: number): string {
  const progress: Record<"beginner" | "intermediate" | "expert", string> = {
    beginner: attendancePct < 50 ? "starting foundation" : attendancePct < 70 ? "building consistency" : "nearly intermediate",
    intermediate: attendancePct < 60 ? "reinforcing basics" : attendancePct < 80 ? "transitioning to expert" : "almost expert",
    expert: attendancePct < 80 ? "reviewing expert material" : "mastery level",
  };
  return progress[level] || "progressing";
}

function _countEnrolledClasses(data: DashData, studentId: string): number {
  const student = data.students.find((s) => s.id === studentId);
  return student ? student.enrolled_classes.length : 0;
}

export function getStudentPerformanceSummary(data: DashData, studentId: string): string {
  const perf = getStudentPerformance(data, studentId);
  const levelLabels = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    expert: "Expert",
  };

  return `${perf.name} (${levelLabels[perf.level as "beginner" | "intermediate" | "expert"]}) — ${perf.attendancePct}% attendance, ${perf.injuryCount} active injury(s), ${perf.noteCount} notes, ${perf.milestoneCount} milestones. Risk: ${perf.riskLevel}. ${perf.recommendations.slice(0, 2).join(" ")}.`;
}

export function aiEnrichCue(
  supabase: SupabaseClient,
  settings: StudioSettings | null,
  cue: StudentCue,
): Promise<StudentCue> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const enriched: StudentCue = {
        ...cue,
        why: `${cue.why} (enriched)`,
      };
      resolve(enriched);
    }, 10);
  });
}

function recentNotes(data: DashData, studentId: string, limit = 5): StudentNote[] {
  const notes = data.studentNotes.filter((n) => n.student_id === studentId);
  return notes
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, limit);
}

function recentMilestones(data: DashData, studentId: string): StudentMilestone[] {
  const student = data.students.find((s) => s.id === studentId);
  if (!student) return [];
  const all = data.milestones.filter((m) => m.student_id === studentId);
  return all.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).slice(0, 10);
}