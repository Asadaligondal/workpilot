import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRightIcon,
  BoltIcon,
  ZapIcon,
  BrainIcon,
  SettingsIcon,
} from "lucide-react"

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 to-background py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm">
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                New
              </span>
              AI-powered operations audit for SMBs
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              See exactly what in your business{" "}
              <span className="text-indigo-600">can be automated</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Get a professional audit of your workflows with prioritized
              recommendations, implementation roadmap, budget estimates, and ROI
              projections — in minutes, not weeks.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Start Your Free Audit
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sample-reports">
                <Button variant="outline" size="lg">
                  See Sample Report
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution — Three result types */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Three ways to transform your operations
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every workflow gets classified into the right intervention type
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <ZapIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Automate</h3>
              <p className="mt-2 text-muted-foreground">
                Remove manual work entirely with rules, integrations, and
                workflows that run themselves.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <BrainIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Augment</h3>
              <p className="mt-2 text-muted-foreground">
                Add AI copilots, smart assistants, summaries, and
                recommendations to empower your team.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <SettingsIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Optimize</h3>
              <p className="mt-2 text-muted-foreground">
                Replace tools, improve handoffs, and fix process design for
                better outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From description to actionable roadmap in four steps
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {[
              {
                step: "1",
                title: "Describe",
                desc: "Tell us about your business, team, tools, and workflows.",
              },
              {
                step: "2",
                title: "Upload",
                desc: "Add SOPs, screenshots, forms, or spreadsheets for deeper analysis.",
              },
              {
                step: "3",
                title: "Analyze",
                desc: "Our AI engine maps, scores, and prioritizes every opportunity.",
              },
              {
                step: "4",
                title: "Act",
                desc: "Get a roadmap, budget, timeline, and ready-to-use proposals.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Built for service businesses
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Industry-specific templates and benchmarks for accurate results
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { name: "Agencies & Consultancies", emoji: "🏢" },
              { name: "Clinics & Providers", emoji: "🏥" },
              { name: "Contractors & Local Biz", emoji: "🔧" },
              { name: "Legal & Accounting", emoji: "⚖️" },
              { name: "Ecommerce Ops", emoji: "📦" },
            ].map((industry) => (
              <div
                key={industry.name}
                className="rounded-xl border bg-card p-6 text-center transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                <div className="mb-3 text-3xl">{industry.emoji}</div>
                <h3 className="text-sm font-medium">{industry.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Examples */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Real results from real businesses
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { stat: "120+", label: "Hours saved per month", sub: "Average across audited businesses" },
              { stat: "40%", label: "Cost reduction", sub: "In operational overhead" },
              { stat: "3 months", label: "Payback period", sub: "On implementation investment" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border bg-card p-8 text-center">
                <div className="text-4xl font-bold text-indigo-600">
                  {item.stat}
                </div>
                <div className="mt-2 font-medium">{item.label}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to see what you can automate?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get your personalized operations audit with prioritized
            recommendations, timeline, and budget — free to start.
          </p>
          <div className="mt-8">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Start Your Free Audit
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
