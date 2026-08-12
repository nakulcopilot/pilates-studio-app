"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashData } from "@/lib/data";
import { Badge, ClassTypeTag, EmptyState, SectionTitle, StatCard } from "./ui";
import { formatCurrency, formatDate, getGreeting, timeLabel } from "@/lib/utils";
import {
  IconCalendar,
  IconCheckSquare,
  IconMilestone,
  IconStar,
} from "@/components/icons";

export function StudentDashboardView({ data }: { data: DashData }) {
  const profile = data.profile;
  const student =
    data.students.find((s) => s.profile_user_id === profile.id) ?? null;
  const greeting = getGreeting();

  if (!student) {
    return <EmptyState message="No student profile linked to this account yet." />;
  }

  const mine = data.classes
    .filter((c) => c.enrolled.includes(student.id))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const today = new Date().toISOString().split("T")[0];
  const upcoming = mine.filter((c) => c.date >= today && c.status === "active");
  const past = mine.filter((c) => c.date < today);

  const attRows = data.attendance.filter((a) => a.student_id === student.id);
  const present = attRows.filter((a) => a.status !== "absent").length;
  const pct = attRows.length === 0 ? 0 : Math.round((present / attRows.length) * 100);

  const myNotes = data.studentNotes.filter((n) => n.student_id === student.id);
  const myMilestones = data.milestones.filter((m) => m.student_id === student.id);
  const myInjuries = data.injuries.filter((i) => i.student_id === student.id);

  return (
    <div className="space-y-6">
      <SectionTitle>
        {greeting}, {student.name.split(" ")[0]}
      </SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Level" value={student.level} icon={<IconMilestone />} accent="#8f3153" />
        <StatCard label="Upcoming classes" value={upcoming.length} icon={<IconCalendar />} accent="#2e7d5b" />
        <StatCard label="Attendance" value={`${pct}%`} icon={<IconCheckSquare />} accent="#3b5f9e" />
        <StatCard label="Milestones" value={myMilestones.length} icon={<IconStar />} accent="#b58a63" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <SectionTitle>My schedule</SectionTitle>
          {upcoming.length === 0 ? (
            <EmptyState message="No upcoming classes. Book one from the Book tab." />
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {upcoming.slice(0, 8).map((c) => {
                const inst = data.instructors.find((i) => i.id === c.instructor);
                return (
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
                        {c.duration} min · {inst?.name ?? "Unassigned"}
                      </div>
                    </div>
                    <Badge tone={c.status === "active" ? "green" : "neutral"}>
                      {c.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <SectionTitle>Progress</SectionTitle>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                <span>Attendance ({past.length} classes)</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>
            </div>
            {Object.entries(student.level_progress ?? {}).map(([lv, n]) => (
              <div key={lv}>
                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                  <span className="capitalize">{lv}</span>
                  <span>{n}</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (Number(n) / 20) * 100)}%`,
                      background: "#7c3aed",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {myNotes.length > 0 && (
            <div className="mt-5">
              <div className="text-xs font-bold uppercase text-gray-400 mb-2">
                Notes from your instructor
              </div>
              <div className="space-y-2">
                {myNotes.slice(0, 4).map((n) => (
                  <div key={n.id} className="rounded-lg bg-[#faf7ff] px-3 py-2 text-sm">
                    {n.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {myInjuries.length > 0 && (
        <div className="card">
          <SectionTitle>Injury care plan</SectionTitle>
          <div className="space-y-2">
            {myInjuries.map((i) => (
              <div
                key={i.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2"
              >
                <span className="text-lg">🩹</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#1a1a2e]">{i.injury}</div>
                  {i.notes && <div className="text-xs text-gray-500">{i.notes}</div>}
                </div>
                <Badge tone={i.status === "active" ? "amber" : "green"}>{i.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function StudentBookView({
  data,
  supabase,
}: {
  data: DashData;
  supabase: SupabaseClient;
}) {
  const student = data.students.find((s) => s.profile_user_id === data.profile.id);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const open = data.classes
    .filter((c) => c.date >= today && c.status === "active")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const book = async (classId: string) => {
    if (!student) return;
    setBusyId(classId);
    setMessage(null);
    const { data: res, error } = await supabase.rpc("enroll_in_class", {
      p_class_id: classId,
      p_student_id: student.id,
    });
    setBusyId("");
    if (error) {
      setMessage({ tone: "err", text: error.message });
      return;
    }
    const map: Record<string, string> = {
      enrolled: "✓ You are enrolled!",
      already_enrolled: "Already enrolled in this class.",
      full: "Class is full.",
      overlap: "This overlaps with a class you are already in.",
      not_active: "Class is no longer active.",
      forbidden: "You do not have permission.",
    };
    setMessage({
      tone: res === "enrolled" ? "ok" : "err",
      text: map[res as string] ?? `Unexpected response: ${res}`,
    });
    if (res === "enrolled") setTimeout(() => window.location.reload(), 900);
  };

  const myIds = new Set(student?.enrolled_classes ?? []);
  const demoIds = new Set(student?.enrolled_demos ?? []);

  return (
    <div className="space-y-6">
      <SectionTitle>Book a Class</SectionTitle>
      {!student && <EmptyState message="No student profile linked to this account." />}
      {message && (
        <div
          className={`text-sm px-3 py-2 rounded-lg ${
            message.tone === "ok" ? "bg-[#ecfdf5] text-[#047857]" : "bg-[#fef2f2] text-[#b91c1c]"
          }`}
        >
          {message.text}
        </div>
      )}
      {student && open.length === 0 && <EmptyState message="No open classes available right now." />}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Type</th>
              <th>Date / Time</th>
              <th>Instructor</th>
              <th>Seats</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {student &&
              open.map((c) => {
                const inst = data.instructors.find((i) => i.id === c.instructor);
                const enrolled = myIds.has(c.id);
                const full = c.enrolled.length >= c.max_students;
                return (
                  <tr key={c.id}>
                    <td className="font-semibold">{c.id}</td>
                    <td>
                      <ClassTypeTag type={c.type} />
                    </td>
                    <td className="text-sm">
                      {formatDate(c.date)} · {timeLabel(c.time)}
                    </td>
                    <td className="text-sm">{inst?.name ?? "Unassigned"}</td>
                    <td className="text-sm">
                      {c.enrolled.length}/{c.max_students}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary !min-h-8 !px-4 !py-1.5 !text-xs"
                        disabled={enrolled || full || busyId === c.id}
                        onClick={() => book(c.id)}
                      >
                        {busyId === c.id
                          ? "Booking…"
                          : enrolled
                            ? "Booked"
                            : full
                              ? "Full"
                              : "Book"}
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {student && demoIds.size < (data.settings?.data.demoSessions ?? 1) && data.demos.length > 0 && (
        <div className="card">
          <SectionTitle>Free demo sessions</SectionTitle>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Date / Time</th>
                  <th>Seats</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.demos
                  .filter((d) => d.date >= today && !demoIds.has(d.id))
                  .map((d) => (
                    <tr key={d.id}>
                      <td className="font-semibold">{d.id}</td>
                      <td className="text-sm">
                        {formatDate(d.date)} · {timeLabel(d.time)}
                      </td>
                      <td className="text-sm">
                        {d.enrolled.length}/{d.max_students}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline !min-h-8 !px-4 !py-1.5 !text-xs"
                          disabled={busyId === d.id || d.enrolled.length >= d.max_students}
                          onClick={async () => {
                            setBusyId(d.id);
                            const { data: res } = await supabase.rpc("enroll_in_demo", {
                              p_demo_id: d.id,
                              p_student_id: student.id,
                            });
                            setBusyId("");
                            setMessage(
                              res === "enrolled"
                                ? { tone: "ok", text: "✓ Demo booked!" }
                                : { tone: "err", text: String(res) },
                            );
                            if (res === "enrolled") setTimeout(() => window.location.reload(), 900);
                          }}
                        >
                          {busyId === d.id ? "Booking…" : "Book demo"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function StudentScheduleView({ data }: { data: DashData }) {
  const student = data.students.find((s) => s.profile_user_id === data.profile.id);
  if (!student) return <EmptyState message="No student profile linked to this account." />;
  const mine = data.classes
    .filter((c) => c.enrolled.includes(student.id))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const today = new Date().toISOString().split("T")[0];
  const upcoming = mine.filter((c) => c.date >= today);
  const past = mine.filter((c) => c.date < today);

  const render = (label: string, list: DashData["classes"]) => (
    <div className="card">
      <SectionTitle>{label}</SectionTitle>
      {list.length === 0 ? (
        <EmptyState message="Nothing here yet." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Type</th>
                <th>Date / Time</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold">{c.id}</td>
                  <td>
                    <ClassTypeTag type={c.type} />
                  </td>
                  <td className="text-sm">
                    {formatDate(c.date)} · {timeLabel(c.time)}
                  </td>
                  <td className="text-sm">{c.duration} min</td>
                  <td>
                    <Badge tone={c.status === "active" ? "green" : "neutral"}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionTitle>My Schedule</SectionTitle>
      {render("Upcoming", upcoming)}
      {render("Past", past.slice(0, 20))}
    </div>
  );
}

export function StudentPackagesView({ data }: { data: DashData }) {
  const packages = data.settings?.data.packages ?? [];
  const currency = data.settings?.data.currency ?? "INR";
  return (
    <div className="space-y-6">
      <SectionTitle>Packages</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {packages.map((p, i) => (
          <div
            key={p.id}
            className={`card text-center ${i === 1 ? "ring-2 ring-[#7c3aed]" : ""}`}
          >
            {i === 1 && (
              <div className="inline-block text-[0.65rem] font-bold uppercase tracking-wide text-white bg-[#7c3aed] rounded-full px-3 py-0.5 mb-2">
                Popular
              </div>
            )}
            <div className="text-sm font-bold text-[#1a1a2e]">{p.name}</div>
            <div className="text-3xl font-extrabold text-[#1a1a2e] mt-2">
              {formatCurrency(p.price, currency)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {p.classes === 999 ? "Unlimited classes" : `${p.classes} classes`}
            </div>
            <button className="btn btn-primary w-full mt-4" disabled>
              Contact studio
            </button>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400">
        Packages are configured by the studio admin in <code>studio_settings</code>.
      </div>
    </div>
  );
}
