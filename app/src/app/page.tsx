import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col landing-hero">
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center text-lg shadow-lg shadow-purple-500/30">
            🧘
          </div>
          <span className="font-extrabold text-sm tracking-wide text-white">
            Pilates<span className="text-[#7ce0c9]">Studio</span>
          </span>
        </div>
        <Link
          href="/login"
          className="text-sm font-semibold text-white/85 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg px-4 py-2 transition"
        >
          Sign in
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center text-3xl mb-6 shadow-xl shadow-purple-500/40">
          🧘
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight max-w-3xl">
          AI-Enhanced Pilates Studio
        </h1>
        <p className="mt-4 text-white/70 max-w-xl text-base leading-relaxed">
          Movement intelligence powered by instructor observations. No cameras.
          No wearables. Your studio, supercharged.
        </p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link
            href="/login"
            className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white font-bold text-sm rounded-xl px-6 py-3 shadow-lg shadow-purple-600/30 hover:shadow-xl hover:-translate-y-0.5 transition"
          >
            Sign in to your studio →
          </Link>
        </div>
        <div className="flex gap-3 mt-12">
          {[
            ["🤖", "AI Cues"],
            ["📊", "Progress"],
            ["🔒", "Private"],
          ].map(([icon, label]) => (
            <div
              key={label}
              className="bg-white/8 border border-white/12 rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-semibold text-white/90 backdrop-blur"
            >
              <span className="text-base">{icon}</span> {label}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
