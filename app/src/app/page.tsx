import Link from "next/link";
import {
  IconArrowRight,
  IconChart,
  IconInstagram,
  IconShield,
  IconSparkles,
} from "@/components/icons";
import FirstVisitJourney from "@/components/journey/FirstVisitJourney";

const INSTAGRAM_URL = "https://www.instagram.com/pilateswithneelam";

function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/branding/logo-gold.png" alt="Pilates With Neelam" className="brand-logo-img" />
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="lp-shell">
      <header className="lp-header">
        <Link href="/" className="lp-brand" aria-label="Pilates With Neelam home">
          <BrandMark />
          <span className="brand-wordmark text-white text-lg">
            <span className="pw">Pilates With</span>
            <span className="neelam">Neelam</span>
          </span>
        </Link>
        <nav className="lp-nav" aria-label="Primary">
          <a href="#instructor">Instructor</a>
          <a href="#how">How it works</a>
          <Link href="/login" className="lp-signin">
            Sign in
          </Link>
        </nav>
      </header>

      <main className="lp-main">
        <section className="lp-grid">
          <div className="lp-copy">
            <p className="lp-eyebrow">
              <IconSparkles size={13} /> Private studio · Mat &amp; Reformer
            </p>
            <h1 className="lp-h1">
              Your <span className="lp-grad-gold">first class</span> starts with a{" "}
              <span className="lp-grad-cool">2&#8209;minute assessment</span>.
            </h1>
            <p className="lp-lede">
              Thoughtfully guided pilates for every body. Answer a few questions and
              we&rsquo;ll match you to the right class — so Neelam knows exactly how to cue
              you before you arrive.
            </p>
            <div className="lp-ctas" id="begin-journey">
              <Link href="/assessment?from=home" className="lp-cta-primary">
                <IconSparkles size={16} /> Begin assessment
              </Link>
            </div>
            <div className="lp-chips">
              {[
                [IconSparkles, "Personalized cues"],
                [IconChart, "Progress tracking"],
                [IconShield, "Private & secure"],
              ].map(([Icon, label]) => (
                <span key={label as string} className="lp-chip">
                  <Icon size={16} /> {label as string}
                </span>
              ))}
            </div>
          </div>

          <aside className="lp-card-wrap" id="instructor">
            <article className="lp-card">
              <div className="lp-card-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/neelam/neelam-portrait.jpg"
                  alt="Neelam, your pilates instructor"
                  className="lp-card-img"
                />
                <div className="lp-card-photo-fade" />
                <div className="lp-card-id">
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lp-ig"
                    aria-label="Neelam on Instagram"
                  >
                    <IconInstagram size={13} /> @pilateswithneelam
                  </a>
                  <span className="lp-card-name">Neelam</span>
                </div>
              </div>
              <div className="lp-card-body">
                <h2 className="lp-card-title">
                  Welcome! Your <span className="lp-grad-gold">first class</span> starts
                  with a <span className="lp-grad-cool">2&#8209;minute assessment</span>.
                </h2>
                <p className="lp-card-sub">Guided by Neelam, personally</p>
                <p className="lp-card-text">
                  Small groups, private sessions and cues tailored to how you move today —
                  never one-size-fits-all instruction.
                </p>
                <div className="lp-card-actions">
                  <Link href="/assessment?from=hero-card" className="lp-cta-primary lp-cta-sm">
                    Begin Now
                  </Link>
                  <Link href="/login" className="lp-cta-ghost lp-cta-sm">
                    Skip
                  </Link>
                </div>
              </div>
            </article>
          </aside>
        </section>

        <section className="lp-how" id="how" aria-labelledby="how-title">
          <p className="lp-eyebrow lp-eyebrow-center">
            <IconSparkles size={13} /> How it works
          </p>
          <h2 className="lp-h2" id="how-title">
            Three steps to your <span className="lp-grad-gold">first class</span>
          </h2>
          <div className="fj-flow lp-flow">
            {[
              { icon: IconSparkles, label: "Quick Assessment", note: "2 minutes" },
              { icon: IconChart, label: "Class match", note: "Personalized" },
              { icon: IconArrowRight, label: "Book & move", note: "Anytime" },
            ].map(({ icon: Icon, label, note }, i) => (
              <div className="fj-flow-node" key={label} style={{ animationDelay: `${i * 0.15}s` }}>
                <span className="fj-flow-icon">
                  <Icon size={18} />
                </span>
                <span className="fj-flow-label">{label}</span>
                <span className="fj-flow-note">{note}</span>
                {i < 2 && <span className="fj-flow-link" aria-hidden />}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <span>© {new Date().getFullYear()} Pilates With Neelam</span>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="lp-footer-ig"
        >
          <IconInstagram size={14} /> Follow the practice
        </a>
      </footer>

      <FirstVisitJourney />
    </div>
  );
}
