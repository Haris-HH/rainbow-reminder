---
version: 1
slug: "app"
primary_target: "app"
related_targets: []
---

## Direction contract

**Scope:** whole app redesign (Operate mode) — login, dashboard, villages, deliverers, deliverer detail, delivery records, users, settings, and every shared component (topbar/nav, modal, FAB, swipe-to-delete, loaders, map picker, update toast).

THESIS: Every house is a ticket stub waiting to be punched, not a card in a dashboard. The app refuses the generic glass-card admin panel (the incumbent look) and the generic white-sidebar SaaS dashboard (the category default) alike — it is built as a conductor's roll of fare stubs, one per house, punched paid or left open unpaid.

OWN-WORLD: Ticket-stock paper as the ground (`#F5F0E4` bg / `#EDE3CE` stub surface light, `#17140F` bg / `#221E17` stub surface dark), near-black warm ink text (`#221E1A` light / `#EDE3CE` dark), hairline rules instead of blur or glass, small die-cut radii (4–8px) instead of iOS pill shapes, a dashed perforation seam between stacked stubs. A named "fare-stage" role palette (teal `#1F7A6C`, ochre `#C97C1E`, crimson `#A32B2B`, cobalt `#2F4B8F`, plum `#6B3F7A`, olive `#6E7A1F`, cycling for villages/days) tags identity, never decoration — this is a Full-palette color strategy, justified because village/day recognition-by-color is the product's own mechanism, not an aesthetic layer. Paid/unpaid state is carried by the punch itself, not by color: a solid filled circle = punched/paid, an open crimson ring = unpunched/owed. Typography stays a workhorse multiscript stack (system-ui / Noto Sans Thai / Noto Sans Myanmar — Thai and Burmese must render natively; no display face survives that constraint), with tabular figures and slight tracking on labels to read as ticket-machine stamped print, never a stencil/display font substituted in.

STORY: A deliverer or admin opens the app and immediately sees whose account is still open — the outstanding total reads instrument-large, no card chrome needed. They scan a roll of house-stubs for a village or day, punch the ones that paid, and the punched stub visibly settles (solid, quiet) while unpunched stubs stay open and crimson-ringed until dealt with. Nothing is ever torn off the roll — soft-deleted records stay in the ledger's history, never erased.

FIRST VIEWPORT: The record list for a selected village/day (RecordList), rendered as a vertical roll of house-stubs. Each stub: house number (bold, tabular), that house's fare-stage color tab at the left edge, amount in large tabular numerals, a punch-circle control at the right sized as the primary tap target. The outstanding total for the whole list sits above the roll as one oversized number, weight-only hierarchy, no card or icon around it. A dashed perforation line separates each stub from the next, evoking a torn ticket roll.

FORM: candidate 6 of 7 in my own resonance-ordered list (ledger book, water-meter card, jug cap-tag system, wet-market receipt spike, songthaew route board, **conductor's punch ticket & satchel — assigned**, temple donation board); seed key 76a3be6f. Raised by two declined challengers: Ikeda Datamatics (tabular numeric precision on every amount column) and the festival lineup poster (size-only hierarchy for totals, no chrome).

Signature interaction: **the punch** — tapping a house's paid toggle plays a fast radial snap (scale + fill, ~150ms, sharp ease-out with a small overshoot) on the punch-circle, the visual and motion signature of the whole app; used nowhere else, so it stays meaningful.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
