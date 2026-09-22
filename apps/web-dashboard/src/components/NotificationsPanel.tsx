import { useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";
import { t } from "../lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ open, onClose }: Props) {
  const locale = useAppStore((s) => s.locale);
  const panelRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: api.notifications,
    enabled: open,
    refetchInterval: open ? 30_000 : false
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] })
  });

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  const notifications = data?.rows ?? [];
  const unread = notifications.filter((n) => n.status === "unread");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="absolute end-0 top-full z-50 mt-2 w-80 rounded-2xl border border-prootech-line bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-prootech-line px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-prootech-violet" />
              <span className="text-sm font-semibold text-prootech-black">{t(locale, "notifications")}</span>
              {unread.length > 0 && (
                <span className="rounded-full bg-prootech-violet px-2 py-0.5 text-[0.65rem] font-bold text-white">{unread.length}</span>
              )}
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-prootech-text-muted hover:bg-prootech-muted">
              <X size={14} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-prootech-text-muted">{t(locale, "noNotifications")}</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={String(n.id)}
                  className={`flex items-start gap-3 border-b border-prootech-line px-4 py-3 last:border-0 hover:bg-prootech-muted transition-colors ${n.status === "unread" ? "bg-prootech-violet-soft/30" : ""}`}
                >
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.status === "unread" ? "bg-prootech-violet" : "bg-prootech-line"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-medium text-prootech-black leading-5">{String(n.title)}</p>
                    <p className="mt-0.5 text-[0.75rem] text-prootech-text-muted leading-5">{String(n.body)}</p>
                  </div>
                  {n.status === "unread" && (
                    <button
                      onClick={() => markRead.mutate(String(n.id))}
                      className="shrink-0 rounded p-1 text-prootech-text-subtle hover:text-prootech-violet"
                      title="Mark read"
                    >
                      <CheckCheck size={13} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {unread.length > 0 && (
            <div className="border-t border-prootech-line px-4 py-3">
              <button
                onClick={() => unread.forEach((n) => markRead.mutate(String(n.id)))}
                className="text-xs font-medium text-prootech-violet hover:underline"
              >
                {t(locale, "markAllRead")}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
