import { IS_BROWSER } from "$fresh/runtime.ts";

// Define our own button props instead of extending HTML attributes
export interface ButtonProps {
  children?: preact.ComponentChildren;
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  onClick?: (event: MouseEvent) => void;
  type?: "button" | "submit" | "reset";
  class?: string;
  id?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  loading = false,
  class: className = "",
  ...rest
}: ButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    tertiary: "bg-transparent hover:bg-gray-100 text-gray-800",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  const sizes = {
    xs: "text-xs py-1 px-2",
    sm: "text-sm py-1.5 px-3",
    md: "text-sm py-2 px-4",
    lg: "text-base py-2.5 px-5",
    xl: "text-lg py-3 px-6",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? "w-full" : ""} 
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${loading ? "relative !text-transparent" : ""}
        ${className}`}
      {...rest}
    >
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
}

export function ChatSubmitButton(props: ButtonProps) {
  // Destructure `class` from props to apply alongside Tailwind classes
  const { class: className, ...buttonProps } = props;

  return (
    <Button
      {...buttonProps}
      // Spread the rest of the buttonProps here
      disabled={!IS_BROWSER || props.disabled}
      class={`disabled:opacity-75 disabled:cursor-not-allowed p-2 ${className ?? ""}`}
      type="button"
      aria-label="Send message"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-up text-white"
        aria-hidden="true"
        role="img"
      >
        <title>Send</title>
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 5v14" />
        <path d="M16 9l-4 -4l-4 4" />
      </svg>
    </Button>
  );
}

export default ChatSubmitButton; 