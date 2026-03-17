# Proposal: Add direct links back to Ludics dashboard + Mag Terminal

**Task:** gh-ludics-44
**Effort:** small
**Files changed:** 3 (in `apps/web/`)

## Problem

The t3code-ludics web client has no way to navigate back to the Ludics dashboard. This is the return-navigation half of bidirectional integration (gh-ludics-40 handles forward navigation).

## Change 1: Port and ntfy.sh configuration

**File:** `apps/web/vite.config.ts`

Added Vite defines (all overridable via env vars):
- `VITE_LUDICS_DASHBOARD_PORT` — default `"7678"`
- `VITE_LUDICS_TTYD_PORT` — default `"7679"`
- `VITE_NTFY_SERVER` — default `"https://ntfy.sh"`
- `VITE_NTFY_TOPIC` — default `"lukstafi-to-Mag"` (protected channel; alerts disabled when empty)

## Change 2: Dashboard URL helper, health check, and ntfy alerting

**File:** `apps/web/src/lib/ludicsDashboard.ts` (new)

- Derives base URLs from `window.location.hostname` + configured ports.
- Exports `LUDICS_LINKS` (Dashboard, Tasks, Briefing, Mag Terminal — each with label, icon, and `getUrl()`).
- `useLudicsHealth()` hook: probes the dashboard every 60 s via `HEAD` fetch (`no-cors`). On healthy → unhealthy transition, sends an ntfy.sh alert (priority 4) to the configured topic. No-op if `VITE_NTFY_TOPIC` is unset.

## Change 3: Sidebar links with health indicator

**File:** `apps/web/src/components/Sidebar.tsx`

Added a "Ludics" section in SidebarFooter (above Settings) with four links:
- Dashboard (`LayoutDashboardIcon`)
- Tasks (`ListTodoIcon`)
- Briefing (`NewspaperIcon`)
- Mag Terminal (`TerminalSquareIcon`)

Uses plain `<a href>` tags for same-tab navigation. When `useLudicsHealth()` reports unhealthy, the section dims to 50% opacity and shows a red dot next to the "Ludics" heading. All additions marked with `ludics-fork` comments for clean upstream merges.

## Notes

- Uses `render` prop pattern (not `asChild`) since codebase uses `@base-ui/react/use-render`
- `no-cors` HEAD fetch: opaque response resolves on success (treated as healthy), rejects on network error (unhealthy)
- Typecheck passes cleanly
- Changes confined to `lukstafi/t3code-ludics` fork
