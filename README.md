# Semicolon

> Cryptographic discovery, contextual risk analysis, and post-quantum readiness—built to turn hidden cryptography into an actionable migration plan.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

Semicolon is a modern front-end prototype for discovering cryptographic assets, visualising cryptographic risk, and preparing organisations for post-quantum cryptography (PQC) migration.

Instead of producing another disconnected list of algorithms, Semicolon connects discovery to context: where an asset lives, its risk band, related dependencies, confidence, migration urgency, recommended action, and executive-ready report.

## Why Semicolon?

Cryptography is everywhere: certificates, keys, protocols, service configurations, repositories, and third-party dependencies. The hardest part of PQC migration is often not choosing an algorithm—it is building a trustworthy picture of what exists and what needs to change first.

Semicolon provides a clear workflow:

```text
Upload File
   ↓
Discover Cryptographic Assets
   ↓
Classify Algorithms and Context
   ↓
Apply Risk Bands and PQC Readiness Logic
   ↓
Prioritise Recommendations
   ↓
Generate Executive PDF Report
```

## Features

- Scan-first dashboard: analysis remains hidden until a file is uploaded or a live demo scan is run.
- Five-band risk model: Safe, Low, Moderate, High, and Critical.
- Cryptographic asset inventory with algorithm, location, confidence, and risk band.
- Risk Breakdown donut chart and current-vs-projected remediation bar chart.
- Cryptographic Asset Topology for understanding relationships and remediation order.
- PQC Readiness score, action deadlines, status, and recommended migration paths.
- Recommendation Engine with confidence, fallback options, and estimated effort.
- Previous scans and re-scan reminders in one place.
- Downloadable multi-page PDF report for the current scan.
- Profile menu, activity history, account settings, help centre, and logout.
- Research-informed News and References pages.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Front end | React 18 |
| Build tool | Vite |
| Routing | React Router |
| Charts | Recharts |
| Topology visualisation | react-force-graph-2d |
| PDF reports | jsPDF |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

### Installation

```bash
git clone https://github.com/antrikshachauhan007-png/Semicolon.git
cd Semicolon
npm install
npm run dev
```

Open the local address shown in the terminal, normally `http://localhost:5173`.

### Production Build

```bash
npm run build
```

The production files are created in `dist/`.

## Using the Dashboard

1. Sign in or continue to the dashboard.
2. Use **Upload file to scan** to choose a certificate, key, configuration, or code file; alternatively use **Run live scan** to see the demo flow.
3. Wait for scanning to finish. Only then will risk analysis, topology, inventory, PQC readiness, recommendations, and reports appear.
4. Review the findings and download the executive PDF report from **Reports**.

> This is a prototype interface. Its displayed risk results and recommendations are decision-support examples, not a guarantee of security or a replacement for expert validation.

## Project Structure

```text
src/
  components/       Shared UI, including the top bar and profile menu
  context/          Lightweight browser-based authentication state
  pages/            Home, Dashboard, News, References, and account pages
```

## Research

The News and References pages link to the supplied papers and primary NIST PQC migration guidance. Claims are presented conservatively and should be reviewed before making policy or security decisions.
