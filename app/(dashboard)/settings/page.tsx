export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your account and preferences.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-slate-500 dark:text-slate-400">Settings content goes here.</p>
      </div>
    </div>
  );
}
