# UI conventions — Sandiwa OS HOA

Civic, trustworthy product UI for Filipino HOA communities with mixed technical literacy. Light editorial layout, Sora typography. Impact is the member portal (split hero, service tiles, large tap targets). Console uses the same brand pack with a task-first sidebar. Platform uses the Sandiwa indigo identity.

Motion stays short (about 140–200ms on press/hover) and respects `prefers-reduced-motion`. Token values live in [`app/assets/css/tokens.css`](../app/assets/css/tokens.css). Components must use those CSS variables or mapped Tailwind semantic utilities — no one-off hex in components.

## Brand packs

Rebrand a tenant without rewriting every component:

1. Add CSS under `app/assets/css/brands/<id>.css` (sets `--brand-*` on `html[data-brand='<id>']`).
2. Register in `app/core/branding/registry.ts` (`BRANDS`, `BRAND_IDS`).
3. Import the CSS in `app/assets/css/main.css`.
4. Set `landing.brandId` on the org (seed, landing editor, or API).

| Pack | Default tenant | Character |
|------|----------------|-----------|
| `sandiwa` | Platform only | Indigo stamp, cool paper |
| `greenfield` | greenfield-hoa | Canopy green, clubhouse light |
| `sunrise` | sunrise-condo | Bronze hardware, honed stone |
| `tenant` | New orgs | Uses `landing.accentColor` via `--brand-accent-override` |

Runtime: `useBrandTheme()` sets `data-brand` on `<html>` and an optional accent override for the `tenant` pack.

## Tokens

### Semantic roles

| Role | Impact | Console | Platform |
|------|--------|---------|----------|
| Canvas | `--bg-canvas` light | `--bg-canvas` dark slate | `--bg-canvas` gray |
| Surface | `--bg-surface` white | `--bg-surface` slate-800 | `--bg-surface` white |
| Primary text | `--text-primary` | `--text-primary` light | `--text-primary` |
| Muted text | `--text-muted` | `--text-muted` | `--text-muted` |
| Accent | brand pack (`--brand-accent`) | brand pack | Sandiwa indigo `#1f3d5c` |

### Action colors (Impact only)

- Green (`--action-services`): services / requests
- Blue (`--action-payments`): dues & documents
- Red (`--action-emergency`): emergencies / broadcasts

### Status pairs (background + text)

Light defaults live on `:root` / Impact / Platform. Console (`[data-shell='console']`) overrides every pair for dark contrast.

| Domain | Tokens | Utility modifiers |
|--------|--------|-------------------|
| Invoice | `--status-invoice-{draft\|open\|partial\|paid\|void\|overdue}-{bg\|text}` | `.status-badge--invoice-*` or short `.status-badge--paid` etc. |
| Aging | `--status-aging-{current\|30\|60\|90}-{bg\|text}` | `.aging-bucket--current`, `--30`, `--60`, `--90` |
| Poll | `--status-poll-{draft\|open\|closed}-{bg\|text}` | `.status-badge--poll-*` (prefer prefixed; `--open`/`--draft` are invoice-biased) |
| Broadcast | `--status-broadcast-{info\|warning\|emergency}-{bg\|text}` | `.status-badge--broadcast-*` |
| Payment | `--status-payment-{pending\|verified\|rejected}-{bg\|text}` | `.status-badge--payment-*` |
| Voucher | `--status-voucher-{draft\|pending\|approved\|paid\|rejected}-{bg\|text}` | `.status-badge--voucher-*`. Domain status `pending_approval` maps to `.status-badge--voucher-pending` |
| Method chip | `--method-chip-{bg\|text\|border}` | `.method-chip`, `.method-chip--gcash` etc. (all neutral — no brand logo colors) |

Impact sets `--status-broadcast-emergency-*` to `--action-emergency` / `--action-emergency-bg`. Console uses the dark danger pair `#7f1d1d` / `#fecaca`.

## Components

### Impact action panel

- Anatomy: icon (32px+) + label + optional description
- Min height: `--tap-target-min` (3rem)
- States: hover lift + shadow; focus-visible ring; disabled 50% opacity

### Console sidebar nav item

- Anatomy: icon + label, full-width row
- States: hover `--bg-surface-raised`; active left border accent; focus-visible ring

### Auth form

- Loading: skeleton the same size as the form (no layout jump)
- Error: `--color-danger` border + message below the field
- Empty: centered message in `--text-muted`

### Data table (console)

- Header: `--bg-muted`, `--text-secondary`
- Row hover: `--bg-surface-raised`
- Empty state: icon + message, table min-height preserved

### Status badge

- Inline pill; optional leading status dot (`aria-hidden`) + **required visible label** (never color-only).
- Base class: `.status-badge`
- Typography: `--text-xs`, weight 600, `--leading-tight`, nowrap + ellipsis; prefer domain-prefixed modifiers when values collide (`poll-open` vs `invoice-open`).
- Informational by default. If used as a filter chip, add hover, focus-visible (`--focus-ring`), and disabled 50% opacity.
- Loading: skeleton pill matching expected label size.
- Unknown: draft/muted pair + the word “Unknown” — do not invent a hex.
- Truncated labels: `title` **and** an operable control to reveal the full value (not hover-only).
- Contrast ≥ 4.5:1; announce the status text, not a color name.

### Aging bucket

- Same pill geometry as status badge; labels `Current`, `1–30`, `31–60`, `61–90+`.
- Base class: `.aging-bucket`
- Modifiers: `--current`, `--30` / `--days30`, `--60` / `--days60`, `--90` / `--days90`
- Severity: green → amber → orange → red (light and dark pairs).
- Non-interactive; the table row carries hover.
- Empty aging: muted “—” (`--text-muted`), not a fake “current” badge.

### Method chip

- Rounded-md chip (not a full pill) for GCash, Maya, Bank, Cash, Check, Other.
- Classes: `.method-chip` (+ optional `--gcash` etc.). Visuals stay identical and neutral.
- Do not embed payment brand marks or trademark colors.

## Brand assets

| Path | Use |
|------|-----|
| `/assets/orgs/greenfield-logo.png` | Greenfield Village HOA logo |
| `/assets/orgs/greenfield-hero.png` | Subdivision clubhouse / street hero |
| `/assets/orgs/sunrise-logo.png` | Sunrise Condominium logo |
| `/assets/orgs/sunrise-hero.png` | Condo exterior |
| `/assets/officers/maria-santos.png` | Greenfield president |
| `/assets/officers/juan-dela-cruz.png` | Greenfield treasurer |
| `/assets/officers/ana-reyes.png` | Greenfield secretary |
| `/assets/officers/roberto-lim.png` | Sunrise board president |
| `/assets/og-image.png` | Social share / Open Graph |
| `/assets/sandiwa-mark.png` | Brand mark |
| `/assets/favicon.png` | Favicon |

## Invariants

- No arbitrary spacing or colors outside tokens.
- Interactive controls define hover, active, focus-visible, and disabled.
- Loading, empty, and error states preserve layout.
- Status meaning uses a visible text label, not color alone.
- Method chips stay neutral (no payment-brand colors).
- Civic teal/slate; do not introduce a competing palette.
