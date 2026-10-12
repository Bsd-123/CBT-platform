"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

/** Curated icons for material categories (Material Symbols names with Hebrew labels). */
export const CATEGORY_ICON_OPTIONS = [
  { name: "description", label: "דף עבודה" },
  { name: "video_library", label: "וידאו" },
  { name: "slideshow", label: "מצגת" },
  { name: "extension", label: "משחק" },
  { name: "auto_stories", label: "קריאה" },
  { name: "fact_check", label: "תוכנית טיפול" },
  { name: "headphones", label: "הקלטה" },
  { name: "quiz", label: "שאלון" },
  { name: "psychology", label: "פסיכולוגיה" },
  { name: "self_improvement", label: "הרפיה" },
  { name: "family_restroom", label: "משפחה" },
  { name: "child_care", label: "ילדים" },
  { name: "edit_note", label: "תרגיל כתיבה" },
  { name: "checklist", label: "רשימה" },
  { name: "lightbulb", label: "רעיון" },
  { name: "menu_book", label: "מדריך" },
] as const;

type IconPickerProps = {
  value: string;
  onChange: (value: string) => void;
  /** Icon shown when no value is chosen (the category's built-in default). */
  fallback?: string;
  label: string;
};

/** Button that opens a grid of icons to choose from, instead of typing an icon name. */
export function IconPicker({ value, onChange, fallback = "category", label }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  // The panel is fixed-positioned so scrollable table wrappers don't clip it.
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const current = CATEGORY_ICON_OPTIONS.find((option) => option.name === value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function close() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="icon-picker" ref={wrapRef}>
      <button
        type="button"
        className="icon-picker-trigger"
        aria-label={`${label}: ${current?.label ?? "ברירת מחדל"}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setPanelStyle({
            top: rect.bottom + 6,
            right: Math.max(8, window.innerWidth - rect.right),
          });
          setOpen((v) => !v);
        }}
      >
        <MaterialIcon name={value || fallback} />
        <span>{current?.label ?? "ברירת מחדל"}</span>
        <MaterialIcon name="expand_more" />
      </button>
      {open && (
        <div
          id={panelId}
          className="icon-picker-panel"
          role="radiogroup"
          aria-label={label}
          style={panelStyle}
        >
          <button
            type="button"
            role="radio"
            aria-checked={!value}
            className="icon-picker-option"
            title="ברירת מחדל"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            <MaterialIcon name={fallback} />
            <span>ברירת מחדל</span>
          </button>
          {CATEGORY_ICON_OPTIONS.map((option) => (
            <button
              key={option.name}
              type="button"
              role="radio"
              aria-checked={value === option.name}
              className="icon-picker-option"
              title={option.label}
              onClick={() => {
                onChange(option.name);
                setOpen(false);
              }}
            >
              <MaterialIcon name={option.name} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
