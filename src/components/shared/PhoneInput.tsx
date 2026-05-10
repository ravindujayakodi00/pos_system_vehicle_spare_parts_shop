"use client";

/**
 * PhoneInput — Fixed +94 prefix, accepts exactly 9 digits (no leading zero).
 * The `value` prop and `onChange` always work with the full E.164 string,
 * e.g. "+94757892492". The visible input shows only the 9-digit subscriber part.
 */

const PREFIX = "+94";
const DIGITS = 9;

interface PhoneInputProps {
  /** Full phone value in +94XXXXXXXXX format */
  value: string;
  onChange: (fullPhone: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

/** Strip the +94 prefix and return the subscriber digits only */
function stripPrefix(full: string): string {
  if (full.startsWith(PREFIX)) return full.slice(PREFIX.length);
  // Handle legacy values starting with 0
  if (full.startsWith("0")) return full.slice(1);
  return full;
}

export function PhoneInput({
  value,
  onChange,
  required,
  placeholder = "757 892 492",
  className = "",
  id,
}: PhoneInputProps) {
  const digits = stripPrefix(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numeric input, strip anything that isn't a digit
    const raw = e.target.value.replace(/\D/g, "");
    // Limit to DIGITS characters
    const trimmed = raw.slice(0, DIGITS);
    onChange(trimmed ? `${PREFIX}${trimmed}` : "");
  };

  const inputClass = [
    "w-full py-2 pr-3 pl-2 border border-gray-300 dark:border-gray-600 rounded-r-lg text-sm",
    "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
    "focus:outline-none focus:ring-2 focus:ring-blue-500",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex">
      {/* Fixed prefix */}
      <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-600 text-sm font-medium text-gray-500 dark:text-gray-300 select-none flex-shrink-0">
        +94
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]{9}"
        maxLength={DIGITS}
        value={digits}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={inputClass}
        title="Enter 9 digits after +94 (without leading 0)"
      />
    </div>
  );
}
