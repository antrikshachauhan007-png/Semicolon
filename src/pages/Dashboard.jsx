import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import Splash from '../components/Splash.jsx';
import ProfileMenu from '../components/ProfileMenu.jsx';
import {
  ShieldAlert, Database, Gauge, Lightbulb, History, Bell, FileText,
  Upload, RefreshCw, Moon, Sun, ChevronDown, ChevronRight, ArrowRight,
  FileSearch, Loader2, Download,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// One unified 5-band risk model (Safe / Low / Moderate / High / Critical)
// drives every section below — the topology graph, risk breakdown, risk
// dashboard, bar graph, inventory, and PQC readiness all read from the same
// FINDINGS list, so a given asset's color and label never disagree between
// sections the way separate mock datasets used to.
// ---------------------------------------------------------------------------
const BAND_COLOR = { safe: '#3fb8af', low: '#5b8ba8', moderate: '#c9a227', high: '#d9772e', critical: '#c1503a' };
const BAND_COLOR_LIGHT = { safe: '#227a70', low: '#3f6a85', moderate: '#9c7a14', high: '#b8631f', critical: '#a63f2b' };
const BAND_LABEL = { safe: 'Safe', low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical' };
const BAND_RANK = { critical: 4, high: 3, moderate: 2, low: 1, safe: 0 };
const BAND_ORDER = ['critical', 'high', 'moderate', 'low', 'safe'];
const BAND_STATUS = { critical: 'Urgent migration', high: 'Urgent migration', moderate: 'Plan migration', low: 'Monitor', safe: 'Safe' };
const BAND_DEADLINE = { critical: '30 days', high: '60 days', moderate: '180 days', low: 'Next review cycle', safe: '—' };

const NAV_SECTIONS = [
  {
    key: 'risk-analysis', label: 'Risk Analysis', icon: ShieldAlert,
    children: [
      { key: 'breakdown', label: 'Risk Breakdown', anchor: 'sec-risk-breakdown' },
      { key: 'topology', label: 'Cryptographic Asset Topology', anchor: 'sec-topology' },
      { key: 'dashboard', label: 'Risk Dashboard', anchor: 'sec-risk-dashboard' },
      { key: 'bargraph', label: 'Risk Bar Graph', anchor: 'sec-risk-bar-graph' },
    ],
  },
  { key: 'inventory', label: 'Crypto Inventory', icon: Database, anchor: 'sec-inventory' },
  { key: 'pqc', label: 'PQC Readiness', icon: Gauge, anchor: 'sec-pqc' },
  { key: 'recommend', label: 'Recommendation Engine', icon: Lightbulb, anchor: 'sec-recommend' },
  { key: 'history', label: 'Scans & Reminders', icon: History, anchor: 'sec-history' },
  { key: 'reports', label: 'Reports', icon: FileText, anchor: 'sec-reports' },
];

// Mock cryptographic-asset dependency graph — node risk values are kept in
// sync with FINDINGS below wherever the same asset appears in both.
const GRAPH_NODES = [
  { id: 'ca-root', name: 'Root CA', type: 'ca', risk: 'safe' },
  { id: 'cert-api', name: 'api.semicolon.internal', type: 'cert', risk: 'safe' },
  { id: 'cert-pay', name: 'payments.internal', type: 'cert', risk: 'critical' },
  { id: 'key-ssh-1', name: 'deploy-key-01', type: 'key', risk: 'high' },
  { id: 'key-ssh-2', name: 'legacy-build-key', type: 'key', risk: 'critical' },
  { id: 'svc-auth', name: 'auth-service', type: 'service', risk: 'high' },
  { id: 'svc-payments', name: 'payments-service', type: 'service', risk: 'critical' },
  { id: 'svc-gateway', name: 'api-gateway', type: 'service', risk: 'moderate' },
  { id: 'proto-tls13', name: 'TLS 1.3', type: 'protocol', risk: 'safe' },
  { id: 'proto-tls10', name: 'TLS 1.0', type: 'protocol', risk: 'high' },
  { id: 'cert-internal', name: 'internal-mesh.pem', type: 'cert', risk: 'moderate' },
  { id: 'key-kms', name: 'kms-master-key', type: 'key', risk: 'safe' },
  { id: 'svc-db', name: 'database-proxy', type: 'service', risk: 'safe' },
  { id: 'cert-legacy', name: 'legacy-portal.crt', type: 'cert', risk: 'critical' },
  { id: 'svc-portal', name: 'legacy-portal', type: 'service', risk: 'critical' },
  { id: 'proto-ssh2', name: 'SSH-2 RSA-1024', type: 'protocol', risk: 'critical' },
];
const GRAPH_LINKS = [
  { source: 'svc-gateway', target: 'cert-api' }, { source: 'cert-api', target: 'ca-root' },
  { source: 'svc-auth', target: 'proto-tls13' }, { source: 'svc-payments', target: 'cert-pay' },
  { source: 'cert-pay', target: 'ca-root' }, { source: 'svc-payments', target: 'proto-tls10' },
  { source: 'svc-payments', target: 'key-ssh-2' }, { source: 'svc-gateway', target: 'svc-auth' },
  { source: 'svc-gateway', target: 'svc-payments' }, { source: 'svc-db', target: 'key-kms' },
  { source: 'svc-gateway', target: 'svc-db' }, { source: 'svc-portal', target: 'cert-legacy' },
  { source: 'cert-legacy', target: 'proto-ssh2' }, { source: 'svc-portal', target: 'key-ssh-1' },
  { source: 'cert-internal', target: 'ca-root' }, { source: 'svc-db', target: 'cert-internal' },
];

// Individual findings, shaped like the real scanner's output. Confidence and
// risk band are deliberately separate — one says "how sure are we this is
// real", the other says "how urgent is it" — matching the actual pipeline.
const FINDINGS = [
  { id: 'f001', asset: 'payments.internal', type: 'Certificate', algorithm: 'RSA-2048', confidence: 0.93, location: 'src/tls/payments.pem', shorVulnerable: true, band: 'critical', recommendation: { primary: 'ML-KEM-768', fallback: 'ML-KEM-1024 (hybrid w/ X25519)', effort: 'Medium' } },
  { id: 'f002', asset: 'legacy-portal.crt', type: 'Certificate', algorithm: 'RSA-1024', confidence: 0.91, location: 'infra/legacy-portal.crt', shorVulnerable: true, band: 'critical', recommendation: { primary: 'ML-KEM-1024', fallback: 'ML-KEM-768 (hybrid w/ X25519)', effort: 'High' } },
  { id: 'f003', asset: 'legacy-build-key', type: 'SSH key', algorithm: 'RSA-1024', confidence: 0.82, location: 'keys/legacy-build-key', shorVulnerable: true, band: 'critical', recommendation: { primary: 'ML-DSA-65', fallback: 'SLH-DSA', effort: 'Medium' } },
  { id: 'f004', asset: 'deploy-key-01', type: 'SSH key', algorithm: 'ECDSA P-256', confidence: 0.85, location: 'keys/deploy-key-01', shorVulnerable: true, band: 'high', recommendation: { primary: 'ML-DSA-65', fallback: 'SLH-DSA', effort: 'Low' } },
  { id: 'f005', asset: 'auth-service', type: 'Protocol', algorithm: 'TLS 1.0', confidence: 0.88, location: 'config/auth-service.yaml', shorVulnerable: false, band: 'high', recommendation: { primary: 'TLS 1.3', fallback: 'TLS 1.2 (interim)', effort: 'Low' } },
  { id: 'f006', asset: 'internal-mesh.pem', type: 'Certificate', algorithm: 'ECDSA P-256', confidence: 0.89, location: 'infra/mesh/internal-mesh.pem', shorVulnerable: true, band: 'moderate', recommendation: { primary: 'ML-DSA-65', fallback: 'SLH-DSA', effort: 'Medium' } },
  { id: 'f009', asset: 'internal-cache', type: 'Protocol', algorithm: 'TLS 1.2', confidence: 0.86, location: 'config/cache.yaml', shorVulnerable: false, band: 'low', recommendation: { primary: 'TLS 1.3', fallback: 'Keep TLS 1.2 with a strong cipher suite', effort: 'Low' } },
  { id: 'f007', asset: 'database-proxy', type: 'Algorithm', algorithm: 'AES-256-GCM', confidence: 0.95, location: 'src/db/proxy.py', shorVulnerable: false, band: 'safe', recommendation: { primary: 'AES-256-GCM — no change needed', fallback: '—', effort: 'None' } },
  { id: 'f008', asset: 'kms-master-key', type: 'Key', algorithm: 'AES-256', confidence: 0.94, location: 'vault/kms-master-key', shorVulnerable: false, band: 'safe', recommendation: { primary: 'AES-256 — no change needed', fallback: '—', effort: 'None' } },
];

// What the bar graph shows: today's counts per band vs. a projection of
// where they'd land if every recommendation above were applied. This is an
// estimate for planning purposes, not a guarantee — labeled as such in the UI.
const RISK_COMPARISON = BAND_ORDER.slice().reverse().map((band) => ({
  band,
  label: BAND_LABEL[band],
  current: FINDINGS.filter((f) => f.band === band).length,
  projected: { safe: 7, low: 1, moderate: 1, high: 0, critical: 0 }[band],
}));

const ENGINE_STAGES = [
  { title: 'Discovery engine', desc: 'Finds algorithms, protocols, certificates, keys, and libraries across code, containers, and certificates.' },
  { title: 'Analysis engine', desc: 'Classifies each finding, removes duplicates, and gives it context — what it is and where it lives.' },
  { title: 'Risk engine', desc: 'Scores severity, flags Shor-vulnerable crypto, and prioritizes what needs fixing first.' },
];
const DATA_SOURCES = ['Source code (Git repos, ZIP uploads)', 'Network endpoints', 'Certificates', 'Container images'];
// Kept accurate to what's actually implemented today, not the eventual plan —
// Tree-sitter is a planned upgrade for JS/TS and C/C++, not yet wired in.
const SCANNER_TECH = [
  { lang: 'Python', method: 'AST-based detection' },
  { lang: 'Java', method: 'Pattern-based detection' },
  { lang: 'JavaScript / TypeScript', method: 'Pattern-based (Tree-sitter planned)' },
  { lang: 'C / C++', method: 'Pattern-based detection' },
  { lang: 'Certificates', method: 'OpenSSL CLI — PEM, CRT, CER, DER, P12, PFX' },
  { lang: 'Containers', method: 'Docker CLI image inspection' },
];

const REMINDER_DAYS = 7;
const RECENT_SCANS = [
  { file: 'payments.internal.pem', time: '12 minutes ago', band: 'critical' },
  { file: 'auth-service.pem', time: '1 hour ago', band: 'safe' },
  { file: 'network-scan-04.json', time: '3 hours ago', band: 'moderate' },
  { file: 'legacy-portal.crt', time: 'Yesterday', band: 'critical' },
];
const PREVIOUS_SCANS = [
  { id: 'ps1', file: 'payments.internal.pem', scannedDaysAgo: 9, topBand: 'critical' },
  { id: 'ps2', file: 'legacy-portal.crt', scannedDaysAgo: 15, topBand: 'critical' },
  { id: 'ps3', file: 'auth-service.pem', scannedDaysAgo: 2, topBand: 'high' },
  { id: 'ps4', file: 'network-scan-04.json', scannedDaysAgo: 5, topBand: 'moderate' },
  { id: 'ps5', file: 'database-proxy.py', scannedDaysAgo: 1, topBand: 'safe' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [riskAnalysisOpen, setRiskAnalysisOpen] = useState(true);
  const [splashing, setSplashing] = useState(false);
  const graphWrapRef = useRef(null);
  const [graphSize, setGraphSize] = useState({ width: 640, height: 380 });
  const fileInputRef = useRef(null);
  const [changedFlags, setChangedFlags] = useState({});

  // The scan-gating state machine: nothing analysis-shaped renders until a
  // scan has actually completed, per the "no fake results before a scan" rule.
  const [scanState, setScanState] = useState('idle'); // 'idle' | 'scanning' | 'complete'
  const [activeFileName, setActiveFileName] = useState(null);
  const [activeScanDate, setActiveScanDate] = useState(null);

  useEffect(() => {
    function measure() {
      if (graphWrapRef.current) setGraphSize({ width: graphWrapRef.current.clientWidth, height: 380 });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const graphData = useMemo(
    () => ({ nodes: GRAPH_NODES.map((n) => ({ ...n })), links: GRAPH_LINKS.map((l) => ({ ...l })) }),
    []
  );

  const bandColors = theme === 'light' ? BAND_COLOR_LIGHT : BAND_COLOR;
  const shorCount = FINDINGS.filter((f) => f.shorVulnerable).length;
  const readinessScore = Math.round(((FINDINGS.length - shorCount) / FINDINGS.length) * 100);
  const sortedFindings = useMemo(() => [...FINDINGS].sort((a, b) => BAND_RANK[b.band] - BAND_RANK[a.band]), []);
  const pqcActions = useMemo(
    () => FINDINGS.filter((f) => f.band !== 'safe').sort((a, b) => BAND_RANK[b.band] - BAND_RANK[a.band]),
    []
  );
  const toggleChanged = (id) => setChangedFlags((prev) => ({ ...prev, [id]: !prev[id] }));
  const sortedPreviousScans = useMemo(
    () => [...PREVIOUS_SCANS].sort((a, b) => BAND_RANK[b.topBand] - BAND_RANK[a.topBand] || b.scannedDaysAgo - a.scannedDaysAgo),
    []
  );

  const paintNode = useCallback(
    (node, ctx, globalScale) => {
      const r = 5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = bandColors[node.risk] || bandColors.safe;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = theme === 'light' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)';
      ctx.stroke();
      if (globalScale > 1.1) {
        const fontSize = (10 / globalScale) * 1.6;
        ctx.font = `${fontSize}px 'IBM Plex Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = theme === 'light' ? '#5b5e66' : '#8a93a3';
        ctx.fillText(node.name, node.x, node.y + r + 2);
      }
    },
    [bandColors, theme]
  );

  const beginScan = (fileName) => {
    setActiveFileName(fileName);
    setScanState('scanning');
    window.setTimeout(() => {
      setActiveScanDate(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }));
      setScanState('complete');
    }, 1800);
  };
  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) beginScan(f.name);
  };
  const runLiveScan = () => beginScan('live-network-scan.json');

  const scrollToSection = (anchor) => {
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDownloadReport = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210; const pageH = 297; const margin = 16;
    const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    const setColor = (hex) => doc.setTextColor(...rgb(hex));
    const bandCount = (band) => FINDINGS.filter((finding) => finding.band === band).length;
    const footer = (page) => { doc.setDrawColor(220, 222, 226); doc.line(margin, 283, pageW - margin, 283); doc.setFontSize(7); doc.setTextColor(94, 101, 112); doc.text('Semicolon — risk-informed assessment. Validate changes with qualified security review.', margin, 289); doc.text(`Page ${page}`, pageW - margin, 289, { align: 'right' }); };
    const title = (text, subtitle) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(18); setColor('#191d24'); doc.text(text, margin, 22); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(92, 99, 109); doc.text(subtitle, margin, 29); };
    const line = (text, x, y, width, size = 9) => { doc.setFontSize(size); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 56, 66); const lines = doc.splitTextToSize(text, width); doc.text(lines, x, y); return y + lines.length * (size * 0.46); };
    const pill = (label, x, y, band) => { const color = BAND_COLOR[band]; doc.setFillColor(...rgb(color)); doc.roundedRect(x, y - 4.3, doc.getTextWidth(label) + 8, 6.4, 1.6, 1.6, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.text(label, x + 4, y); };
    const metric = (label, value, x, y, accent = '#191d24') => { doc.setFillColor(246, 247, 248); doc.roundedRect(x, y, 40, 23, 2, 2, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(15); setColor(accent); doc.text(String(value), x + 4, y + 11); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(94, 101, 112); doc.text(label, x + 4, y + 18); };

    // Cover & executive summary
    doc.setFillColor(10, 13, 18); doc.rect(0, 0, pageW, pageH, 'F');
    doc.setFillColor(201, 162, 39); doc.roundedRect(margin, 25, 38, 7, 2, 2, 'F'); doc.setTextColor(25, 19, 8); doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.text('SEMICOLON REPORT', margin + 4, 29.6);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(29); doc.setTextColor(232, 234, 239); doc.text('Cryptographic', margin, 59); doc.text('risk assessment', margin, 71);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(168, 176, 188); doc.text(`Scan: ${activeFileName}`, margin, 91); doc.text(`Completed: ${activeScanDate}`, margin, 99);
    doc.setFillColor(23, 28, 37); doc.roundedRect(margin, 123, 178, 53, 4, 4, 'F'); doc.setTextColor(232, 234, 239); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Executive summary', margin + 10, 139); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(168, 176, 188); const summary = `Semicolon identified ${FINDINGS.length} cryptographic assets. ${bandCount('critical')} are Critical and ${bandCount('high')} are High priority. ${shorCount} assets require post-quantum action. Applying the proposed plan is estimated to reduce Critical and High findings to zero.`; doc.text(doc.splitTextToSize(summary, 156), margin + 10, 151);
    doc.setTextColor(84, 91, 102); doc.setFontSize(7.5); doc.text('Generated for the currently scanned file. This report supports planning; it is not a guarantee of security.', margin, 267); doc.text('SEMICOLON', pageW - margin, 267, { align: 'right' });

    // Risk overview with donut and double bars
    doc.addPage(); title('Risk overview', `${activeFileName} · current posture and estimated post-remediation position`); metric('Total assets', FINDINGS.length, 16, 39); metric('Critical', bandCount('critical'), 60, 39, BAND_COLOR.critical); metric('High', bandCount('high'), 104, 39, BAND_COLOR.high); metric('PQC readiness', `${readinessScore}/100`, 148, 39, BAND_COLOR.safe);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); setColor('#191d24'); doc.text('Risk distribution', 16, 78);
    const cx = 49; const cy = 116; let start = -Math.PI / 2; const total = FINDINGS.length; const slice = (from, to, color) => { const points = [{ x: cx, y: cy }]; for (let step = 0; step <= 12; step += 1) { const angle = from + ((to - from) * step / 12); points.push({ x: cx + (25 * Math.cos(angle)), y: cy + (25 * Math.sin(angle)) }); } points.push({ x: cx, y: cy }); const deltas = points.slice(1).map((point, index) => [point.x - points[index].x, point.y - points[index].y]); doc.setFillColor(...rgb(color)); doc.lines(deltas, points[0].x, points[0].y, [1, 1], 'F', true); }; BAND_ORDER.slice().reverse().forEach((band) => { const arc = (bandCount(band) / total) * Math.PI * 2; slice(start, start + arc, BAND_COLOR[band]); start += arc; }); doc.setFillColor(255, 255, 255); doc.circle(cx, cy, 14, 'F'); doc.setTextColor(25, 29, 36); doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(String(total), cx, cy + 2, { align: 'center' }); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(94, 101, 112); doc.text('assets', cx, cy + 8, { align: 'center' });
    let ly = 91; BAND_ORDER.slice().reverse().forEach((band) => { doc.setFillColor(...rgb(BAND_COLOR[band])); doc.circle(86, ly - 1.5, 1.8, 'F'); doc.setTextColor(50, 56, 66); doc.setFontSize(8.5); doc.text(`${BAND_LABEL[band]} · ${bandCount(band)}`, 91, ly); ly += 10; });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); setColor('#191d24'); doc.text('Current vs. after recommendations', 16, 168); const chartX = 22; const chartY = 244; const chartH = 56; const max = Math.max(...RISK_COMPARISON.map((d) => Math.max(d.current, d.projected)), 1); RISK_COMPARISON.forEach((row, index) => { const x = chartX + index * 34; const currentH = (row.current / max) * chartH; const projectedH = (row.projected / max) * chartH; doc.setFillColor(...rgb(BAND_COLOR[row.band])); doc.rect(x, chartY - currentH, 10, currentH, 'F'); doc.setFillColor(63, 184, 175); doc.rect(x + 12, chartY - projectedH, 10, projectedH, 'F'); doc.setFontSize(7); doc.setTextColor(75, 82, 92); doc.text(row.label, x + 11, chartY + 7, { align: 'center' }); }); doc.setFillColor(...rgb(BAND_COLOR.critical)); doc.rect(139, 179, 4, 4, 'F'); doc.setTextColor(75, 82, 92); doc.setFontSize(7.5); doc.text('Current', 145, 182.5); doc.setFillColor(63, 184, 175); doc.rect(170, 179, 4, 4, 'F'); doc.text('Projected', 176, 182.5); footer(2);

    // Topology and inventory
    doc.addPage(); title('Asset topology & inventory', 'Relationships and discovered cryptographic assets'); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); setColor('#191d24'); doc.text('Dependency topology', 16, 42); const points = [{ x: 48, y: 82, label: 'Gateway', band: 'moderate' }, { x: 100, y: 62, label: 'Payments', band: 'critical' }, { x: 150, y: 82, label: 'Root CA', band: 'safe' }, { x: 78, y: 117, label: 'Auth', band: 'high' }, { x: 126, y: 119, label: 'Legacy portal', band: 'critical' }]; [[0,1],[1,2],[0,3],[1,4],[4,2]].forEach(([a,b])=>{doc.setDrawColor(190,195,203);doc.setLineWidth(.6);doc.line(points[a].x,points[a].y,points[b].x,points[b].y)}); points.forEach((point)=>{doc.setFillColor(...rgb(BAND_COLOR[point.band]));doc.circle(point.x,point.y,6,'F');doc.setTextColor(50,56,66);doc.setFontSize(7.5);doc.text(point.label,point.x,point.y+11,{align:'center'})}); doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(94,101,112); doc.text('Topology is a scan-derived relationship view to guide remediation sequencing.', 16, 143);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); setColor('#191d24'); doc.text('Cryptographic inventory', 16, 160); const headers = ['Asset', 'Type', 'Algorithm', 'Band', 'Location', 'Confidence']; const cols = [16, 44, 68, 101, 122, 176]; doc.setFont('helvetica','bold');doc.setFontSize(6.8);doc.setTextColor(94,101,112);headers.forEach((h,i)=>doc.text(h.toUpperCase(),cols[i],170)); let y=177; FINDINGS.forEach((f)=>{doc.setDrawColor(226,228,231);doc.line(16,y+4,194,y+4);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(50,56,66);doc.text(f.asset.slice(0,18),cols[0],y);doc.text(f.type.slice(0,13),cols[1],y);doc.text(f.algorithm.slice(0,17),cols[2],y);pill(BAND_LABEL[f.band],cols[3],y,f.band);doc.text(f.location.slice(0,27),cols[4],y);doc.text(f.confidence.toFixed(2),cols[5],y);y+=10}); footer(3);

    // PQC & recommendations
    doc.addPage(); title('PQC readiness & recommendations', 'Prioritised action plan for the currently scanned file'); doc.setFont('helvetica','bold');doc.setFontSize(12);setColor('#191d24');doc.text('Readiness summary',16,43); metric('Readiness score',`${readinessScore}/100`,16,51,BAND_COLOR.safe);metric('Safe assets',FINDINGS.filter(f=>f.band==='safe').length,60,51,BAND_COLOR.safe);metric('Needs action',pqcActions.length,104,51,BAND_COLOR.critical);metric('Quantum-vulnerable',shorCount,148,51,BAND_COLOR.high); doc.setFont('helvetica','bold');doc.setFontSize(12);setColor('#191d24');doc.text('Action plan',16,91); const actionCols=[16,53,81,131,167]; ['Asset','Priority','Recommended action','Action by','Status'].forEach((h,i)=>{doc.setFontSize(6.8);doc.setTextColor(94,101,112);doc.text(h.toUpperCase(),actionCols[i],100)}); y=108; pqcActions.forEach((f)=>{if(y>265)return;doc.setDrawColor(226,228,231);doc.line(16,y+5,194,y+5);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(50,56,66);doc.text(f.asset.slice(0,21),16,y);pill(BAND_LABEL[f.band],53,y,f.band);doc.text(f.recommendation.primary.slice(0,25),81,y);doc.text(BAND_DEADLINE[f.band],131,y);doc.text(BAND_STATUS[f.band],167,y);y+=12}); doc.setFontSize(8);doc.setTextColor(94,101,112);doc.text(doc.splitTextToSize('Recommendations are prioritised for planning. Test compatibility and operational impact before implementation.',178),16,272); footer(4);
    doc.save(`semicolon-executive-report-${(activeFileName || 'scan').replace(/[^a-z0-9.-]/gi, '_')}.pdf`);
  };

  return (
    <div className="sentinel-dash" data-theme={theme}>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=switzer@400,500,600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');

        .sentinel-dash {
          --bg: #0a0d12; --surface-1: #12161d; --surface-2: #171c25;
          --border: #262e3a; --border-soft: #1b2129;
          --text-primary: #e8eaef; --text-secondary: #8a93a3; --text-faint: #545e6e;
          --gold: #c9a227; --gold-soft: rgba(201,162,39,0.14);
          --crimson: #c1503a; --teal: #3fb8af;
          font-family: 'Switzer', 'Inter', system-ui, sans-serif;
          background: var(--bg); color: var(--text-primary);
          min-height: 100vh; display: flex; width: 100%; box-sizing: border-box;
        }
        .sentinel-dash[data-theme="light"] {
          --bg: #f4f2ec; --surface-1: #ffffff; --surface-2: #ece9e0;
          --border: #dad6c9; --border-soft: #e4e1d6;
          --text-primary: #1b1d22; --text-secondary: #5b5e66; --text-faint: #8b8d93;
          --gold: #9c7a14; --gold-soft: rgba(156,122,20,0.12);
          --crimson: #a63f2b; --teal: #227a70;
        }
        .sentinel-dash *, .sentinel-dash *::before, .sentinel-dash *::after { box-sizing: border-box; }
        .sd-display { font-family: 'Clash Display', 'Switzer', sans-serif; }
        .sd-mono { font-family: 'IBM Plex Mono', monospace; }

        .sd-sidebar {
          width: 246px; flex-shrink: 0; background: var(--surface-1);
          border-right: 1px solid var(--border-soft); padding: 22px 14px;
          display: flex; flex-direction: column; gap: 22px;
          overflow: hidden auto; transition: width 0.18s ease, padding 0.18s ease, opacity 0.15s ease;
          max-height: 100vh; position: sticky; top: 0;
        }
        .sd-sidebar.closed { width: 0; padding-left: 0; padding-right: 0; opacity: 0; border-right: none; }
        .sd-brand {
          display: flex; align-items: center; gap: 9px; padding: 0 8px;
          background: none; border: none; cursor: pointer; font-family: inherit; width: 100%; white-space: nowrap;
        }
        .sd-brand:hover span { color: var(--gold); }
        .sd-brand svg { flex-shrink: 0; }
        .sd-brand span { font-size: 15px; font-weight: 600; letter-spacing: 0.06em; }
        .sd-nav { display: flex; flex-direction: column; gap: 2px; }
        .sd-nav-item {
          display: flex; align-items: center; gap: 9px; padding: 9px 10px;
          border-radius: 6px; font-size: 13px; color: var(--text-secondary);
          cursor: pointer; border: none; background: none; width: 100%; text-align: left; font-family: inherit;
        }
        .sd-nav-item:hover { background: var(--surface-2); color: var(--text-primary); }
        .sd-nav-group-head { justify-content: space-between; }
        .sd-nav-group-head .sd-nav-item-left { display: flex; align-items: center; gap: 9px; }
        .sd-nav-children { display: flex; flex-direction: column; gap: 1px; padding-left: 14px; margin-top: 1px; }
        .sd-nav-child {
          display: block; text-align: left; padding: 7px 10px 7px 20px; border-radius: 6px; font-size: 12.5px;
          color: var(--text-secondary); background: none; border: none; cursor: pointer; font-family: inherit; width: 100%;
          border-left: 1px solid var(--border-soft);
        }
        .sd-nav-child:hover { background: var(--surface-2); color: var(--gold); }

        .sd-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .sd-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 28px; border-bottom: 1px solid var(--border-soft);
          position: sticky; top: 0; background: var(--bg); z-index: 5;
        }
        .sd-topbar h1 { font-size: 21px; font-weight: 600; margin: 0; letter-spacing: -0.01em; }
        .sd-top-actions { display: flex; align-items: center; gap: 14px; }
        .sd-theme-btn {
          width: 32px; height: 32px; border-radius: 7px; border: 1px solid var(--border);
          background: var(--surface-1); color: var(--text-secondary); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .sd-theme-btn:hover { color: var(--gold); border-color: var(--gold); }
        .sd-profile { display: flex; align-items: center; gap: 8px; cursor: pointer; background: none; border: none; padding: 0; font-family: inherit; }
        .sd-avatar {
          width: 30px; height: 30px; border-radius: 999px; background: var(--gold-soft);
          color: var(--gold); display: flex; align-items: center; justify-content: center;
          font-size: 11.5px; font-weight: 600; font-family: 'IBM Plex Mono', monospace;
        }
        .sd-profile-name { font-size: 13px; color: var(--text-secondary); }
        .sd-profile-menu { position: relative; }
        .sd-profile-menu .profile-menu-trigger { display: flex; align-items: center; gap: 8px; cursor: pointer; border: 0; background: none; color: var(--text-secondary); padding: 0; font-family: inherit; }
        .sd-profile-menu .profile-menu-avatar { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--gold-soft); color: var(--gold); font: 600 11px 'IBM Plex Mono', monospace; }
        .sd-profile-menu .profile-menu-name { font-size: 13px; }
        .sd-profile-menu .profile-menu-popover { position: absolute; right: 0; top: calc(100% + 12px); z-index: 60; width: 270px; padding: 8px; background: var(--surface-1); border: 1px solid var(--border); box-shadow: 0 18px 40px rgba(0,0,0,.28); border-radius: 10px; }
        .sd-profile-menu .profile-menu-summary { display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid var(--border-soft); }.sd-profile-menu .profile-menu-avatar-large { width: 36px; height: 36px; }.sd-profile-menu .profile-menu-summary strong,.sd-profile-menu .profile-menu-summary span { display:block; }.sd-profile-menu .profile-menu-summary strong { font-size:13px; color:var(--text-primary); }.sd-profile-menu .profile-menu-summary span { font-size:11px; margin-top:2px; color:var(--text-secondary); }
        .sd-profile-menu .profile-menu-list { padding: 5px 0; }.sd-profile-menu .profile-menu-list button,.sd-profile-menu .profile-menu-logout { display:flex; align-items:center; gap:9px; width:100%; padding:9px 10px; border:0; border-radius:6px; background:none; color:var(--text-secondary); font:inherit; font-size:12.5px; text-align:left; cursor:pointer; }.sd-profile-menu .profile-menu-list button:hover,.sd-profile-menu .profile-menu-logout:hover { background:var(--surface-2); color:var(--gold); }.sd-profile-menu .profile-menu-logout { border-top:1px solid var(--border-soft); color:var(--crimson); }

        .sd-content { padding: 22px 28px 48px; overflow-x: hidden; }
        .sd-scroll-target { scroll-margin-top: 84px; }

        .sd-stats-row { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; margin-bottom: 14px; }
        .sd-stat-card { background: var(--surface-1); border: 1px solid var(--border-soft); border-radius: 10px; padding: 16px; }
        .sd-stat-label { font-size: 12px; color: var(--text-secondary); margin: 0 0 8px; }
        .sd-stat-value { font-size: 26px; font-weight: 600; margin: 0; letter-spacing: -0.01em; }
        .sd-stat-value.accent-risk { color: var(--crimson); }

        .sd-grid { display: grid; grid-template-columns: minmax(0,1.6fr) minmax(0,1fr); gap: 14px; margin-bottom: 14px; }
        .sd-topology-layout { display: grid; grid-template-columns: minmax(210px,.62fr) minmax(0,1.8fr); gap: 14px; margin-bottom: 14px; }
        .sd-card { background: var(--surface-1); border: 1px solid var(--border-soft); border-radius: 10px; padding: 18px; margin-bottom: 14px; }
        .sd-card h2 { font-size: 14px; font-weight: 500; margin: 0 0 14px; }
        .sd-card-sub { font-size: 12.5px; color: var(--text-secondary); margin: -8px 0 14px; line-height: 1.5; }
        .sd-graph-card { min-height: 430px; margin-bottom: 0; }
        .sd-graph-wrap { border-radius: 8px; overflow: hidden; background: var(--bg); }

        .sd-side-col { display: flex; flex-direction: column; gap: 0; }
        .sd-donut-row { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
        .sd-legend { display: flex; flex-direction: column; gap: 6px; }
        .sd-legend-item { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-secondary); }
        .sd-legend-dot { width: 8px; height: 8px; border-radius: 999px; flex-shrink: 0; }

        .sd-actions { display: flex; flex-direction: column; gap: 10px; }
        .sd-action-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 14px; border-radius: 7px; font-size: 13.5px; font-weight: 500;
          cursor: pointer; font-family: inherit; border: 1px solid var(--border);
          background: var(--surface-2); color: var(--text-primary);
        }
        .sd-action-btn.primary { background: var(--gold); color: #191308; border-color: var(--gold); }
        .sd-action-btn.primary:hover { filter: brightness(1.07); }
        .sd-action-btn:not(.primary):hover { border-color: var(--gold); color: var(--gold); }
        .sd-action-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .sd-action-btn .spin { animation: sd-spin 0.9s linear infinite; }
        @keyframes sd-spin { to { transform: rotate(360deg); } }
        .sd-upload-note { font-size: 11.5px; color: var(--text-faint); text-align: center; margin: 0; }
        .sd-scan-hero { min-height: 278px; display: flex; align-items: center; justify-content: center; text-align: center; padding: 34px; background: radial-gradient(circle at 50% 18%, var(--gold-soft), transparent 48%), var(--surface-1); }
        .sd-scan-hero-inner { width: min(100%, 680px); }
        .sd-scan-hero-icon { width: 52px; height: 52px; display: inline-flex; align-items: center; justify-content: center; border-radius: 14px; background: var(--gold-soft); color: var(--gold); margin-bottom: 15px; }
        .sd-scan-hero h2 { font-size: 21px; font-weight: 600; margin-bottom: 9px; }
        .sd-scan-hero .sd-card-sub { max-width: 520px; margin: 0 auto 22px; font-size: 13.5px; }
        .sd-scan-hero .sd-actions { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 10px; max-width: 560px; margin: 0 auto; }
        .sd-scan-hero .sd-action-btn { min-height: 50px; font-size: 14px; }
        .sd-scan-hero .sd-upload-note { grid-column: 1 / -1; margin-top: 2px; }

        .sd-pipeline { display: flex; align-items: flex-start; gap: 16px; margin-top: 4px; }
        .sd-pipeline-step { flex: 1; }
        .sd-pipeline-num { font-size: 11px; color: var(--gold); }
        .sd-pipeline-step h3 { font-size: 14px; font-weight: 600; margin: 6px 0 6px; }
        .sd-pipeline-step p { font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; margin: 0; }
        .sd-pipeline-arrow { color: var(--text-faint); margin-top: 22px; flex-shrink: 0; }
        .sd-sources-row { margin-top: 18px; }
        .sd-source-tag {
          display: inline-block; font-size: 11.5px; padding: 5px 10px; border: 1px solid var(--border);
          border-radius: 999px; color: var(--text-secondary); margin: 0 6px 6px 0;
        }

        .sd-table-wrap { overflow-x: auto; margin-top: 14px; }
        .sd-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .sd-table th {
          text-align: left; font-weight: 500; color: var(--text-secondary); font-size: 11px;
          text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 10px; border-bottom: 1px solid var(--border-soft);
          white-space: nowrap;
        }
        .sd-table td { padding: 10px; border-bottom: 1px solid var(--border-soft); white-space: nowrap; }
        .sd-table-loc { color: var(--text-faint); font-size: 12px; }

        .sd-band-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .sd-band-chip { flex: 1; min-width: 60px; background: var(--surface-2); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 3px; }
        .sd-band-dot { width: 8px; height: 8px; border-radius: 999px; }
        .sd-band-count { font-size: 18px; }
        .sd-band-label { font-size: 10.5px; color: var(--text-secondary); }
        .sd-band-list-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 0; border-top: 1px solid var(--border-soft); }
        .sd-band-pill { font-size: 11px; padding: 3px 9px; border-radius: 5px; font-weight: 500; white-space: nowrap; }

        .sd-pqc-summary-row { display: flex; gap: 28px; margin-bottom: 16px; flex-wrap: wrap; }
        .sd-pqc-note { font-size: 12px; color: var(--text-faint); line-height: 1.55; margin: 14px 0 0; }

        .sd-alarm-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding: 12px 0; border-top: 1px solid var(--border-soft); }
        .sd-alarm-check { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .sd-alarm-check input { accent-color: var(--gold); width: 15px; height: 15px; flex-shrink: 0; }
        .sd-alarm-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .sd-reminder { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--crimson); background: rgba(193,80,58,0.12); padding: 4px 9px; border-radius: 5px; white-space: nowrap; }

        .sd-scan-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-top: 1px solid var(--border-soft); }
        .sd-scan-row:first-of-type { border-top: none; }
        .sd-scan-file { font-size: 13.5px; margin: 0; }
        .sd-scan-time { font-size: 11.5px; color: var(--text-faint); margin: 2px 0 0; }

        .sd-empty-state {
          border: 1px dashed var(--border); border-radius: 10px; padding: 48px 24px;
          text-align: center; color: var(--text-secondary); margin-bottom: 14px;
        }
        .sd-empty-state svg { color: var(--text-faint); margin-bottom: 14px; }
        .sd-empty-state h2 { font-size: 17px; color: var(--text-primary); margin: 0 0 8px; font-weight: 600; }
        .sd-empty-state p { font-size: 13.5px; max-width: 420px; margin: 0 auto; line-height: 1.6; }
        .sd-empty-state .spin { animation: sd-spin 1s linear infinite; }

        .sd-reports-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
        .sd-reports-meta { font-size: 12.5px; color: var(--text-secondary); line-height: 1.7; }
        .sd-reports-meta b { color: var(--text-primary); font-weight: 600; }

        @media (max-width: 980px) {
          .sd-sidebar { display: none; }
          .sd-stats-row { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .sd-grid { grid-template-columns: 1fr; }
          .sd-topology-layout { grid-template-columns: 1fr; }
          .sd-scan-hero .sd-actions { grid-template-columns: 1fr; }
          .sd-scan-hero .sd-upload-note { grid-column: auto; }
        }
      `}</style>

      {splashing && (
        <Splash duration={1100} onFinish={() => { setSplashing(false); navigate('/'); }} />
      )}

      <aside className={`sd-sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <button className="sd-brand" onClick={() => setSplashing(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" stroke="var(--gold)" strokeWidth="1.4" />
            <circle cx="12" cy="12" r="2.6" fill="var(--gold)" />
          </svg>
          <span className="sd-display">SEMICOLON</span>
        </button>
        <nav className="sd-nav">
          {NAV_SECTIONS.map((item) => {
            const Icon = item.icon;
            if (item.children) {
              return (
                <div key={item.key}>
                  <button className="sd-nav-item sd-nav-group-head" onClick={() => setRiskAnalysisOpen((o) => !o)}>
                    <span className="sd-nav-item-left"><Icon size={16} />{item.label}</span>
                    {riskAnalysisOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {riskAnalysisOpen && (
                    <div className="sd-nav-children">
                      {item.children.map((child) => (
                        <button key={child.key} className="sd-nav-child" onClick={() => scrollToSection(child.anchor)}>
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button key={item.key} className="sd-nav-item" onClick={() => scrollToSection(item.anchor)}>
                <Icon size={16} />{item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="sd-main">
        <header className="sd-topbar">
          <h1 className="sd-display">Dashboard</h1>
          <div className="sd-top-actions">
            <button className="sd-theme-btn" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} aria-label="Toggle dark mode">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <ProfileMenu className="sd-profile-menu" />
          </div>
        </header>

        <div className="sd-content">
          <div className="sd-card">
            <h2>How Semicolon works</h2>
            <div className="sd-pipeline">
              {ENGINE_STAGES.map((stage, i) => (
                <React.Fragment key={stage.title}>
                  <div className="sd-pipeline-step">
                    <span className="sd-pipeline-num sd-mono">{String(i + 1).padStart(2, '0')}</span>
                    <h3>{stage.title}</h3>
                    <p>{stage.desc}</p>
                  </div>
                  {i < ENGINE_STAGES.length - 1 && <ArrowRight size={16} className="sd-pipeline-arrow" />}
                </React.Fragment>
              ))}
            </div>
            <div className="sd-sources-row">
              {DATA_SOURCES.map((s) => <span key={s} className="sd-source-tag sd-mono">{s}</span>)}
            </div>
            <div className="sd-table-wrap">
              <table className="sd-table">
                <thead><tr><th>Coverage</th><th>Detection method</th></tr></thead>
                <tbody>
                  {SCANNER_TECH.map((s) => (
                    <tr key={s.lang}><td>{s.lang}</td><td className="sd-table-loc">{s.method}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div id="sec-upload" className="sd-card sd-scan-hero sd-scroll-target">
            <div className="sd-scan-hero-inner">
              <div className="sd-scan-hero-icon"><Upload size={24} /></div>
              <h2>Start a cryptographic scan</h2>
              <p className="sd-card-sub">Upload a config, certificate, key, or code file. Semicolon will reveal the complete risk analysis only after the scan is finished.</p>
              <div className="sd-actions">
                <button className="sd-action-btn primary" onClick={handleUploadClick} disabled={scanState === 'scanning'}><Upload size={17} /> Upload file to scan</button>
                <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: 'none' }} />
                <button className="sd-action-btn" onClick={runLiveScan} disabled={scanState === 'scanning'}><RefreshCw size={17} className={scanState === 'scanning' ? 'spin' : ''} />{scanState === 'scanning' ? 'Scanning…' : 'Run live scan'}</button>
                <p className="sd-upload-note">{activeFileName && scanState !== 'idle' ? `Current scan: ${activeFileName}` : 'No file scanned in this session yet'}</p>
              </div>
            </div>
          </div>

          {scanState === 'idle' && (
            <div className="sd-empty-state">
              <FileSearch size={30} />
              <h2>No scan yet</h2>
              <p>Upload a file or run a live scan above to see risk analysis, topology, crypto inventory, and PQC readiness here.</p>
            </div>
          )}

          {scanState === 'scanning' && (
            <div className="sd-empty-state">
              <Loader2 size={30} className="spin" />
              <h2>Scanning {activeFileName}…</h2>
              <p>Running the discovery, analysis, and risk engines. This usually takes a few seconds.</p>
            </div>
          )}

          {scanState === 'complete' && (
            <>
              <div className="sd-stats-row">
                <StatCard label="Scanned file" value={activeFileName} small />
                <StatCard label="Scan date" value={activeScanDate} small />
                <StatCard label="Critical findings" value={FINDINGS.filter((f) => f.band === 'critical').length} accent="risk" />
                <StatCard label="High findings" value={FINDINGS.filter((f) => f.band === 'high').length} />
              </div>

              <div className="sd-topology-layout">
                <div id="sec-risk-breakdown" className="sd-card sd-scroll-target" style={{ marginBottom: 0 }}>
                  <h2>Risk breakdown</h2>
                  <p className="sd-card-sub">Distribution for this scan.</p>
                  <div className="sd-donut-row"><PieChart width={116} height={116}><Pie data={RISK_COMPARISON} dataKey="current" nameKey="label" innerRadius={35} outerRadius={52} startAngle={90} endAngle={-270} stroke="none">{RISK_COMPARISON.map((entry) => <Cell key={entry.band} fill={bandColors[entry.band]} />)}</Pie></PieChart></div>
                  <div className="sd-legend" style={{ marginTop: 10 }}>{RISK_COMPARISON.map((entry) => <div className="sd-legend-item" key={entry.band}><span className="sd-legend-dot" style={{ background: bandColors[entry.band] }} />{entry.label} · {entry.current}</div>)}</div>
                </div>
                <div id="sec-topology" className="sd-card sd-graph-card sd-scroll-target">
                  <h2>Cryptographic asset topology</h2>
                  <div className="sd-graph-wrap" ref={graphWrapRef}>
                    <ForceGraph2D
                      graphData={graphData}
                      width={graphSize.width}
                      height={graphSize.height}
                      backgroundColor="rgba(0,0,0,0)"
                      nodeLabel={(n) => `${n.name} — ${BAND_LABEL[n.risk]}`}
                      linkColor={() => (theme === 'light' ? 'rgba(27,29,34,0.18)' : 'rgba(138,147,163,0.28)')}
                      nodeCanvasObject={paintNode}
                      nodeRelSize={5}
                      cooldownTicks={90}
                      linkDirectionalParticles={0}
                    />
                  </div>
                </div>
              </div>

              <div id="sec-risk-dashboard" className="sd-card sd-scroll-target">
                <h2>Risk dashboard</h2>
                <p className="sd-card-sub">Findings ranked by urgency, so your team knows what to handle first.</p>
                <div className="sd-band-row">
                  {BAND_ORDER.map((band) => (
                    <div className="sd-band-chip" key={band}>
                      <span className="sd-band-dot" style={{ background: bandColors[band] }} />
                      <span className="sd-band-count sd-display">{FINDINGS.filter((f) => f.band === band).length}</span>
                      <span className="sd-band-label">{BAND_LABEL[band]}</span>
                    </div>
                  ))}
                </div>
                <div>
                  {sortedFindings.slice(0, 4).map((f) => (
                    <div className="sd-band-list-row" key={f.id}>
                      <span className="sd-mono" style={{ fontSize: 12.5 }}>{f.asset}</span>
                      <span className="sd-band-pill" style={{ color: bandColors[f.band], background: `${bandColors[f.band]}22` }}>{BAND_LABEL[f.band]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="sec-risk-bar-graph" className="sd-card sd-scroll-target">
                <h2>Risk before vs. after remediation</h2>
                <p className="sd-card-sub">
                  Current count per band vs. an estimate of where they'd land if every recommendation below is applied.
                  Projected values are an estimate for planning, not a guarantee.
                </p>
                <BarChart
                  width={graphSize.width > 480 ? 460 : Math.max(graphSize.width - 20, 260)}
                  height={220}
                  data={RISK_COMPARISON}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid stroke={theme === 'light' ? '#dad6c9' : '#1b2129'} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="current" name="Current" fill="var(--crimson)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="projected" name="Projected after fixes" fill="var(--teal)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </div>

              <div id="sec-inventory" className="sd-card sd-scroll-target">
                <h2>Crypto inventory</h2>
                <p className="sd-card-sub">Every cryptographic asset Semicolon found in this scan, mapped to where it lives.</p>
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <thead><tr><th>Asset</th><th>Type</th><th>Algorithm</th><th>Band</th><th>Location</th><th>Confidence</th></tr></thead>
                    <tbody>
                      {FINDINGS.map((f) => (
                        <tr key={f.id}>
                          <td className="sd-mono">{f.asset}</td>
                          <td>{f.type}</td>
                          <td>{f.algorithm}</td>
                          <td><span className="sd-band-pill" style={{ color: bandColors[f.band], background: `${bandColors[f.band]}22` }}>{BAND_LABEL[f.band]}</span></td>
                          <td className="sd-mono sd-table-loc">{f.location}</td>
                          <td className="sd-mono">{f.confidence.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="sec-pqc" className="sd-card sd-scroll-target">
                <h2>PQC readiness</h2>
                <p className="sd-card-sub">Quantum-vulnerable cryptography — broken outright by Shor's algorithm, not just weakened.</p>
                <div className="sd-pqc-summary-row">
                  <div>
                    <p className="sd-stat-value sd-display">{readinessScore}<span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>/100</span></p>
                    <p className="sd-stat-label">Overall readiness score</p>
                  </div>
                  <div>
                    <p className="sd-stat-value sd-display" style={{ color: 'var(--teal)' }}>{FINDINGS.length - shorCount}</p>
                    <p className="sd-stat-label">Assets already safe</p>
                  </div>
                  <div>
                    <p className="sd-stat-value sd-display" style={{ color: 'var(--crimson)' }}>{shorCount}</p>
                    <p className="sd-stat-label">Assets requiring action</p>
                  </div>
                </div>
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <thead><tr><th>Asset</th><th>Priority</th><th>Recommended action</th><th>Action by</th><th>Status</th></tr></thead>
                    <tbody>
                      {pqcActions.map((f) => (
                        <tr key={f.id}>
                          <td className="sd-mono">{f.asset}</td>
                          <td><span className="sd-band-pill" style={{ color: bandColors[f.band], background: `${bandColors[f.band]}22` }}>{BAND_LABEL[f.band]}</span></td>
                          <td className="sd-mono">{f.recommendation.primary}</td>
                          <td>{BAND_DEADLINE[f.band]}</td>
                          <td>{BAND_STATUS[f.band]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="sd-pqc-note">
                  RSA and ECC/ECDSA are fully broken by a sufficiently powerful quantum computer. AES-256 is only
                  weakened by Grover's algorithm, not broken, so fully-safe assets aren't listed as needing action.
                </p>
              </div>

              <div id="sec-recommend" className="sd-card sd-scroll-target">
                <h2>Recommendation engine</h2>
                <p className="sd-card-sub">
                  Confidence (0.70–0.95) is how sure the detector is — separate from risk. Every recommendation
                  includes a fallback so one unavailable algorithm doesn't stall the plan.
                </p>
                <div className="sd-table-wrap">
                  <table className="sd-table">
                    <thead><tr><th>Finding</th><th>Band</th><th>Confidence</th><th>Recommended</th><th>Fallback</th><th>Effort</th></tr></thead>
                    <tbody>
                      {sortedFindings.map((f) => (
                        <tr key={f.id}>
                          <td className="sd-mono">{f.algorithm}</td>
                          <td><span className="sd-band-pill" style={{ color: bandColors[f.band], background: `${bandColors[f.band]}22` }}>{BAND_LABEL[f.band]}</span></td>
                          <td className="sd-mono">{f.confidence.toFixed(2)}</td>
                          <td className="sd-mono">{f.recommendation.primary}</td>
                          <td className="sd-mono sd-table-loc">{f.recommendation.fallback}</td>
                          <td>{f.recommendation.effort}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="sec-reports" className="sd-card sd-scroll-target">
                <h2>Reports</h2>
                <div className="sd-reports-row">
                  <div className="sd-reports-meta">
                    <div><b>{activeFileName}</b> — scanned {activeScanDate}</div>
                    <div>{FINDINGS.length} findings · {shorCount} quantum-vulnerable · readiness {readinessScore}/100</div>
                  </div>
                  <button className="sd-action-btn primary" onClick={handleDownloadReport}>
                    <Download size={15} /> Download PDF report
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="sd-card">
            <h2>Recent scans</h2>
            {RECENT_SCANS.map((scan) => (
              <div className="sd-scan-row" key={scan.file}>
                <div>
                  <p className="sd-scan-file sd-mono">{scan.file}</p>
                  <p className="sd-scan-time">{scan.time}</p>
                </div>
                <span className="sd-band-pill" style={{ color: bandColors[scan.band], background: `${bandColors[scan.band]}22` }}>{BAND_LABEL[scan.band]}</span>
              </div>
            ))}
          </div>

          <div id="sec-history" className="sd-card sd-scroll-target">
            <h2>Previous scans & reminders</h2>
            <p className="sd-card-sub">Every file Semicolon has scanned before, most vulnerable and least recently checked first.</p>
            {sortedPreviousScans.map((scan) => (
              <div className="sd-scan-row" key={scan.id}>
                <div>
                  <p className="sd-scan-file sd-mono">{scan.file}</p>
                  <p className="sd-scan-time">Scanned {scan.scannedDaysAgo}d ago</p>
                </div>
                <span className="sd-band-pill" style={{ color: bandColors[scan.topBand], background: `${bandColors[scan.topBand]}22` }}>{BAND_LABEL[scan.topBand]}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border-soft)', marginTop: 16, paddingTop: 18 }}>
            <h2>Re-scan reminders</h2>
            <p className="sd-card-sub">
              Flag a file if you've changed its code, or let Semicolon remind you automatically after {REMINDER_DAYS} days.
            </p>
            {sortedPreviousScans.map((scan) => {
              const changed = !!changedFlags[scan.id];
              const overdue = scan.scannedDaysAgo >= REMINDER_DAYS;
              const showReminder = changed || overdue;
              return (
                <div className="sd-alarm-row" key={scan.id}>
                  <label className="sd-alarm-check">
                    <input type="checkbox" checked={changed} onChange={() => toggleChanged(scan.id)} />
                    <div>
                      <p className="sd-scan-file sd-mono">{scan.file}</p>
                      <p className="sd-scan-time">I've changed this code since the last scan</p>
                    </div>
                  </label>
                  <div className="sd-alarm-right">
                    <span className="sd-band-pill" style={{ color: bandColors[scan.topBand], background: `${bandColors[scan.topBand]}22` }}>{BAND_LABEL[scan.topBand]} priority</span>
                    {showReminder && (
                      <span className="sd-reminder">
                        <Bell size={12} />
                        {changed ? 'Changes flagged — re-scan recommended' : 'Overdue — re-scan recommended'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, accent, small }) {
  return (
    <div className="sd-stat-card">
      <p className="sd-stat-label">{label}</p>
      <p className={`sd-stat-value sd-display ${accent === 'risk' ? 'accent-risk' : ''}`} style={small ? { fontSize: 16 } : undefined}>
        {value}
        {suffix && <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>{suffix}</span>}
      </p>
    </div>
  );
}
