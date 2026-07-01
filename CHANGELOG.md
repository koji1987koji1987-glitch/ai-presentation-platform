# Changelog

All notable changes to the AI Presentation Platform will be documented in this file.

---

## [2026-06-26] - Friday

### Added
- **Dynamic Slide Images (Gamma-Style)**:
  - Slide cards now automatically pull relevant Unsplash photos on generation.
  - Implemented interactive hover overlays on slide images allowing users to **Replace/Search** for images, change layout **Position** (`left` / `right` / `top` / `none`), and **Resize** width percentage using a slide control.
  - Created a server-side proxy route [images/route.ts](file:///Users/kojifukui/ai-presentation-platform/frontend/app/api/images/route.ts) that queries Unsplash's public API securely without exposing keys to the client browser.
  - Added visual search modal dialog allowing users to enter custom query keywords and select matching photo thumbnails in real time.

### Changed
- **API Key Relocation (Security)**:
  - Removed `GEMINI_API_KEY` and `OPENAI_API_KEY` from `frontend/.env.local`.
  - Created `backend/.env` to store keys securely.
  - Added a custom environment loading parser in [slide_generator.py](file:///Users/kojifukui/ai-presentation-platform/backend/slide_generator.py) to load key configurations directly in Python.
- **Header Menu Cleanup**:
  - Removed the external "GitHub" link from the landing page navbar in [page.tsx](file:///Users/kojifukui/ai-presentation-platform/frontend/app/page.tsx).

---

## [2026-06-25] - Thursday

### Added
- **Strict Slide Count Controls (Backend)**:
  - Regex parser in [slide_generator.py](file:///Users/kojifukui/ai-presentation-platform/backend/slide_generator.py) to extract slide count requests (e.g., "4-slide", "4 slides", "four slides").
  - Strict system prompt limits instructing the LLM to output exactly the requested slide count.
  - Fallback logic to dynamically slice or pad outlines to match the requested slide count.
- **Dynamic Text Wrapping (Frontend)**:
  - Created `AutoGrowingTextarea` component in [presentation/page.tsx](file:///Users/kojifukui/ai-presentation-platform/frontend/app/presentation/page.tsx) to replace single-line text inputs for slide titles and bullet points. Text now wraps to multiple lines naturally as it is edited.
- **Hover Deletion Controls**:
  - Hidden delete buttons on bullet rows by default. They fade in smoothly only when hovering over a specific bullet row, producing a clean Gamma-style editor UI.

### Changed
- **Fluid Layout & Responsiveness**:
  - Replaced rigid aspect ratios and inline dimensions on slide cards with fluid container CSS rules (`height: "auto"`, `min-height: 520px`).
  - Added responsive CSS grids that stack side-by-side elements (sidebar outline/editor and text/diagrams) vertically on smaller screen resolutions (under 1024px) to prevent horizontal scrollbars and overlaps.

---

## [2026-06-19] - Friday

### Added
- **Professional Landing Page**:
  - Created a visually rich landing page in [upload/page.tsx](file:///Users/kojifukui/ai-presentation-platform/frontend/app/upload/page.tsx) supporting prompt inputs and drag-and-drop document upload (PDF/Word).
- **Split-Pane Editor Interface**:
  - Redesigned the editor in [presentation/page.tsx](file:///Users/kojifukui/ai-presentation-platform/frontend/app/presentation/page.tsx) to feature a split-pane layout: a sticky outline sidebar on the left and scrollable slide cards on the right.
- ** Sakura Peach & Cobalt Tech Themes**:
  - Expanded presentation editor styles to include a pink blossom theme and a bright high-contrast blue tech theme.

### Changed
- **Visual Diagram Alignment**:
  - Corrected coordinates alignment and added `x_shift` coordinate shifts inside [ppt_exporter.py](file:///Users/kojifukui/ai-presentation-platform/backend/ppt_exporter.py) to ensure downloaded PowerPoint decks display shapes neatly without overlap.
