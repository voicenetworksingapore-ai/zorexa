"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Stats = {
  properties: number;
  bookings: number;
  upcomingCheckIns: number;
  connectedChannels: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setError(userError?.message ?? "Not signed in");
      setStats(null);
      setLoading(false);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);

    const [propertiesRes, bookingsRes, upcomingRes, channelsRes] = await Promise.all([
      supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("check_in", today),
      supabase
        .from("channels")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    setStats({
      properties: propertiesRes.count ?? 0,
      bookings: bookingsRes.count ?? 0,
      upcomingCheckIns: upcomingRes.count ?? 0,
      connectedChannels: channelsRes.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const statCards = stats
    ? [
        { label: "Properties", value: stats.properties, sub: "Active listings" },
        { label: "Bookings", value: stats.bookings, sub: "Total bookings" },
        { label: "Upcoming check-ins", value: stats.upcomingCheckIns, sub: "Check-in today or later" },
        { label: "Connected channels", value: stats.connectedChannels, sub: "Linked platforms" },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Welcome back. Here’s an overview of your activity.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-8 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-1 h-3 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
            >
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stat.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent activity</h2>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Your recent bookings and updates will appear here.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/bookings"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              New booking
            </a>
            <a
              href="/properties"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Add property
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
