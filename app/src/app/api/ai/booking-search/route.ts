import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface ClassRow {
  id: string;
  type: string;
  level: string;
  date: string;
  available_spots: number;
  max_students: number;
  price: number | null;
  instructor: string | null;
  studio: string | null;
}

export async function POST(req: NextRequest) {
  let body: { query?: string; userId?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { query } = body ?? {};
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Missing required field: query" }, { status: 400 });
  }

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const lower = query.toLowerCase();

  // Parse day of week from query
  const dayNames: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7,
  };
  let filterDay: number | undefined;
  const dayMatch = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (dayMatch) {
    filterDay = dayNames[dayMatch[1]];
  }

  // Parse time range from query — first match only
  const timeRangeMap: Record<string, { start: number; end: number }> = {
    morning: { start: 6, end: 12 },
    afternoon: { start: 12, end: 17 },
    evening: { start: 17, end: 21 },
  };
  let filterTimeRange: { start: number; end: number } | undefined;
  for (const kw of ["morning", "afternoon", "evening"]) {
    if (lower.includes(kw)) {
      filterTimeRange = timeRangeMap[kw];
      break;
    }
  }

  // Parse class type from query — priority order, first match only
  let filterClassType = "all";
  const typePatterns: Array<{ pattern: RegExp; type: string }> = [
    { pattern: /reformer/i, type: "reformer" },
    { pattern: /mat/i, type: "mat" },
    { pattern: /wunda chair/i, type: "wunda_chair" },
    { pattern: /cadillac/i, type: "cadillac" },
    { pattern: /trapeze/i, type: "trapeze" },
    { pattern: /barrel/i, type: "barrel" },
  ];
  for (const { pattern, type } of typePatterns) {
    if (pattern.test(lower)) {
      filterClassType = type;
      break;
    }
  }

  // Fetch classes from Supabase
  const { data: classes, error } = await supabase
    .from("studio_classes")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }

  // Filter classes based on query parameters
  let matchedClasses = (classes as ClassRow[] | null) ?? [];

  if (filterClassType !== "all") {
    matchedClasses = matchedClasses.filter((c) => c.type === filterClassType);
  }
  if (filterDay !== undefined) {
    matchedClasses = matchedClasses.filter((c) => {
      const classDay = new Date(c.date).getDay();
      return (classDay === 0 ? 7 : classDay) === filterDay;
    });
  }
  if (filterTimeRange) {
    matchedClasses = matchedClasses.filter((c) => {
      const classHour = new Date(c.date).getHours();
      return classHour >= filterTimeRange.start && classHour < filterTimeRange.end;
    });
  }

  // Format results for UI
  const formattedResults = matchedClasses.map((c) => ({
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

  return NextResponse.json({
    query,
    totalResults: formattedResults.length,
    results: formattedResults,
    aiAssisted: true,
    aiQuery: query,
    disclaimer:
      "AI-assisted class recommendations. Please verify class details and consult with instructor for personalized advice.",
  });
}
