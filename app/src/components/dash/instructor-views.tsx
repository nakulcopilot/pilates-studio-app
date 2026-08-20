"use client";

import { useState, useRef } from "react";
import InteractiveAvatar from "@/components/InteractiveAvatar";
import { useScreenShare } from "@/lib/use-screen-share";
import { useVoiceInteraction } from "@/lib/use-voice-interaction";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashData } from "@/lib/data";
import type { PhaseType } from "@/components/dash/live-timer";
import { IconClock, IconSparkles } from "@/components/icons";
import { Badge } from "./ui";
import { LiveStudentPanel } from "./live-student-panel";
import { LiveTimer } from "./live-timer";

export function LiveClassConsole({
  classId,
  supabase,
  data,
}: {
  classId: string;
  supabase: SupabaseClient;
  data: DashData;
}) {
  const [phase, setPhase] = useState<PhaseType>("free");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const { stream, isSharing, start: startShare, stop: stopShare } = useScreenShare();
  const { isListening, transcript, isSpeaking } = useVoiceInteraction();

  const phaseLabels: Record<PhaseType, string> = {
    free: "Free Flow",
    pilates: "Pilates",
    interval: "Interval",
    emom: "EMOM",
    amrap: "AMRAP",
  };

  const start = (p: PhaseType) => {
    setPhase(p);
    setRunning(true);
    setElapsed(0);
    if (intervalId) clearInterval(intervalId);
    const id = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    setIntervalId(id as unknown as number);
  };

  const pause = () => {
    setRunning(false);
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
  };

  const reset = () => {
    pause();
    setElapsed(0);
  };

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEnd = () => {
    pause();
    onEnd();
  };

  return (
    <div className="space-y-6">
      <InteractiveAvatar
        name="Instructor"
        onScreenShareToggle={() => isSharing ? stopShare() : startShare()}
        onVoiceToggle={() => {}}
      />

      <section className="card">
        <div className="flex items-center gap-2">
          <Badge tone={running ? "amber" : "green"}>
            {running ? "Live Class Running" : "Ready for Live Class"}
          </Badge>
          <div className="flex items-center gap-2">
            <IconClock size={20} className="text-[#e5ddd4]" />
            <span className="text-lg font-semibold">{formatElapsed(elapsed)}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-2">
          <button
            className="btn btn-primary"
            onClick={() => start("free")}
            disabled={running}
          >
            Free
          </button>
          <button
            className="btn btn-primary"
            onClick={() => start("pilates")}
            disabled={running}
          >
            Pilates
          </button>
          <button
            className="btn btn-primary"
            onClick={() => start("interval")}
            disabled={running}
          >
            Interval
          </button>
          <button
            className="btn btn-primary"
            onClick={() => start("emom")}
            disabled={running}
          >
            EMOM
          </button>
          <button
            className="btn btn-primary"
            onClick={() => start("amrap")}
            disabled={running}
          >
            AMRAP
          </button>
          <button
            className="btn btn-outline"
            onClick={pause}
            disabled={!running}
          >
            Pause
          </button>
          <button
            className="btn btn-outline"
            onClick={reset}
            disabled={!running}
          >
            Reset
          </button>
          <button
            className="btn btn-danger !w-full"
            onClick={handleEnd}
            disabled={!running}
          >
            <IconSparkles size={14} /> End Class
          </button>
        </div>
      </section>

      <section className="card">
        <LiveStudentPanel
          classId={classId}
          supabase={supabase}
          data={data}
          studentId="student-1"
          onNoteSave={(note) => console.log("Note saved:", note)}
        />
      </section>

      {isSpeaking && (
        <div className="mt-2 text-center text-amber-400 text-xs">
          Speaking: {transcript || "..."}
        </div>
      )}
    </div>
  );
}