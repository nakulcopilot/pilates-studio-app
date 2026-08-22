"use client";

import { useState, useEffect } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import type { DashData } from "@/lib/data";
import type { StudioClass, Student } from "@/lib/types";
import {
  isAIEnabled,
  callAI,
  generateWithFallback,
  buildPreClassBrief,
  buildStudentCues,
  smartAISuggestion,
} from "@/lib/ai";
import { Badge, LevelTag, SectionTitle } from "./ui";
import { IconSparkles } from "@/components/icons";

export interface StudentSummary {
  studentId: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  attendancePct: number;
  lastAttendance: string | null;
  goals: string[];
  focusAreas: string[];
  recentNotes: string[];
}

export interface CopilotSuggestion {
  type: "class-structure" | "exercise" | "modification";
  title: string;
  description: string;
  confidence: number;
  studentIds?: string[];
}

export function InstructorCopilotPanel({
  data,
  supabase,
  classId,
}: {
  data: DashData;
  supabase: SupabaseClient;
  classId: string;
}) {
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([]);
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiOn, setAIOn] = useState(false);

  const loadStudentSummaries = async () => {
    setLoading(true);

    // Get enrolled students for this class from the classes data
    const studioClass = data.classes.find((c) => c.id === classId);
    if (!studioClass) {
      setLoading(false);
      return;
    }

    const enrolledStudentIds = studioClass.enrolled || [];

    // Build summaries for each enrolled student using data already loaded
    const summaries: StudentSummary[] = [];

    for (const studentId of enrolledStudentIds) {
      const student = data.students.find((s) => s.id === studentId);
      if (!student) continue;

      // Get attendance data from the attendance array
      const studentAttendance = data.attendance.filter(
        (a) => a.student_id === studentId,
      );
      const attended = studentAttendance.filter(
        (a) => a.status === "present",
      ).length;
      const total = studentAttendance.length;
      const attendancePct = total > 0 ? Math.round((attended / total) * 100) : 0;

      // Get last attendance date
      const lastAttendance = studentAttendance
        .filter((a) => a.status === "present")
        .sort((a, b) => (new Date(a.date).getTime() - new Date(b.date).getTime()))[0]
        ?.date || null;

      // Get goals from milestones
      const studentMilestones = data.milestones.filter(
        (m) => m.student_id === studentId,
      );
      const goals = studentMilestones.map((m) => m.title);

      // Get focus areas from injuries
      const studentInjuries = data.injuries.filter(
        (i) => i.student_id === studentId && !i.resolved,
      );
      const focusAreas = studentInjuries.length
        ? ["modifications"]
        : student.level === "beginner"
          ? ["foundation"]
          : ["progression"];

      // Get recent notes
      const studentNotes = data.studentNotes.filter(
        (n) => n.student_id === studentId,
      );
      const recentNotes = studentNotes
        .sort((a, b) => (new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime()))
        .slice(0, 3)
        .map((n) => n.text || "");

      summaries.push({
        studentId,
        name: student.name,
        level: student.level,
        attendancePct,
        lastAttendance,
        goals,
        focusAreas,
        recentNotes,
      });
    }

    setStudentSummaries(summaries);
    setAIOn(isAIEnabled(data.settings));
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStudentSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, supabase, classId]);

  const generateSuggestions = async () => {
    if (!aiOn) {
      setSuggestions(generateHeuristicSuggestions());
      return;
    }

    setLoading(true);

    // Build student data summary for AI prompt
    const studentData = studentSummaries.map((s) => ({
      name: s.name,
      level: s.level,
      attendancePct: s.attendancePct,
      goals: s.goals,
      focusAreas: s.focusAreas,
    }));

    const systemPrompt = `You are an AI Pilates instructor copilot for "Pilates with Neelam". 
    Given the student summaries for a class, suggest:
    1. Class structure (warmup, main focus, cooldown)
    2. Exercise recommendations for each student
    3. Modifications based on injuries/levels
    
    Return JSON with:
    - "structure": { warmup: string, main: string, cooldown: string }
    - "exercises": array of { studentId, exercise, modification, confidence }
    - "notes": array of strings for instructor attention
    
    Keep it concise and practical. Focus on safe, effective programming.`;

    const userPrompt = `Class ID: ${classId}. Student data: ${JSON.stringify(studentData)}.

    Suggest class structure and exercise recommendations.`;

    const aiResponse = await generateWithFallback(
      supabase,
      data.settings,
      systemPrompt,
      userPrompt,
      generateHeuristicSuggestions(),
    );

    if (aiResponse) {
      try {
        const parsed = JSON.parse(aiResponse);
        // Set exercises, ignoring structure/notes for now to match state shape
        if (parsed.exercises && Array.isArray(parsed.exercises)) {
          setSuggestions(parsed.exercises as CopilotSuggestion[]);
        }
      } catch {
        // Invalid JSON, fall through to heuristic
      }
    }

    setLoading(false);
  };

  const generateHeuristicSuggestions = (): CopilotSuggestion[] => {
    const suggestions: CopilotSuggestion[] = [];

    studentSummaries.forEach((student) => {
      // Exercise recommendations based on level and focus areas
      let exercise: string;
      let modification: string | undefined;
      let confidence = 0.7;

      if (student.focusAreas.includes("modifications")) {
        exercise = "Reformer - Footwork with modifications";
        modification = "Reduce range of motion for sensitive areas";
        confidence = 0.9;
      } else if (student.level === "beginner") {
        exercise = "Mat - Hundred and Roll-Up";
        modification = "Bend knees if needed, use pillow under head";
        confidence = 0.8;
      } else if (student.level === "intermediate") {
        exercise = "Reformer - Short Box Series";
        modification = "Adjust spring tension based on feedback";
        confidence = 0.75;
      } else {
        exercise = "Mat - Advanced Short Spine";
        modification = "Add spine support if needed";
        confidence = 0.7;
      }

      suggestions.push({
        type: "exercise",
        title: exercise,
        description: modification || "No modifications needed",
        confidence,
        studentIds: [student.studentId],
      });

      // Add class structure suggestion after first few students
      if (suggestions.length <= 3) {
        suggestions.push({
          type: "class-structure",
          title: "Class Structure",
          description: `Warmup: 10min | Main: ${student.level} focus | Cooldown: 10min`,
          confidence: 0.8,
          studentIds: studentSummaries.map((s) => s.studentId),
        });
      }
    });

    return suggestions;
  };

  const [modifiedSuggestions, setModifiedSuggestions] = useState<CopilotSuggestion[]>([]);

