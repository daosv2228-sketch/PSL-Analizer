# PSL Face Analyzer

PSL Face Analyzer is a client-side computer vision application for objective anthropometric facial assessment based on the PSL (PhySeL / Lookism) craniofacial framework and plastic surgery cephalometric standards. It runs directly inside modern web browsers using MediaPipe Face Mesh to extract 468 three-dimensional facial landmarks, validates head posture across 11 optical criteria in real time, and computes normalized aesthetic indices.

All biometric calculations are executed locally in memory on the client device. No photos, video streams, or facial landmark coordinates are transmitted to external servers.

---

## Features

- Real-Time Facial Tracking: Employs MediaPipe Face Mesh (468 landmarks plus refined iris coordinates) running at 30 FPS.
- Exponential Moving Average (EMA) Landmark Filter: Reduces camera sensor jitter and sub-pixel noise for smooth, stable geometric readings.
- 11-Point Optical Positioning Protocol: Evaluates head yaw, pitch, roll, frame centering, distance and scale, neutral expression, eye opening, lighting uniformity, focus sharpness, and contour visibility prior to capture.
- Frontal 0° Anthropometric Evaluation: Computes 11 verified craniofacial ratios aligned with looksmaxing community benchmarks and cephalometric literature.
- Four Anthropometric Pillars: Measures facial harmony and proportions, lower third dimorphism, periorbital architecture, and bilateral symmetry.
- Multilingual Support: Built-in localization for English (EN), Russian (RU), and German (DE) with instantaneous in-app language switching.
- Adaptive Dual Theme: Supports both light mode (#E6EDF7 neutral base) and dark mode (#0B0F1A deep slate base), adhering to a strict 90/10 neutral-to-accent ratio and WCAG AA contrast standards.
- Visual Analytics: Interactive six-axis radar chart and four-pillar population benchmark charts rendered via Chart.js.
- Local Image Calibration: Dedicated upload interface with pan, zoom, and rotation controls for pre-existing portrait photographs.
- Report Export: Single-click clipboard copying of structured results and full canvas report export to PNG.

---

## Anthropometric Standards & Community Benchmarks

The scoring pipeline maps measured proportions to normalized PSL scales where the population median evaluates to 5.0, high-tier normie (HTN) proportions evaluate to ~6.5, and model-tier proportions evaluate to 8.0+.

| Metric | Anatomical Basis | Population Mean | Looksmaxing Ideal |
|---|---|---|---|
| fWHR | Bizygomatic width / Midface height (Nasion to upper vermilion) | 1.82 | 1.95 - 2.05 |
| Compact Midface | Interpupillary distance (IPD) / Midface length (Mid-eye to stomion) | 0.90 | 1.00 - 1.05 |
| Canthal Tilt | Lateral canthus elevation relative to medial canthus (roll-invariant) | +1.5 deg | +4.0 - +6.0 deg |
| Hunter Eyes Index (PFI) | Palpebral fissure height / Palpebral fissure width | 0.38 | 0.28 - 0.32 |
| Chin-to-Philtrum Ratio (CPR) | Menton-to-lower-vermilion height / Subnasale-to-upper-vermilion height | 1.75 : 1 | 2.00 - 2.25 : 1 |
| Bigonial-to-Bizygomatic | Mandibular angle span / Bizygomatic breadth | 79% | 86% - 90% |
| Frontal Jaw Angle | Angle formed by gonion-L, gnathion/menton, and gonion-R | 110 deg | 92 - 98 deg |
| Eye Separation Ratio (ESR) | Interpupillary distance / Bizygomatic breadth | 0.445 | 0.465 |
| Neoclassical Thirds | Lower third height (Subnasale to Menton) / Mid third height (Glabella to Subnasale) | 0.92 | 1.00 - 1.05 |
| Lip Ratio | Lower vermilion height / Upper vermilion height | 1.35 | 1.55 - 1.65 |
| Bilateral Symmetry | Sagittal mirror deviation across bilateral cheekbones, gonions, and canthi | 95.0% | > 98.0% |

---

## Real-Time Optical Alignment Criteria

To eliminate perspective distortion and lens foreshortening, the coach panel validates 11 conditions before recommending snapshot capture:

1. Face Presence: Confirmation of 468 verified landmark coordinates.
2. Centering: Bounding center within 42% to 58% horizontal and 38% to 56% vertical bounds.
3. Yaw Angle: Facial rotation constrained to +/- 4.2 degrees using bilateral cheek depth and nasal horizontal offset.
4. Pitch Angle: Head nod constrained to +/- 4.5 degrees relative to the Frankfurt horizontal line.
5. Roll Angle: Lateral head tilt constrained to +/- 2.8 degrees between outer canthi.
6. Distance and Scale: Face height occupying 35% to 72% of the vertical viewport.
7. Neutral Expression: Lip separation index under 0.22 of eye width.
8. Eye Gaze: Palpebral aperture between 0.20 and 0.44 with forward ocular vector.
9. Lighting Distribution: Balanced bilateral luminance across facial hemispheres.
10. Image Sharpness: High-frequency edge contrast verification.
11. Contour Visibility: Key peripheral jaw and orbital points unobstructed.

---

## Technical Stack

- Frontend: Vanilla TypeScript / ES2022, HTML5 Canvas API
- Computer Vision: Google MediaPipe Face Mesh (WebAssembly / WebGL runtime)
- Styling: Tailwind CSS, Plus Jakarta Sans, JetBrains Mono
- Data Visualization: Chart.js
- Bundler & Dev Server: Vite

---

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm, pnpm, or bun

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/psl-face-analyzer.git
cd psl-face-analyzer
npm install
```

### Running Locally

Start the Vite development server:

```bash
npm run dev
```

Open your browser at:

```
http://localhost:3000
```

To create an optimized production build:

```bash
npm run build
```

The compiled assets will be placed into the dist/ directory.

---

## Privacy & Biometrics

All landmark detection, geometry calculations, and image transformations occur strictly on the client device inside the browser sandbox. No camera streams, uploaded photos, or facial biometric records are stored or transmitted over any network connection.

---

## Disclaimer

This software is an educational and anthropometric research project. It calculates mathematical proportions based on specific aesthetic theories popular in online lookism and craniofacial modeling communities. Human aesthetic appeal is subjective, context-dependent, and influenced by personal health, expression, charisma, and individuality.

---

## License

This project is licensed under the Apache 2.0 License.
