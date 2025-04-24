## 📦 `Project DUST – Modular Scene Kernel`

**A lightweight framework for exploring structured emergence through modular simulations.**  
Project DUST allows you to **build, organize, and swap dynamic WebGL-based scenes** in real-time from a unified interface.

> This isn't a monolith—it's a **relational operating surface** for visualizing complexity, structure, and system behavior.  
> Built from the ground up using **native JS, Python, and THREE.js.**

---

### 🧠 What is it?

Project DUST is a **proof of concept** designed to:

- **Unify concept-driven visual simulations** under a single interface.
- Provide a **modular, navigable scene environment**—no reloads, no context switching.
- Explore how **relational structures, particle systems, and emergence** can be navigated visually.
- Allow you to **switch between simulations** like nodes in a graph of evolving ideas.

Each simulation (e.g., solar system, particle bonding, prime distribution) is:
- Encapsulated in its own file
- Indexed in `index.json`
- Dynamically loaded into a live preview panel (`iframe`) without leaving the portal

---

### 🧰 Tech Stack

| Layer         | Purpose                                      |
|---------------|----------------------------------------------|
| `Python`      | Local dev server (`http.server`)             |
| `JavaScript`  | Frontend logic and iframe routing            |
| `THREE.js`    | WebGL-based simulation rendering             |
| `index.json`  | Structured index of scenes with metadata     |
| `HTML/CSS`    | Minimal styling, native controls             |

---

### 🚀 Getting Started

#### 1. **Clone the Repo**
```bash
git clone https://github.com/QuantumBeers/project-dust.git
cd project-dust
```

#### 2. **Start the Local Server**
Make sure Python 3 is installed.

```bash
python run_js.py
```

By default, it will serve at:
```
http://localhost:8069/
```

> This gives you access to the Scene Explorer, where you can click and explore each simulation.

---

### 📁 Project Structure

```txt
project-dust/
├── static/                # All scenes, index, and frontend assets
│   ├── index.html         # Main Scene Explorer UI
│   ├── index.json         # Simulation index (metadata-driven)
│   ├── indexv1.html       # Individual simulation scenes
│   ├── ...
├── run_js.py              # Local Python server to serve files
```

---

### 📋 Example Entry in `index.json`
```json
[
  "Solar System",
  "indexv17.html",
  1.0,
  "Orbital simulation using Vis-Viva dynamics and inclination planes"
]
```

---

### 🎯 Why This Matters

Most code environments treat simulations as one-offs.  
Project DUST treats them as **navigable structure.**  

- You don't open files—you **traverse concepts.**
- You don't reload pages—you **shift lenses.**
- You’re building a system that **reflects cognition itself**: modular, emergent, and navigable.

This is the start of a **framework for structured thinking**, not just structured rendering.

---

### 🧩 What's Coming Next

- ✅ Scene-to-scene linking via metadata (`Related`, `Lineage`)
- 🖼️ Thumbnail previews and metadata extraction
- 📚 Auto-indexing: generate `index.json` dynamically from file system
- 🧠 Conceptual lineage tracking (parent/child sims)
- 🔄 Live state transitions between scenes (not just iframe swaps)

---

### 🤝 Contributing

This is a one-person project right now. If it resonates and you’d like to help:
- Build out new scenes using THREE.js
- Help scaffold metadata, linkages, and narrative flow
- Create utilities to enhance auto-indexing or UI transitions

Just open an issue or reach out via GitHub.

---

### 🧬 Author

**Callum Maystone**  
Systems Architect of Relational Intelligence  
> _“This isn’t about code. This is about emergence.”_
