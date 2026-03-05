"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled";

type Booking = {
  id: string;
  user_id: string;
  guest_name: string;
  property_id?: string;
  property?: string;
  properties?: { name: string } | null;
  check_in: string;
  check_out: string;
  guests: number;
  platform: string;
  status: BookingStatus;
  [key: string]: unknown;
};

type PropertyOption = { id: string; name: string };

const PLATFORM_OPTIONS = ["Airbnb", "Booking.com", "Direct"] as const;

const inputClassName =
  "block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-700";
const labelClassName = "block text-sm font-medium text-slate-700 dark:text-slate-300";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    confirmed:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    pending:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    completed:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    cancelled:
      "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  };
  const labels: Record<BookingStatus, string> = {
    confirmed: "Confirmed",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

const COLUMNS = [
  "Guest Name",
  "Property",
  "Check-in",
  "Check-out",
  "Guests",
  "Platform",
  "Status",
] as const;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formGuestName, setFormGuestName] = useState("");
  const [formCheckIn, setFormCheckIn] = useState("");
  const [formCheckOut, setFormCheckOut] = useState("");
  const [formGuests, setFormGuests] = useState("");
  const [formPlatform, setFormPlatform] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setError(userError?.message ?? "Not signed in");
      setBookings([]);
      setLoading(false);
      return;
    }
    const { data, error: fetchError } = await supabase
      .from("bookings")
      .select("*, properties(name)")
      .eq("user_id", user.id)
      .order("check_in", { ascending: true });
    if (fetchError) {
      setError(fetchError.message);
      setBookings([]);
    } else {
      setBookings((data as Booking[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    const onBookingsUpdated = () => loadBookings();
    window.addEventListener("zorexa-bookings-updated", onBookingsUpdated);
    return () => window.removeEventListener("zorexa-bookings-updated", onBookingsUpdated);
  }, [loadBookings]);

  async function openModal() {
    setFormPropertyId("");
    setFormGuestName("");
    setFormCheckIn("");
    setFormCheckOut("");
    setFormGuests("");
    setFormPlatform("");
    setFormError(null);
    setModalOpen(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return;
    const { data } = await supabase
      .from("properties")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name");
    setProperties((data as PropertyOption[]) ?? []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const guestName = formGuestName.trim();
    const checkIn = formCheckIn;
    const checkOut = formCheckOut;
    const guests = parseInt(formGuests, 10);
    if (!formPropertyId) {
      setFormError("Please select a property.");
      return;
    }
    if (!guestName) {
      setFormError("Guest name is required.");
      return;
    }
    if (!checkIn || !checkOut) {
      setFormError("Check-in and check-out dates are required.");
      return;
    }
    if (new Date(checkOut) < new Date(checkIn)) {
      setFormError("Check-out must be on or after check-in.");
      return;
    }
    if (Number.isNaN(guests) || guests < 1 || guests > 99) {
      setFormError("Guests must be between 1 and 99.");
      return;
    }
    if (!formPlatform) {
      setFormError("Please select a platform.");
      return;
    }
    setFormSaving(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setFormError("Not signed in.");
      setFormSaving(false);
      return;
    }
    const { data: conflicting } = await supabase
      .from("bookings")
      .select("id")
      .eq("property_id", formPropertyId)
      .lt("check_in", checkOut)
      .gt("check_out", checkIn);
    if (conflicting && conflicting.length > 0) {
      setFormError(
        "Booking conflict: this property is already booked for the selected dates."
      );
      setFormSaving(false);
      return;
    }
    const { error: insertError } = await supabase.from("bookings").insert({
      user_id: user.id,
      property_id: formPropertyId,
      guest_name: guestName,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      platform: formPlatform,
    });
    setFormSaving(false);
    if (insertError) {
      setFormError(insertError.message);
      return;
    }
    setModalOpen(false);
    await loadBookings();
  }

  const propertyDisplayName = (b: Booking) =>
    b.properties?.name ?? b.property ?? (b.property_id ? "—" : "—");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View and manage all your bookings.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add Booking
        </button>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
          aria-labelledby="add-booking-title"
        >
          <div
            className="absolute inset-0"
            onClick={() => !formSaving && setModalOpen(false)}
            aria-hidden
          />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h2 id="add-booking-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Add Booking
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create a new booking for one of your properties.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {formError && (
                <div
                  className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
                  role="alert"
                >
                  {formError}
                </div>
              )}
              <div>
                <label htmlFor="booking-property" className={labelClassName}>
                  Property
                </label>
                <select
                  id="booking-property"
                  value={formPropertyId}
                  onChange={(e) => setFormPropertyId(e.target.value)}
                  className={inputClassName}
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {properties.length === 0 && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    No properties yet. Add one from the Properties page.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="booking-guest-name" className={labelClassName}>
                  Guest name
                </label>
                <input
                  id="booking-guest-name"
                  type="text"
                  value={formGuestName}
                  onChange={(e) => setFormGuestName(e.target.value)}
                  className={inputClassName}
                  placeholder="e.g. John Smith"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="booking-check-in" className={labelClassName}>
                    Check-in date
                  </label>
                  <input
                    id="booking-check-in"
                    type="date"
                    value={formCheckIn}
                    onChange={(e) => setFormCheckIn(e.target.value)}
                    className={inputClassName}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="booking-check-out" className={labelClassName}>
                    Check-out date
                  </label>
                  <input
                    id="booking-check-out"
                    type="date"
                    value={formCheckOut}
                    onChange={(e) => setFormCheckOut(e.target.value)}
                    className={inputClassName}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="booking-guests" className={labelClassName}>
                  Guests
                </label>
                <input
                  id="booking-guests"
                  type="number"
                  min={1}
                  max={99}
                  value={formGuests}
                  onChange={(e) => setFormGuests(e.target.value)}
                  className={inputClassName}
                  placeholder="e.g. 2"
                  required
                />
              </div>
              <div>
                <label htmlFor="booking-platform" className={labelClassName}>
                  Platform
                </label>
                <select
                  id="booking-platform"
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value)}
                  className={inputClassName}
                  required
                >
                  <option value="">Select platform</option>
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !formSaving && setModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {formSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading bookings…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-slate-500 dark:text-slate-400">No bookings yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800">
                  {COLUMNS.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      {col}
                    </th>
                  ))}
                  <th className="w-10 px-4 py-3.5" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {booking.guest_name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                      {propertyDisplayName(booking)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(booking.check_in)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(booking.check_out)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                      {booking.guests}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                      {booking.platform}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                        aria-label="More options"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
