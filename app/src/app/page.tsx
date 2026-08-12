import Link from "next/link";
import { IconArrowRight, IconChart, IconShield, IconSparkles } from "@/components/icons";

function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
        <path d="M12 20s7-3.5 7-9V5.5L12 3 5 5.5V11c0 5.5 7 9 7 9Z" />
        <path d="M12 20V8.5M12 8.5C10.5 7.5 8.8 7.5 7.5 8M12 8.5c1.5-1 3.2-1 4.5-.5" />
      </svg>
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col landing-hero">
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="brand-wordmark text-white text-lg">
            <span className="pw">Pilates With</span>
            <span className="neelam">Neelam</span>
          </span>
        </div>
        <Link
          href="/login"
          className="text-sm font-semibold text-white/85 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-5 py-2 transition"
        >
          Sign in
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#b05877] to-[#8f3153] flex items-center justify-center mb-7 shadow-2xl shadow-[#8f3153]/40">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <path d="M12 20s7-3.5 7-9V5.5L12 3 5 5.5V11c0 5.5 7 9 7 9Z" />
            <path d="M12 20V8.5M12 8.5C10.5 7.5 8.8 7.5 7.5 8M12 8.5c1.5-1 3.2-1 4.5-.5" />
          </svg>
        </div>
        <p className="text-[#e8c4a8] font-semibold tracking-[0.22em] uppercase text-xs mb-4">
          Private studio · Mat &amp; Reformer
        </p>
        <h1 className="text-4xl sm:text-6xl font-semibold text-white leading-[1.05] tracking-tight max-w-3xl">
          Pilates With <span className="italic text-[#e8c4a8]">Neelam</span>
        </h1>
        <p className="mt-5 text-white/70 max-w-xl text-base leading-relaxed">
          Thoughtfully guided pilates for every body. Small classes, personal
          attention, and a practice that grows with you.
        </p>
        <div className="flex flex-wrap gap-3 mt-9">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-gradient-to-br from-[#b05877] to-[#8f3153] text-white font-bold text-sm rounded-full px-7 py-3.5 shadow-xl shadow-[#8f3153]/35 hover:shadow-2xl hover:-translate-y-0.5 transition"
          >
            Enter your studio <IconArrowRight size={16} />
          </Link>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-12">
          {[
            [IconSparkles, "Personalized cues"],
            [IconChart, "Progress tracking"],
            [IconShield, "Private & secure"],
          ].map(([Icon, label]) => (
            <div
              key={label as string}
              className="bg-white/8 border border-white/12 rounded-full px-5 py-3 flex items-center gap-2 text-sm font-semibold text-white/90 backdrop-blur"
            >
              <Icon /> {label as string}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
