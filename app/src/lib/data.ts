import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AttendanceRow,
  ClassNote,
  DemoSession,
  Instructor,
  InstructorFeedback,
  Profile,
  Student,
  StudentInjury,
  StudentMilestone,
  StudentNote,
  StudioClass,
  StudioSettings,
} from "./types";

export interface DashData {
  profile: Profile;
  settings: StudioSettings | null;
  instructors: Instructor[];
  students: Student[];
  classes: StudioClass[];
  demos: DemoSession[];
  attendance: AttendanceRow[];
  classNotes: ClassNote[];
  studentNotes: StudentNote[];
  milestones: StudentMilestone[];
  injuries: StudentInjury[];
  feedback: InstructorFeedback[];
}

export async function loadDashboardData(
  supabase: SupabaseClient,
): Promise<DashData> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) throw new Error("No profile for this account");

  const [
    settingsRes,
    instructorsRes,
    studentsRes,
    classesRes,
    demosRes,
    attendanceRes,
    classNotesRes,
    studentNotesRes,
    milestonesRes,
    injuriesRes,
    feedbackRes,
  ] = await Promise.all([
    supabase.from("studio_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("instructors").select("*").order("name"),
    supabase.from("students").select("*").order("name"),
    supabase.from("classes").select("*").order("date", { ascending: false }),
    supabase.from("demo_sessions").select("*").order("date"),
    supabase.from("attendance").select("*"),
    supabase.from("class_notes").select("*").order("created_at", { ascending: false }),
    supabase.from("student_notes").select("*").order("created_at", { ascending: false }),
    supabase.from("student_milestones").select("*").order("date", { ascending: false }),
    supabase.from("student_injuries").select("*").order("created_at", { ascending: false }),
    supabase.from("instructor_feedback").select("*").order("created_at", { ascending: false }),
  ]);

  return {
    profile: profile as Profile,
    settings: (settingsRes.data as StudioSettings) ?? null,
    instructors: (instructorsRes.data as Instructor[]) ?? [],
    students: (studentsRes.data as Student[]) ?? [],
    classes: (classesRes.data as StudioClass[]) ?? [],
    demos: (demosRes.data as DemoSession[]) ?? [],
    attendance: (attendanceRes.data as AttendanceRow[]) ?? [],
    classNotes: (classNotesRes.data as ClassNote[]) ?? [],
    studentNotes: (studentNotesRes.data as StudentNote[]) ?? [],
    milestones: (milestonesRes.data as StudentMilestone[]) ?? [],
    injuries: (injuriesRes.data as StudentInjury[]) ?? [],
    feedback: (feedbackRes.data as InstructorFeedback[]) ?? [],
  };
}
