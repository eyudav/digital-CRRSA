import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Building2, CalendarCheck, FileSignature, Languages, Lock, ScrollText, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/data/seed";
import { useAuth } from "@/context/AuthContext";
const HIGHLIGHTS = [
    { icon: FileSignature, title: "Apply online", body: "Submit any of 8 civil registration services in minutes — no queue." },
    { icon: CalendarCheck, title: "Book your slot", body: "Reserve an office appointment with a real-time queue number." },
    { icon: ScrollText, title: "Track in real time", body: "Follow every status change from submitted to ready for collection." },
    { icon: Lock, title: "Secure & auditable", body: "Role-based access, audit logs and verifiable digital records." },
];
const STEPS = [
    { n: "01", title: "Create your account", body: "Register with your national ID and verified phone number." },
    { n: "02", title: "Choose a service", body: "Pick from birth, marriage, residency and other certificates." },
    { n: "03", title: "Submit & schedule", body: "Upload documents and book an appointment if needed." },
    { n: "04", title: "Track & collect", body: "Receive notifications and pick up your certificate." },
];
const Index = () => {
    const { user } = useAuth();
    return (<div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#services" className="hover:text-foreground">Services</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#trust" className="hover:text-foreground">Security</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to={user.role === 'citizen' ? '/citizen' : user.role === 'admin' ? '/staff/admin/users' : '/staff'}>Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero text-primary-foreground">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-accent/15 blur-3xl"/>
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-[380px] w-[380px] rounded-full bg-primary-glow/20 blur-3xl"/>
        <div className="container relative grid gap-12 py-20 md:py-28 lg:grid-cols-12">
          <div className="lg:col-span-7 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground/80">
              <Sparkles className="h-3.5 w-3.5 text-accent"/> A new era of civil services
            </div>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-balance md:text-6xl lg:text-7xl">
              Civil registration, <span className="text-accent">reimagined</span> for every citizen.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-primary-foreground/75">
              Digital CRRSA brings birth, marriage, residency and identity services online. Apply, upload documents, book appointments and track your certificate - all from one secure place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-elegant">
                  <Link to={user.role === 'citizen' ? '/citizen' : user.role === 'admin' ? '/staff/admin/users' : '/staff'}>Return to Dashboard <ArrowRight className="ml-1 h-4 w-4"/></Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-elegant">
                    <Link to="/register">Create your account <ArrowRight className="ml-1 h-4 w-4"/></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                    <Link to="/login">I already have an account</Link>
                  </Button>
                </>
              )}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-primary-foreground/65">
              <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-accent"/> Government-grade security</div>
              <div className="flex items-center gap-2"><Languages className="h-4 w-4 text-accent"/> English & Amharic-ready</div>
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-accent"/> Nationwide CRRSA offices</div>
            </div>
          </div>

          {/* Mock dashboard card */}
          <div className="lg:col-span-5">
            <div className="relative animate-fade-in rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-5 backdrop-blur-md shadow-elegant">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/60">Application</p>
                  <p className="font-display text-lg">CRC-2025-001042</p>
                </div>
                <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent">Under review</span>
              </div>
              <div className="mt-5 space-y-3">
                {[
            { label: "Submitted", done: true },
            { label: "Documents verified", done: true },
            { label: "Officer review", done: false, current: true },
            { label: "Ready for collection", done: false },
        ].map((s, i) => (<div key={i} className="flex items-center gap-3">
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${s.done ? "bg-accent text-accent-foreground" : s.current ? "border border-accent text-accent" : "border border-primary-foreground/20 text-primary-foreground/50"}`}>{i + 1}</span>
                    <span className={`text-sm ${s.done ? "text-primary-foreground" : s.current ? "text-primary-foreground" : "text-primary-foreground/50"}`}>{s.label}</span>
                  </div>))}
              </div>
              <div className="mt-5 rounded-xl bg-background/95 p-4 text-foreground">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Next appointment</p>
                <p className="mt-1 font-display text-base font-semibold">Bole Sub-City · Friday 10:00</p>
                <p className="mt-1 text-sm text-muted-foreground">Queue position #24 · ~25 min wait</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => (<div key={h.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-elegant">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-grad text-primary-foreground">
                <h.icon className="h-5 w-5"/>
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{h.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{h.body}</p>
            </div>))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-secondary/40 py-20">
        <div className="container">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Services</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">Eight services. One trusted portal.</h2>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">From birth and marriage certificates to residency transfers — request what you need without leaving home.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (<div key={s.id} className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">{s.category}</p>
                <h3 className="mt-2 font-display text-lg font-semibold">{s.name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                <p className="mt-4 text-xs text-muted-foreground">~{s.processingDays} days · {s.fee} ETB</p>
              </div>))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">How it works</p>
        <h2 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl">A simpler path from application to certificate.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (<div key={s.n} className="rounded-2xl bg-cream-grad p-6 ring-1 ring-border">
              <p className="font-display text-3xl font-semibold text-primary">{s.n}</p>
              <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </div>))}
        </div>
      </section>

      {/* Trust band */}
      <section id="trust" className="bg-hero py-20 text-primary-foreground">
        <div className="container grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Built for trust</p>
            <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">Security and accountability at every step.</h2>
            <p className="mt-4 max-w-xl text-primary-foreground/75">Role-based access for citizens, staff and administrators. Every approval, document verification and certificate issuance is logged and auditable.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {user ? (
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to={user.role === 'citizen' ? '/citizen' : user.role === 'admin' ? '/staff/admin/users' : '/staff'}>Dashboard</Link></Button>
              ) : (
                <>
                  <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/register">Create an account</Link></Button>
                  <Button asChild variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"><Link to="/login">Staff sign in</Link></Button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
            { k: "8", l: "Digital services" },
            { k: "100%", l: "Audit-logged actions" },
            { k: "24/7", l: "Online application" },
            { k: "<5d", l: "Average turnaround" },
        ].map((stat) => (<div key={stat.l} className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-5 backdrop-blur">
                <p className="font-display text-3xl font-semibold text-accent">{stat.k}</p>
                <p className="mt-1 text-sm text-primary-foreground/70">{stat.l}</p>
              </div>))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <Logo />
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Digital CRRSA · Civil Registration & Certification Agency</p>
        </div>
      </footer>
    </div>);
};
export default Index;
