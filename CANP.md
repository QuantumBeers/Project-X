# 📡 CANP Protocol – Contextual Asset Naming Protocol

**CANP (Contextual Asset Naming Protocol)** is a semantic, OS-agnostic, and queryable file reference standard for emergent systems.

It allows assets to be treated as **contextual nodes**, enabling structured traversal, intuitive referencing, and dynamic path resolution across platforms and environments.

---

## 🔤 Syntax

```
[domain].[context].[category].[subcontext].[identifier].[extension]
```

Each `.` is not just a delimiter — it's a **graph edge**.  
Each segment holds meaning in a structured path hierarchy.  
The **last segment** (`.extension`) defines the file type and acts as the **terminal node**.

---

## 🧠 Philosophy

CANP isn’t about location — it’s about **contextual meaning**.

Where traditional paths reference physical structure (`/folder/file`),  
CANP references **semantic structure** (`domain.context.subcontext.identifier.ext`).

This shift enables:
- Portable asset linking across OS boundaries
- Graph-based navigation of data
- Meaning-first file referencing

---

## 🧪 Examples

| CANP Path | Description |
|-----------|-------------|
| `assets.solar_system.planets.earth.texture.jpg` | Texture file for Earth in solar system module |
| `assets.bioinformatics.rna.foldmodel.v1.json`   | JSON structure for RNA fold model v1 |
| `assets.particles.fields.vector.springmatrix.glsl` | Spring matrix shader in particle system |
| `assets.dust.kernel.versioning.manifest.json`   | Core version manifest for the DUST kernel |

---

## 🔧 Resolution Logic

To resolve a CANP path to a real file system path:

```js
function resolveCANP(dotPath) {
  const parts = dotPath.split('.');
  const ext = parts.pop();           // file extension
  const filename = parts.pop();      // filename
  const folderPath = parts.join('/'); // convert remaining dots to slashes
  return `${folderPath}/${filename}.${ext}`;
}
```

### ✅ Example

```js
resolveCANP('assets.solar_system.planets.earth.texture.jpg');
// → "assets/solar_system/planets/earth/texture.jpg"
```

---

## 📦 Use Cases

- ✅ File and texture loading in web-based visualizations
- ✅ Cross-platform asset resolution in static/hosted systems
- ✅ Dynamic asset querying in relational simulation engines
- ✅ Contextual tracking for simulation evolution (e.g. versioned lineage)

---

## 🧩 Integration in Project X

CANP is now the **default asset referencing schema** for all future simulations in **Project X**.

This allows:
- 💡 Structured indexing of assets
- 🧬 Graph-based lineage across simulations
- 🔁 Consistent asset access regardless of operating system

Used in:
- 🌍 `indexv17.html` (Solar System) to load:
  ```txt
  assets.solar_system.planets.8081_earthmap10k.jpg
  ```

---

## 🔄 Future Expansion

- `canp://` protocol handler for browser/plugin environments
- Graph query language for deep CANP traversal
- Lineage chain tracking (e.g., `parent → child` node mappings)
- CANP-based simulation dependency mapping

---

## ✨ Why It Matters

CANP formalizes the way **emergent systems interface with assets**.  
It’s the bridge between structure and execution — between cognition and code.

Where file systems are rigid,  
**CANP is relational.**  
Where paths are brittle,  
**CANP is modular.**  
Where references are flat,  
**CANP is a graph.**

---

**Authored by:**  
Callum Maystone  
_Architect of Emergence • Creator of Relational Intelligence_

