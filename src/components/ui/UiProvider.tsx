"use client";

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
        setPending({ ...options, resolve });
      }),
    [],
  );

  function settle(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  useEffect(() => {
    if (!pending) return;
    confirmButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        pending?.resolve(false);
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
          <div className="ui-dialog ui-dialog-small" role="alertdialog" aria-modal="true" aria-label={pending.title}>
            <div className="ui-dialog-body">
              <h2>{pending.title}</h2>
              {pending.message && <p className="muted">{pending.message}</p>}
              <div className="ui-dialog-actions">
                <button type="button" className="materials-btn-secondary" onClick={() => settle(false)}>
                  ביטול
                </button>
                <button
                  ref={confirmButtonRef}
                  type="button"
                  className="materials-btn-primary"
                  data-danger={pending.danger ? "true" : undefined}
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
