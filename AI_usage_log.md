# AI Usage Log

This document logs how AI assistance was utilized, where the AI outputs were incomplete or incorrect, and how we verified and corrected the errors.

## 1. Task: Express Server Routing & Initial cleaner.js
- **What we asked AI to do**: Write a clean Express pipeline and helper function `cleaner.js` to strip out boilerplates (Agent signatures, order numbers, Pune/Kolkata/Bangalore city tags).
- **AI Mistakes / Issues**:
  - The AI generated a regex pattern to catch punctuation and symbols, but missed emoji characters like `😡😡😡😡`.
  - Initially, the test script returned `IsMeaningless: false` for emojis because they didn't match the punctuation regex `/^[.\s?~!@#$%^&*()_+={}[\]|\\:;"'<>,/`-]+$/`.
- **How we fixed it**:
  - We modified the function `isMeaningless()` to use Unicode property escapes: `!/[\p{L}\p{N}]/u.test(trimmed)`.
  - This checks if the string has *no letters* and *no numbers* in any Unicode language. Emojis, punctuation, and symbol-only lines now correctly return `isMeaningless: true` and are successfully dropped from the pipeline.

---

## 2. Task: Inconsistent Date Parsing
- **What we asked AI to do**: Parse mixed-format date columns (`02-Feb-24`, `02/14/2024`, `25-03-2024 16.31`, `"March 18, 2024"`).
- **AI Mistakes / Issues**:
  - The AI initially suggested using `date-fns` for parsing. However, installing `date-fns` in different project folders could lead to import path errors or dependency resolution issues with Node.
- **How we fixed it**:
  - We removed the `date-fns` import entirely and wrote a custom pure JavaScript parser `parseDate()` in `cleaner.js` that splits date/time components using spaces, slashes, or dashes, and maps month string names manually.
  - This made the cleaning script zero-dependency, extremely fast, and highly reliable.

---

## 3. Task: Frontend Chart Integrations
- **What we asked AI to do**: Create dashboard graphs tracking rating and sentiment changes over time.
- **AI Mistakes / Issues**:
  - The AI suggested installing `recharts` or `chart.js`. When running in React 19 / Next.js 15 environments, external chart libraries often throw compilation warnings or SSR mismatches.
- **How we fixed it**:
  - We bypassed external dependencies by writing a responsive SVG line/area generator in React. The trend line is rendered directly using SVG elements (`<path>`, `<circle>`, `<linearGradient>`) and absolute scaling.
  - This guaranteed that the dashboard page compiled in less than 500ms and was 100% stable with Next.js SSR.
