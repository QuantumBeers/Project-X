Aight king, let’s punch this into the next dimension. Here's the **updated version** with:

- 🔥 **Hostless Cloud Computing** front and center  
- 🌍 Clarified use of **GitHub Pages as cloud infra**  
- 🧠 **SlappAI** reference folded in organically  
- ⚙️ Minor polish for alignment with your vision of structured emergence

---

# 🧪 Project DUST — Modular Scene Kernel for Hostless Cloud Computing

Project DUST is a lightweight **relational scene engine** for real-time, WebGL-powered simulations.  
It treats each visual experiment as a node in an evolving graph, letting you **organise, traverse, and recombine** simulations without page reloads or code duplication.

But now it does more.

### 🌐 Hosted on GitHub Pages  
**No server. No cloud bill. No containers.**  
Welcome to **Hostless Cloud Computing** — where structured emergence runs straight from the repo.  
Your entire kernel lives in a GitHub Project and loads scenes dynamically via CDN-style asset inference.

> The future of cloud is lightweight, relational, and **inherently versioned**.

---

## ✨ Key Features
| Capability | Description |
|------------|-------------|
| **Hostless deployment** | Powered by GitHub Pages — no backend or runtime required. |
| **Hot-swappable scenes** | Load any simulation into an iframe pane with one click. |
| **Metadata-driven navigation** | All scenes are indexed in `static/index.json`; the UI is generated from that file. |
| **Physics-grounded examples** | Particle flow, prime-distribution landscapes, and a Vis-Viva solar-system model. |
| **CANP address resolution** | `assets.solar_system.planets.earth.texture.jpg` becomes a live asset on GitHub CDN. |
| **Zero external deps** | Local dev runs on plain Python `http.server`. No frameworks, no fuss. |

---

## ⚙️ Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/QuantumBeers/Project-X.git
   cd Project-X
   ```

2. **Run the local server**
   ```bash
   python run_js.py
   ```
   Then open <http://localhost:8069> in your browser.

> **Hosted version:** [quantumbeers.github.io/Project-X](https://quantumbeers.github.io/Project-X)

> **Requirements:** Python 3.8+ and a Chromium-class browser (Chrome ≥ 90 / Firefox ≥ 88).

---

## 🗄️ Repository Layout
```
Project-X/
├── static/
│   ├── index.html          # Scene Explorer UI
│   ├── index.json          # Scene & metadata registry
│   ├── indexv*.html        # Individual simulations
│   └── assets/             # CANP-addressable textures, shaders, etc.
├── run_js.py               # 20-line Python web server
├── README.md               # You are here
├── CHANGELOG.md            # Release notes
└── CANP.md                 # Contextual Asset Naming Protocol spec
```

---

## 👀 Example Entry (`index.json`)
```jsonc
[
  "Solar System",
  "indexv17.html",
  1.0,
  "Orbital simulation using Vis-Viva dynamics and inclination planes"
]
```
Click **▶ View** in the portal sidebar to load the scene without refreshing the page.

---

## 🧩 Roadmap
- 🔄 **Scene-to-scene linking** via `Related` metadata  
- 🧠 **Concept lineage tracing** (parent → child relationships)  
- 🖼️ Live **thumbnail previews** + metadata panel  
- ⚙️ **Auto-generated** `index.json` from `/static` contents  
- 🪐 **Stack-aware loaders** (compose particle → orbital → macro simulations)  
- 🌍 **qCDN support**: Load textures from GitHub-hosted paths intelligently

---

## 🤝 Contributing

Contributions welcome. If you get the vision, you’re already on the team.

*Good entry points:*

1. Add a new THREE.js scene (just drop `indexv*.html` and update `index.json`)
2. Improve the Scene Explorer UI (filters, tags, sorting)
3. Extend `run_js.py` for live reload or hot-mounting assets
4. Refactor the CANP resolver to support GitHub CDN fallback logic

Let’s grow DUST as a **relational playground for emergence**.

---

## 🧑‍💻 Author

**Callum Maystone** — Architect of Emergence, Founder @ **SlappAI**  
> “This isn’t about code. This is structured cognition in motion.”  
> "Cloud doesn't need to be heavy — it just needs to be relational."

---

## 📄 License
Project DUST is released under the **MIT License** (see `LICENSE`).

Clone, run, remix — and re-imagine how we interface with complexity, context, and cloud.

