import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Play, Trash2 } from "lucide-react";

let openDialog = null; // <ConfirmHost /> isko set karta hai

// Usage: const ok = await confirm({ title, message, confirmText, variant, details, notes })
export const confirm = (options) =>
  new Promise((resolve) => {
    if (!openDialog) {
      resolve(window.confirm(options.title)); // fallback
      return;
    }
    openDialog({ ...options, resolve });
  });

const variants = {
  danger: {
    icon: Trash2,
    iconClass: "bg-red-50 text-red-600",
    btnClass: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-200",
  },
  primary: {
    icon: Play,
    iconClass: "bg-indigo-50 text-indigo-600",
    btnClass: "bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-200",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "bg-amber-50 text-amber-600",
    btnClass: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-200",
  },
};

export function ConfirmHost() {
  const [state, setState] = useState(null);

  useEffect(() => {
    openDialog = setState;
    return () => {
      openDialog = null;
    };
  }, []);

  const close = (result) => {
    if (!state) return;
    state.resolve(result);
    setState(null);
  };

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const v = variants[state?.variant] || variants.primary;
  const Icon = v.icon;

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          key="confirm"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => close(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <span className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${v.iconClass}`}>
                  <Icon size={22} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-900">{state.title}</h2>
                  {state.message && <p className="mt-1 text-sm text-slate-500">{state.message}</p>}
                </div>
              </div>

              {state.details?.length > 0 && (
                <dl className="mt-5 grid grid-cols-3 gap-3">
                  {state.details.map((d) => (
                    <div key={d.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                      <dt className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">
                        {d.label}
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-slate-900">{d.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {state.notes?.length > 0 && (
                <ul className="mt-5 space-y-2">
                  {state.notes.map((n) => (
                    <li key={n} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                      {n}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => close(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200/60 transition"
              >
                {state.cancelText || "Cancel"}
              </button>
              <button
                autoFocus
                onClick={() => close(true)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-4 ${v.btnClass}`}
              >
                {state.confirmText || "Confirm"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}