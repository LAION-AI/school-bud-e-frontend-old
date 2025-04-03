// @ts-ignore: JSX namespace is used in type definitions
import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { forwardRef } from "preact/compat";

export interface InputProps {
  label?: string;
  error?: string;
  type?: string;
  name?: string;
  value?: string | number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: (e: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
  onBlur?: (e: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
  onFocus?: (e: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  icon?: JSX.Element;
  iconPosition?: "left" | "right";
  helpText?: string;
  [key: string]: unknown; // Allow for additional HTML attributes
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  type = "text",
  name,
  value,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  onChange,
  onBlur,
  onFocus,
  className = "",
  labelClassName = "",
  inputClassName = "",
  errorClassName = "",
  icon,
  iconPosition = "right",
  helpText,
  ...props
}, ref) => {
  const baseInputClass = "block w-full px-3 py-2 sm:text-sm border-2 border-gray-200 rounded-md focus:ring-primary-500 focus:border-primary-500";
  const errorInputClass = "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500";
  const disabledInputClass = "bg-gray-100 cursor-not-allowed";
  
  const inputClasses = [
    baseInputClass,
    error ? errorInputClass : "",
    disabled ? disabledInputClass : "",
    icon && iconPosition === "left" ? "pl-10" : "",
    icon && iconPosition === "right" ? "pr-10" : "",
    inputClassName,
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
        {icon && iconPosition === "left" && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={!IS_BROWSER || disabled}
          readOnly={readOnly}
          required={required}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          className={inputClasses}
          ref={ref}
          {...props}
        />
        {icon && iconPosition === "right" && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {icon}
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
});

export default Input; 