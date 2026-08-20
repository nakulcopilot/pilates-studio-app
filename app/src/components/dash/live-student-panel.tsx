"use client";

import { useState, useMemo } from "react";
import InteractiveAvatar from "@/components/InteractiveAvatar";
import { useVoiceInteraction } from "@/lib/use-voice-interaction";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashData } from "@/lib/data";
import { Badge, LevelTag, SectionTitle } from "./ui";

interface LiveStudentPanelProps {
  classId: string;
  supabase: SupabaseClient;
  data: DashData;
  studentId: string;
  onNoteSave?: (note: string) => void;
}

export function LiveStudentPanel({
  classId,
  supabase,
  data,
  studentId,
  onNoteSave,
}: LiveStudentPanelProps) {
  const [note, setNote] = useState("");
  const { isListening, transcript, isSpeaking } = useVoiceInteraction();

  const student = useMemo(
    () => data.students.find((s) => s.id === studentId),
    [data.students, studentId],
  );

  if (!student) {
    return null;
  }

  const startVoice = () => {
    // Start listening and append transcript to note
    setTimeout(() => {}, 100);
  };

  const stopVoice = () => {
    // Stop listening
  };

  const handleSaveNote = async () => {
    if (!note.trim()) return;
    const { error } = await supabase.from("class_notes").insert({
      class_id: classId,
      student_id: studentId,
      text: note.trim(),
      tags: [],
    });
    if (error) {
      // silently fail
    }
    setNote("");
    onNoteSave?.(note);
  };

  return (
    <div className="card space-y-3">
      <InteractiveAvatar
        name={student.name}
        onScreenShareToggle={() => {}}
        onVoiceToggle={startVoice}
      />

      <div className="flex items-center gap-2 text-xs text-[#85776c]">
        <span>Voice: {isListening ? "Listening" : "Idle"}</span>
        <span>Transcript: {transcript || ""}</span>
      </div>

      <SectionTitle> {student.name} ({student.level}) </SectionTitle>
      <div className="grid grid-cols-2 gap-2 text-sm text-[#e5ddd4]">
        <div>
          <span>Attendance:</span>
          <Badge>Present</Badge>
        </div>
        <div>
          <span>Level progress:</span>
          <LevelTag level={student.level} />
        </div>
      </div>
      <div>
        <label className="block text-xs text-[#b8a99c] mb-1">Observation note</label>
        <textarea
          className="input w-full h-24 resize-y"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add observation about form, cues, etc."
        ></textarea>
      </div>
      <div className="flex justify-end">
        <button
          className="btn btn-sm btn-primary"
          onClick={handleSaveNote}
          disabled={!note.trim()}
        >
          Save Note
        </button>
      </div>
    </div>
  );
}