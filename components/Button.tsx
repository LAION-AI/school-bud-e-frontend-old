import type { JSX } from "preact";

const variants = {
  primary:
    "bg-primary-600 after:bg-primary-500 text-white focus-visible:ring-primary-500",
  secondary:
    "bg-gray-200 after:bg-gray-100 text-gray-900 focus-visible:ring-gray-500",
  outline:
    "bg-gray-100 after:bg-white border border-gray-200 focus-visible:ring-gray-500",
  ghost:
    "hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-gray-500 !border-none",
  danger:
    "bg-red-600 after:bg-white text-red-500 border border-red-500 focus-visible:ring-red-600",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 py-2",
  lg: "h-12 px-6 text-lg",
  xl: "h-14 px-8 text-xl",
};

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export interface ButtonProps
  extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isFullWidth?: boolean;
  disabled?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  isLoading = false,
  isFullWidth = false,
  class: className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "relative inline-flex items-center justify-center rounded-2xl gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none after:absolute after:inset-0 after:top-0 after:rounded-2xl after:-translate-y-[4px] after:transition-transform after:duration-150 active:after:translate-y-0 hover:after:-translate-y-[6px] after:z-10 group";

  const widthClass = isFullWidth ? "w-full" : "";

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      class={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${
        className ?? ""
      }`}
    >
      <span class="relative z-20 -translate-y-[4px] transition-transform duration-150 group-hover:-translate-y-[6px] group-active:translate-y-0 flex items-center gap-2 justify-between">
        {isLoading
          ? (
            <div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )
          : null}
        {children}
      </span>
    </button>
  );
}
