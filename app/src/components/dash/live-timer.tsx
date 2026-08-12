"use client";

import { useState, useEffect } from "react";
import { IconClock, IconSparkles } from "@/components/icons";
import { Badge } from "./ui";

type PhaseType = "free" | "pilates" | "interval" | "emom" | "amrap";

interface LiveTimerProps {
  classId: string;
  onEnd: () => void;
}

export function LiveTimer({ classId, onEnd }: LiveTimerProps) {
  const [phase, setPhase] = useState<PhaseType>("free");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  const phaseLabels: Record<PhaseType, string> = {
    free: "Free Flow",
    pilates: "Pilates",
    interval: "Interval",
    emom: "EMOM",
    amrap: "AMRAP",
  };

  const [selectedPhase, setSelectedPhase] = useState<PhaseType>("free");

  // Start timer
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

  // Pause timer
  const pause = () => {
    setRunning(false);
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
  };

  // Reset timer
  const reset = () => {
    pause();
    setElapsed(0);
  };

  // Format elapsed time mm:ss
  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // End class cleanup
  const handleEnd = () => {
    pause();
    onEnd();
  };

  return (
    <div className="card space-y-4">
      <Badge tone={running ? "amber" : "green"}>
        {running ? "Live Class Running" : "Ready for Live Class"}
      </Badge>
      <div className="flex items-center gap-2">
        <IconClock size={20} className="text-[#e5ddd4]" /> {formatElapsed(elapsed)}
      </div>
      <div className="flex gap-2">
        <button
          className="btn btn-outline"
          onClick={() => start(selectedPhase)}
          disabled={running}
        >
          <IconSparkles size={14} /> Start
        </button>
        <button
          className="btn btn-outline"
          onClick={pause}
          disabled={!running}
        >
          <IconSparkles size={14} /> Pause
        </button>
        <button
          className="btn btn-outline"
          onClick={reset}
          disabled={!running}
        >
          <IconSparkles size={14} /> Reset
        </button>
      </div>
      <div className="flex gap-3">
        <button
          className="btn btn-primary"
          onClick={() => setPhase("free")}
          disabled={running}
        >
          Free
        </button>
        <button
          className="btn btn-primary"
          onClick={() => setPhase("pilates")}
          disabled={running}
        >
          Pilates
        </button>
        <button
          className="btn btn-primary"
          onClick={() => setPhase("interval")}
          disabled={running}
        >
          Interval
        </button>
      </div>
      <div className="mt-4">
        <button
          className="btn btn-danger !w-full"
          onClick={handleEnd}
          disabled={!running}
        >
          <IconSparkles size={14} /> End Class
        </button>
      </div>
    </div>
  );
}