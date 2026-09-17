# Semicolon

Semicolon is a front-end prototype for cryptographic discovery, risk analysis, and post-quantum cryptography (PQC) readiness. It turns an uploaded file into an explainable inventory, risk view, recommended actions, and downloadable executive report.

## What it includes

- A scan-first dashboard: analysis remains hidden until a file is uploaded or a live demo scan is run.
- Five consistent risk bands: Safe, Low, Moderate, High, and Critical.
- Risk breakdown, dependency topology, current-vs-projected risk chart, crypto inventory, PQC readiness, and recommendation engine.
- Previous scans and re-scan reminders in one place.
- A multi-page PDF report for the current scan.
- Profile menu with activity, account settings, help centre, and logout.
- A research-informed News article and reference library.

## Run locally

### Requirements

- Node.js 18 or later
- npm

### Install and start

```bash
npm install
npm run dev
```

Open the local address shown in the terminal, normally `http://localhost:5173`.

### Production build

```bash
npm run build
```

The production files are created in `dist/`.

## Using the dashboard

1. Sign in or continue to the dashboard.
2. Use **Upload file to scan** to choose a certificate, key, configuration, or code file; alternatively use **Run live scan** to see the demo flow.
3. Wait for scanning to finish. Only then will risk analysis, topology, inventory, PQC readiness, recommendations, and reports appear.
4. Review the findings and download the executive PDF report from **Reports**.

> This is a prototype interface. Its displayed risk results and recommendations are decision-support examples, not a guarantee of security or a replacement for expert validation.

## Project structure

```text
src/
  components/       Shared UI, including the top bar and profile menu
  context/          Lightweight browser-based authentication state
  pages/            Home, Dashboard, News, References, and account pages
```

## Deploying to GitHub Pages

This repository is ready to be stored on GitHub. To publish it as a live website, configure a GitHub Pages deployment for a Vite/React app, or deploy the `dist/` output to another hosting provider after running `npm run build`.

## Research

The News and References pages link to the supplied papers and primary NIST PQC migration guidance. Claims are presented conservatively and should be reviewed before making policy or security decisions.
