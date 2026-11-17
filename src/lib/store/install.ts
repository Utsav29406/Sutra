import { create } from "zustand";

/*
 * Installing Sutra as an app from the browser. Android browsers (Chrome,
 * Edge, Samsung) offer a real install prompt, caught here as
 * beforeinstallprompt; iPhones have none, so they get the "Add to Home
 * Screen" steps instead.
 */
type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

interface InstallState {
  /** The browser's own install prompt, when it has offered one. */
  prompt: PromptEvent | null;
  /** Already running as the installed app. */
  standalone: boolean;
  ios: boolean;
  /** The how-to sheet (iPhone, or a browser without a prompt). */
  sheetOpen: boolean;
  setSheet: (open: boolean) => void;
  /** Runs the browser prompt if there is one, else opens the how-to sheet. */
  install: () => Promise<void>;
}

export const useInstallStore = create<InstallState>()((set, get) => ({
  prompt: null,
  standalone: false,
  ios: false,
  sheetOpen: false,
  setSheet: (open) => set({ sheetOpen: open }),
  install: async () => {
    const prompt = get().prompt;
    if (!prompt) {
      set({ sheetOpen: true });
      return;
    }
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    // A prompt can be used once; the browser offers a fresh one if it may.
    set({ prompt: null, ...(outcome === "accepted" ? { standalone: true } : {}) });
  },
}));

// Listening from the first import: the browser may offer its prompt before
// any component has mounted.
if (typeof window !== "undefined") {
  const nav = navigator as Navigator & { standalone?: boolean };
  useInstallStore.setState({
    standalone: window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true,
    ios: /iphone|ipad|ipod/i.test(nav.userAgent) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1),
  });
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we show our own button instead of the browser's mini-bar
    useInstallStore.setState({ prompt: e as PromptEvent });
  });
  window.addEventListener("appinstalled", () => useInstallStore.setState({ prompt: null, standalone: true }));
}
