"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { loadDashboardData, type DashData } from "@/lib/data";
import { Avatar, cnAlt } from "@/components/dash/ui";
import { AccountView } from "@/components/dash/shared-views";
import {
  AdminDashboardView,
  AdminInstructorsView,
  AdminPackagesView,
  AdminReportsView,
  AdminSettingsView,
} from "@/components/dash/admin-views";
import {
  InstructorAttendanceView,
  InstructorClassesView,
  InstructorDashboardView,
  InstructorDemoView,
  InstructorInsightsView,
  InstructorStudentsView,
} from "@/components/dash/instructor-views";
import {
  StudentBookView,
  StudentDashboardView,
  StudentPackagesView,
  StudentScheduleView,
} from "@/components/dash/student-views";
import type { Role } from "@/lib/types";

const NAV: Record<Role, Array<{ id: string; label: string }>> = {
  admin: [
    { id: "dashboard", label: "Dashboard" },
    { id: "settings", label: "Studio Settings" },
    { id: "instructors", label: "Instructors" },
    { id: "packages", label: "Payments & Packages" },
    { id: "reports", label: "Reports" },
  ],
  instructor: [
    { id: "dashboard", label: "Dashboard" },
    { id: "classes", label: "Classes" },
    { id: "attendance", label: "Attendance" },
    { id: "students", label: "Students" },
    { id: "demos", label: "Demo Sessions" },
    { id: "insights", label: "Insights" },
  ],
  student: [
    { id: "dashboard", label: "Dashboard" },
    { id: "book", label: "Book a Class" },
    { id: "schedule", label: "My Schedule" },
    { id: "packages", label: "Packages" },
  ],
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState("dashboard");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await loadDashboardData(supabase);
        if (cancelled) return;
        setData(d);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        if (/auth|logged|session/i.test(msg)) {
          router.replace("/login");
          return;
        }
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const role: Role | null = data?.profile.role ?? null;
  const nav = role ? NAV[role] : [];

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  const view = useMemo(() => {
    if (!data) return null;
    switch (active) {
      case "dashboard":
        return role === "admin" ? (
          <AdminDashboardView data={data} />
        ) : role === "instructor" ? (
          <InstructorDashboardView
            data={data}
            instructorId={
              data.instructors.find((i) => i.profile_user_id === data.profile.id)?.id ??
              data.instructors[0]?.id ??
              ""
            }
          />
        ) : (
          <StudentDashboardView data={data} />
        );
      case "settings":
        return <AdminSettingsView data={data} />;
      case "instructors":
        return <AdminInstructorsView data={data} supabase={supabase} />;
      case "packages":
        return role === "admin" ? (
          <AdminPackagesView data={data} />
        ) : (
          <StudentPackagesView data={data} />
        );
      case "reports":
        return <AdminReportsView data={data} />;
      case "classes":
        return <InstructorClassesView data={data} supabase={supabase} />;
      case "attendance":
        return <InstructorAttendanceView data={data} supabase={supabase} />;
      case "students":
        return <InstructorStudentsView data={data} />;
      case "demos":
        return <InstructorDemoView data={data} supabase={supabase} />;
      case "insights":
        return <InstructorInsightsView data={data} />;
      case "book":
        return <StudentBookView data={data} supabase={supabase} />;
      case "schedule":
        return <StudentScheduleView data={data} />;
      case "account":
        return <AccountView data={data} supabase={supabase} />;
      default:
        return <StudentDashboardView data={data} />;
    }
  }, [data, active, role, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa]">
        <div className="text-center">
          <div className="spinner mx-auto" />
          <p className="mt-4 text-sm text-[#8a8f9d]">Loading your studio…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa]">
        <div className="max-w-sm w-full mx-4 card text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="text-sm text-[#b91c1c]">{error}</p>
          <button className="btn btn-primary mt-4" onClick={signOut}>
            Back to login
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <header className="topbar">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#c4b5fd] flex items-center justify-center text-base">
              🧘
            </span>
            <div className="leading-tight">
              <div className="font-extrabold text-[#1a1a2e]">
                {data.settings?.data.studioName ?? "Pilates"} Studio
              </div>
              <div className="text-xs text-[#8a8f9d] capitalize">{role} dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-sm font-semibold text-[#1a1a2e]">
                {data.profile.display_name}
              </div>
              <div className="text-xs text-[#8a8f9d]">{data.profile.email}</div>
            </div>
            <Avatar name={data.profile.display_name} src={data.profile.avatar_url} />
            <button className="btn btn-outline !min-h-9 !px-3 !py-1.5 !text-xs" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <nav className="mx-auto max-w-7xl px-4 flex gap-1 overflow-x-auto py-3">
        {[...nav, { id: "account", label: "My Account" }].map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={cnAlt(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active === item.id
                ? "bg-[#7c3aed] text-white"
                : "text-[#5b5f6b] hover:bg-white hover:text-[#1a1a2e]",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="mx-auto max-w-7xl px-4 pb-12">{view}</main>
    </div>
  );
}
