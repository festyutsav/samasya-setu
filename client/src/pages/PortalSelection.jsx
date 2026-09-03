import { useEffect, useRef, useState } from "react";
import JharkhandEmblem from "../components/JharkhandEmblem";

/* ============================================================
   SamasyaSetu — Landing experience
   "Every problem deserves a bridge to solutions."
   Deep-teal night hero · animated Setu bridge · scroll reveals
   ============================================================ */

const DOMAINS = [
  "Education",
  "Healthcare",
  "Agriculture",
  "Water Resources",
  "Environment",
  "Energy",
  "Urban Development",
  "Accessibility",
  "Public Administration",
  "Rural Livelihoods",
];

const HEADLINE = [
  { text: "Every", accent: false },
  { text: "problem", accent: false },
  { text: "deserves", accent: false },
  { text: "a", accent: false },
  { text: "bridge", accent: true },
  { text: "to", accent: false },
  { text: "solutions.", accent: true },
];

const JOURNEY = [
  {
    step: "01",
    title: "Raise",
    copy: "Citizens, panchayats and local bodies submit real challenges — with photos, videos, location and documents.",
  },
  {
    step: "02",
    title: "Understand",
    copy: "AI categorizes, prioritizes and de-duplicates every submission across ten domains of impact.",
  },
  {
    step: "03",
    title: "Route",
    copy: "Validated problems flow to universities matched by discipline, research expertise and innovation centres.",
  },
  {
    step: "04",
    title: "Build",
    copy: "Multidisciplinary student teams and industry partners co-create, fund, prototype and field-test solutions.",
  },
  {
    step: "05",
    title: "Impact",
    copy: "Milestones tracked, outcomes validated, dashboards lighting the way for every district of Jharkhand.",
  },
];

const portals = [
  {
    id: "citizen",
    eyebrow: "FOR COMMUNITIES",
    title: "Citizen Portal",
    copy: "Raise a challenge, add local context, and follow the journey from submission to impact.",
    icon: "◎",
    accent: "bg-[#e1f1ed] text-[#087f70]",
    action: "Share a challenge",
  },
  {
    id: "partner",
    eyebrow: "FOR INNOVATORS",
    title: "University & Industry Portal",
    copy: "Discover real-world problems, build multidisciplinary teams, and take solutions to the field.",
    icon: "✦",
    accent: "bg-[#f7ebd8] text-[#a25a1b]",
    action: "Enter workspace",
  },
  {
    id: "admin",
    eyebrow: "FOR GOVERNANCE",
    title: "Government Portal",
    copy: "Coordinate priorities, route challenges, and measure outcomes across Jharkhand.",
    icon: "⌂",
    accent: "bg-[#e2e9f4] text-[#31527c]",
    action: "Open dashboard",
  },
];

/* ---------- Reveal on scroll ---------- */

