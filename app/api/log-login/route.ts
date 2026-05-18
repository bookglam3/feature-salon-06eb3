import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // ── 1. Get authenticated user ──────────────────────────────
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ── 2. Get real IP ─────────────────────────────────────────
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : 
               req.headers.get("x-real-ip") || "unknown";

    // ── 3. Get salon info ──────────────────────────────────────
    const { data: salon } = await supabaseAdmin
      .from("salons")
      .select("id,name")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    // ── 4. Geo lookup via ip-api.com (free, no key needed) ────
    let city = "Unknown", country = "Unknown", countryCode = "", isp = "Unknown", lat = null, lon = null;
    if (ip !== "unknown" && ip !== "127.0.0.1" && ip !== "::1") {
      try {
        const geo = await fetch(
          `http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,isp,lat,lon`,
          { signal: AbortSignal.timeout(3000) }
        );
        if (geo.ok) {
          const geoData = await geo.json();
          if (geoData.status === "success") {
            city = geoData.city || "Unknown";
            country = geoData.country || "Unknown";
            countryCode = geoData.countryCode || "";
            isp = geoData.isp || "Unknown";
            lat = geoData.lat || null;
            lon = geoData.lon || null;
          }
        }
      } catch {
        // Geo lookup failure is non-fatal
      }
    }

    // ── 5. Device info from user-agent ────────────────────────
    const ua = req.headers.get("user-agent") || "";
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);
    const browser = ua.includes("Chrome") ? "Chrome"
                  : ua.includes("Firefox") ? "Firefox"
                  : ua.includes("Safari") ? "Safari"
                  : ua.includes("Edge") ? "Edge"
                  : "Unknown";
    const device = `${isMobile ? "📱 Mobile" : "🖥️ Desktop"} · ${browser}`;

    // ── 6. Insert into login_logs ──────────────────────────────
    await supabaseAdmin.from("login_logs").insert({
      owner_id: user.id,
      owner_email: user.email,
      salon_id: salon?.id || null,
      salon_name: salon?.name || user.email,
      ip_address: ip,
      city,
      country,
      country_code: countryCode,
      isp,
      lat,
      lon,
      device,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("log-login error:", err);
    return NextResponse.json({ ok: false });
  }
}
