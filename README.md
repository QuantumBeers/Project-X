# 🧪 Project DUST — Modular Scene Kernel

Project DUST is a lightweight **relational scene engine** for real-time, WebGL-powered simulations.  
It treats each visual experiment as a node in an evolving graph, letting you **organise, traverse, and recombine** simulations without page reloads or code duplication.

---

## ✨ Key Features
| Capability | Description |
|------------|-------------|
| **Hot-swappable scenes** | Load any simulation into an iframe pane with one click. |
| **Metadata-driven navigation** | All scenes are indexed in `static/index.json`; the UI is generated from that file. |
| **Physics-grounded examples** | Particle flow, prime-distribution landscapes, and a Vis-Viva solar-system model. |
| **OS-agnostic asset paths** | Uses the CANP protocol (`assets.solar_system.planets.earth.texture.jpg`) for portable, semantic asset references. |
| **Zero external deps** | Plain Python `http.server` for local hosting—no frameworks required. |

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

> **Prerequisites:** Python 3.8+ and a modern browser (Chromium ≥ 90 or Firefox ≥ 88).

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
- 🧠 **Concept lineage tracing** (parent → child)  
- 🖼️ Live **thumbnail previews** + metadata panel  
- ⚙️ **Auto-generated** `index.json` from the `/static` directory  
- 🪐 **Stack-aware loaders** (compose particle → orbital → macro sims)  

---

## 🤝 Contributing

Contributions are welcome! Ideas that help the kernel grow in clarity, capability, or creative range are appreciated.

*Low-lift starting points:*

1. Add a new THREE.js scene (just drop an `indexv*.html` + update `index.json`).
2. Improve the Scene Explorer UI (filters, search, thumbnails).
3. Extend `run_js.py` to watch files and trigger live reloads.
4. Enhance the CANP resolver (e.g., validation, TypeScript typings).

Please open an issue first to discuss your idea.

---

## 🧑‍💻 Author

**Callum Maystone** — Architect of Emergence, Creator of Relational Intelligence  
> “This isn’t about code. This is structured cognition in motion.”

---

## 📄 License
Project DUST is released under the **MIT License** (see `LICENSE`).

Clone, run, explore — and re-imagine how we interface with complexity.
