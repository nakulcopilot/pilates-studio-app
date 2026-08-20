import { NextResponse } from "next/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

interface BookingQuery {
  query: string;
  userId?: string;
  filters?: {
    classType?: "mat" | "reformer" | "wunda-chair" | "cadillac" | "all";
    dayOfWeek?: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
    timeRange?: "morning" | "afternoon" | "evening";
    level?: "beginner" | "intermediate" | "advanced";
  };
}

const TIME_RANGE_MAP: Record<string, { start: number; end: number }> = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 21 },
};

const DAY_MAP: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

const CLASS_TYPE_MAP: Record<string, string> = {
  mat: "mat",
  reformer: "reformer",
  "wunda-chair": "wunda_chair",
  cadillac: "cadillac",
  all: "all",
};

function parseNaturalLanguageQuery(query: string): Partial<BookingQuery["filters"]> {
  const lower = query.toLowerCase();
  const filters: Partial<BookingQuery["filters"]> = {};

  // Parse class type
  if (lower.includes("reformer")) filters.classType = "reformer";
  if (lower.includes("mat")) filters.classType = "mat";
  if (lower.includes("wunda") || lower.includes("chair")) filters.classType = "wunda_chair";
  if (lower.includes("cadillac")) filters.classType = "cadillac";

  // Parse day of week
  const dayMatches = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (dayMatches) {
    filters.dayOfWeek = DAY_MAP[dayMatches[1]] as BookingQuery["filters"]["dayOfWeek"];
  }

  // Parse time range
  if (lower.includes("morning")) filters.timeRange = "morning";
  if (lower.includes("afternoon")) filters.timeRange = "afternoon";
  if (lower.includes("evening")) filters.timeRange = "evening";

  // Parse level
  if (lower.includes("beginner")) filters.level = "beginner";
  if (lower.includes("intermediate")) filters.level = "intermediate";
  if (lower.includes("advanced")) filters.level = "advanced";

  return filters;
}

function matchesFilter(classData: any, filters: Partial<BookingQuery["filters"]>): boolean {
  // Check class type
  if (filters.classType && filters.classType !== "all") {
    const classTypes = filters.classType === "mat"
      ? ["mat"]
      : [filters.classType];
    if (!classTypes.includes(classData.type)) return false;
  }

  // Check day of week
  if (filters.dayOfWeek) {
    const classDay = new Date(classData.date).getDay();
    if (classDay === 0) classDay = 7; // Sunday
    if (classDay !== filters.dayOfWeek) return false;
  }

  // Check time range
  if (filters.timeRange) {
    const classHour = new Date(classData.date).getHours();
    const { start, end } = TIME_RANGE_MAP[filters.timeRange];
    if (classHour < start || classHour >= end) return false;
  }

  // Check level
  if (filters.level) {
    if (classData.level !== filters.level) return false;
  }

  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query, userId } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing required field: query" });
    }

    const filters = parseNaturalLanguageQuery(query);

    // Fetch classes from Supabase
    const { data: classes, error } = await supabase
      .from("studio_classes")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      return res.status(500).json({ error: "Failed to fetch classes" });
    }

    // Filter classes based on natural language query
    const matchedClasses = classes.filter((c) => matchesFilter(c, filters));

    // If no matches with filters, try broader search
    const searchResults = matchedClasses.length > 0
      ? matchedClasses
      : classes.filter((c) => {
          const lowerTitle = (c.type + " " + (c.name || "")).toLowerCase();
          const lowerQuery = query.toLowerCase();
          return lowerTitle.includes(lowerQuery) ||
            lowerQuery.includes("class") ||
            lowerQuery.includes("pilates");
        });

    // Format results for UI
    const formattedResults = searchResults.map((c: any) => ({
      id: c.id,
      type: c.type,
      level: c.level,
      date: new Date(c.date).toLocaleDateString(),
      time: new Date(c.date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      instructor: c.instructor || "TBA",
      studio: c.studio || "Studio",
      availableSpots: c.available_spots,
      maxSpots: c.max_students,
      price: c.price,
    }));

    return res.status(200).json({
      query,
      filters,
      totalResults: formattedResults.length,
      results: formattedResults,
    });

  } catch (error) {
    console.error("Booking search API error:", error);
    return res.status(500).json({
      error: "Internal server error during booking search",
    });
  }
}