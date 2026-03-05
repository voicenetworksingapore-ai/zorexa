"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Property = {
  id: string;
  user_id: string;
  name: string;
  location: string;
  max_guests: number;
  status: "active" | "inactive";
  ical_url?: string | null;
  [key: string]: unknown;
};

const inputClassName =
  "block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-700";
const labelClassName = "block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formMaxGuests, setFormMaxGuests] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);
  const [syncingPropertyId, setSyncingPropertyId] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setError(userError?.message ?? "Not signed in");
      setProperties([]);
      setLoading(false);
      return;
    }
    const { data, error: fetchError } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id);
    if (fetchError) {
      setError(fetchError.message);
      setProperties([]);
    } else {
      setProperties((data as Property[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  function openModal() {
    setEditingProperty(null);
    setFormName("");
    setFormLocation("");
    setFormMaxGuests("");
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(property: Property) {
    setModalOpen(false);
    setFormName(property.name);
    setFormLocation(property.location);
    setFormMaxGuests(String(property.max_guests));
    setFormError(null);
    setEditingProperty(property);
  }

  function closeEditModal() {
    if (!formSaving) setEditingProperty(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const name = formName.trim();
    const location = formLocation.trim();
    const maxGuests = parseInt(formMaxGuests, 10);
    if (!name) {
      setFormError("Property name is required.");
      return;
    }
    if (!location) {
      setFormError("Location is required.");
      return;
    }
    if (Number.isNaN(maxGuests) || maxGuests < 1 || maxGuests > 99) {
      setFormError("Max guests must be between 1 and 99.");
      return;
    }
    setFormSaving(true);
    if (editingProperty) {
      const { error: updateError } = await supabase
        .from("properties")
        .update({ name, location, max_guests: maxGuests })
        .eq("id", editingProperty.id);
      setFormSaving(false);
      if (updateError) {
        setFormError(updateError.message);
        return;
      }
      setEditingProperty(null);
      await loadProperties();
      return;
    }
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setFormError("Not signed in.");
      setFormSaving(false);
      return;
    }
    const { error: insertError } = await supabase.from("properties").insert({
      user_id: user.id,
      name,
      location,
      max_guests: maxGuests,
    });
    setFormSaving(false);
    if (insertError) {
      setFormError(insertError.message);
      return;
    }
    setModalOpen(false);
    await loadProperties();
  }

  async function handleDeleteConfirm() {
    if (!deletingProperty) return;
    setDeleteConfirmLoading(true);
    const { error: deleteError } = await supabase
      .from("properties")
      .delete()
      .eq("id", deletingProperty.id);
    setDeleteConfirmLoading(false);
    setDeletingProperty(null);
    if (deleteError) return;
    await loadProperties();
  }

  async function handleSyncCalendar(property: Property) {
    if (!property.ical_url?.trim()) {
      setError("This property has no calendar URL set.");
      return;
    }
    setSyncingPropertyId(property.id);
    setError(null);
    setSyncSuccess(false);
    try {
      const res = await fetch("/api/import-ical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: property.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sync failed");
        return;
      }
      setSyncSuccess(true);
      window.dispatchEvent(new CustomEvent("zorexa-bookings-updated"));
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (e) {
      setError((e as Error).message ?? "Sync failed");
    } finally {
      setSyncingPropertyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Properties
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your property listings and availability.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Property
        </button>
      </div>

      {editingProperty && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
          aria-labelledby="edit-property-title"
        >
          <div className="absolute inset-0" onClick={closeEditModal} aria-hidden />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h2 id="edit-property-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Edit Property
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Update the property details.
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
                <label htmlFor="edit-property-name" className={labelClassName}>
                  Property name
                </label>
                <input
                  id="edit-property-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={inputClassName}
                  placeholder="e.g. Lakeside Villa"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="edit-property-location" className={labelClassName}>
                  Location
                </label>
                <input
                  id="edit-property-location"
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className={inputClassName}
                  placeholder="e.g. Lake Constance, Bavaria"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="edit-property-max-guests" className={labelClassName}>
                  Max guests
                </label>
                <input
                  id="edit-property-max-guests"
                  type="number"
                  min={1}
                  max={99}
                  value={formMaxGuests}
                  onChange={(e) => setFormMaxGuests(e.target.value)}
                  className={inputClassName}
                  placeholder="e.g. 4"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
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

      {deletingProperty && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
          aria-labelledby="delete-property-title"
        >
          <div
            className="absolute inset-0"
            onClick={() => !deleteConfirmLoading && setDeletingProperty(null)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h2 id="delete-property-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Delete property
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong>{deletingProperty.name}</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => !deleteConfirmLoading && setDeletingProperty(null)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmLoading}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
              >
                {deleteConfirmLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
          aria-labelledby="add-property-title"
        >
          <div
            className="absolute inset-0"
            onClick={() => !formSaving && setModalOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h2 id="add-property-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Add Property
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add a new property to your listings.
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
                <label htmlFor="property-name" className={labelClassName}>
                  Property name
                </label>
                <input
                  id="property-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={inputClassName}
                  placeholder="e.g. Lakeside Villa"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="property-location" className={labelClassName}>
                  Location
                </label>
                <input
                  id="property-location"
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className={inputClassName}
                  placeholder="e.g. Lake Constance, Bavaria"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="property-max-guests" className={labelClassName}>
                  Max guests
                </label>
                <input
                  id="property-max-guests"
                  type="number"
                  min={1}
                  max={99}
                  value={formMaxGuests}
                  onChange={(e) => setFormMaxGuests(e.target.value)}
                  className={inputClassName}
                  placeholder="e.g. 4"
                />
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
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading properties…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-slate-500 dark:text-slate-400">No properties yet.</p>
        </div>
      ) : (
        <>
        {syncSuccess && (
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
            role="status"
          >
            Calendar synced successfully
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <article
              key={property.id}
              className="flex flex-col rounded-xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow dark:border-slate-800 dark:bg-slate-900/50 dark:hover:shadow-none"
            >
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {property.name}
                  </h2>
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      property.status === "active"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {property.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span>{property.location}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  <span>Up to {property.max_guests} guests</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/80 px-5 py-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSyncCalendar(property)}
                  disabled={!!syncingPropertyId || !property.ical_url?.trim()}
                  title={property.ical_url?.trim() ? "Import bookings from iCal feed" : "Add a calendar URL to this property to sync"}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {syncingPropertyId === property.id ? "Syncing…" : "Sync Calendar"}
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(property)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingProperty(property)}
                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
