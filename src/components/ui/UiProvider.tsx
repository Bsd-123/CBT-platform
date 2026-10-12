"use client";

import { useFocusTrap } from "@/components/ui/useFocusTrap";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string };

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
};

type UiContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const UiContext = createContext<UiContextValue | null>(null);

export function useUi(): UiContextValue {
  const value = useContext(UiContext);
  if (!value) throw new Error("useUi must be used inside <UiProvider>.");
  return value;
}

/** Replaces window.alert / window.confirm with in-app toasts and a confirm dialog. */
export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pending, setPending] = useState<
    (ConfirmOptions & { resolve: (value: boolean) => void }) | null
  >(null);
  const nextId = useRef(1);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  // Source of truth for the open dialog, updated synchronously so back-to-back confirm()
  // calls in one tick still settle the earlier promise.
  const pendingRef = useRef<typeof pending>(null);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        // A newer confirm replaces an open one: settle the older promise as "cancelled".
        pendingRef.current?.resolve(false);
        const entry = { ...options, resolve };
        pendingRef.current = entry;
        setPending(entry);
      }),
    [],
  );

  function settle(result: boolean) {
    pendingRef.current?.resolve(result);
    pendingRef.current = null;
    setPending(null);
  }

  useFocusTrap(confirmDialogRef, pending !== null);

  useEffect(() => {
    if (!pending) return;
    confirmButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        pendingRef.current?.resolve(false);
        pendingRef.current = null;
        setPending(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pending]);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <UiContext.Provider value={value}>
      {children}

      <div className="ui-toasts" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className="ui-toast" data-kind={item.kind} role="status">
            {item.message}
          </div>
        ))}
      </div>

      {pending && (
        <div
          className="ui-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) settle(false);
          }}
        >
          <div ref={confirmDialogRef} className="ui-dialog ui-dialog-small" role="alertdialog" aria-modal="true" aria-label={pending.title}>
            <div className="ui-dialog-body">
              <h2>{pending.title}</h2>
              {pending.message && <p className="muted">{pending.message}</p>}
              <div className="ui-dialog-actions">
                <button type="button" className="btn btn-secondary" onClick={() => settle(false)}>
                  ביטול
                </button>
                <button
                  ref={confirmButtonRef}
                  type="button"
                  className={pending.danger ? "btn btn-danger" : "btn btn-primary"}
                  onClick={() => settle(true)}
                >
                  {pending.confirmLabel ?? "אישור"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </UiContext.Provider>
  );
}
