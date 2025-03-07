import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

const variants = {
    primary: "bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500 shadow-[0_4px_0_0_#2297b7] active:translate-y-1 active:shadow-none",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-500 shadow-[0_4px_0_0_#d1d5db] active:translate-y-1 active:shadow-none",
    outline: "border border-gray-200 hover:bg-gray-50 focus-visible:ring-gray-500 shadow-[0_4px_0_0_#e5e7eb] active:translate-y-1 active:shadow-none",
    ghost: "hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-gray-500 shadow-[0_4px_0_0_#f3f4f6] active:translate-y-1 active:shadow-none",
    danger: "text-red-500 border border-red-500 bg-white focus-visible:ring-red-600 shadow-[0_4px_0_0_#ef4444] active:translate-y-1 active:shadow-none"
};

const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-6 text-lg",
    xl: "h-14 px-8 text-xl"
};

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export interface ButtonProps extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, 'size'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    isFullWidth?: boolean;
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
    const baseStyles = "inline-flex items-center justify-center rounded-2xl gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none";

    const widthClass = isFullWidth ? "w-full" : "";

    return (
        <button
            {...props}
            disabled={disabled || isLoading}
            class={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className ?? ""}`}
        >
            {isLoading ? (
                <div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            {children}
        </button>
    );
}