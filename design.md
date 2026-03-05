# Design Elements: Source of Truth

This document serves as the source of truth for the design elements used in the `portfolio-v2` project, based on the Figma designs.

## 🎨 Color Palette

| Color Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Cream (Background)** | `#fffeee` | The primary background color for the application. Gives a warm, off-white/cream paper feel. |
| **Dark Brown (Primary)** | `#502e2e` | Used for all typography, logos, and graphic blocks. Acts as the primary contrast color. |

## 🔤 Typography

### Fonts
1. **General Sans Variable**: The primary display font used for the main name heading and English fallback for the logo block.
2. **Quicksand**: Used for secondary text and subtitles (specifically the Light weight).
3. **Noto Sans SC / Noto Sans JP**: Fallback fonts used for Chinese/Japanese characters.

### Type Styles

#### 1. Main Heading (Name)
*   **Text:** `horst fang`
*   **Font Family:** `General Sans Variable`, `sans-serif`
*   **Weight:** Medium
*   **Size:** `128px`
*   **Letter Spacing (Tracking):** `-12.8px` (approx. `-0.1em` for tight typography)
*   **Color:** `#502e2e`

#### 2. Subtitle
*   **Text:** `swe @QuickPOS, syde @uwaterloo`
*   **Font Family:** `Quicksand`, `sans-serif`
*   **Weight:** Light
*   **Size:** `24px`
*   **Color:** `#502e2e`

#### 3. Graphic Text Block (Chinese Characters)
*   **Text:** `方建为`
*   **Font Family:** `General Sans Variable`, `Noto Sans JP`, `Noto Sans SC`, `sans-serif`
*   **Weight:** Bold
*   **Size:** `48px`
*   **Style:** Cut-out effect (the container has a `bg-[#502e2e]` background, and the text creates a transparent cut-out so the cream background shines through).

## 📐 Spacing & Layout Constraints
*   **Logo/Hero Layout:** The header composition sits at the bottom-left of the viewport.
*   **Alignment:** The Chinese text block aligns vertically and acts as an anchor to the left of the main heading and subtitle. The name and subtitle are vertically stacked and aligned to the left next to it.
