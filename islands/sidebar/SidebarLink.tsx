import type { ComponentChildren } from "preact";
import { useState, useEffect } from "preact/hooks";

interface SidebarLinkProps {
  href: string;
  isActive?: boolean;
  children: ComponentChildren;
  className?: string;
}

export default function SidebarLink({ href, isActive: propIsActive, children, className = "" }: SidebarLinkProps) {
  const [isActive, setIsActive] = useState(propIsActive);

  useEffect(() => {
    const updateActive = () => {
      const currentPath = globalThis.location?.pathname;
      setIsActive(currentPath === href || Boolean(propIsActive));
    };

    // Initial check
    updateActive();

    // Listen for route changes
    globalThis.addEventListener('popstate', updateActive);
    return () => globalThis.removeEventListener('popstate', updateActive);
  }, [href, propIsActive]);

  return (
    <a
      href={href}
      class={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-amber-500 ${
        isActive 
          ? "bg-amber-100 text-amber-900 hover:bg-amber-200" 
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      } ${className}`}
    >
      {children}
    </a>
  );
} 