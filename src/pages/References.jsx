import React from 'react';
import TopBar from '../components/TopBar.jsx';

const SOURCES = [
  { title: 'Shared reference', url: 'https://share.google/fUbWYbNVjumRa3zOz' },
  { title: 'Shared reference', url: 'https://share.google/hJc3mc3cjogIqFIW1' },
  { title: 'Electronics (MDPI), 14(17), 3338', url: 'https://doi.org/10.3390/electronics14173338' },
  { title: 'Electronics (MDPI), 15(12), 2546', url: 'https://doi.org/10.3390/electronics15122546' },
  { title: 'Springer chapter — 978-3-030-91293-2_16', url: 'https://doi.org/10.1007/978-3-030-91293-2_16' },
  { title: 'Computers (MDPI), 15(8), 495', url: 'https://doi.org/10.3390/computers15080495' },
  { title: 'IACR ePrint 2026/1938', url: 'https://eprint.iacr.org/2026/1938' },
  { title: 'arXiv 2606.13425', url: 'https://arxiv.org/abs/2606.13425' },
  { title: 'arXiv 2604.21436', url: 'https://arxiv.org/abs/2604.21436' },
  { title: 'NIST SP 1800-38 (Draft)', url: 'https://csrc.nist.gov/publications/detail/sp/1800-38/draft' },
  { title: 'Journal of Cybersecurity, 7(1), tyab013', url: 'https://academic.oup.com/cybersecurity/article/7/1/tyab013/6289827' },
];

export default function References() {
  return (
    <div className="sentinel-refs">
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=switzer@400,500,600&display=swap');
        .sentinel-refs {
          --bg: #0a0d12; --surface-1: #12161d; --border-soft: #1b2129;
          --text-primary: #e8eaef; --text-secondary: #8a93a3; --text-faint: #545e6e; --gold: #c9a227;
          background: var(--bg); color: var(--text-primary); min-height: 100vh;
          font-family: 'Switzer', system-ui, sans-serif;
        }
        .sentinel-refs *, .sentinel-refs *::before, .sentinel-refs *::after { box-sizing: border-box; }
        .refs-wrap { max-width: 780px; margin: 0 auto; padding: 64px 32px 100px; }
        .refs-eyebrow { font-size: 12px; letter-spacing: 0.14em; color: var(--gold); text-transform: uppercase; }
        .refs-title { font-family: 'Clash Display', sans-serif; font-size: 34px; font-weight: 600; margin: 14px 0 12px; }
        .refs-note {
          font-size: 13.5px; color: var(--text-secondary); line-height: 1.7; margin: 0 0 40px;
          background: var(--surface-1); border: 1px solid var(--border-soft); border-radius: 10px; padding: 16px 18px;
        }
        .refs-list { list-style: none; margin: 0; padding: 0; counter-reset: refs; }
        .refs-list li {
          counter-increment: refs; padding: 18px 0; border-top: 1px solid var(--border-soft);
          display: flex; gap: 14px; align-items: baseline;
        }
        .refs-list li::before {
          content: '[' counter(refs) ']'; font-family: 'IBM Plex Mono', monospace; font-size: 12px;
          color: var(--gold); flex-shrink: 0;
        }
        .refs-item-title { font-size: 14px; margin: 0 0 4px; }
        .refs-item-url { font-size: 12.5px; color: var(--text-faint); word-break: break-all; }
        .refs-item-url a { color: var(--text-faint); text-decoration: none; }
        .refs-item-url a:hover { color: var(--gold); }
      `}</style>

      <TopBar variant="public" />

      <div className="refs-wrap">
        <span className="refs-eyebrow">References</span>
        <h1 className="refs-title">Sources</h1>
        <p className="refs-note">
          This bibliography is being verified — sources are cited here by URL only until each one has
          been checked and its content confirmed. Nothing on this page attributes findings, results, or
          claims to a source that hasn't been read directly.
        </p>
        <ol className="refs-list">
          {SOURCES.map((s) => (
            <li key={s.url}>
              <div>
                <p className="refs-item-title">{s.title}</p>
                <p className="refs-item-url">
                  <a href={s.url} target="_blank" rel="noopener noreferrer">{s.url}</a>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
