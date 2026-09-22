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
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className={`relative w-full ${sizeMap[size]} rounded-2xl bg-white shadow-2xl`}
          >
            <div className="flex items-center justify-between border-b border-prootech-line px-6 py-4">
              <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-prootech-black">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-prootech-text-muted hover:bg-prootech-muted"
                aria-label="close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-prootech-line px-6 py-4">
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
          <button onClick={onClose} className="rounded-xl border border-prootech-line px-4 py-2 text-sm font-medium text-prootech-text-muted hover:bg-prootech-muted">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-prootech-violet hover:bg-prootech-violet-light"} disabled:opacity-60`}
          >
            {isPending ? "..." : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-6 text-prootech-text-muted">{message}</p>
    </Modal>
  );
}
