"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const CHANNEL_COLORS: Record<string, string> = {
  airbnb: "bg-rose-500",
  booking: "bg-blue-600",
  "booking.com": "bg-blue-600",
  fewo: "bg-emerald-600",
  "fewo-direkt": "bg-emerald-600",
  direct: "bg-slate-700",
  "direct-website": "bg-slate-700",
  default: "bg-slate-600",
};

function getColor(iconType: string | null | undefined): string {
  if (!iconType) return CHANNEL_COLORS.default;
  const key = iconType.toLowerCase().replace(/\s+/g, "-");
  return CHANNEL_COLORS[key] ?? CHANNEL_COLORS.default;
}

function ChannelIcon({ type }: { type: string }) {
  const iconClass = "h-6 w-6";
  const t = type?.toLowerCase() ?? "";
  if (t.includes("airbnb")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor">
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45v6.9L12 18.82l-6.9-3.45v-6.9L12 4.18z" />
      </svg>
    );
  }
  if (t.includes("booking")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    );
  }
  if (t.includes("fewo") || t.includes("fewo-direkt")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

const PLATFORMS = ["Airbnb", "Booking.com", "FeWo-direkt", "Direct Website"] as const;

type Channel = {
  id: string;
  user_id: string;
  name?: string | null;
  platform?: string | null;
  status?: string | null;
  connected?: boolean;
  icon_type?: string | null;
  color?: string | null;
  [key: string]: unknown;
};

function isConnected(channel: Channel | undefined): boolean {
  if (!channel) return false;
  if (channel.status === "connected") return true;
  return Boolean(channel.connected);
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    setLoading(true);
    setError(null);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setError(userError?.message ?? "Not signed in");
      setChannels([]);
      setLoading(false);
      return;
    }
    const { data, error: fetchError } = await supabase
      .from("channels")
      .select("*")
      .eq("user_id", user.id);
    if (fetchError) {
      setError(fetchError.message);
      setChannels([]);
    } else {
      setChannels((data as Channel[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  async function handleConnect(platform: string) {
    setConnectingPlatform(platform);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setConnectingPlatform(null);
      return;
    }
    const { error: insertError } = await supabase.from("channels").insert({
      user_id: user.id,
      platform,
      status: "connected",
    });
    setConnectingPlatform(null);
    if (insertError) return;
    await loadChannels();
  }

  const channelByPlatform = (platform: string) =>
    channels.find((c) => (c.platform ?? c.name) === platform);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Channels
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Connect and manage your distribution channels.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading channels…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORMS.map((platform) => {
            const channel = channelByPlatform(platform);
            const connected = isConnected(channel);
            const color = channel?.color ?? getColor(platform);
            const iconType = channel?.icon_type ?? platform;
            const isConnecting = connectingPlatform === platform;
            return (
              <article
                key={platform}
                className="flex flex-col rounded-xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${color}`}
                    >
                      <ChannelIcon type={iconType} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-slate-900 dark:text-white">
                        {platform}
                      </h2>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <span
                          className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                            connected
                              ? "bg-emerald-500"
                              : "bg-slate-300 dark:bg-slate-600"
                          }`}
                          aria-hidden
                        />
                        Status: {connected ? "Connected" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5">
                    {connected ? (
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                      >
                        Connected
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConnect(platform)}
                        disabled={isConnecting}
                        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      >
                        {isConnecting ? "Connecting…" : "Connect"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
