import { type ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl"
};

export function Modal({ open, onClose, title, children, size = "md", footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#09070d]/55 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.965, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.975, y: 8 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className={`relative w-full ${sizeMap[size]} overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-[0_32px_100px_rgba(10,6,18,.30)]`}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-prootech-violet-soft/60 to-transparent" />
            <div className="relative flex items-center justify-between border-b border-prootech-line/80 px-6 py-5">
              <div>
                <div className="mb-2 h-1 w-8 rounded-full bg-prootech-violet" />
                <h2 className="text-[1rem] font-semibold tracking-[-0.02em] text-prootech-black">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-xl border border-prootech-line bg-white/80 text-prootech-text-muted shadow-sm hover:border-prootech-violet/20 hover:bg-prootech-violet-soft hover:text-prootech-violet"
                aria-label="close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="relative max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <div className="relative flex items-center justify-end gap-2 border-t border-prootech-line/80 bg-[#fcfbfd] px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
  isPending?: boolean;
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", variant = "default", isPending }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl border border-prootech-line bg-white px-4 py-2.5 text-sm font-medium text-prootech-text-muted shadow-sm hover:bg-prootech-muted">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition ${variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-prootech-violet hover:bg-prootech-violet-light hover:shadow-violet-glow"} disabled:opacity-60`}
          >
            {isPending ? "..." : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-7 text-prootech-text-muted">{message}</p>
    </Modal>
  );
}
