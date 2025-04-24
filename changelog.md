# 📜 Project DUST – Change Register

This changelog documents significant updates to the Project DUST Modular Scene Kernel, with a focus on feature additions, architecture changes, and conceptual milestones.


```markdown
## [v0.2.1] – 2025-04-24

**📦 Protocol Defined: CANP (Contextual Asset Naming Protocol)**
- Introduced `CANP.md` as the formal specification.
- CANP enables structured, OS-agnostic asset referencing via dot-path semantics.
- Added `resolveCANP()` utility logic to support runtime resolution of semantic paths.
- Now used in Solar System simulation to load Earth texture from:

## [v0.2.0] – 2025-04-24

**🔭 Feature Added: Earth Texture Integration**
- Earth now renders with a realistic surface texture using `MeshStandardMaterial`.
- Texture path is defined using dot-separated logic:

  texture: 'assets.solar_system.planets.8081_earthmap10k.jpg'

- A custom path resolver converts this format to a valid URL path:

  "assets/solar_system/planets/8081_earthmap10k.jpg"


**💡 Update: OS-Agnostic Path Resolution**
- Introduced a function `resolveTexturePath(dotPath)` that:
  - Interprets dot-separated asset strings
  - Resolves paths dynamically based on file extension location
- Ensures portability across Linux, Windows, macOS, and web-hosted environments.

**🧱 Refactor: TextureLoader Scope Fix**
- Moved `const textureLoader = new THREE.TextureLoader()` outside loop to prevent scope issues and improve memory usage.

---

## [v0.1.0] – Initial Launch

**🧪 Initial Framework Release**
- Python webserver (run_js.py) for static scene hosting.
- Dynamic scene loading using `index.json` and iframe rendering.
- Scene Explorer UI with metadata-driven loading.
- Core simulations:
  - Particle Flow
  - Thermal Interactions
  - Prime Distribution
  - Solar System (baseline)

---

🧠 *Everything in this register is a reflection of evolving structure.*  
*Each change is a step toward a modular framework for cognitive simulation.*

```
