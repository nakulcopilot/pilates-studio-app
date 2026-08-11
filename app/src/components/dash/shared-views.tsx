"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import type { DashData } from "@/lib/data";
import { Avatar, SectionTitle } from "./ui";

export function AccountView({
  data,
  supabase,
}: {
  data: DashData;
  supabase: SupabaseClient;
}) {
  const router = useRouter();
  const { profile } = data;

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const linked =
    data.instructors.find((i) => i.profile_user_id === profile.id) ?? null;
  const student = data.students.find((s) => s.profile_user_id === profile.id) ?? null;

  return (
    <div className="space-y-6">
      <SectionTitle>My Account</SectionTitle>
      <div className="card flex items-center gap-4">
        <Avatar name={profile.display_name} src={profile.avatar_url} size={56} />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-lg text-[#1a1a2e] truncate">
            {profile.display_name}
          </div>
          <div className="text-sm text-gray-500">{profile.email}</div>
          <span className="role-badge mt-1 inline-flex" style={{ background: "#f5f3ff", color: "#6d28d9" }}>
            {profile.role}
          </span>
        </div>
        <button className="btn btn-outline" onClick={signOut}>
          Sign out
        </button>
      </div>

      {linked && (
        <div className="card">
          <SectionTitle>Instructor Profile</SectionTitle>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 m-0 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Name</dt>
              <dd className="m-0 mt-1">{linked.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Specialization</dt>
              <dd className="m-0 mt-1">{linked.specialization || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Experience</dt>
              <dd className="m-0 mt-1">{linked.experience} years</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Rating</dt>
              <dd className="m-0 mt-1">★ {Number(linked.rating).toFixed(1)}</dd>
            </div>
          </dl>
        </div>
      )}

      {student && (
        <div className="card">
          <SectionTitle>Student Profile</SectionTitle>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 m-0 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Name</dt>
              <dd className="m-0 mt-1">{student.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Level</dt>
              <dd className="m-0 mt-1 capitalize">{student.level}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Phone</dt>
              <dd className="m-0 mt-1">{student.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Email</dt>
              <dd className="m-0 mt-1">{student.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-gray-400">Enrolled classes</dt>
              <dd className="m-0 mt-1">{student.enrolled_classes.length}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="card text-xs text-gray-500">
        Signed in via Supabase Auth. Data is read/written to PostgreSQL with row
        level security enforced per role.
      </div>
    </div>
  );
}
