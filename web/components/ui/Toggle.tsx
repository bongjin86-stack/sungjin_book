"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className="relative inline-block w-[30px] h-[17px] flex-shrink-0"
    >
      <span
        className={`absolute inset-0 rounded-[9px] transition-colors ${
          checked ? "bg-accent" : "bg-border"
        }`}
      />
      <span
        className={`absolute top-[2px] left-[2px] w-[13px] h-[13px] bg-white rounded-full transition-transform shadow-[0_1px_3px_rgba(0,0,0,0.15)] ${
          checked ? "translate-x-[13px]" : ""
        }`}
      />
    </button>
  );
}
