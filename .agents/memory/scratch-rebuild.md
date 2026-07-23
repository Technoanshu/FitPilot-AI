---
name: Scratch rebuild boundaries
description: Durable architecture decisions for the current FitPilot rebuild.
---

FitPilot's current rebuild deliberately uses a fresh `fp_*` database namespace and a React Router frontend rather than carrying forward the previous feature model.

**Why:** The user explicitly asked to destroy the previous implementation and start the model-building process from scratch, so isolation prevents stale schema and route assumptions from leaking into the new product.

**How to apply:** Add new FitPilot domain features to the fresh API contract and `fp_*` schema, then expose them through generated hooks and the requested clean-architecture folders.