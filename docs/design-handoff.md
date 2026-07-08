# Design Handoff — Sandiwa OS HOA POC

## Art Direction

- **Mood / brand tone:** Trustworthy, civic, accessible; Filipino HOA communities with mixed technical literacy.
- **Visual language:** Impact = high-contrast light portal with large icon panels; Operations Console = dark blue-gray SaaS dashboard; Platform = clean neutral admin.
- **Interaction richness:** Restrained on Impact (large tap targets, minimal nesting); moderate density on Operations Console (data tables, side nav).

## Tokens

See [`app/assets/css/tokens.css`](../app/assets/css/tokens.css). All components MUST use CSS variables or mapped Tailwind semantic utilities — no arbitrary hex in components.

### Semantic roles

| Role | Impact | Console | Platform |
|------|--------|---------|----------|
| Canvas | `--bg-canvas` light | `--bg-canvas` dark slate | `--bg-canvas` gray |
| Surface | `--bg-surface` white | `--bg-surface` slate-800 | `--bg-surface` white |
| Primary text | `--text-primary` | `--text-primary` light | `--text-primary` |
| Muted text | `--text-muted` | `--text-muted` | `--text-muted` |
| Accent | teal `#0f766e` | blue `#3b82f6` | blue `#1d4ed8` |

### Action colors (Impact only)

- Green (`--action-services`): services / requests
- Blue (`--action-payments`): dues & documents
- Red (`--action-emergency`): emergencies / broadcasts

## Component Spec

### Impact action panel

- Anatomy: icon (32px+) + label + optional description
- Min height: `--tap-target-min` (3rem)
- States: hover lift + shadow; focus-visible ring; disabled 50% opacity

### Console sidebar nav item

- Anatomy: icon + label, full-width row
- States: hover `--bg-surface-raised`; active left border accent; focus-visible ring

### Auth form

- Loading: skeleton same dimensions as form (no CLS)
- Error: `--color-danger` border + message below field
- Empty: centered message in `--text-muted`

### Data table (console)

- Header: `--bg-muted`, `--text-secondary`
- Row hover: `--bg-surface-raised`
- Empty state: icon + message preserving table min-height

## Accept / Reject Checklist

- [x] No arbitrary spacing/colors allowed downstream
- [x] hover / active / focus-visible / disabled defined
- [x] loading / empty / error preserve layout
- [x] Impact action color coding documented
