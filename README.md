# Semicolon

> Cryptographic discovery, risk prioritisation, and post-quantum readiness—turning hidden cryptography into an actionable migration plan.

Semicolon is a React-based prototype for discovering cryptographic assets in uploaded files, assigning contextual risk bands, visualising dependencies, and producing a practical PQC migration report.

It is designed around one core principle:

> Do not show security analysis until a file has actually been scanned.

## Highlights

- Scan-first workflow with loading, empty, and completed states
- Five-band risk model: Safe, Low, Moderate, High, Critical
- Cryptographic asset inventory with algorithm, location, confidence, and risk band
- Risk Breakdown donut chart
- Current-vs-projected remediation bar chart
- Cryptographic asset topology visualisation
- PQC readiness score, deadlines, status, and recommended actions
- Recommendation engine with fallback algorithms and estimated effort
- Previous scans and re-scan reminders
- Multi-page executive PDF report
- Profile activity, account settings, help centre, and logout
- Research-informed News and References pages

## Tech Stack

| Area | Technology |
| --- | --- |
| UI | React 18 |
| Build tool | Vite |
| Routing | React Router |
| Charts | Recharts |
| Asset topology | react-force-graph-2d |
| PDF generation | jsPDF |
| Icons | Lucide React |

## Architecture

```text
User Upload
    ↓
Scan State Controller
    ↓
Discovery & Classification Layer
    ↓
Unified Five-Band Risk Model
    ↓
Dashboard Views
├── Risk Breakdown
├── Asset Topology
├── Risk Dashboard
├── Remediation Projection
├── Crypto Inventory
├── PQC Readiness
└── Recommendation Engine
    ↓
Executive PDF Report
```

The dashboard uses a unified risk model so the same asset has the same band across the topology, charts, inventory, recommendations, and PQC readiness views.

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Installation

```bash
git clone https://github.com/antrikshachauhan007-png/Semicolon.git
cd Semicolon
npm install
npm run dev
```

Open the local URL shown in Terminal, usually:

```text
http://localhost:5173
```

### Production Build

```bash
npm run build
```

The optimised website is generated in the `dist` folder.

## Available Scripts

```bash
npm run dev
```

Starts the local development server.

```bash
npm run build
```

Creates the production build.

```bash
npm run preview
```

Previews the production build locally after running `npm run build`.

## Dashboard Workflow

1. Open the Dashboard.
2. Select **Upload file to scan** or use **Run live scan** for the demonstration workflow.
3. Semicolon enters a scanning state.
4. Once complete, the dashboard reveals the analysis for the current file.
5. Review the risk, inventory, PQC readiness, and recommended actions.
6. Download the executive PDF report.

## Risk Bands

| Band | Meaning | Suggested response |
| --- | --- | --- |
| Critical | Immediate or severe cryptographic exposure | Act immediately |
| High | Significant risk requiring near-term remediation | Prioritise |
| Moderate | Migration planning is required | Plan remediation |
| Low | Limited concern or maintenance opportunity | Monitor |
| Safe | No immediate action identified in the current scan | Maintain |

## Project Structure

```text
src/
├── components/
│   ├── ProfileMenu.jsx
│   ├── Splash.jsx
│   └── TopBar.jsx
├── context/
│   └── AuthContext.jsx
├── pages/
│   ├── AccountPages.jsx
│   ├── Dashboard.jsx
│   ├── Home.jsx
│   ├── News.jsx
│   ├── References.jsx
│   └── account.css
├── App.jsx
├── ECDATLogin.jsx
├── index.css
└── main.jsx
```

## Security and Research Note

Semicolon is a front-end prototype and educational demonstration. Its scan output, risk scores, recommendations, readiness score, and PDF reports are designed to support decision-making; they are not a guarantee of security, compliance, or quantum safety.

Before production deployment, implement:

- Secure backend authentication and authorisation
- Encrypted storage and data retention rules
- Audit logging
- Real scanner integrations
- Expert validation of discovered cryptographic assets
- Compatibility testing before PQC migration

The project’s News and References pages include supplied research links and NIST PQC migration resources.

## Roadmap

- [ ] Connect a production cryptographic scanning backend
- [ ] Add organisation-level scan history
- [ ] Add role-based access control
- [ ] Add real-time notification delivery
- [ ] Add exportable compliance templates
- [ ] Add deployment pipeline for GitHub Pages or cloud hosting

## License

This project is intended for educational and demonstration purposes. Add an MIT License file if you want others to freely use and modify the code.

