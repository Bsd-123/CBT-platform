"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { useFocusTrap } from "@/components/ui/useFocusTrap";

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
  triggerClassName = "btn btn-primary",
  children,
}: ModalButtonProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;

    dialogRef.current?.focus();
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
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
                className="btn btn-ghost btn-icon btn-sm"
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
