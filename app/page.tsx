import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <span className="text-sm font-semibold text-white">Z</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Zorexa</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200/60 bg-gradient-to-b from-slate-50 to-white pt-28 pb-20 sm:pt-36 sm:pb-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            The Smart Channel Manager for Vacation Rentals
          </h1>
          <p className="mt-5 text-lg text-slate-600 sm:text-xl">
            Sync Airbnb, Booking and more in one powerful dashboard.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features — 3 columns */}
      <section className="border-b border-slate-200/60 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Everything in one place
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
            One dashboard. All your channels. No double bookings.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Unified Calendar",
                description:
                  "See all your properties and bookings in a single grid. Spot availability and conflicts at a glance.",
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                ),
              },
              {
                title: "Channel Sync",
                description:
                  "Connect Airbnb, Booking.com, and more. iCal import keeps your calendar in sync automatically.",
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                ),
              },
              {
                title: "Property Management",
                description:
                  "Add properties, set capacity, and manage details. Keep locations and max guests in one place.",
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                ),
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border border-slate-200/80 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="border-b border-slate-200/60 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
            Get started in minutes.
          </p>
          <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {[
              { step: "1", title: "Add your properties", text: "Create listings with location, capacity, and calendar links." },
              { step: "2", title: "Connect channels", text: "Link Airbnb, Booking.com, and sync iCal feeds into one calendar." },
              { step: "3", title: "Manage bookings", text: "View and manage all reservations from a single dashboard." },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 text-sm font-semibold text-slate-900">
                  {item.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — Starter $19, Pro $39, Agency $79 */}
      <section className="border-b border-slate-200/60 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Simple pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
            Choose the plan that fits your portfolio.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              { name: "Starter", price: "$19", period: "/month", desc: "For small portfolios.", features: ["Up to 3 properties", "Unified calendar", "iCal sync", "Email support"], cta: "Start Free Trial", highlighted: false },
              { name: "Pro", price: "$39", period: "/month", desc: "For growing rental businesses.", features: ["Up to 15 properties", "Channel sync", "Priority support"], cta: "Start Free Trial", highlighted: true },
              { name: "Agency", price: "$79", period: "/month", desc: "For teams and multiple portfolios.", features: ["Unlimited properties", "API access", "Dedicated support"], cta: "Contact sales", highlighted: false },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-xl border p-6 ${
                  plan.highlighted ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200/80 bg-white"
                }`}
              >
                <h3 className={`text-lg font-semibold ${plan.highlighted ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
                <p className="mt-1 text-sm opacity-80">{plan.desc}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${plan.highlighted ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.highlighted ? "text-slate-200" : "text-slate-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                    plan.highlighted ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Start managing your rentals smarter
          </h2>
          <p className="mt-3 text-slate-600">
            Join vacation rental hosts who save time and avoid double bookings.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                <span className="text-sm font-semibold text-white">Z</span>
              </div>
              <span className="font-semibold text-slate-900">Zorexa</span>
            </div>
            <p className="text-sm text-slate-500">© {new Date().getFullYear()} Zorexa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
