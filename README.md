# AI Quiz Multiverse

Turn your study notes & documents into playable, action-packed arcade mini-games — powered by Google Gemini AI.

## Pixel‑Art Style Guide

### Palette (10 hues, no gradients)

| Token | Hex | Usage |
|---|---|---|
| `px-bg` | `#0a0a0f` | Root background |
| `px-surface` | `#111118` | Card / panel background |
| `px-border` | `#2a2a3a` | Default border |
| `px-text` | `#e8e8f0` | Body text |
| `px-dim` | `#7a7a9a` | Secondary / muted text |
| `px-yellow` | `#ffb800` | Score, primary CTA |
| `px-green` | `#00e676` | Correct answer, success |
| `px-red` | `#ff3d57` | Wrong answer, error |
| `px-blue` | `#3d9bff` | Progress, info |
| `px-purple` | `#9b6dff` | Option B accent |
| `px-amber` | `#ff9800` | Streak / combo |

### Typography

- **Font:** `Press Start 2P` (Google Fonts) — loaded in `src/index.css`
- **Headings:** `text-sm uppercase tracking-widest`
- **Body / options:** `text-[9px]` to `text-[10px]`, `leading-loose`
- **Labels / badges:** `text-[8px] uppercase tracking-wider`

### Spacing & Layout

- Tight grid: `gap-2` / `gap-3` between sections
- Max content width: `max-w-lg` centered
- Mobile-first; desktop just widens within the same container

### Component Classes

```css
.btn-px   — pixel button (2px border, 2px shadow, active offset)
.card-px  — pixel card (surface bg, 2px border, 2px shadow)
.border-px / .border-px-{color}
.shadow-px
```

### Anti‑Slop Rules

- ❌ No `bg-gradient-*`, `backdrop-blur`, or `/N` opacity on backgrounds
- ❌ No `rounded-2xl` or `rounded-full` (use `rounded` or none)
- ❌ No `animate-pulse` or shimmer on static elements
- ✅ Solid colors only
- ✅ `strokeWidth={2}` on all Lucide icons with `shape-rendering: crispEdges`
- ✅ Every interactive element has `aria-label`

---

## Game Modes

| Mode | Description |
|---|---|
| Normal Quiz | Classic multiple-choice |
| Runner | Steer into the correct lane block |
| Flappy | Flap through the correct gap |
| Dash | Jump over wrong obstacles |
| Shooter | Shoot the correct target |

## Dev

```bash
npm run dev       # tsx server.ts (dev server + Vite HMR)
npm run build     # Vite + esbuild → dist/
npm run lint      # tsc --noEmit
node dist/server.cjs  # production server
```

## Environment

```env
GEMINI_API_KEY=your_key_here
```

