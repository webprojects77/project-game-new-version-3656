import { getDesktopAPI, type ElectronAPI } from "../lib/desktop";

export function useDesktop(): ElectronAPI | null {
  return getDesktopAPI();
}
