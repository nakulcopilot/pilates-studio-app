import { NextResponse } from "next/server";
import type { NextApiRequest, NextApiResponse } from "next";
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

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

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
    const dayMatch = query.toLowerCase().match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dayMatch) {
      filterDay = dayNames[dayMatch[1]];
    }

    // Parse time range from query
    const timeRangeMap: Record<string, { start: number; end: number }> = {
      morning: { start: 6, end: 12 },
      afternoon: { start: 12, end: 17 },
      evening: { start: 17, end: 21 },
    };
    let filterTimeRange: { start: number; end: number } | undefined;
    // Check each time range keyword - use the first match found
    const timeKeywords = ["morning", "afternoon", "evening"];
    for (const kw of timeKeywords) {
      if (query.toLowerCase().includes(kw)) {
        filterTimeRange = timeRangeMap[kw];
        break; // Use first match only
      }
    }

    // Parse class type from query
    let filterClassType: string = "all";
    const lower = query.toLowerCase();
    // Priority order for class type matching
    const typePatterns = [
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
        break; // Use first match only
      }
    }

    // Fetch classes from Supabase
    const { data: classes, error } = await supabase
      .from("studio_classes")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      return res.status(500).json({ error: "Failed to fetch classes" });
    }

    // Filter classes based on query parameters
    let matchedClasses = classes || [];

    if (filterClassType !== "all") {
      matchedClasses = matchedClasses.filter((c: ClassRow) => c.type === filterClassType);
    }
    if (filterDay !== undefined) {
      matchedClasses = matchedClasses.filter((c: ClassRow) => {
        const classDay = new Date(c.date).getDay();
        return classDay === 0 ? 7 : classDay === filterDay;
      });
    }
    if (filterTimeRange) {
      matchedClasses = matchedClasses.filter((c: ClassRow) => {
        const classHour = new Date(c.date).getHours();
        return classHour >= filterTimeRange.start && classHour < filterTimeRange.end;
      });
    }

    // Format results for UI
    const formattedResults = (matchedClasses || []).map((c: ClassRow) => ({
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
      totalResults: formattedResults.length,
      results: formattedResults,
      aiAssisted: true,
      aiQuery: query,
      disclaimer:
        "AI-assisted class recommendations. Please verify class details and consult with instructor for personalized advice.",
    });

  } catch (error) {
    console.error("Booking search API error:", error);
    return res.status(500).json({ error: "Internal server error during booking search" });
  }
}