import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

const variants = {
    primary: "bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500",
    outline: "border border-gray-200 hover:bg-gray-100 focus-visible:ring-gray-500",
    ghost: "hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500",
    danger: "text-red-500 border border-red-500 bg-white focus-visible:ring-red-600"
};

const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8 text-lg",
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
    const baseStyles = "inline-flex items-center justify-center rounded-md gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const widthClass = isFullWidth ? "w-full" : "";

    return (
        <button
            {...props}
            disabled={!IS_BROWSER || disabled || isLoading}
            class={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className ?? ""}`}
        >
            {isLoading ? (
                <div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            {children}
        </button>
    );
}