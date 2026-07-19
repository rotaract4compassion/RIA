---
name: Ria spinner decision
description: Why we use a programmatic gear SVG instead of the Rotaract Tanzania icon file.
---

The file `rotaract-tanzania-icon.svg` is a binary PNG mislabeled as SVG — it cannot be used inline as an SVG path. The existing `rotary-wheel-spinner.svg` path rendered poorly at small sizes.

**Decision:** Generate a clean 8-tooth gear-wheel SVG path programmatically in `frontend/src/components/LoadingSpinner.jsx` at module load time. Gold fill `#F7A81B`, hub cut out via `fillRule="evenodd"`.

**Why:** Any future icon file change would break a file-based approach; the programmatic path is self-contained and resolution-independent.

**How to apply:** Do not replace with a file-based SVG unless the file is confirmed to be a real vector SVG with a parseable `<path>` element.
