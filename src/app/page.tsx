"use client";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-app-bg dark:bg-dark-bg transition-colors">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-app-border dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--text-primary)] rounded-lg flex items-center justify-center">
              <span className="text-[var(--bg-color)] font-bold text-sm">H</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">HireDesk</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 lg:px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge variant="accent" className="mb-6">Empowering Modern Teams</Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-tight mb-8">
            Hire the best talent with{" "}
            <span className="text-brand">confidence</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-primary)]-sub dark:text-dark-text-sub max-w-2xl mx-auto mb-10">
            Create professional assessments, monitor tests in real-time, and make data-driven hiring decisions with our all-in-one assessment platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">Start Free Trial →</Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">Explores Features</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 lg:px-8 bg-app-bg-subtle dark:bg-dark-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
              Everything you need to hire better
            </h2>
            <p className="text-[var(--text-primary)]-sub dark:text-dark-text-sub max-w-xl mx-auto">
              From advanced proctoring to detailed analytics, we provide the tools to evaluate candidates fairly and efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "📝",
                title: "Rich Question Types",
                description: "MCQ, coding, fill-in-blanks, and text responses — create diverse assessments for any technical or non-technical role.",
              },
              {
                icon: "🔒",
                title: "Advanced Proctoring",
                description: "Tab-switch detection, fullscreen enforcement, and copy-paste blocking to ensure assessment integrity.",
              },
              {
                icon: "⚡",
                title: "Real-time Monitoring",
                description: "Watch candidate progress live and receive instant alerts for rule violations or suspicious activity.",
              },
              {
                icon: "📊",
                title: "Smart Analytics",
                description: "Deep insights into score distributions, question difficulty, and overall candidate performance metrics.",
              },
              {
                icon: "🎯",
                title: "Automated Scoring",
                description: "Save time with instant scoring for objective questions while using intuitive tools for manual review.",
              },
              {
                icon: "📧",
                title: "Streamlined Invites",
                description: "Easily manage candidate pools and send unique, secure test links with custom expiration settings.",
              },
            ].map((feature, i) => (
              <Card key={i} hover className="flex flex-col h-full">
                <span className="text-4xl mb-6 block">{feature.icon}</span>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{feature.title}</h3>
                <p className="text-[var(--text-primary)]-sub dark:text-dark-text-sub flex-1">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">How it works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { step: "01", title: "Build", desc: "Create assessments from your custom question bank" },
              { step: "02", title: "Invite", desc: "Send secure, unique links to your candidates" },
              { step: "03", title: "Monitor", desc: "Track progress and violations in real-time" },
              { step: "04", title: "Hire", desc: "Review detailed reports and make informed decisions" },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="w-14 h-14 bg-[var(--text-primary)] text-[var(--bg-color)] rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-primary)]-sub dark:text-dark-text-sub">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 lg:px-8 bg-app-bg-subtle dark:bg-dark-surface/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
              Simple, transparent pricing
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Free", price: "$0", features: ["5 tests/month", "50 candidates", "Basic proctoring", "Email support"], cta: "Get Started" },
              { name: "Pro", price: "$49", features: ["Unlimited tests", "500 candidates/month", "Advanced proctoring", "Priority support", "Analytics dashboard"], cta: "Start Trial", featured: true },
              { name: "Enterprise", price: "Custom", features: ["Unlimited everything", "Custom integrations", "Dedicated support", "SLA guarantee", "SSO access"], cta: "Contact Sales" },
            ].map((plan) => (
              <Card key={plan.name} className={`flex flex-col ${plan.featured ? "border-brand ring-2 ring-brand/10" : ""}`}>
                {plan.featured && <Badge variant="accent" className="mb-4 self-start">Most Popular</Badge>}
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-4 mb-8">
                  <span className="text-4xl font-bold text-[var(--text-primary)]">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-[var(--text-primary)]-sub dark:text-dark-text-sub">/month</span>}
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-sm text-[var(--text-primary)]-sub dark:text-dark-text-sub flex items-center gap-3">
                      <span className="text-success text-lg">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.featured ? "primary" : "secondary"} className="w-full">
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-app-border dark:border-dark-border py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--text-primary)] rounded-lg flex items-center justify-center">
              <span className="text-[var(--bg-color)] font-bold text-sm">H</span>
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">HireDesk</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-[var(--text-primary)]-sub dark:text-dark-text-sub">
            <Link href="#" className="hover:text-[var(--text-primary)] dark:hover:text-dark-text">Privacy Policy</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] dark:hover:text-dark-text">Terms of Service</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] dark:hover:text-dark-text">Contact</Link>
          </div>
          <p className="text-sm text-[var(--text-primary)]-sub dark:text-dark-text-sub">
            © 2024 HireDesk. Built for efficiency.
          </p>
        </div>
      </footer>
    </div>
  );
}
