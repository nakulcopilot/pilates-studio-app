"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashData } from "@/lib/data";
import {
  Avatar,
  Badge,
  ClassTypeTag,
  EmptyState,
  LevelTag,
  SectionTitle,
  StatCard,
} from "./ui";
import { formatCurrency, formatDate, timeLabel } from "@/lib/utils";
import {
  IconActivity,
  IconCalendar,
  IconChart,
  IconCheckSquare,
  IconClock,
  IconMilestone,
  IconPencil,
  IconUsers,
} from "@/components/icons";

export function AdminDashboardView({ data }: { data: DashData }) {
  const today = new Date().toISOString().split("T")[0];
  const todaysClasses = data.classes.filter(
    (c) => c.date === today && c.status === "active",
  );
  const activeStudents = data.students.filter((s) => s.active).length;
  const activeInstructors = data.instructors.filter((i) => i.active).length;
  const totalEnrollments = data.classes.reduce(
    (sum, c) => sum + c.enrolled.length,
    0,
  );

  return (
    <div className="space-y-6">
      <SectionTitle>Studio Overview</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Students" value={activeStudents} icon={<IconUsers />} accent="#8f3153" />
        <StatCard label="Instructors" value={activeInstructors} icon={<IconActivity />} accent="#3b5f9e" />
        <StatCard label="Classes today" value={todaysClasses.length} icon={<IconCalendar />} accent="#2e7d5b" />
        <StatCard label="Enrollments" value={totalEnrollments} icon={<IconChart />} accent="#b58a63" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <SectionTitle>Upcoming Classes</SectionTitle>
          {data.classes.filter((c) => c.date >= today).length === 0 ? (
            <EmptyState message="No upcoming classes." />
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {data.classes
                .filter((c) => c.date >= today && c.status === "active")
                .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                .slice(0, 10)
                .map((c) => {
                  const inst = data.instructors.find((i) => i.id === c.instructor);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2"
                    >
                      <ClassTypeTag type={c.type} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#1a1a2e] truncate">
                          {formatDate(c.date)} · {timeLabel(c.time)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {inst?.name ?? "Unassigned"} · {c.enrolled.length}/{c.max_students}
                        </div>
                      </div>
                      <LevelTag level={c.level} />
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="card">
          <SectionTitle>Instructor Roster</SectionTitle>
          <div className="space-y-2">
            {data.instructors.map((i) => (
              <div
                key={i.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2"
              >
                <Avatar name={i.name} src={i.photo} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#1a1a2e] truncate">
                    {i.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {i.specialization || "—"}
                  </div>
                </div>
                <Badge tone={i.active ? "green" : "neutral"}>
                  {i.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSettingsView({ data }: { data: DashData }) {
  const s = data.settings?.data;
  if (!s) return <EmptyState message="Studio settings not found." />;
  return (
    <div className="space-y-6">
      <SectionTitle>Studio Settings</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <SectionTitle>Branding</SectionTitle>
          <dl className="grid grid-cols-2 gap-4 m-0 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Studio name</dt>
              <dd className="m-0 mt-1 font-semibold">{s.studioName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Theme</dt>
              <dd className="m-0 mt-1 flex items-center gap-2">
                <span
                  className="inline-block w-4 h-4 rounded-full border border-gray-200"
                  style={{ background: s.colorTheme }}
                />
                {s.colorTheme}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <SectionTitle>Classes</SectionTitle>
          <dl className="grid grid-cols-2 gap-4 m-0 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Class types</dt>
              <dd className="m-0 mt-1">
                {s.classTypes.mat ? "Mat" : ""}
                {s.classTypes.mat && s.classTypes.reformer ? " + " : ""}
                {s.classTypes.reformer ? "Reformer" : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Default duration</dt>
              <dd className="m-0 mt-1">{s.defaultDuration} min</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Demo sessions</dt>
              <dd className="m-0 mt-1">{s.demoSessions} per student</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Instructor</dt>
              <dd className="m-0 mt-1">{s.instructorName}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <SectionTitle>Payments</SectionTitle>
          <dl className="grid grid-cols-2 gap-4 m-0 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Currency</dt>
              <dd className="m-0 mt-1">{s.currency}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Accepted</dt>
              <dd className="m-0 mt-1">
                {["Cash", "UPI", "Card"]
                  .filter((_, idx) => ["cash", "upi", "card"][idx] && Object.values(s.paymentTypes)[idx])
                  .join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <SectionTitle>AI Assistant</SectionTitle>
          <dl className="grid grid-cols-2 gap-4 m-0 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Enabled</dt>
              <dd className="m-0 mt-1">{s.ai.enabled ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Model</dt>
              <dd className="m-0 mt-1">{s.ai.model}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="text-xs text-gray-400">
        Studio configuration is saved automatically and applies to every role
        in your workspace.
      </div>
    </div>
  );
}

export function AdminInstructorsView({
  data,
  supabase,
}: {
  data: DashData;
  supabase: SupabaseClient;
}) {
  const toggle = async (id: string, active: boolean) => {
    await supabase.from("instructors").update({ active }).eq("id", id);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <SectionTitle>Instructors</SectionTitle>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Instructor</th>
              <th>Specialization</th>
              <th>Experience</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Login</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.instructors.map((i) => (
              <tr key={i.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar name={i.name} src={i.photo} size={34} />
                    <div>
                      <div className="font-semibold">{i.name}</div>
                      <div className="text-xs text-gray-500">{i.email || "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="text-sm">{i.specialization || "—"}</td>
                <td className="text-sm">{i.experience} yrs</td>
                <td className="text-sm">★ {Number(i.rating).toFixed(1)}</td>
                <td>
                  <Badge tone={i.active ? "green" : "neutral"}>
                    {i.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="text-xs">
                  {i.login_id ? (
                    <code>{i.login_id}</code>
                  ) : (
                    <span className="text-gray-400">roster only</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-outline !min-h-8 !px-3 !py-1 !text-xs"
                    onClick={() => toggle(i.id, !i.active)}
                  >
                    {i.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminPackagesView({ data }: { data: DashData }) {
  const packages = data.settings?.data.packages ?? [];
  return (
    <div className="space-y-6">
      <SectionTitle>Payments &amp; Packages</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {packages.map((p) => (
          <div key={p.id} className="card text-center">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
              {p.name}
            </div>
            <div className="text-2xl font-extrabold text-[#1a1a2e] mt-2">
              {formatCurrency(p.price, data.settings?.data.currency)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {p.classes === 999 ? "Unlimited classes" : `${p.classes} classes`}
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <SectionTitle>Accepted payment types</SectionTitle>
        <div className="flex gap-2">
          {data.settings?.data.paymentTypes.cash && <Badge tone="green">Cash</Badge>}
          {data.settings?.data.paymentTypes.upi && <Badge tone="blue">UPI</Badge>}
          {data.settings?.data.paymentTypes.card && <Badge tone="amber">Card</Badge>}
        </div>
      </div>
    </div>
  );
}

export function AdminReportsView({ data }: { data: DashData }) {
  const today = new Date().toISOString().split("T")[0];
  const past = data.classes.filter((c) => c.date < today);
  const attendanceMap = new Map<string, Map<string, number>>();
  past.forEach((c) => {
    const rows = data.attendance.filter((a) => a.class_id === c.id);
    const present = rows.filter((a) => a.status !== "absent").length;
    attendanceMap.set(c.id, new Map([["present", present], ["enrolled", c.enrolled.length]]));
  });

  return (
    <div className="space-y-6">
      <SectionTitle>Reports</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Classes held" value={past.length} icon={<IconClock />} accent="#8f3153" />
        <StatCard label="Attendance rows" value={data.attendance.length} icon={<IconCheckSquare />} accent="#2e7d5b" />
        <StatCard label="Class notes" value={data.classNotes.length} icon={<IconPencil />} accent="#3b5f9e" />
        <StatCard label="Milestones" value={data.milestones.length} icon={<IconMilestone />} accent="#b58a63" />
      </div>

      <div className="card">
        <SectionTitle>Class attendance summary</SectionTitle>
        {past.length === 0 ? (
          <EmptyState message="No completed classes yet." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Enrolled</th>
                  <th>Present</th>
                </tr>
              </thead>
              <tbody>
                {past.slice(0, 15).map((c) => {
                  const rec = attendanceMap.get(c.id);
                  return (
                    <tr key={c.id}>
                      <td className="font-semibold">{c.id}</td>
                      <td className="text-sm">{formatDate(c.date)}</td>
                      <td>
                        <ClassTypeTag type={c.type} />
                      </td>
                      <td className="text-sm">{rec?.get("enrolled") ?? c.enrolled.length}</td>
                      <td className="text-sm">{rec?.get("present") ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
