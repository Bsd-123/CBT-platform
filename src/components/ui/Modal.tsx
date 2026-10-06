"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

type ModalButtonProps = {
  /** Text of the button that opens the dialog. */
  label: string;
  icon?: string;
  title: string;
  triggerClassName?: string;
  children: ReactNode;
};

/**
 * Button + dialog. The children (usually a client form) stay mounted only while
 * open, so each opening starts from an empty form.
 */
export function ModalButton({
  label,
  icon,
  title,
  triggerClassName = "materials-btn-primary",
  children,
}: ModalButtonProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      (previouslyFocused ?? triggerRef.current)?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {icon && <MaterialIcon name={icon} />}
        {label}
      </button>

      {open && (
        <div
          className="ui-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            className="ui-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
          >
            <div className="ui-dialog-header">
              <h2 id={titleId}>{title}</h2>
              <button
                type="button"
                className="ui-icon-btn"
                onClick={() => setOpen(false)}
                aria-label="סגירה"
              >
                <MaterialIcon name="close" />
              </button>
            </div>
            <div className="ui-dialog-body">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
