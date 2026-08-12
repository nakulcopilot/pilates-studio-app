"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashData } from "@/lib/data";
import type { StudioClass } from "@/lib/types";
import {
  aiEnrichCue,
  buildPreClassBrief,
  buildStudentCues,
  callAI,
  isAIEnabled,
  type StudentCue,
} from "@/lib/ai";
import { Badge, LevelTag, SectionTitle } from "./ui";
import { IconSparkles } from "@/components/icons";

export function PreClassBriefPanel({
  data,
  supabase,
  c,
}: {
  data: DashData;
  supabase: SupabaseClient;
  c: StudioClass;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [source, setSource] = useState<"ai" | "heuristic">("heuristic");

  const generate = async () => {
    setLoading(true);
    const heuristic = buildPreClassBrief(data, c);
    if (isAIEnabled(data.settings)) {
      const system =
        "You are a senior Pilates coaching assistant. Rewrite the given class brief in plain text using these section labels: OVERVIEW, HIGHLIGHTS, RISKS, FOCUS. Keep it concise and practical. No markdown headings with #.";
      const ai = await callAI(supabase, system, heuristic);
      if (ai && ai.trim()) {
        setText(ai.trim());
        setSource("ai");
        setLoading(false);
        return;
      }
    }
    setText(heuristic);
    setSource("heuristic");
    setLoading(false);
  };

  return (
    <div>
      <button
        className="btn btn-outline !min-h-8 !px-3 !py-1 !text-xs"
        onClick={() => {
          setOpen((o) => !o);
          if (!text && !loading) generate();
        }}
      >
        <IconSparkles size={13} /> {open ? "Hide brief" : "Brief"}
      </button>
      {open && (
        <div className="mt-3 rounded-xl border border-[#2a2420] bg-[#12100e] p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <IconSparkles size={15} className="text-[#c9975a]" />
              <span className="text-sm font-bold text-[#f0e6dd]">
                Pre-class brief
              </span>
              <Badge tone={source === "ai" ? "purple" : "amber"}>
                {source === "ai" ? "AI generated" : "Heuristic"}
              </Badge>
            </div>
            <button
              className="btn btn-outline !min-h-7 !px-2 !py-0.5 !text-xs"
              onClick={generate}
              disabled={loading}
            >
              {loading ? "Generating…" : "Regenerate"}
            </button>
          </div>
          {loading ? (
            <div className="flex items-center gap-3 text-sm text-[#b8a99c]">
              <span className="spinner" style={{ width: 14, height: 14 }} />
              Building your brief…
            </div>
          ) : (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#e5ddd4] m-0">
              {text}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export function AICoachingPanel({
  data,
  supabase,
}: {
  data: DashData;
  supabase: SupabaseClient;
}) {
  const [cues, setCues] = useState<StudentCue[]>(() => buildStudentCues(data));
  const [busy, setBusy] = useState(false);
  const aiOn = isAIEnabled(data.settings);

  const enrich = async () => {
    if (!aiOn) return;
    setBusy(true);
    const top = cues.slice(0, 3);
    const enriched = await Promise.all(
      top.map((cue) => aiEnrichCue(supabase, data.settings, cue)),
    );
    setCues((prev) => [...enriched, ...prev.slice(3)]);
    setBusy(false);
  };

  return (
    <div className="card">
      <SectionTitle
        right={
          aiOn ? (
            <button
              className="btn btn-outline !min-h-8 !px-3 !py-1 !text-xs"
              onClick={enrich}
              disabled={busy}
            >
              <IconSparkles size={13} /> {busy ? "Enriching…" : "Generate with AI"}
            </button>
          ) : (
            <Badge tone="amber">AI off — heuristic cues</Badge>
          )
        }
      >
        AI Coaching Assist
      </SectionTitle>
      <p className="text-xs text-[#85776c] -mt-2 mb-4">
        Priority students ranked by attendance, active injuries and recent notes.
      </p>
      <div className="space-y-3">
        {cues.map((cue) => {
          const st = data.students.find((s) => s.id === cue.studentId);
          return (
            <div
              key={cue.studentId}
              className="rounded-lg border border-[#2a2420] px-3 py-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-[#f0e6dd]">
                  {cue.name}
                </span>
                {st && <LevelTag level={st.level} />}
                <span className="text-xs text-[#85776c]">
                  Attendance {cue.attendancePct}%
                </span>
              </div>
              <div className="mt-1 text-sm text-[#e5ddd4]">{cue.cue}</div>
              <div className="mt-1 flex items-start gap-2">
                <IconSparkles size={13} className="mt-0.5 shrink-0 text-[#c9975a]" />
                <div className="text-xs text-[#b8a99c]">{cue.why}</div>
              </div>
              <div className="mt-1 text-[0.7rem] uppercase tracking-wide text-[#85776c]">
                {cue.reason}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
