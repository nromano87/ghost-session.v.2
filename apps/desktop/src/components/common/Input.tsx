interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  /** Shown on the same row as the label (e.g. Forgot password?) */
  labelRight?: React.ReactNode;
}

export default function Input({ label, labelClassName = '', labelRight, className = '', id, ...props }: InputProps) {
  const inputId = id ?? (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center justify-between gap-3 min-h-[1.25rem]">
          <label
            htmlFor={inputId}
            className={`text-xs text-ghost-text-secondary font-medium ${labelClassName}`.trim()}
          >
            {label}
          </label>
          {labelRight ? <span className="shrink-0">{labelRight}</span> : null}
        </div>
      )}
      <input id={inputId} className={`ghost-input ${className}`} {...props} />
    </div>
  );
}
