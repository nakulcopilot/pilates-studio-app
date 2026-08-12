"use client";

import { useState, useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashData } from "@/lib/data";
import type { StudioClass } from "@/lib/types";
import { Badge, LevelTag, SectionTitle } from "./ui";
import { IconUser, IconCheckSquare, IconClock } from "@/components/icons";

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

  const student = useMemo(
    () => data.students.find((s) => s.id === studentId),
    [data.students, studentId],
  );

  if (!student) {
    return null;
  }

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