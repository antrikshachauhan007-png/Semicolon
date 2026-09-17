import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, KeyRound, FileSearch, Gauge, Share2, FileCheck2, ArrowRight,
} from 'lucide-react';
import Splash from '../components/Splash.jsx';
import TopBar from '../components/TopBar.jsx';

const CAPABILITIES = [
  { icon: FileSearch, title: 'Discover assets', desc: 'Crawl networks, endpoints, and codebases to find every certificate, key, and algorithm in use — including the ones nobody remembers deploying.' },
  { icon: KeyRound, title: 'Secure keys', desc: 'Locate unmanaged SSH and API keys, flag weak or reused ones, and track who owns them.' },
  { icon: ShieldCheck, title: 'Secure certificates', desc: 'Catch expired and soon-to-expire SSL/TLS certificates before they cause an outage.' },
  { icon: Gauge, title: 'Score quantum risk', desc: 'Grade every asset against NIST post-quantum standards so you know what to migrate first.' },
  { icon: Share2, title: 'Map dependencies', desc: 'See which services rely on which certificates and keys, so fixing one thing doesn\u2019t break another.' },
  { icon: FileCheck2, title: 'Generate compliance reports', desc: 'Export an audit-ready cryptographic bill of materials (CBOM) for every scan.' },
];

