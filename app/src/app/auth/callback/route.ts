import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/dashboard";

  const loginRedirect = (reason: string) =>
    NextResponse.redirect(
      `${origin}/login?oauth_error=${encodeURIComponent(reason)}`,
    );

  if (oauthError) return loginRedirect(oauthError);

  if (!code) return loginRedirect("Missing authorization code");

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return loginRedirect(error.message);

  // Ensure the authenticated user has a studio profile provisioned.
  // OAuth newcomers are not auto-provisioned; staff create accounts.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.auth.signOut();
      response.cookies
        .getAll()
        .forEach((c) => request.cookies.set(c.name, c.value));
      const out = loginRedirect(
        "No studio profile is linked to this Google account. Please ask Neelam to set up your access.",
      );
      request.cookies
        .getAll()
        .forEach((c) => out.cookies.set(c.name, c.value));
      return out;
    }
  }

  const url = new URL(next, origin);
  const finalResponse = NextResponse.redirect(url);
  request.cookies
    .getAll()
    .forEach((c) => finalResponse.cookies.set(c.name, c.value));
  return finalResponse;
}