const Reveal = ({ children, delay = 0, className = "", as: Tag = "div" }) => {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-visible");
          observer.unobserve(node);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`ss-reveal ${className}`}
      style={{ "--ss-delay": `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};

/* ---------- Count-up number ---------- */

const CountUp = ({ to, suffix = "", duration = 1800 }) => {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(node);

        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(to * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
};

/* ---------- Animated Setu bridge ---------- */

const Bridge = () => (
  <svg viewBox="0 0 520 300" fill="none" className="w-full" aria-hidden="true">
    {/* deck line */}
    <line x1="30" y1="228" x2="490" y2="228" stroke="rgba(233,201,133,.28)" strokeWidth="1.5" />
    {/* pillars */}
    <path d="M160 228V150M360 228V150M260 228V96" stroke="rgba(233,201,133,.22)" strokeWidth="1.5" strokeDasharray="3 6" />
    {/* main arc — draws itself */}
    <path
      d="M50 228 C 150 60, 370 60, 470 228"
      stroke="#e9c985"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="ss-bridge-path"
    />
    {/* flowing dashes over the arc */}
    <path
      d="M50 228 C 150 60, 370 60, 470 228"
      stroke="#fff6df"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="ss-bridge-dash"
    />
    {/* travelling spark */}
    <circle r="5" fill="#fff6df">
      <animateMotion dur="5s" repeatCount="indefinite" path="M50 228 C 150 60, 370 60, 470 228" />
    </circle>
    {/* endpoints */}
    <circle cx="50" cy="228" r="7" fill="#e9c985" className="ss-float" style={{ animationDuration: "3.5s" }} />
    <circle cx="470" cy="228" r="7" fill="#e9c985" className="ss-float" style={{ animationDuration: "3.5s", animationDelay: ".6s" }} />
    <text x="50" y="266" textAnchor="middle" fill="#9dc3b8" fontSize="12" letterSpacing="3">PROBLEM</text>
    <text x="470" y="266" textAnchor="middle" fill="#9dc3b8" fontSize="12" letterSpacing="3">SOLUTION</text>
    <text x="260" y="40" textAnchor="middle" fill="#e9c985" fontSize="13" letterSpacing="6" fontStyle="italic" fontFamily="Fraunces, serif">SETU</text>
  </svg>
);

/* ---------- Domain marquee ---------- */

const Marquee = () => (
  <div className="ss-marquee overflow-hidden border-b border-white/10 bg-[#062722] py-3.5">
    <div className="ss-marquee-track items-center gap-10 pr-10">
      {[0, 1].map((dup) => (
        <div key={dup} className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={dup === 1}>
          {DOMAINS.map((domain) => (
            <span key={`${dup}-${domain}`} className="flex items-center gap-10 whitespace-nowrap text-[13px] font-semibold uppercase tracking-[0.22em] text-[#e9c985]/90">
              {domain}
              <span className="text-[#e9c985]/40">✦</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

/* ============================================================ */

const PortalSelection = ({ onSelectPortal }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;

      ticking = true;

      requestAnimationFrame(() => {
        setScrolled((prev) => {
          const next = window.scrollY > 24;

          return next === prev ? prev : next;
        });

        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToPortals = () =>
    document.getElementById("portals")?.scrollIntoView({ behavior: "smooth" });

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#173d3a]">
      {/* ============ DARK NIGHT WRAPPER ============ */}
      <div className="ss-grain relative overflow-hidden bg-gradient-to-b from-[#031a17] via-[#0b514a] to-[#0e5d54] text-[#f4f7f4]">
        {/* atmosphere — pre-softened gradient orbs (no filter blur) */}
        <div className="ss-orb left-[-6rem] top-[-4rem] h-80 w-80" style={{ "--orb-color": "rgba(15,122,108,.55)" }} />
        <div className="ss-orb right-[-8rem] top-24 h-[26rem] w-[26rem]" style={{ "--orb-color": "rgba(233,201,133,.16)", animationDelay: "-5s" }} />
        <div className="ss-orb bottom-[-6rem] left-1/3 h-72 w-72" style={{ "--orb-color": "rgba(15,122,108,.45)", animationDelay: "-9s" }} />

        {/* marquee */}
        <div className="relative">
          <Marquee />
        </div>

        {/* nav — solid background on scroll; animating backdrop-blur
            while the orbs move underneath caused constant repaints */}
        <nav className={`relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 transition-colors duration-500 lg:px-10 ${scrolled ? "bg-[#031a17]/85 shadow-lg shadow-black/20" : ""}`}>
          <div className="ss-enter flex items-center gap-3" style={{ "--ss-delay": "100ms" }}>
            <JharkhandEmblem className="h-11 w-11 shrink-0 drop-shadow" />
            <div>
              <p className="font-display text-lg font-semibold tracking-tight">SamasyaSetu</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9dc3b8]">Problems to solutions</p>
            </div>
          </div>
          <span className="ss-enter hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-[#cfe4dc] backdrop-blur-sm sm:block" style={{ "--ss-delay": "220ms" }}>
            Jharkhand’s innovation network
          </span>
        </nav>

        {/* ============ HERO ============ */}
        <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pt-16">
          <div>
            <p className="ss-enter mb-7 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-[#e9c985]" style={{ "--ss-delay": "250ms" }}>
              <span className="h-px w-10 bg-[#e9c985]/70" />
              A shared platform for shared progress
            </p>

            <h1 className="font-display max-w-3xl text-5xl font-medium leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
              {HEADLINE.map((word, i) => (
                <span
                  key={i}
                  className="ss-word mr-[0.26em]"
                  style={{ "--ss-delay": `${450 + i * 110}ms` }}
                >
                  {word.accent ? (
                    <span className="ss-shimmer italic">{word.text}</span>
                  ) : (
                    word.text
                  )}
                </span>
              ))}
            </h1>

            <p className="ss-enter mt-8 max-w-xl text-lg leading-8 text-[#cfe4dc]" style={{ "--ss-delay": "1350ms" }}>
              SamasyaSetu connects citizens, universities, government and industry —
              turning Jharkhand’s most pressing challenges into practical, measurable,
              real-world solutions.
            </p>

            <div className="ss-enter mt-10 flex flex-wrap items-center gap-4" style={{ "--ss-delay": "1500ms" }}>
              <button
                onClick={scrollToPortals}
                className="group relative overflow-hidden rounded-full bg-[#e9c985] px-8 py-4 text-sm font-bold text-[#032621] shadow-xl shadow-[#e9c985]/20 transition-transform duration-300 hover:scale-[1.03]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Choose your portal
                  <span className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
                </span>
              </button>
              <a
                href="#journey"
                className="rounded-full border border-white/25 px-8 py-4 text-sm font-bold text-[#f4f7f4] backdrop-blur-sm transition hover:border-[#e9c985]/60 hover:text-[#e9c985]"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* bridge visual */}
          <div className="ss-enter relative" style={{ "--ss-delay": "700ms" }}>
            <div className="ss-float relative rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur-md" style={{ "--ss-delay": "1s" }}>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#e9c985]/15 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-[#f4d99d]">
                  THE SETU EFFECT
                </span>
                <span className="ss-spin-slow inline-block text-xl text-[#e9c985]">✳</span>
              </div>
              <div className="mt-6">
                <Bridge />
              </div>
            </div>

            {/* floating chips */}
            <div className="ss-float absolute -left-4 top-6 hidden rounded-2xl border border-[#dce5dd] bg-white px-4 py-3 shadow-xl sm:block" style={{ "--ss-delay": ".4s" }}>
              <p className="text-[10px] font-bold tracking-[0.16em] text-[#899892]">AI ENGINE</p>
              <p className="text-sm font-bold text-[#0b514a]">Categorize · Dedupe · Route</p>
            </div>
            <div className="ss-float absolute -bottom-5 -right-3 hidden rounded-2xl border border-white/10 bg-[#062722] px-4 py-3 shadow-xl sm:block" style={{ "--ss-delay": "1.2s" }}>
              <p className="text-[10px] font-bold tracking-[0.16em] text-[#9dc3b8]">CITIZEN → UNIVERSITY → INDUSTRY</p>
              <p className="text-sm font-bold text-[#e9c985]">One connected ecosystem</p>
            </div>
          </div>
        </section>

        {/* ============ STAT BAND ============ */}
        <section className="relative z-10 border-t border-white/10 bg-[#031a17]/70">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-6 py-12 sm:grid-cols-4 lg:px-10">
            {[
              { value: 24, suffix: "", label: "districts of Jharkhand, one network" },
              { value: 10, suffix: "+", label: "domains of societal impact" },
              { value: 3, suffix: "", label: "portals, one shared purpose" },
              { value: 100, suffix: "%", label: "community-driven problems" },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 120} className="text-center">
                <p className="font-display text-4xl font-semibold text-[#e9c985] sm:text-5xl">
                  <CountUp to={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mx-auto mt-2 max-w-40 text-xs leading-5 text-[#9dc3b8]">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </section>
      </div>

      {/* ============ JOURNEY ============ */}
      <section id="journey" className="relative overflow-hidden px-6 py-24 lg:px-10">
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#d9eee6] blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <Reveal className="mb-16 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a25a1b]">The Setu journey</p>
            <h2 className="font-display mx-auto mt-3 max-w-2xl text-4xl font-medium tracking-tight text-[#173d3a] sm:text-5xl">
              From a citizen’s observation to a{" "}
              <span className="italic text-[#b56b2a]">measurable outcome.</span>
            </h2>
          </Reveal>

          <div className="relative">
            {/* animated spine */}
            <span className="ss-timeline-line absolute left-[27px] top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-[#0b514a] via-[#e9c985] to-[#0b514a]/30 sm:left-1/2" />

            <div className="space-y-12">
              {JOURNEY.map((item, i) => (
                <Reveal key={item.step} delay={i * 140} className="relative">
                  <div className={`flex flex-col gap-4 pl-16 sm:w-1/2 sm:pl-0 ${i % 2 === 0 ? "sm:pr-14 sm:text-right" : "sm:ml-auto sm:pl-14"}`}>
                    <span className={`absolute left-0 top-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b514a] font-display text-lg font-semibold text-[#e9c985] shadow-lg shadow-[#0b514a]/25 sm:top-0 ${i % 2 === 0 ? "sm:-right-7 sm:left-auto" : "sm:-left-7"}`}>
                      {item.step}
                    </span>
                    <h3 className="font-display text-2xl font-semibold text-[#173d3a]">{item.title}</h3>
                    <p className="text-[15px] leading-7 text-[#5c6f69]">{item.copy}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ PORTALS ============ */}
      <section id="portals" className="border-t border-[#e3e9e3] bg-white/60 px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a25a1b]">Choose your path</p>
              <h2 className="font-display mt-3 text-4xl font-medium tracking-tight text-[#173d3a] sm:text-5xl">
                Be part of the <span className="italic text-[#0b6b60]">solution.</span>
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#74827d]">
              One ecosystem, connected by purpose. Select the space that fits your role.
            </p>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-3">
            {portals.map((portal, i) => (
              <Reveal key={portal.id} delay={i * 150}>
                <button
                  onClick={() => onSelectPortal(portal.id)}
                  className="ss-card group flex h-full w-full flex-col rounded-3xl border border-[#e0e7e1] bg-white p-8 text-left transition-all duration-300 hover:-translate-y-2 hover:border-[#b9d3c9] hover:shadow-2xl hover:shadow-[#174f47]/15"
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-semibold transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${portal.accent}`}>
                    {portal.icon}
                  </div>
                  <p className="mt-8 text-[10px] font-bold tracking-[0.22em] text-[#899892]">{portal.eyebrow}</p>
                  <h3 className="font-display mt-2 text-2xl font-semibold tracking-tight text-[#173d3a]">{portal.title}</h3>
                  <p className="mt-3 min-h-14 flex-1 text-sm leading-6 text-[#687b75]">{portal.copy}</p>
                  <span className="mt-8 flex items-center gap-2 text-sm font-bold text-[#0b6b60]">
                    {portal.action}
                    <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-[#e3e9e3] bg-[#f7f8f5] px-6 py-10 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-[#8a9791] sm:flex-row">
          <p>A demand-driven innovation ecosystem for communities across Jharkhand.</p>
          <p className="flex items-center gap-2 font-display italic text-[#0b6b60]">
            <JharkhandEmblem className="h-5 w-5 shrink-0" />
            SamasyaSetu — problems to solutions.
          </p>
        </div>
      </footer>
    </main>
  );
};

export default PortalSelection;
