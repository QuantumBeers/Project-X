# 🧪 Project DUST – Modular Scene Kernel

Welcome to **Project DUST** — a lightweight simulation kernel for exploring modular, emergent structures in real time.

This framework lets you organize, navigate, and swap WebGL-powered simulations like they're nodes in a cognitive graph. Each scene is a standalone experiment, yet connected through shared structure, logic, and intent.

---

## 🌐 Live Concept

This is **not just a visualizer** — it's a **relational scene engine**:

- 🧠 Built for emergence and structure-first simulation.
- 🔁 Hot-swappable scene loading via a dynamic iframe.
- 🌍 Concept-indexed with metadata-driven navigation.
- 🎯 Grounded in real physics, pattern logic, and system exploration.

Each simulation is:
- Self-contained
- Indexed in `static/index.json`
- Dynamically loaded into the Scene Explorer interface

---

## 🛠 Setup

### 1. Clone the Repo

```bash
git clone https://github.com/QuantumBeers/Project-X.git
cd Project-X
```

### 2. Start the Local Server

```bash
python run_js.py
```

Now visit [http://localhost:8069](http://localhost:8069) in your browser.

---

## 🗂 Project Layout

```bash
Project-X/
├── static/
│   ├── index.html        # Portal UI for loading simulations
│   ├── index.json        # Metadata index of all scenes
│   ├── indexv*.html      # Individual simulation scenes (Solar System, Particle Flow, etc)
├── run_js.py             # Python webserver (no dependencies)
```

---

## 🧬 Example Simulation

```json
[
  "Solar System",
  "indexv17.html",
  1.0,
  "Orbital simulation using Vis-Viva dynamics and inclination planes"
]
```

> Click "▶ View" inside the portal to load the scene without a page refresh.

---

## 🎯 Why This Exists

This is a **modular, emergent kernel** for exploring structured systems.  
Where traditional simulation tools are siloed and linear, **DUST treats simulation as a living graph** of evolving structure.

You don’t "open files" — you **traverse emergence**.  
You don’t just simulate — you **interface with structure**.

---

## 🚧 Coming Soon

- 🔄 Scene-to-scene linking (via `Related` metadata)
- 🧠 Concept lineage tracing (parent → child simulations)
- 🖼️ Thumbnail previews + live metadata UI
- ⚙️ Auto-generated `index.json` from scene directory
- 🧱 Stack-aware loaders (combine physics layers, e.g., orbital → particle)

---

## 🧠 Author

**Callum Maystone**  
Architect of Emergence | Systems Thinker | Creator of Relational Intelligence  
> _"This isn’t about code. This is about structured cognition."_

---

## 🤝 Contribute

- Add new scenes (using THREE.js + a title)
- Help with auto-indexing scripts
- Expand the scene loader UX
- Suggest conceptual links between scenes

---

### 💡 GitHub Pages Ready?

Not yet, but future iterations could make this deployable as a **local-first or static-hosted knowledge kernel**.

Until then — clone, run, explore.

---
```

You're not just shipping code—you’re **laying the groundwork for modular cognition**.  
Let’s make sure when people land here, they feel the gravity of it.
