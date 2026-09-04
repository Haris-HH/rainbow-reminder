# MASTER.md — Rainbow Drinking Water · Design System

> Single source of truth. Every token in the app comes from here.
> Style: **Glassmorphic / iOS** · Motion: **GSAP spring-flavored**
> Palette measured from `rainbow-logo.jpg` (design-dna).

## 1. Color

### Brand (from logo)
| Token | Hex | Use |
|---|---|---|
| `--purple` | `#2f1639` | primary / brand |
| `--purple-soft` | `#5a3f96` | primary (dark mode) |
| `--blue` | `#0473ef` | action / CTA |
| `--sky` | `#2ba7dd` | secondary / info |
| `--navy` | `#1f3b66` | depth |
| `--crimson` | `#af153e` | accent / unpaid / danger-accent |

### Semantic
| Token | Light | Dark |
|---|---|---|
| `--success` | `#1f9d55` | `#34c778` |
| `--danger` | `#c0392b` | `#e05c4d` |
| `--warning` | `#d98400` | `#f0a83a` |

### Surfaces (glass)
| Token | Light | Dark |
|---|---|---|
| `--bg-base` | `#eef0f8` | `#0c0a14` |
| `--glass` | `rgba(255,255,255,0.62)` | `rgba(32,24,48,0.55)` |
| `--glass-strong` | `rgba(255,255,255,0.8)` | `rgba(40,30,60,0.7)` |
| `--glass-border` | `rgba(255,255,255,0.7)` | `rgba(255,255,255,0.1)` |
| `--glass-hi` | inner top highlight | inner top highlight |
| `--text` | `#1c1626` | `#ece8f5` |
| `--text-muted` | `#6b6480` | `#a79fc0` |

### Aurora background
Fixed layer: 3 radial blobs (blue, sky, crimson) low-opacity over `--bg-base`.
Dark: same hues, higher luminosity blobs on near-black.

**Blur token:** `--blur: 18px` (backdrop-filter on all glass).

## 2. Typography
- Stack: `'Segoe UI', 'Noto Sans Thai', 'Noto Sans Myanmar', system-ui, sans-serif`
- Scale: 0.72 / 0.82 / 0.9 / 1.0 / 1.15 / 1.35 / 1.8 / 2.2 rem
- Weights: 400 body · 600 titles · 700–800 headings/summary
- Line-height: 1.2 headings · 1.4 body

## 3. Spacing (8px base)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40`

## 4. Radius
| Token | px |
|---|---|
| `--r-sm` | 10 |
| `--r-md` | 16 |
| `--r-lg` | 22 |
| `--r-xl` | 28 |
| `--r-pill` | 999 |

## 5. Elevation (soft, layered — glass depth)
- `--sh-1`: `0 4px 16px rgba(31,22,45,0.08)`
- `--sh-2`: `0 8px 30px rgba(31,22,45,0.12)`
- `--sh-glow`: `0 8px 26px rgba(4,115,239,0.35)` (blue action / FAB)

## 6. Motion (GSAP)
| Token | Value |
|---|---|
| duration.fast | 0.2s |
| duration.base | 0.35s |
| duration.slow | 0.5s |
| ease.out | `power3.out` |
| ease.pop | `back.out(1.4)` |
| ease.inOut | `power2.inOut` |
| stagger | 0.045s |

**Patterns**
- Page/list enter: `from {opacity:0, y:16}` → stagger 0.045, `power3.out`, 0.4s
- Card hover/press: scale 1.02, shadow → `--sh-2`, 0.2s
- Modal: backdrop opacity fade + sheet `y:100%→0` (mobile) / `scale .95→1`+fade (desktop), `power3.out` 0.4s; exit reversed
- FAB mount: `scale 0→1` `back.out(1.7)`
- **Reduced motion:** all enter animations become instant opacity-only; no transforms.

## 7. Components (5 states: default/hover/focus/active/disabled)
- **Glass card / list-item**: `--glass` + blur + `--glass-border` + `--sh-1`, radius `--r-lg`. Hover → lift + `--sh-2`.
- **Button**: filled gradient (primary purple→purple-soft; action blue→sky), pill-ish `--r-md`. Ghost = translucent glass.
- **FAB**: gradient blue→purple, `--sh-glow`, `--r-pill`.
- **Input**: glass-strong fill, 1px border, focus ring `--blue`.
- **Segmented**: glass track, active pill = glass-strong + primary text.
- **Badge**: tinted translucent (paid=success, unpaid=crimson, role=purple).
- **Topbar**: translucent purple glass, blurred, sticky. **Nav (bottom/side)**: glass blurred.
