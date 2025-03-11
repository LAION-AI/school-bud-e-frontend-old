import type { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";

interface SidebarLinkProps {
  href: string;
  isActive?: boolean;
  children: ComponentChildren;
  className?: string;
  variant?: "amber" | "blue" | "red" | "purple" | "lime";
}

const variantClasses = {
  amber:
    "bg-amber-100 text-amber-900 hover:bg-amber-200 focus-visible:ring-amber-500",
  blue: "bg-blue-100 text-blue-900 hover:bg-blue-200 focus-visible:ring-blue-500",
  red: "bg-red-100 text-red-900 hover:bg-red-200 focus-visible:ring-red-500",
  purple:
    "bg-purple-100 text-purple-900 hover:bg-purple-200 focus-visible:ring-purple-500",
  lime: "bg-lime-100 text-lime-900 hover:bg-lime-200 focus-visible:ring-lime-500",
};

const defaultClass = "text-gray-700 hover:bg-gray-50 hover:text-gray-900";

export default function SidebarLink({
  href,
  isActive: propIsActive,
  children,
  className = "",
  variant = "amber",
}: SidebarLinkProps) {
  const [isActive, setIsActive] = useState(propIsActive);

  useEffect(() => {
    const updateActive = () => {
      const currentPath = globalThis.location?.pathname;
      setIsActive(currentPath === href || Boolean(propIsActive));
    };

    // Initial check
    updateActive();

    // Listen for route changes
    globalThis.addEventListener("popstate", updateActive);
    return () => globalThis.removeEventListener("popstate", updateActive);
  }, [href, propIsActive]);

  const activeClass = variantClasses[variant];

  return (
    <a
      href={href}
      class={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 ${
        isActive ? activeClass : defaultClass
      } ${className}`}
    >
      {children}
    </a>
  );
}
