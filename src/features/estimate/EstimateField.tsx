export default function Field({
  label,
  hint,
  children,
  group = false,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  group?: boolean;
}) {
  if (group) {
    return (
      <div className="estimate-field" role="group" aria-label={label}>
        <span className="estimate-field-label" aria-hidden="true">
          {label}
        </span>
        {children}
      </div>
    );
  }

  return (
    <label className="estimate-field">
      <span className="estimate-field-label">{label}</span>
      {children}
      {hint && <span className="estimate-field-hint">{hint}</span>}
    </label>
  );
}
