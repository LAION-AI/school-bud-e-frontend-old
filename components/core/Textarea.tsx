import type { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export interface TextareaProps {
  label?: string;
  error?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  onChange?: (e: JSX.TargetedEvent<HTMLTextAreaElement, Event>) => void;
  onBlur?: (e: JSX.TargetedEvent<HTMLTextAreaElement, Event>) => void;
  onFocus?: (e: JSX.TargetedEvent<HTMLTextAreaElement, Event>) => void;
  className?: string;
  labelClassName?: string;
  textareaClassName?: string;
  errorClassName?: string;
  helpText?: string;
  [key: string]: unknown; // Allow for additional HTML attributes
}

export default function Textarea({
  label,
  error,
  name,
  value,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  rows = 4,
  onChange,
  onBlur,
  onFocus,
  className = "",
  labelClassName = "",
  textareaClassName = "",
  errorClassName = "",
  helpText,
  ...props
}: TextareaProps) {
  const baseTextareaClass = "border-2 block w-full px-3 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500";
  const errorTextareaClass = "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500";
  const disabledTextareaClass = "bg-gray-100 cursor-not-allowed";
  
  const textareaClasses = [
    baseTextareaClass,
    error ? errorTextareaClass : "",
    disabled ? disabledTextareaClass : "",
    textareaClassName,
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
        <textarea
          id={name}
          name={name}
          value={value}
          placeholder={placeholder}
          disabled={!IS_BROWSER || disabled}
          readOnly={readOnly}
          required={required}
          rows={rows}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          className={textareaClasses}
          {...props}
        />
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