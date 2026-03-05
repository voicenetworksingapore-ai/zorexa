import ical from "ical";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Format a Date or ical date object to YYYY-MM-DD for DB. */
function toDateString(
  d: Date | { toISOString?(): string; getFullYear?(): number; getMonth?(): number; getDate?(): number }
): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof (d as Date).toISOString === "function") return (d as Date).toISOString().slice(0, 10);
  const y = (d as Date).getFullYear?.() ?? 0;
  const m = ((d as Date).getMonth?.() ?? 0) + 1;
  const day = (d as Date).getDate?.() ?? 1;
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export type IcalImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

/**
 * Import bookings from iCal URL(s) for the given user.
 * Loads ical_url from the properties table, fetches each .ics, parses events,
 * and inserts into bookings (skipping duplicates).
 */
export async function importBookingsFromIcal(
  supabase: SupabaseClient,
  userId: string,
  options?: { propertyId?: string }
): Promise<IcalImportResult> {
  const result: IcalImportResult = { imported: 0, skipped: 0, errors: [] };

  const propsQuery = supabase
    .from("properties")
    .select("id, user_id, ical_url")
    .eq("user_id", userId)
    .not("ical_url", "is", null);

  if (options?.propertyId) propsQuery.eq("id", options.propertyId);

  const { data: properties, error: propsError } = await propsQuery;

  if (propsError) {
    result.errors.push(propsError.message);
    return result;
  }
  if (!properties?.length) return result;

  for (const prop of properties) {
    const url = prop.ical_url as string;
    if (!url?.trim()) continue;

    let icsText: string;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        result.errors.push(`Property ${prop.id}: HTTP ${res.status} for ${url}`);
        continue;
      }
      icsText = await res.text();
    } catch (e) {
      result.errors.push(`Property ${prop.id}: fetch failed – ${(e as Error).message}`);
      continue;
    }

    let data: ReturnType<typeof ical.parseICS>;
    try {
      data = ical.parseICS(icsText);
    } catch (e) {
      result.errors.push(`Property ${prop.id}: parse failed – ${(e as Error).message}`);
      continue;
    }

    for (const key of Object.keys(data)) {
      const ev = data[key];
      if (!ev || (ev as { type?: string }).type !== "VEVENT") continue;

      const start = (ev as { start?: Date }).start;
      const end = (ev as { end?: Date }).end;
      if (!start || !end) continue;

      const checkIn = toDateString(start);
      const checkOut = toDateString(end);
      if (checkIn >= checkOut) continue;

      const { data: existing } = await supabase
        .from("bookings")
        .select("id")
        .eq("property_id", prop.id)
        .eq("check_in", checkIn)
        .eq("check_out", checkOut)
        .maybeSingle();

      if (existing) {
        result.skipped += 1;
        continue;
      }

      const { error: insertError } = await supabase.from("bookings").insert({
        user_id: userId,
        property_id: prop.id,
        guest_name: "Imported booking",
        check_in: checkIn,
        check_out: checkOut,
        guests: 1,
        platform: "ical import",
      });

      if (insertError) {
        result.errors.push(`Booking ${checkIn}–${checkOut}: ${insertError.message}`);
      } else {
        result.imported += 1;
      }
    }
  }

  return result;
}
