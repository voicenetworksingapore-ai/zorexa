"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/** Booked days use red; availability blocks still show guest + platform on red. */
const BOOKED_BLOCK_CLASS = "bg-red-500";

type Property = {
  id: string;
  user_id: string;
  name: string;
  [key: string]: unknown;
};

type Booking = {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  platform: string;
  [key: string]: unknown;
};

type Segment = {
  startDay: number;
  endDay: number; // last booked day (inclusive). Booked when check_in <= day < check_out
  guest_name: string;
  platform: string;
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function parseDay(dateStr: string): number {
  return parseInt(dateStr.slice(8, 10), 10);
}

/**
 * Booked when check_in <= day < check_out (check_out exclusive).
 * Returns the inclusive [startDay, endDay] of booked days in the month.
 */
function segmentForBookingInMonth(
  checkIn: string,
  checkOut: string,
  year: number,
  month: number,
  daysInMonth: number
): { startDay: number; endDay: number } | null {
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  if (checkOut <= monthStart || checkIn > monthEnd) return null;
  const startDay = checkIn >= monthStart ? parseDay(checkIn) : 1;
  const checkOutDay = checkOut <= monthEnd ? parseDay(checkOut) : daysInMonth + 1;
  const endDay = Math.min(daysInMonth, checkOutDay - 1);
  if (endDay < startDay) return null;
  return { startDay, endDay };
}

export default function CalendarPage() {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setError(userError?.message ?? "Not signed in");
      setProperties([]);
      setBookings([]);
      setLoading(false);
      return;
    }
    const [propsRes, bookRes] = await Promise.all([
      supabase.from("properties").select("id, user_id, name").eq("user_id", user.id).order("name"),
      supabase
        .from("bookings")
        .select("id, property_id, check_in, check_out, guest_name, platform")
        .eq("user_id", user.id)
        .order("check_in"),
    ]);
    if (propsRes.error) {
      setError(propsRes.error.message);
      setLoading(false);
      return;
    }
    if (bookRes.error) {
      setError(bookRes.error.message);
      setLoading(false);
      return;
    }
    setProperties((propsRes.data as Property[]) ?? []);
    setBookings((bookRes.data as Booking[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const segmentsByProperty = useMemo(() => {
    const map = new Map<string, Segment[]>();
    properties.forEach((prop) => {
      const propBookings = bookings.filter((b) => b.property_id === prop.id);
      const segs: Segment[] = [];
      propBookings.forEach((b) => {
        const range = segmentForBookingInMonth(
          b.check_in,
          b.check_out,
          year,
          month,
          daysInMonth
        );
        if (range) {
          segs.push({
            startDay: range.startDay,
            endDay: range.endDay,
            guest_name: b.guest_name ?? "",
            platform: b.platform ?? "",
          });
        }
      });
      segs.sort((a, b) => a.startDay - b.startDay);
      map.set(prop.id, segs);
    });
    return map;
  }, [properties, bookings, year, month, daysInMonth]);

  const goPrev = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const dayColumns = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Calendar
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View and manage your booking calendar by property.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading calendar…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-col gap-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {monthLabel}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goPrev}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Previous month"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Next month"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>

            {properties.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No properties yet. Add one from the Properties page.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="sticky left-0 z-10 min-w-[160px] border-r border-slate-200 bg-slate-50/95 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-400">
                        Property
                      </th>
                      {dayColumns.map((d) => (
                        <th
                          key={d}
                          className="min-w-[72px] border-r border-slate-200 bg-slate-50/95 px-2 py-3 text-center text-xs font-semibold text-slate-600 last:border-r-0 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-300"
                        >
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((prop) => {
                      const segments = segmentsByProperty.get(prop.id) ?? [];
                      const cells: React.ReactNode[] = [];
                      let day = 1;
                      while (day <= daysInMonth) {
                        const segment = segments.find((s) => s.startDay === day);
                        if (segment) {
                          const span = segment.endDay - segment.startDay + 1;
                          cells.push(
                            <td
                              key={day}
                              colSpan={span}
                              className="border-r border-slate-200 p-1 align-top last:border-r-0 dark:border-slate-800"
                            >
                              <div
                                className={`rounded px-2 py-2 text-xs font-medium text-white shadow-sm ${BOOKED_BLOCK_CLASS}`}
                                title={`${segment.guest_name} · ${segment.platform}`}
                              >
                                <div className="font-semibold truncate">{segment.guest_name}</div>
                                <div className="truncate opacity-90">{segment.platform}</div>
                              </div>
                            </td>
                          );
                          day = segment.endDay + 1;
                        } else {
                          cells.push(
                            <td
                              key={day}
                              className="min-w-[72px] border-r border-slate-200 bg-emerald-50 dark:border-slate-800 dark:bg-emerald-950/40 last:border-r-0"
                              title="Available"
                            />
                          );
                          day += 1;
                        }
                      }
                      return (
                        <tr
                          key={prop.id}
                          className="border-b border-slate-200 dark:border-slate-800"
                        >
                          <td className="sticky left-0 z-10 min-w-[160px] border-r border-slate-200 bg-white px-3 py-2 font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white">
                            {prop.name}
                          </td>
                          {cells}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
