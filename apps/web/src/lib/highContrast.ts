// ludics-fork: high contrast mode helpers

export const HIGH_CONTRAST_CLASS_NAME = "high-contrast";

const CLIENT_SETTINGS_STORAGE_KEY = "t3code:client-settings:v1";

export function applyHighContrastMode(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(HIGH_CONTRAST_CLASS_NAME, enabled);
}

export function getStoredHighContrastMode(): boolean {
  try {
    const raw = localStorage.getItem(CLIENT_SETTINGS_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed !== null && typeof parsed === "object" && "highContrastMode" in parsed) {
      return Boolean((parsed as Record<string, unknown>).highContrastMode);
    }
    return false;
  } catch {
    return false;
  }
}
