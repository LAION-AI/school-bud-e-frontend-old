import type { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options: SelectOption[];
  onChange?: (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => void;
  onBlur?: (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => void;
  onFocus?: (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => void;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  errorClassName?: string;
  icon?: JSX.Element;
  helpText?: string;
  [key: string]: unknown; // Allow for additional HTML attributes
}

export default function Select({
  label,
  error,
  name,
  value,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  onChange,
  onBlur,
  onFocus,
  className = "",
  labelClassName = "",
  selectClassName = "",
  errorClassName = "",
  icon,
  helpText,
  ...props
}: SelectProps) {
  const baseSelectClass = "block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-primary-500 sm:text-sm rounded-md";
  const errorSelectClass = "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500";
  const disabledSelectClass = "bg-gray-100 cursor-not-allowed";
  
  const selectClasses = [
    baseSelectClass,
    error ? errorSelectClass : "",
    disabled ? disabledSelectClass : "",
    selectClassName,
  ].filter(Boolean).join(" ");

  return (
    <div className={`${className}`}>
      {label && (
        <label
          htmlFor={name}
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        <select
          id={name}
          name={name}
          value={value}
          disabled={!IS_BROWSER || disabled}
          required={required}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          className={selectClasses}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {icon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        {!icon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className={`mt-1 text-sm text-red-600 ${errorClassName}`}>
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
} 