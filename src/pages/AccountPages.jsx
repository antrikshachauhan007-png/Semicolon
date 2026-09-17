import React, { useEffect, useState } from 'react';
import { Bell, BookOpen, CheckCircle2, Clock3, KeyRound, LifeBuoy, Save, ShieldCheck } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './account.css';

const ACTIVITY = [
  ['Scan completed', 'live-network-scan.json', 'Today, 10:24'],
  ['Report generated', 'payments.internal.pem', 'Yesterday, 16:10'],
  ['Reminder created', 'legacy-portal.crt', 'Yesterday, 09:14'],
  ['Settings updated', 'Notification preferences', '12 Sep 2026'],
];

function Shell({ eyebrow, title, children }) {
  return <div className="account-page"><TopBar /><main className="account-wrap"><span className="account-eyebrow">{eyebrow}</span><h1>{title}</h1>{children}</main></div>;
}

export function ActivityPage() {
  return <Shell eyebrow="Account" title="Profile activity"><p className="account-lead">A concise history of your scans, reports, reminders, and account changes.</p><section className="account-card"><div className="activity-list">{ACTIVITY.map(([title, detail, time]) => <div className="activity-row" key={`${title}-${time}`}><Clock3 size={16} /><div><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>)}</div></section></Shell>;
}

export function SettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState(() => ({ name: user?.name || '', email: user?.email || '', scanAlerts: true, reportSummary: true, compact: false }));
  useEffect(() => { localStorage.setItem('semicolon_settings', JSON.stringify(settings)); }, [settings]);
  const toggle = (key) => setSettings((value) => ({ ...value, [key]: !value[key] }));
  return <Shell eyebrow="Account" title="Account settings"><p className="account-lead">Manage your account details, reporting preferences, and scan notifications.</p><section className="account-card settings-card"><h2><UserIcon /> Profile</h2><label>Display name<input value={settings.name} onChange={(e) => setSettings((v) => ({ ...v, name: e.target.value }))} /></label><label>Email address<input type="email" value={settings.email} onChange={(e) => setSettings((v) => ({ ...v, email: e.target.value }))} /></label><h2><Bell size={17} /> Notifications</h2><Toggle label="Risk alerts for high and critical findings" checked={settings.scanAlerts} onChange={() => toggle('scanAlerts')} /><Toggle label="Include an executive summary with generated reports" checked={settings.reportSummary} onChange={() => toggle('reportSummary')} /><h2><ShieldCheck size={17} /> Workspace</h2><Toggle label="Use compact tables when available" checked={settings.compact} onChange={() => toggle('compact')} /><button className="account-save" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2200); }}><Save size={15} />{saved ? 'Saved' : 'Save changes'}</button></section></Shell>;
}

function UserIcon() { return <BookOpen size={17} />; }
function Toggle({ label, checked, onChange }) { return <label className="account-toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={onChange} /><i /></label>; }

export function HelpPage() {
  return <Shell eyebrow="Support" title="Help centre"><p className="account-lead">A quick guide to getting a defensible cryptographic inventory and prioritised migration plan.</p><div className="help-grid"><HelpCard icon={BookOpen} title="Getting started" text="Upload a supported certificate, key, configuration, or code file. Results are shown only after the scan finishes." /><HelpCard icon={ShieldCheck} title="Understanding risk bands" text="Critical through Safe bands help order remediation work. They are decision support, not a security guarantee." /><HelpCard icon={KeyRound} title="PQC readiness" text="Use the readiness table to focus on assets that need action, the proposed migration approach, and the suggested timeline." /><HelpCard icon={LifeBuoy} title="Need help?" text="For a production deployment, contact your security administrator or Semicolon support with the scan ID and asset name." /></div></Shell>;
}
function HelpCard({ icon: Icon, title, text }) { return <section className="account-card help-card"><Icon size={19} /><h2>{title}</h2><p>{text}</p></section>; }
