"use client";

import { useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashData } from "@/lib/data";
import type { AttendanceStatus, StudioClass } from "@/lib/types";
import {
  Avatar,
  Badge,
  ClassTypeTag,
  EmptyState,
  LevelTag,
  SectionTitle,
  StatCard,
} from "./ui";
import { formatDate, timeLabel } from "@/lib/utils";
import {
  IconCalendar,
  IconCheckSquare,
  IconClock,
  IconUsers,
} from "@/components/icons";

export function InstructorDashboardView({
  data,
  instructorId,
}: {
  data: DashData;
  instructorId: string;
}) {
  const mine = data.classes.filter((c) => c.instructor === instructorId);
  const active = mine.filter((c) => c.status === "active");
  const rosterIds = new Set<string>();
  active.forEach((c) => c.enrolled.forEach((s) => rosterIds.add(s)));
  const today = new Date().toISOString().split("T")[0];
  const todays = mine.filter((c) => c.date === today && c.status === "active");

  return (
    <div className="space-y-6">
      <SectionTitle>Instructor Overview</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My classes" value={active.length} icon={<IconCalendar />} accent="#8f3153" />
        <StatCard label="Classes today" value={todays.length} icon={<IconClock />} accent="#2e7d5b" />
        <StatCard label="My students" value={rosterIds.size} icon={<IconUsers />} accent="#3b5f9e" />
        <StatCard label="Attendance rows" value={data.attendance.length} icon={<IconCheckSquare />} accent="#b58a63" />
      </div>

      <div className="card">
        <SectionTitle>My upcoming classes</SectionTitle>
        {mine.filter((c) => c.date >= today && c.status === "active").length === 0 ? (
          <EmptyState message="No upcoming classes assigned to you." />
        ) : (
          <div className="space-y-2">
            {mine
              .filter((c) => c.date >= today && c.status === "active")
              .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
              .slice(0, 10)
              .map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2"
                >
                  <ClassTypeTag type={c.type} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[#1a1a2e]">
                      {formatDate(c.date)} · {timeLabel(c.time)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {c.duration} min · {c.enrolled.length}/{c.max_students} enrolled
                    </div>
                  </div>
                  <LevelTag level={c.level} />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function InstructorClassesView({
  data,
  supabase,
}: {
  data: DashData;
  supabase: SupabaseClient;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    type: "mat",
    level: "beginner",
    date: today,
    time: "07:00",
    duration: "60",
    max_students: "15",
    instructor: "neelamr",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const id = `c${Date.now().toString().slice(-8)}`;
    const row: Omit<StudioClass, "created_at" | "updated_at"> = {
      id,
      type: form.type as "mat" | "reformer",
      level: form.level as "beginner" | "intermediate" | "expert",
      date: form.date,
      time: form.time,
      duration: Number(form.duration),
      max_students: Number(form.max_students),
      status: "active",
      instructor: form.instructor,
      enrolled: [],
      waitlist: [],
    };
    const { error } = await supabase.from("classes").insert(row);
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => {
        setShowCreate(false);
        setSaved(false);
        window.location.reload();
      }, 800);
    }
  };

  const sorted = [...data.classes].sort((a, b) =>
    (b.date + b.time).localeCompare(a.date + a.time),
  );

  return (
    <div className="space-y-6">
      <SectionTitle
        right={
          <button className="btn btn-primary" onClick={() => setShowCreate((s) => !s)}>
            {showCreate ? "Cancel" : "+ New class"}
          </button>
        }
      >
        Classes
      </SectionTitle>

      {showCreate && (
        <form className="card grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" onSubmit={createClass}>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
            Type
            <select
              className="select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="mat">Mat</option>
              <option value="reformer">Reformer</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
            Level
            <select
              className="select"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
            Date
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
            Time
            <input
              className="input"
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
            Duration
            <input
              className="input"
              type="number"
              min={30}
              max={120}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
            Capacity
            <input
              className="input"
              type="number"
              min={1}
              value={form.max_students}
              onChange={(e) => setForm({ ...form, max_students: e.target.value })}
            />
          </label>
          <div className="col-span-full flex items-center gap-3">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create class"}
            </button>
            {saved && <span className="text-sm text-green-600">✓ Class created</span>}
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Type</th>
              <th>Level</th>
              <th>Date / Time</th>
              <th>Duration</th>
              <th>Roster</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const inst = data.instructors.find((i) => i.id === c.instructor);
              return (
                <tr key={c.id}>
                  <td className="font-semibold">{c.id}</td>
                  <td>
                    <ClassTypeTag type={c.type} />
                  </td>
                  <td>
                    <LevelTag level={c.level} />
                  </td>
                  <td className="text-sm">
                    {formatDate(c.date)} · {timeLabel(c.time)}
                  </td>
                  <td className="text-sm">{c.duration} min</td>
                  <td className="text-sm">
                    {c.enrolled.length}/{c.max_students}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Badge tone={c.status === "active" ? "green" : c.status === "cancelled" ? "red" : "neutral"}>
                        {c.status}
                      </Badge>
                      <span className="text-xs text-gray-400">{inst?.name ?? "—"}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function InstructorAttendanceView({
  data,
  supabase,
}: {
  data: DashData;
  supabase: SupabaseClient;
}) {
  const [classId, setClassId] = useState("");
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const classes = [...data.classes].sort((a, b) =>
    (b.date + b.time).localeCompare(a.date + a.time),
  );

  const selected = classes.find((c) => c.id === classId);
  const studentMap = useMemo(
    () => new Map(data.students.map((s) => [s.id, s])),
    [data.students],
  );

  const selectClass = (id: string) => {
    setClassId(id);
    const c = classes.find((x) => x.id === id);
    const next: Record<string, AttendanceStatus> = {};
    if (c) {
      c.enrolled.forEach((sid) => {
        const existing = data.attendance.find(
          (a) => a.class_id === id && a.student_id === sid,
        );
        next[sid] = existing?.status ?? "present";
      });
    }
    setMarks(next);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const rows = Object.entries(marks).map(([student_id, status]) => ({
      class_id: selected.id,
      student_id,
      status,
    }));
    if (rows.length === 0) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("attendance").upsert(rows);
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle>Attendance</SectionTitle>
      <div className="card">
        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500 max-w-md">
          Select a class
          <select
            className="select"
            value={classId}
            onChange={(e) => selectClass(e.target.value)}
          >
            <option value="">Choose class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {formatDate(c.date)} {timeLabel(c.time)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selected && (
        <div className="card space-y-4">
          <SectionTitle
            right={
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save attendance"}
              </button>
            }
          >
            {selected.id} — {formatDate(selected.date)} {timeLabel(selected.time)}
          </SectionTitle>
          {saved && <div className="text-sm text-green-600">✓ Saved</div>}
          {selected.enrolled.length === 0 ? (
            <EmptyState message="No students enrolled in this class." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.enrolled.map((sid) => {
                    const st = studentMap.get(sid);
                    return (
                      <tr key={sid}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar name={st?.name ?? sid} src={null} size={32} />
                            <div>
                              <div className="font-semibold">{st?.name ?? sid}</div>
                              <div className="text-xs text-gray-500 capitalize">
                                {st?.level ?? ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {(["present", "late", "absent"] as AttendanceStatus[]).map(
                              (s) => (
                                <button
                                  key={s}
                                  type="button"
                                  className={`btn !min-h-8 !px-3 !py-1 !text-xs ${
                                    marks[sid] === s ? "btn-primary" : "btn-outline"
                                  }`}
                                  onClick={() =>
                                    setMarks((m) => ({ ...m, [sid]: s }))
                                  }
                                >
                                  {s}
                                </button>
                              ),
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function InstructorStudentsView({ data }: { data: DashData }) {
  return (
    <div className="space-y-6">
      <SectionTitle>Students</SectionTitle>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Level</th>
              <th>Classes</th>
              <th>Demos</th>
              <th>Notes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((s) => {
              const notes = data.studentNotes.filter((n) => n.student_id === s.id);
              const milestones = data.milestones.filter((m) => m.student_id === s.id);
              return (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size={32} />
                      <div>
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.phone || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <LevelTag level={s.level} />
                  </td>
                  <td className="text-sm">{s.enrolled_classes.length}</td>
                  <td className="text-sm">{s.enrolled_demos.length}</td>
                  <td className="text-sm">
                    {notes.length} notes · {milestones.length} milestones
                  </td>
                  <td>
                    <Badge tone={s.active ? "green" : "neutral"}>
                      {s.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function InstructorDemoView({
  data,
  supabase,
}: {
  data: DashData;
  supabase: SupabaseClient;
}) {
  const [enrollId, setEnrollId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState("");

  const enroll = async (studentId: string) => {
    if (!enrollId) return;
    setEnrolling(true);
    setMessage("");
    const demo = data.demos.find((d) => d.id === enrollId);
    if (!demo) return;
    const { error } = await supabase
      .from("demo_sessions")
      .update({ enrolled: [...demo.enrolled, studentId] })
      .eq("id", demo.id);
    setEnrolling(false);
    if (error) setMessage(`Failed: ${error.message}`);
    else {
      setMessage("✓ Student enrolled in demo session");
      setTimeout(() => window.location.reload(), 900);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle>Demo Sessions</SectionTitle>
      {data.demos.length === 0 ? (
        <EmptyState message="No demo sessions scheduled." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Date / Time</th>
                <th>Duration</th>
                <th>Roster</th>
                <th>Enroll student</th>
              </tr>
            </thead>
            <tbody>
              {data.demos.map((d) => (
                <tr key={d.id}>
                  <td className="font-semibold">{d.id}</td>
                  <td className="text-sm">
                    {formatDate(d.date)} · {timeLabel(d.time)}
                  </td>
                  <td className="text-sm">{d.duration} min</td>
                  <td className="text-sm">
                    {d.enrolled.length}/{d.max_students}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <select
                        className="select !py-1 !text-xs"
                        value={enrollId}
                        onChange={(e) => setEnrollId(e.target.value)}
                      >
                        <option value="">Student…</option>
                        {data.students
                          .filter((s) => s.active && !d.enrolled.includes(s.id))
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                      </select>
                      <button
                        className="btn btn-outline !min-h-8 !px-3 !py-1 !text-xs"
                        disabled={!enrollId || enrolling}
                        onClick={() => enroll(data.students.find((s) => s.id === enrollId)?.id ?? "")}
                      >
                        Add
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {message && <div className="text-sm text-gray-600">{message}</div>}
    </div>
  );
}

export function InstructorInsightsView({ data }: { data: DashData }) {
  const rows = data.students.map((s) => {
    const present = data.attendance.filter(
      (a) => a.student_id === s.id && a.status !== "absent",
    ).length;
    const total = data.attendance.filter((a) => a.student_id === s.id).length;
    const pct = total === 0 ? 0 : Math.round((present / total) * 100);
    return { student: s, present, total, pct };
  });
  return (
    <div className="space-y-6">
      <SectionTitle>Insights</SectionTitle>
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Attendance</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student.id}>
                  <td className="font-semibold">{r.student.name}</td>
                  <td className="text-sm">
                    {r.present}/{r.total}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-28 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${r.pct}%`,
                            background:
                              r.pct >= 80 ? "#16a34a" : r.pct >= 50 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{r.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
