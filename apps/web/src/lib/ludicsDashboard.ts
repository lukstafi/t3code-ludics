/**
 * ludics-fork: Dashboard URL helpers, health check, and ntfy.sh alerting.
 *
 * Derives the Ludics dashboard base URL from the current window hostname
 * and the configurable VITE_LUDICS_DASHBOARD_PORT (defaults to 7678).
 */

import { useEffect, useRef, useState } from "react";
import { LayoutDashboardIcon, ListTodoIcon, NewspaperIcon, TerminalSquareIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const DASHBOARD_PORT: string =
  (import.meta.env.VITE_LUDICS_DASHBOARD_PORT as string | undefined) ?? "7678";

const NTFY_SERVER: string =
  (import.meta.env.VITE_NTFY_SERVER as string | undefined) ?? "https://ntfy.sh";

const NTFY_TOPIC: string =
  (import.meta.env.VITE_NTFY_TOPIC as string | undefined) ?? "lukstafi-to-Mag";

/** Health-check interval in ms. */
const HEALTH_CHECK_INTERVAL = 60_000;

function getHostname(): string {
  return typeof window !== "undefined" ? window.location.hostname : "localhost";
}

/** Build the base URL for the Ludics dashboard (no trailing slash). */
export function getLudicsDashboardBaseUrl(): string {
  return `http://${getHostname()}:${DASHBOARD_PORT}`;
}

export interface LudicsLink {
  label: string;
  icon: LucideIcon;
  getUrl: () => string;
}

/** Ludics sidebar links — dashboard tabs + Mag Terminal. */
export const LUDICS_LINKS: readonly LudicsLink[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    getUrl: () => `${getLudicsDashboardBaseUrl()}/`,
  },
  { label: "Tasks", icon: ListTodoIcon, getUrl: () => `${getLudicsDashboardBaseUrl()}/tasks.html` },
  {
    label: "Briefing",
    icon: NewspaperIcon,
    getUrl: () => `${getLudicsDashboardBaseUrl()}/briefing.html`,
  },
  {
    label: "Mag Terminal",
    icon: TerminalSquareIcon,
    getUrl: () => `${getLudicsDashboardBaseUrl()}/terminal.html`,
  },
];

/** Send an alert to the configured ntfy.sh topic. No-op if VITE_NTFY_TOPIC is unset. */
function sendNtfyAlert(title: string, message: string, priority?: number): void {
  if (!NTFY_TOPIC) return;
  fetch(`${NTFY_SERVER}/${NTFY_TOPIC}`, {
    method: "POST",
    headers: {
      Title: title,
      Priority: String(priority ?? 3),
    },
    body: message,
  }).catch(() => {
    // Best-effort — don't let notification failures cascade.
  });
}

/**
 * Periodically probes the Ludics dashboard. Returns whether it's reachable.
 * Sends an ntfy.sh alert on the transition from healthy → unhealthy.
 */
export function useLudicsHealth(): boolean {
  const [healthy, setHealthy] = useState(true);
  const wasHealthy = useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        await fetch(getLudicsDashboardBaseUrl(), {
          method: "HEAD",
          mode: "no-cors",
          signal: AbortSignal.timeout(5_000),
        });
        // no-cors makes res.ok always false (opaque response), but a resolved
        // fetch means the server responded — treat as healthy.
        if (!cancelled) {
          setHealthy(true);
          wasHealthy.current = true;
        }
      } catch {
        if (!cancelled) {
          setHealthy(false);
          if (wasHealthy.current) {
            wasHealthy.current = false;
            sendNtfyAlert(
              "Ludics dashboard unreachable",
              `Dashboard at ${getLudicsDashboardBaseUrl()} is not responding. Checked from t3code web client on ${getHostname()}.`,
              4,
            );
          }
        }
      }
    }

    check();
    const id = setInterval(check, HEALTH_CHECK_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return healthy;
}
