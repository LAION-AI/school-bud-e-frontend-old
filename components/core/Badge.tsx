import { JSX } from "preact";

type BadgeVariant = "primary" | "secondary" | "success" | "danger" | "warning" | "info";

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

const variantStyles = {
  primary: "bg-blue-100 text-blue-800",
  secondary: "bg-gray-100 text-gray-800",
  success: "bg-green-100 text-green-800",
  danger: "bg-red-100 text-red-800",
  warning: "bg-yellow-100 text-yellow-800",
  info: "bg-indigo-100 text-indigo-800",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
};

export default function Badge({ 
  text, 
  variant = "primary", 
  size = "sm",
  className = "",
}: BadgeProps): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {text}
    </span>
  );
} 