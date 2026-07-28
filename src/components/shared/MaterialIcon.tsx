type MaterialIconProps = {
  name: string;
  filled?: boolean;
  className?: string;
};

export function MaterialIcon({ name, filled = false, className = "" }: MaterialIconProps) {
  return (
    <span
      className={`material-symbol${filled ? " is-filled" : ""}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
