# Warm Storycraft Design System

The visual design system and component guidelines for the **Readventure** application.

---

## 📖 Philosophy: The Anti-AI-Slop Aesthetic

Modern web tools and AI code generators have saturated the web with generic "AI slop":
- Default purple-to-blue diagonal gradients
- Centered cards floating in empty voids
- Floating icon chips in pastel rounded squares (`bg-amber-100 p-3 rounded-2xl`)
- 4-bar rainbow password strength meters
- Conversational filler copy (*"Don't worry! It happens to the best of us"*)
- Welded arrow glyphs on buttons (`Send Link →`)
- Reflexive glassmorphism and `backdrop-blur`

**Warm Storycraft** replaces every reflex with an intentional design choice:
1. **Calm, Earthy Palette**: Grounded in natural paper, linen, and warm hazelnut tones.
2. **Editorial Typography**: Clear hierarchy using **Poppins** with literary serif moments for books and quotes.
3. **Intentional Elevation**: Delicate hairline borders (`#E8DFD3`) and subtle shadows rather than heavy floating modals.
4. **Respectful Microcopy**: Direct, human, and concise language.

---

## 🎨 Color Palette Tokens

| Token Name | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#F7F4EE` | Warm linen background for all pages. |
| **Card Surface (Pure)** | `#FFFFFF` | Primary card container surface. |
| **Card Surface (Muted)** | `#FAF8F5` | Secondary surface, input field backgrounds, and quiet callout cards. |
| **Hairline Border** | `#E8DFD3` | Delicate 1px borders for cards, inputs, and dividers. |
| **Primary Accent** | `#8A582B` | Brand identity, primary CTA buttons, active tabs, progress bars. |
| **Primary Hover** | `#754820` | Hover state for primary buttons. |
| **Secondary Accent** | `#996735` | Sub-labels, book metadata highlights, and section badges. |
| **Soft Sand Accent** | `#D4A373` | Foil book cover accents, decorative dividers. |
| **Primary Ink** | `#2B231D` | Headings, high-contrast text, active icons. |
| **Stone Gray Subtext** | `#756F68` | Body text, subtitles, helper text, and inactive tab labels. |
| **Destructive / Error** | `#9E2A2B` | Validation errors, alert banners, password mismatch text. |

---

## 🔤 Typography & Type Scale

* **Primary Font**: [Poppins](https://fonts.google.com/specimen/Poppins) (Google Fonts)
* **Weights Loaded**: 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold)
* **Fallback Stack**: `system-ui, -apple-system, sans-serif`
* **Serif Accent**: `font-serif` (Georgia, serif) used exclusively for literary quotations, book titles on covers, and marginalia.

### Type Hierarchy
- **Display Headings (H1/H2)**: `text-2xl` to `text-4xl`, `font-bold`, `text-[#2B231D]`, `tracking-tight`
- **Section Headings (H3)**: `text-base` to `text-lg`, `font-bold`, `text-[#2B231D]`
- **Body Text**: `text-sm`, `font-normal`, `text-[#756F68]`, `leading-relaxed`
- **Micro-labels / Metadata**: `text-xs` or `text-[11px]`, `font-medium`, `text-[#756F68]` or `text-[#8A582B]`

---

## 🧩 Component Standards & Primitives

### 1. Buttons (`client/src/shared/components/ui/button.tsx`)
- **Primary**: `bg-[#8A582B] text-white hover:bg-[#754820] shadow-sm rounded-xl`
- **Outline**: `border border-[#E8DFD3] text-[#2B231D] bg-transparent hover:bg-[#FAF8F5] rounded-xl`
- **Secondary**: `bg-[#FAF8F5] text-[#2B231D] border border-[#E8DFD3] hover:bg-[#EFE8DE] rounded-xl`
- **Sizes**: `sm` (h-9, text-xs), `md` (h-11, text-sm), `lg` (h-13, text-base font-semibold)
- **Rules**: Never weld arrow glyphs (`→`) into button text.

### 2. Form Inputs (`client/src/shared/components/ui/input.tsx`)
- Background: `bg-[#FAF8F5]`
- Border: `border border-[#E8DFD3] focus:border-[#8A582B] focus:ring-1 focus:ring-[#8A582B]`
- Rounded: `rounded-xl`
- Height: `h-11` with comfortable internal padding (`px-3.5`)

### 3. Password Input (`client/src/shared/components/ui/password-input.tsx`)
- Features an accessible show/hide toggle button with `Eye` / `EyeOff` icons.
- `aria-label="Show password"` / `aria-label="Hide password"`.
- TabIndex `-1` so keyboard tab navigation flows directly to the next input or submit button.

### 4. Cards & Containers (`client/src/shared/components/ui/card.tsx`)
- Maximum width: `max-w-md` for auth sheets, `max-w-6xl` for dashboard layouts.
- Background: `bg-[#FFFFFF]` or `bg-[#FAF8F5]`.
- Border: `border border-[#E8DFD3]`.
- Radius: `rounded-2xl` for primary viewports, `rounded-xl` for inner metric cards, `rounded-lg` for book covers.

### 5. Modal Dialogs
- Overlays use clean warm scrims: `bg-[#2B231D]/45` (no artificial `backdrop-blur`).
- Dialog card: `bg-[#FFFFFF] border border-[#E8DFD3] rounded-xl shadow-xl`.

---

## 🛡️ Anti-AI-Slop Checklist for New Features

When developing new screens or components for Readventure, verify against this checklist:
- [ ] No floating icon chips inside pastel rounded squares.
- [ ] No purple-to-blue or rainbow gradients.
- [ ] No 4-bar password strength checklists.
- [ ] No conversational filler phrases (*"Don't worry!"*).
- [ ] No raw Unicode arrow characters (`→`) in button labels.
- [ ] No celebratory confetti, sparkle icons, or animated envelope badges.
- [ ] Responsive testing across 375px (mobile), 768px (tablet), and 1440px (desktop).
