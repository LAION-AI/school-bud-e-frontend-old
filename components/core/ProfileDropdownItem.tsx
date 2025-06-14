import { JSX } from "preact";

interface ProfileDropdownItemProps
  extends JSX.HTMLAttributes<HTMLAnchorElement> {
  variant?: "default" | "danger";
}

export function ProfileDropdownItem({
  variant = "default",
  class: className,
  ...props
}: ProfileDropdownItemProps): JSX.Element {
  const baseStyles = "block px-4 py-2 text-sm hover:bg-gray-100";
  const variantStyles = variant === "danger" ? "text-red-600" : "text-gray-700";

  return (
    <a
      {...props}
      class={`${baseStyles} ${variantStyles} ${className ?? ""}`}
    />
  );
}
