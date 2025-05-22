import type { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";

interface SidebarLinkProps {
  href: string;
  isActive?: boolean;
  children: ComponentChildren;
  className?: string;
}

const activeClass =
  "bg-primary-100 text-primary-900 hover:bg-primary-200 focus-visible:ring-primary-500";

const defaultClass = "text-gray-700 hover:bg-gray-50 hover:text-gray-900";

export default function SidebarLink({
  href,
  isActive: propIsActive,
  children,
  className = "",
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

  return (
    <a
      href={href}
      class={`block px-3 rounded-lg text-sm transition-all duration-200 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 ${
        isActive ? activeClass : defaultClass
      } ${className}`}
    >
      {children}
    </a>
  );
}
