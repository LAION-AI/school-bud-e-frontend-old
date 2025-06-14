import { JSX } from "preact";

interface ProfileDropdownProps {
  isOpen: boolean;
  children: JSX.Element | JSX.Element[];
}

export function ProfileDropdown(
  { isOpen, children }: ProfileDropdownProps,
): JSX.Element {
  return (
    <div
      class={`absolute right-2 mt-2 w-48 py-2 bg-white rounded-md shadow-xl z-50 transition-all transform origin-top-right ${
        isOpen
          ? "scale-100 opacity-100"
          : "scale-95 opacity-0 pointer-events-none"
      }`}
    >
      {children}
    </div>
  );
}
