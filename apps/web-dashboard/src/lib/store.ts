import { create } from "zustand";
import type { Locale, UserSession } from "@prootech/shared-types";

interface AuthState {
  accessToken?: string;
  refreshToken?: string;
  user?: UserSession;
  locale: Locale;
  sidebarOpen: boolean;
  setSession: (payload: { accessToken: string; refreshToken: string; user: UserSession }) => void;
  logout: () => void;
  setLocale: (locale: Locale) => void;
  toggleSidebar: () => void;
}

const storedSession = localStorage.getItem("prootech.session");
const parsed = storedSession ? (JSON.parse(storedSession) as Partial<AuthState>) : {};

export const useAppStore = create<AuthState>((set, get) => ({
  accessToken: parsed.accessToken,
  refreshToken: parsed.refreshToken,
  user: parsed.user,
  locale: (parsed.locale as Locale | undefined) ?? "ar",
  sidebarOpen: true,
  setSession: (payload) => {
    localStorage.setItem("prootech.session", JSON.stringify({ ...payload, locale: get().locale }));
    set(payload);
  },
  logout: () => {
    localStorage.removeItem("prootech.session");
    set({ accessToken: undefined, refreshToken: undefined, user: undefined });
  },
  setLocale: (locale) => {
    const next = { ...get(), locale };
    localStorage.setItem("prootech.session", JSON.stringify(next));
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    set({ locale });
  },
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen })
}));
