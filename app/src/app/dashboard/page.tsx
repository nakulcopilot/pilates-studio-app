"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { loadDashboardData, type DashData } from "@/lib/data";
import { Avatar, cnAlt } from "@/components/dash/ui";
import { BRAND_NAME, brandName } from "@/lib/utils";
import {
  IconCalendar,
  IconChart,
  IconCheckSquare,
  IconClock,
  IconDashboard,
  IconLogOut,
  IconReport,
  IconSettings,
  IconUser,
  IconUsers,
  IconWallet,
} from "@/components/icons";
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

type NavItem = { id: string; label: string; Icon: typeof IconDashboard };

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { id: "dashboard", label: "Dashboard", Icon: IconDashboard },
    { id: "settings", label: "Studio Settings", Icon: IconSettings },
    { id: "instructors", label: "Instructors", Icon: IconUsers },
    { id: "packages", label: "Payments & Packages", Icon: IconWallet },
    { id: "reports", label: "Reports", Icon: IconReport },
  ],
  instructor: [
    { id: "dashboard", label: "Dashboard", Icon: IconDashboard },
    { id: "classes", label: "Classes", Icon: IconCalendar },
    { id: "attendance", label: "Attendance", Icon: IconCheckSquare },
    { id: "students", label: "Students", Icon: IconUsers },
    { id: "demos", label: "Demo Sessions", Icon: IconClock },
    { id: "insights", label: "Insights", Icon: IconChart },
  ],
  student: [
    { id: "dashboard", label: "Dashboard", Icon: IconDashboard },
    { id: "book", label: "Book a Class", Icon: IconCalendar },
    { id: "schedule", label: "My Schedule", Icon: IconClock },
    { id: "packages", label: "Packages", Icon: IconWallet },
  ],
};

function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }}>
      <img src="/branding/logo-gold.png" alt="Pilates With Neelam" className="brand-logo-img" />
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState("dashboard");
  const [persona, setPersona] = useState<Role | null>(null);
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Session persistence using sessionStorage
  const SESSION_KEY = "zenpilates_session_v1";

  function saveSession() {
    try {
      const sessionData = {
        persona,
        instructorId: instructorId || null,
        studentId: studentId || null,
        page: active,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {}
  }

  function restoreSession() {
    try {
      const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (!sess || !sess.persona) return;
      const persona = sess.persona;
      setPersona(persona as Role);
      if (persona === "admin") {
        setInstructorId(null);
        setStudentId(null);
        router.replace("/dashboard");
      } else if (persona === "instructor") {
        const instructor = sess.instructorId
          ? data?.instructors?.find((i) => i.id === sess.instructorId) || null
          : null;
        if (instructor) {
          setInstructorId(instructor.id);
          setStudentId(null);
          router.replace("/instructor");
        } else {
          sessionStorage.removeItem(SESSION_KEY);
          supabase.auth.signOut();
          router.replace("/login");
        }
      } else if (persona === "student") {
        const student = sess.studentId
          ? data?.students?.find((s) => s.id === sess.studentId) || null
          : null;
        if (student) {
          setStudentId(student.id);
          setInstructorId(null);
          router.replace("/student");
        } else {
          sessionStorage.removeItem(SESSION_KEY);
          supabase.auth.signOut();
          router.replace("/login");
        }
      }
    } catch (e) {
      sessionStorage.removeItem(SESSION_KEY);
      supabase.auth.signOut();
      router.replace("/login");
    }
  }

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, [data, supabase]);

  // Load dashboard data after session is restored
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const dashData = await loadDashboardData(supabase);
        if (!cancelled) {
          setData(dashData);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load dashboard data:", err.message);
          setError(err.message);
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [supabase]);

  const role: Role | null = data?.profile.role ?? null;
  const nav = role ? NAV[role] : [];
  const studioName = brandName(data?.settings?.data);
  const wordmark =
    studioName === BRAND_NAME ? (
      <>
        <span className="pw">Pilates With</span> <span className="neelam">Neelam</span>
      </>
    ) : (
      studioName
    );

  const signOut = async () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
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
        return <AdminSettingsView data={data} supabase={supabase} />;
      case "instructors":
        return <AdminInstructorsView data={data} supabase={supabase} />;
      case "packages":
        return role === "admin" ? (
          <AdminPackagesView data={data} supabase={supabase} />
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
        return <InstructorInsightsView data={data} supabase={supabase} />;
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <div className="text-center">
          <div className="spinner mx-auto" />
          <p className="mt-4 text-sm text-[#b8a99c]">Loading your studio…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <div className="max-w-sm w-full mx-4 card text-center">
          <div className="text-3xl mb-2">!</div>
          <p className="text-sm text-[#f0a3a3]">{error}</p>
          <button className="btn btn-primary mt-4" onClick={signOut}>
            Back to login
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="dash-shell">
      <header className="dash-topbar">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div className="leading-tight">
            <div className="brand-wordmark text-lg">{wordmark}</div>
            <div className="text-xs text-[#b8a99c] capitalize">{role} dashboard</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right leading-tight">
            <div className="text-sm font-semibold text-[#f0e6dd]">
              {data.profile.display_name}
            </div>
            <div className="text-xs text-[#b8a99c]">{data.profile.email}</div>
          </div>
          <Avatar name={data.profile.display_name} src={data.profile.avatar_url} />
          <button className="btn btn-outline !min-h-9 !px-3 !py-1.5 !text-xs" onClick={signOut}>
            <IconLogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <nav className="dash-topnav">
        {[...nav, { id: "account", label: "My Account", Icon: IconUser }].map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={cnAlt("nav-item", active === item.id ? "active" : "")}
          >
            <item.Icon />
            {item.label}
          </button>
        ))}
      </nav>

      <main className="dash-content">{view}</main>
    </div>
  );
}