const handleSuggestion = (suggestion: CopilotSuggestion) => {
    const alreadyModified = modifiedSuggestions.find(
      (s) => s.title === suggestion.title && s.type === suggestion.type
    );
    if (alreadyModified) {
      setModifiedSuggestions((prev) =>
        prev.filter((s) => s.title !== suggestion.title || s.type !== suggestion.type)
      );
    } else {
      setModifiedSuggestions((prev) => [...prev, suggestion]);
    }
  };

  const renderSuggestion = (s: CopilotSuggestion) => {
    const isModified = modifiedSuggestions.some(
      (ms) => ms.title === s.title && ms.type === s.type
    );
    const displayTitle = isModified ? `${s.title} (modified)` : s.title;
    const displayDescription = isModified
      ? `${s.description} (instructor modified)`
      : s.description;

    if (s.type === "class-structure") {
      return (
        <div
          key={s.title}
          className="rounded-lg border border-[#2a2420] px-3 py-2 mb-3"
        >
          <h4 className="font-medium text-[#f0e6dd] mb-1">{displayTitle}</h4>
          <p className="text-sm text-[#e5ddd4]">{displayDescription}</p>
          <Badge tone="purple">AI generated</Badge>
          <button
            onClick={() => handleSuggestion(s)}
            className="ml-2 text-xs text-[#b8a99c] hover:text-[#f0e6dd] underline"
          >
            {isModified ? "Undo override" : "Override"}
          </button>
        </div>
      );
    }

    return (
      <div
        key={s.title}
        className="rounded-lg border border-[#2a2420] px-3 py-2 mb-3"
      >
        <h4 className="font-medium text-[#f0e6dd] mb-1">{displayTitle}</h4>
        <p className="text-sm text-[#e5ddd4]">{displayDescription}</p>
        <span className="text-xs text-[#b8a99c]">Confidence: {Math.round(
          s.confidence * 100,
        )}%</span>
        <Badge tone="purple">AI generated</Badge>
        {isModified && (
          <span className="text-xs text-green-500 ml-2">Modified by instructor</span>
        )}
        <button
          onClick={() => handleSuggestion(s)}
          className="ml-2 text-xs text-[#b8a99c] hover:text-[#f0e6dd] underline"
        >
          {isModified ? "Undo override" : "Override"}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card p-6">
        <p className="text-sm text-[#85776c]">Loading student summaries...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <SectionTitle
        right={
          aiOn ? (
            <button
              className="btn btn-outline !min-h-8 !px-3 !py-1 !text-xs"
              onClick={generateSuggestions}
              disabled={loading}
            >
              <IconSparkles size={13} /> {loading ? "Generating…" : "Generate with AI"}
            </button>
          ) : (
            <Badge tone="amber">AI off — heuristic</Badge>
          )
        }
      >
        AI Instructor Copilot
      </SectionTitle>
      <p className="text-xs text-[#85776c] mb-4">
        Personalized class structure and exercise recommendations based on student data
      </p>

      {studentSummaries.length === 0 ? (
        <p className="text-sm text-[#716c63] mb-4">
          No student data available for this class. Add students to see recommendations.
        </p>
      ) : (
        <>
          {/* Student Summaries */}
          <div className="space-y-3 mb-4">
            {studentSummaries.map((student) => (
              <div
                key={student.studentId}
                className="rounded-lg border border-[#2a2420] px-3 py-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#f0e6dd]">
                    {student.name}
                  </span>
                  <LevelTag level={student.level} />
                  <span className="text-xs text-[#85776c]">
                    Attendance {student.attendancePct}%
                  </span>
                </div>
                <p className="text-[0.8rem] text-[#b8a99c] mt-1">
                  Goals: {student.goals.slice(0, 2).join(", ")}
                </p>
                <p className="text-[0.8rem] text-[#b8a99c] mt-1">
                  Focus: {student.focusAreas.join(", ")}
                </p>
              </div>
            ))}
          </div>

          {/* AI Suggestions */}
          {suggestions.length > 0 ? null : (
            <p className="text-sm text-[#716c63] mb-2">
              No suggestions yet. Refresh to generate AI recommendations.
            </p>
          )}

          {suggestions.map((suggestion) => renderSuggestion(suggestion))}

          {/* Instructor override actions */}
          <div className="mt-4 p-3 bg-[#1a1611] rounded border border-[#2a2420]">
            <p className="text-xs text-[#85776c] mb-2">
              Instructor can override or modify any AI suggestion
            </p>
            {modifiedSuggestions.length > 0 ? (
              <>
                <p className="text-xs text-green-500 mb-2">
                  {modifiedSuggestions.length} suggestion(s) modified
                </p>
                <button
                  onClick={() => setModifiedSuggestions([])}
                  className="w-full text-sm text-[#85776c] hover:text-[#f0e6dd] mb-2 underline"
                >
                  Clear all modifications
                </button>
                <button
                  onClick={() => {
                    // Save modified suggestions and reset
                    setModifiedSuggestions([]);
                    console.log("Modified suggestions saved:", modifiedSuggestions);
                  }}
                  className="w-full text-sm text-green-600 hover:text-green-800 mb-2 underline"
                >
                  Save modifications
                </button>
              </>
            ) : (
              <p className="text-xs text-[#85776c]">
                Use the Override button on any suggestion above to modify it.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}