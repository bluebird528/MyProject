import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  if (code || (tokenHash && type === "email")) {
    try {
      const supabase = await createClient();
      const { error } = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: "email" });
      if (!error) return NextResponse.redirect(new URL("/notes", request.url));
    } catch {
      // Session exchange failures use the same confirmation error as invalid links.
    }
  }
  return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
}
