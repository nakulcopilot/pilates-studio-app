"use client";

import { useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashData } from "@/lib/data";
import type { Instructor, StudioSettings } from "@/lib/types";
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
  IconActivity,
  IconCalendar,
  IconChart,
  IconCheckSquare,
  IconClock,
  IconMilestone,
  IconPencil,
  IconPlus,
  IconSparkles,
  IconTrash,
  IconUsers,
} from "@/components/icons";

type SettingsData = StudioSettings["data"];

function normSettingsData(s: StudioSettings | null): SettingsData {
  const d = s?.data ?? ({} as SettingsData);
  return {
    studioName: d.studioName ?? "",
    logoData: d.logoData ?? null,
    colorTheme: d.colorTheme ?? "#7c3aed",
    numInstructors: d.numInstructors ?? 0,
    classTypes: {
      mat: d.classTypes?.mat ?? true,
      reformer: d.classTypes?.reformer ?? true,
    },
    defaultDuration: d.defaultDuration ?? 60,
    timeSlots: d.timeSlots ?? [],
    paymentTypes: {
      cash: d.paymentTypes?.cash ?? true,
      upi: d.paymentTypes?.upi ?? true,
      card: d.paymentTypes?.card ?? false,
    },
    currency: d.currency ?? "INR",
    packages: d.packages ?? [],
    demoSessions: d.demoSessions ?? 1,
    instructorName: d.instructorName ?? "",
    instructorSpecialization: d.instructorSpecialization ?? "",
    instructorPhoto: d.instructorPhoto ?? null,
    sidebarBg: d.sidebarBg ?? "#1a1a2e",
    sidebarText: d.sidebarText ?? "#9ca3af",
    sidebarActiveBg: d.sidebarActiveBg ?? "",
    sidebarActiveText: d.sidebarActiveText ?? "",
    sidebarHoverBg: d.sidebarHoverBg ?? "",
    sidebarBannerData: d.sidebarBannerData ?? null,
    sidebarBannerText: d.sidebarBannerText ?? "",
    ai: {
      enabled: d.ai?.enabled ?? false,
      baseUrl: d.ai?.baseUrl ?? "",
      apiKey: d.ai?.apiKey ?? "",
      model: d.ai?.model ?? "gpt-4o-mini",
      temperature: d.ai?.temperature ?? 0.4,
    },
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-[#b8a99c]">
      {label}
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#e5ddd4] cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[#c9975a] h-4 w-4"
      />
      {label}
    </label>
  );
}

function SaveBar({
  saving,
  msg,
  onSave,
}: {
  saving: boolean;
  msg: { tone: "ok" | "err"; text: string } | null;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button className="btn btn-primary" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
      {msg && (
        <span
          className={`text-sm ${msg.tone === "ok" ? "text-green-400" : "text-red-400"}`}
        >
          {msg.text}
        </span>
      )}
    </div>
  );
}

function PackagesEditor({
  packages,
  onChange,
}: {
  packages: SettingsData["packages"];
  onChange: (p: SettingsData["packages"]) => void;
}) {
  const upd = (i: number, patch: Partial<SettingsData["packages"][number]>) =>
    onChange(packages.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <div className="space-y-3">
      {packages.length === 0 && (
        <div className="text-sm text-[#b8a99c]">No packages yet.</div>
      )}
      {packages.map((p, i) => (
        <div
          key={p.id}
          className="grid grid-cols-1 sm:grid-cols-[1fr_7rem_8rem_auto] gap-2 items-end"
        >
          <Field label="Name">
            <input
              className="input"
              value={p.name}
              onChange={(e) => upd(i, { name: e.target.value })}
            />
          </Field>
          <Field label="Classes">
            <input
              className="input"
              type="number"
              min={1}
              value={p.classes}
              onChange={(e) => upd(i, { classes: Number(e.target.value) || 1 })}
            />
          </Field>
          <Field label="Price">
            <input
              className="input"
              type="number"
              min={0}
              value={p.price}
              onChange={(e) => upd(i, { price: Number(e.target.value) || 0 })}
            />
          </Field>
          <button
            type="button"
            className="btn btn-danger !min-h-9 !px-3"
            onClick={() => onChange(packages.filter((_, j) => j !== i))}
            title="Remove package"
          >
            <IconTrash size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-outline !text-xs"
        onClick={() =>
          onChange([
            ...packages,
            {
              id: `p${Date.now().toString().slice(-6)}`,
              name: "New package",
              classes: 4,
              price: 1999,
            },
          ])
        }
      >
        <IconPlus size={14} /> Add package
      </button>
    </div>
  );
}

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
        <StatCard label="Students" value={activeStudents} icon={<IconUsers />} accent="#c9975a" />
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
                      className="flex items-center gap-3 rounded-lg border border-[#2a2420] px-3 py-2"
                    >
                      <ClassTypeTag type={c.type} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#1a1a2e] truncate">
                          {formatDate(c.date)} · {timeLabel(c.time)}
                        </div>
                        <div className="text-xs text-[#b8a99c]">
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
                className="flex items-center gap-3 rounded-lg border border-[#2a2420] px-3 py-2"
              >
                <Avatar name={i.name} src={i.photo} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#1a1a2e] truncate">
                    {i.name}
                  </div>
                  <div className="text-xs text-[#b8a99c] truncate">
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

export function AdminSettingsView({
  data,
  supabase,
}: {
  data: DashData;
  supabase: SupabaseClient;
}) {
  const [form, setForm] = useState<SettingsData>(() => normSettingsData(data.settings));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const upd = (patch: Partial<SettingsData>) =>
    setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.studioName.trim()) {
      setMsg({ tone: "err", text: "Studio name is required." });
      return;
    }
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("studio_settings")
      .update({ data: form })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      setMsg({ tone: "err", text: error.message });
      return;
    }
    setMsg({ tone: "ok", text: "Settings saved ✓" });
    setTimeout(() => window.location.reload(), 900);
  };

  return (
    <div className="space-y-6">
      <SectionTitle right={<SaveBar saving={saving} msg={msg} onSave={save} />}>
        Studio Settings
      </SectionTitle>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-4">
          <SectionTitle>Branding</SectionTitle>
          <Field label="Studio name">
            <input
              className="input"
              value={form.studioName}
              onChange={(e) => upd({ studioName: e.target.value })}
            />
          </Field>
          <Field label="Theme color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.colorTheme}
                onChange={(e) => upd({ colorTheme: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded border border-[#2a2420] bg-transparent"
              />
              <input
                className="input"
                value={form.colorTheme}
                onChange={(e) => upd({ colorTheme: e.target.value })}
              />
            </div>
          </Field>
          <Field label="Owner / lead instructor name">
            <input
              className="input"
              value={form.instructorName}
              onChange={(e) => upd({ instructorName: e.target.value })}
            />
          </Field>
        </div>

        <div className="card space-y-4">
          <SectionTitle>Classes</SectionTitle>
          <div className="flex flex-wrap gap-4">
            <Toggle
              label="Mat"
              checked={form.classTypes.mat}
              onChange={(v) =>
                upd({ classTypes: { ...form.classTypes, mat: v } })
              }
            />
            <Toggle
              label="Reformer"
              checked={form.classTypes.reformer}
              onChange={(v) =>
                upd({ classTypes: { ...form.classTypes, reformer: v } })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Default duration (min)">
              <input
                className="input"
                type="number"
                min={15}
                value={form.defaultDuration}
                onChange={(e) =>
                  upd({ defaultDuration: Number(e.target.value) || 60 })
                }
              />
            </Field>
            <Field label="Demo sessions per student">
              <input
                className="input"
                type="number"
                min={0}
                value={form.demoSessions}
                onChange={(e) =>
                  upd({ demoSessions: Number(e.target.value) || 0 })
                }
              />
            </Field>
          </div>
        </div>

        <div className="card space-y-4">
          <SectionTitle>Payments</SectionTitle>
          <Field label="Currency">
            <select
              className="select"
              value={form.currency}
              onChange={(e) => upd({ currency: e.target.value })}
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </Field>
          <div className="flex flex-wrap gap-4">
            <Toggle
              label="Cash"
              checked={form.paymentTypes.cash}
              onChange={(v) =>
                upd({ paymentTypes: { ...form.paymentTypes, cash: v } })
              }
            />
            <Toggle
              label="UPI"
              checked={form.paymentTypes.upi}
              onChange={(v) =>
                upd({ paymentTypes: { ...form.paymentTypes, upi: v } })
              }
            />
            <Toggle
              label="Card"
              checked={form.paymentTypes.card}
              onChange={(v) =>
                upd({ paymentTypes: { ...form.paymentTypes, card: v } })
              }
            />
          </div>
        </div>

        <div className="card space-y-4">
          <SectionTitle>Packages</SectionTitle>
          <PackagesEditor
            packages={form.packages}
            onChange={(packages) => upd({ packages })}
          />
        </div>

        <div className="card space-y-4 lg:col-span-2">
          <SectionTitle>
            <span className="flex items-center gap-2">
              <IconSparkles size={16} className="text-[#c9975a]" /> AI Assistant
            </span>
          </SectionTitle>
          <div className="flex flex-wrap gap-6 items-center">
            <Toggle
              label="Enable AI for instructors"
              checked={form.ai.enabled}
              onChange={(v) => upd({ ai: { ...form.ai, enabled: v } })}
            />
            <Field label="Model">
              <input
                className="input"
                list="ai-models"
                value={form.ai.model}
                onChange={(e) => upd({ ai: { ...form.ai, model: e.target.value } })}
              />
              <datalist id="ai-models">
                <option value="gpt-4o-mini" />
                <option value="gpt-4o" />
                <option value="claude-3-5-sonnet" />
                <option value="llama-3.1-70b" />
                <option value="qwen2.5-72b" />
              </datalist>
            </Field>
            <Field label={`Temperature — ${Number(form.ai.temperature).toFixed(1)}`}>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={form.ai.temperature}
                onChange={(e) =>
                  upd({ ai: { ...form.ai, temperature: Number(e.target.value) } })
                }
                className="accent-[#c9975a]"
              />
            </Field>
          </div>
          <div className="text-xs text-[#85776c]">
            When enabled, instructors can generate pre-class briefs and coaching
            cues. The AI provider key stays in the Edge Function (server-side)
            and is never stored in the database.
          </div>
        </div>
      </div>
    </div>
  );
}

type InstructorForm = {
  id: string;
  name: string;
  specialization: string;
  certification: string;
  experience: string;
  email: string;
  phone: string;
  login_id: string;
  active: boolean;
  editSchedule: boolean;
  editPricing: boolean;
};

function emptyInstructorForm(): InstructorForm {
  return {
    id: "",
    name: "",
    specialization: "",
    certification: "",
    experience: "3",
    email: "",
    phone: "",
    login_id: "",
    active: true,
    editSchedule: true,
    editPricing: false,
  };
}

function instructorToForm(i: Instructor): InstructorForm {
  return {
    id: i.id,
    name: i.name,
    specialization: i.specialization ?? "",
    certification: i.certification ?? "",
    experience: String(i.experience),
    email: i.email ?? "",
    phone: i.phone ?? "",
    login_id: i.login_id ?? "",
    active: i.active,
    editSchedule: i.permissions?.editSchedule ?? true,
    editPricing: i.permissions?.editPricing ?? false,
  };
}

export function AdminInstructorsView({
  data,
  supabase,
}: {
  data: DashData;
  supabase: SupabaseClient;
}) {
  const [editing, setEditing] = useState<InstructorForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const set = (patch: Partial<InstructorForm>) =>
    setEditing((f) => (f ? { ...f, ...patch } : f));

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("instructors").update({ active }).eq("id", id);
    window.location.reload();
  };

  const remove = async (i: Instructor) => {
    if (!window.confirm(`Delete ${i.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("instructors").delete().eq("id", i.id);
    if (error) setMsg({ tone: "err", text: error.message });
    else window.location.reload();
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setMsg({ tone: "err", text: "Name is required." });
      return;
    }
    setSaving(true);
    setMsg(null);
    const row = {
      name: editing.name.trim(),
      specialization: editing.specialization.trim() || null,
      certification: editing.certification.trim() || null,
      experience: Number(editing.experience) || 0,
      email: editing.email.trim() || null,
      phone: editing.phone.trim() || null,
      login_id: editing.login_id.trim() || null,
      active: editing.active,
      permissions: {
        editSchedule: editing.editSchedule,
        editPricing: editing.editPricing,
      },
    };
    const isNew = !data.instructors.some((i) => i.id === editing.id);
    const { error } = isNew
      ? await supabase.from("instructors").insert({
          ...row,
          id: `i${Date.now().toString().slice(-6)}`,
        })
      : await supabase.from("instructors").update(row).eq("id", editing.id);
    setSaving(false);
    if (error) {
      setMsg({ tone: "err", text: error.message });
      return;
    }
    setMsg({ tone: "ok", text: isNew ? "Instructor added ✓" : "Instructor updated ✓" });
    setTimeout(() => window.location.reload(), 900);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        right={
          <button
            className="btn btn-primary"
            onClick={() => setEditing(emptyInstructorForm())}
          >
            <IconPlus size={15} /> Add instructor
          </button>
        }
      >
        Instructors
      </SectionTitle>

      {msg && (
        <div
          className={`text-sm px-3 py-2 rounded-lg ${
            msg.tone === "ok" ? "bg-[#ecfdf5] text-[#047857]" : "bg-[#fef2f2] text-[#b91c1c]"
          }`}
        >
          {msg.text}
        </div>
      )}

      {editing && (
        <form
          className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="col-span-full flex items-center justify-between">
            <span className="text-sm font-bold text-[#f0e6dd]">
              {data.instructors.some((i) => i.id === editing.id)
                ? `Edit — ${editing.name}`
                : "New instructor"}
            </span>
            <button
              type="button"
              className="btn btn-outline !min-h-8 !px-3 !py-1 !text-xs"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>
          <Field label="Full name *">
            <input
              className="input"
              value={editing.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </Field>
          <Field label="Specialization">
            <input
              className="input"
              value={editing.specialization}
              onChange={(e) => set({ specialization: e.target.value })}
            />
          </Field>
          <Field label="Certification">
            <input
              className="input"
              value={editing.certification}
              onChange={(e) => set({ certification: e.target.value })}
            />
          </Field>
          <Field label="Experience (years)">
            <input
              className="input"
              type="number"
              min={0}
              value={editing.experience}
              onChange={(e) => set({ experience: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={editing.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <input
              className="input"
              value={editing.phone}
              onChange={(e) => set({ phone: e.target.value })}
            />
          </Field>
          <Field label="Login id (for auth account)">
            <input
              className="input"
              value={editing.login_id}
              onChange={(e) => set({ login_id: e.target.value })}
              placeholder="e.g. neelamr"
            />
          </Field>
          <div className="flex items-end gap-3 pb-1">
            <Toggle
              label="Active"
              checked={editing.active}
              onChange={(v) => set({ active: v })}
            />
          </div>
          <div className="flex items-end gap-3 pb-1">
            <Toggle
              label="Can edit schedule"
              checked={editing.editSchedule}
              onChange={(v) => set({ editSchedule: v })}
            />
          </div>
          <div className="flex items-end gap-3 pb-1">
            <Toggle
              label="Can edit pricing"
              checked={editing.editPricing}
              onChange={(v) => set({ editPricing: v })}
            />
          </div>
          <div className="col-span-full flex items-center gap-3">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : editing.id ? "Update instructor" : "Add instructor"}
            </button>
            {msg?.tone === "ok" && (
              <span className="text-sm text-green-600">{msg.text}</span>
            )}
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Instructor</th>
              <th>Specialization</th>
              <th>Experience</th>
              <th>Rating</th>
              <th>Permissions</th>
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
                      <div className="text-xs text-[#b8a99c]">{i.email || "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="text-sm">{i.specialization || "—"}</td>
                <td className="text-sm">{i.experience} yrs</td>
                <td className="text-sm">★ {Number(i.rating).toFixed(1)}</td>
                <td className="text-xs">
                  <div className="flex gap-1 flex-wrap">
                    {i.permissions?.editSchedule && <Badge tone="green">Schedule</Badge>}
                    {i.permissions?.editPricing && <Badge tone="amber">Pricing</Badge>}
                    {!i.permissions?.editSchedule && !i.permissions?.editPricing && (
                      <span className="text-[#85776c]">read only</span>
                    )}
                  </div>
                </td>
                <td>
                  <Badge tone={i.active ? "green" : "neutral"}>
                    {i.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="text-xs">
                  {i.login_id ? (
                    <code>{i.login_id}</code>
                  ) : (
                    <span className="text-[#85776c]">roster only</span>
                  )}
                </td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="btn btn-outline !min-h-8 !px-2 !py-1 !text-xs"
                      onClick={() => setEditing(instructorToForm(i))}
                      title="Edit instructor"
                    >
                      <IconPencil size={13} />
                    </button>
                    <button
                      className="btn btn-outline !min-h-8 !px-2 !py-1 !text-xs"
                      onClick={() => toggle(i.id, !i.active)}
                      title={i.active ? "Deactivate" : "Activate"}
                    >
                      {i.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="btn btn-danger !min-h-8 !px-2 !py-1 !text-xs"
                      onClick={() => remove(i)}
                      title="Delete instructor"
                    >
                      <IconTrash size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminPackagesView({
  data,
  supabase,
}: {
  data: DashData;
  supabase: SupabaseClient;
}) {
  const [form, setForm] = useState<SettingsData>(() => normSettingsData(data.settings));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const upd = (patch: Partial<SettingsData>) =>
    setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("studio_settings")
      .update({ data: form })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      setMsg({ tone: "err", text: error.message });
      return;
    }
    setMsg({ tone: "ok", text: "Packages saved ✓" });
    setTimeout(() => window.location.reload(), 900);
  };

  return (
    <div className="space-y-6">
      <SectionTitle right={<SaveBar saving={saving} msg={msg} onSave={save} />}>
        Payments &amp; Packages
      </SectionTitle>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-4">
          <SectionTitle>Packages</SectionTitle>
          <PackagesEditor
            packages={form.packages}
            onChange={(packages) => upd({ packages })}
          />
        </div>

        <div className="card space-y-4">
          <SectionTitle>Payment types</SectionTitle>
          <Field label="Currency">
            <select
              className="select"
              value={form.currency}
              onChange={(e) => upd({ currency: e.target.value })}
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </Field>
          <div className="flex flex-wrap gap-4">
            <Toggle
              label="Cash"
              checked={form.paymentTypes.cash}
              onChange={(v) =>
                upd({ paymentTypes: { ...form.paymentTypes, cash: v } })
              }
            />
            <Toggle
              label="UPI"
              checked={form.paymentTypes.upi}
              onChange={(v) =>
                upd({ paymentTypes: { ...form.paymentTypes, upi: v } })
              }
            />
            <Toggle
              label="Card"
              checked={form.paymentTypes.card}
              onChange={(v) =>
                upd({ paymentTypes: { ...form.paymentTypes, card: v } })
              }
            />
          </div>
          <div className="text-xs text-[#85776c]">
            These settings apply to the student-facing packages page and any
            invoice previews.
          </div>
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
        <StatCard label="Classes held" value={past.length} icon={<IconClock />} accent="#c9975a" />
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
