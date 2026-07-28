type TagInputProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function TagInput({
  id = "tags",
  name = "tags",
  value,
  onChange,
  required = false,
}: TagInputProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>
        תגיות{required ? " (חובה)" : ""}
      </label>
      <input
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="הפרידו בין תגיות בפסיקים, למשל: CBT, חרדה, ילדים"
        required={required}
      />
      <p className="muted">יש להפריד בין תגיות בפסיקים.</p>
    </div>
  );
}
