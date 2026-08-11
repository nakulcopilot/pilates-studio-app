export type Role = "admin" | "instructor" | "student";

export interface Profile {
  id: string;
  role: Role;
  display_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Instructor {
  id: string;
  name: string;
  specialization: string | null;
  certification: string | null;
  experience: number;
  email: string | null;
  phone: string | null;
  photo: string | null;
  active: boolean;
  date_joined: string | null;
  bio: string;
  availability: Record<string, string[]>;
  permissions: Record<string, boolean>;
  rating: number;
  login_id: string | null;
  profile_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  emergency: string | null;
  active: boolean;
  level: "beginner" | "intermediate" | "expert";
  level_progress: Record<string, number>;
  enrolled_classes: string[];
  enrolled_demos: string[];
  profile_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudioClass {
  id: string;
  type: "mat" | "reformer";
  level: "beginner" | "intermediate" | "expert";
  date: string;
  time: string;
  duration: number;
  max_students: number;
  status: "active" | "cancelled" | "completed";
  instructor: string | null;
  enrolled: string[];
  waitlist: string[];
  created_at: string;
  updated_at: string;
}

export interface DemoSession {
  id: string;
  date: string;
  time: string;
  duration: number;
  max_students: number;
  enrolled: string[];
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceRow {
  class_id: string;
  student_id: string;
  status: AttendanceStatus;
  updated_at: string;
}

export interface ClassNote {
  id: number;
  class_id: string;
  student_id: string;
  text: string;
  tags: string[];
  created_at: string;
}

export interface StudentNote {
  id: string;
  student_id: string;
  text: string;
  date: string;
  added_by: string | null;
  created_at: string;
}

export interface StudentMilestone {
  id: string;
  student_id: string;
  title: string;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface StudentInjury {
  id: string;
  student_id: string;
  injury: string;
  notes: string | null;
  status: "active" | "recovered";
  created_at: string;
  updated_at: string;
}

export interface InstructorFeedback {
  id: string;
  student_id: string;
  instructor_id: string;
  rating: number;
  text: string;
  created_at: string;
}

export interface StudioSettings {
  id: number;
  data: {
    studioName: string;
    logoData: string | null;
    colorTheme: string;
    numInstructors: number;
    classTypes: { mat: boolean; reformer: boolean };
    defaultDuration: number;
    timeSlots: string[];
    paymentTypes: { cash: boolean; upi: boolean; card: boolean };
    currency: string;
    packages: { id: string; name: string; classes: number; price: number }[];
    demoSessions: number;
    instructorName: string;
    instructorSpecialization: string;
    instructorPhoto: string | null;
    sidebarBg: string;
    sidebarText: string;
    sidebarActiveBg: string;
    sidebarActiveText: string;
    sidebarHoverBg: string;
    sidebarBannerData: string | null;
    sidebarBannerText: string;
    ai: {
      enabled: boolean;
      baseUrl: string;
      apiKey: string;
      model: string;
      temperature: number;
    };
  };
  updated_at: string;
  updated_by: string | null;
}