function ReadMoreBlock({ eyebrow, title, short, long }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rm-block">
      <span className="rm-eyebrow">{eyebrow}</span>
      <h3 className="rm-title">{title}</h3>
      <p className="rm-text">{short}</p>
      {open && <p className="rm-text rm-extra">{long}</p>}
      <button className="rm-btn" onClick={() => setOpen((o) => !o)}>
        {open ? 'Show less' : 'Read more'} <ArrowRight size={13} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="sentinel-home">
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=switzer@400,500,600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');

        .sentinel-home {
          --bg: #0a0d12; --surface-1: #12161d; --surface-2: #171c25;
          --border: #262e3a; --border-soft: #1b2129;
          --text-primary: #e8eaef; --text-secondary: #8a93a3; --text-faint: #545e6e;
          --gold: #c9a227; --gold-soft: rgba(201,162,39,0.14);
          --crimson: #c1503a; --teal: #3fb8af;
          background: var(--bg); color: var(--text-primary);
          font-family: 'Switzer', system-ui, sans-serif;
          min-height: 100vh;
        }
        .sentinel-home *, .sentinel-home *::before, .sentinel-home *::after { box-sizing: border-box; }
        .sh-display { font-family: 'Clash Display', sans-serif; }
        .sh-mono { font-family: 'IBM Plex Mono', monospace; }
        .sh-section { max-width: 1100px; margin: 0 auto; padding: 80px 32px; }

        /* Hero */
        .sh-hero {
          position: relative; overflow: hidden;
          padding: 110px 32px 90px; text-align: left;
          background: radial-gradient(circle at 25% 20%, #10151d 0%, var(--bg) 60%);
          border-bottom: 1px solid var(--border-soft);
        }
        .sh-hero-inner { max-width: 1100px; margin: 0 auto; position: relative; z-index: 2; }
        .sh-hero-bg { position: absolute; inset: 0; opacity: 0.35; }
        .sh-eyebrow {
          font-size: 12px; letter-spacing: 0.16em; color: var(--gold); text-transform: uppercase;
          margin-bottom: 18px; display: inline-block;
        }
        .sh-h1 { font-size: clamp(36px, 5vw, 60px); line-height: 1.1; font-weight: 600; letter-spacing: -0.01em; max-width: 780px; margin: 0 0 22px; }
        .sh-hero-sub { font-size: 16px; color: var(--text-secondary); max-width: 560px; line-height: 1.6; margin: 0 0 34px; }
        .sh-hero-actions { display: flex; gap: 14px; }
        .sh-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--gold); color: #191308; font-weight: 600; font-size: 14px;
          padding: 12px 22px; border-radius: 7px; text-decoration: none;
        }
        .sh-btn-primary:hover { filter: brightness(1.08); }
        .sh-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid var(--border); color: var(--text-primary); font-size: 14px;
          padding: 12px 22px; border-radius: 7px; text-decoration: none;
        }
        .sh-btn-secondary:hover { border-color: var(--gold); color: var(--gold); }

        /* Stats strips */
        .sh-stats { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 18px; }
        .sh-stat-box { background: var(--surface-1); border: 1px solid var(--border-soft); border-radius: 10px; padding: 26px 22px; }
        .sh-stat-label { font-size: 13px; color: var(--text-secondary); margin: 0 0 10px; }
        .sh-stat-value { font-size: 34px; font-weight: 600; margin: 0; }

        /* Why Sentinel */
        .sh-why-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 28px; margin-top: 40px; }
        .rm-block { }
        .rm-eyebrow { font-size: 11px; letter-spacing: 0.1em; color: var(--gold); text-transform: uppercase; }
        .rm-title { font-size: 19px; font-weight: 600; margin: 10px 0 10px; }
        .rm-text { font-size: 14px; line-height: 1.65; color: var(--text-secondary); margin: 0 0 8px; }
        .rm-extra { color: var(--text-primary); }
        .rm-btn {
          display: inline-flex; align-items: center; gap: 5px; margin-top: 6px;
          background: none; border: none; color: var(--gold); font-size: 13px; cursor: pointer; padding: 0;
          font-family: inherit;
        }

        /* Capabilities */
        .sh-cap-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px; margin-top: 40px; }
        .sh-cap-card { background: var(--surface-1); border: 1px solid var(--border-soft); border-radius: 10px; padding: 24px; }
        .sh-cap-icon {
          width: 38px; height: 38px; border-radius: 8px; background: var(--gold-soft); color: var(--gold);
          display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
        }
        .sh-cap-title { font-size: 15.5px; font-weight: 600; margin: 0 0 8px; }
        .sh-cap-desc { font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin: 0; }

        /* Final CTA */
        .sh-cta {
          text-align: center; padding: 90px 32px; border-top: 1px solid var(--border-soft);
          background: var(--surface-1);
        }
        .sh-cta h2 { font-size: 30px; font-weight: 600; margin: 0 0 24px; }

        .sh-footer {
          padding: 26px 32px; text-align: center; font-size: 12px; color: var(--text-faint);
          border-top: 1px solid var(--border-soft);
        }

        @media (max-width: 760px) {
          .sh-stats, .sh-why-grid, .sh-cap-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {showSplash && <Splash onFinish={() => setShowSplash(false)} />}

      <TopBar variant="public" onProfileClick={() => navigate('/dashboard')} />

      <section className="sh-hero">
        <div className="sh-hero-bg sh-mono" aria-hidden="true" />
        <div className="sh-hero-inner">
          <span className="sh-eyebrow sh-mono">CRYPTOGRAPHIC DISCOVERY &amp; RISK PLATFORM</span>
          <h1 className="sh-h1 sh-display">Every cipher in your enterprise, mapped and graded before it's a liability.</h1>
          <p className="sh-hero-sub">
            SEMICOLON discovers, analyzes, and visualizes every cryptographic asset in your
            organization — certificates, keys, and algorithms — and flags what won't survive
            a quantum-capable adversary.
          </p>
          <div className="sh-hero-actions">
            <Link to="/login" className="sh-btn-primary">Sign in <ArrowRight size={15} /></Link>
            <a href="#about" className="sh-btn-secondary">See how it works</a>
          </div>
        </div>
      </section>

      <section className="sh-section" id="glimpse">
        <div className="sh-stats">
          <div className="sh-stat-box">
            <p className="sh-stat-label">Assets scanned this demo</p>
            <p className="sh-stat-value sh-display">1,204</p>
          </div>
          <div className="sh-stat-box">
            <p className="sh-stat-label">Quantum-at-risk flagged</p>
            <p className="sh-stat-value sh-display" style={{ color: 'var(--crimson)' }}>58</p>
          </div>
          <div className="sh-stat-box">
            <p className="sh-stat-label">NIST PQC algorithms supported</p>
            <p className="sh-stat-value sh-display">12</p>
          </div>
        </div>
      </section>

      <section className="sh-section" id="about">
        <span className="sh-eyebrow sh-mono">WHY SEMICOLON</span>
        <div className="sh-why-grid">
          <ReadMoreBlock
            eyebrow="The problem"
            title="Nobody has one list"
            short="Certificates, keys, and algorithms pile up across teams, tools, and years — most enterprises can't produce a single, current inventory of their own cryptography."
            long="Weak algorithms stay in production because no one flagged them. Certificates expire without warning because no one owned the renewal. SSH keys from departed employees stay valid because no one tracked them. This isn't negligence — it's the natural result of cryptography being everyone's responsibility and no one's job."
          />
          <ReadMoreBlock
            eyebrow="The solution"
            title="One engine, one inventory"
            short="SEMICOLON scans infrastructure and codebases automatically, builds a live cryptographic inventory, and grades every asset against current and post-quantum standards."
            long="Discovery runs continuously, not as a one-time audit. Every certificate, key, and protocol gets mapped to the services that depend on it, so a fix in one place doesn't silently break another."
          />
          <ReadMoreBlock
            eyebrow="The impact"
            title="Fix it before it's urgent"
            short="Security teams get a prioritized, visual risk dashboard instead of a spreadsheet — so quantum migration becomes a plan, not a scramble."
            long="For a security or compliance team, that means a standing, auditable picture of cryptographic posture across an enterprise — the difference between finding a weak algorithm during a routine review versus during an incident."
          />
        </div>
      </section>

      <section className="sh-section" id="capabilities">
        <span className="sh-eyebrow sh-mono">CAPABILITIES</span>
        <h2 className="sh-display" style={{ fontSize: 30, margin: '10px 0 0' }}>Everything discovery and analysis needs</h2>
        <div className="sh-cap-grid">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div className="sh-cap-card" key={cap.title}>
                <div className="sh-cap-icon"><Icon size={18} /></div>
                <h3 className="sh-cap-title">{cap.title}</h3>
                <p className="sh-cap-desc">{cap.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="sh-section" id="scans">
        <span className="sh-eyebrow sh-mono">LIVE ON THIS INSTANCE</span>
        <div className="sh-stats" style={{ marginTop: 16 }}>
          <div className="sh-stat-box">
            <p className="sh-stat-label">Total scans</p>
            <p className="sh-stat-value sh-display">3,918</p>
          </div>
          <div className="sh-stat-box">
            <p className="sh-stat-label">Completed</p>
            <p className="sh-stat-value sh-display" style={{ color: 'var(--teal)' }}>3,802</p>
          </div>
          <div className="sh-stat-box">
            <p className="sh-stat-label">Running now</p>
            <p className="sh-stat-value sh-display" style={{ color: 'var(--gold)' }}>3</p>
          </div>
        </div>
      </section>

      <section className="sh-cta">
        <h2 className="sh-display">See your own cryptographic blind spots.</h2>
        <Link to="/login" className="sh-btn-primary">Sign in to Semicolon <ArrowRight size={15} /></Link>
      </section>

      <footer className="sh-footer sh-mono">
        SEMICOLON — cryptographic discovery, risk analysis, and quantum-readiness for the enterprise
      </footer>
    </div>
  );
}
