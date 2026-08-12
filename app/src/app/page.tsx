import Link from "next/link";
import { IconArrowRight, IconChart, IconShield, IconSparkles } from "@/components/icons";

function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }}>
      <img src="/branding/logo-gold.png" alt="Pilates With Neelam" className="brand-logo-img" />
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
        <div className="brand-emblem mb-7">
          <img src="/branding/logo-gold.png" alt="Pilates With Neelam" className="brand-logo-img" />
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
            className="inline-flex items-center gap-2 bg-gradient-to-br from-[#c9975a] to-[#9a7338] text-white font-bold text-sm rounded-full px-7 py-3.5 shadow-xl shadow-[#c9975a]/30 hover:shadow-2xl hover:-translate-y-0.5 transition"
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
