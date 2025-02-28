import Input from "./Input.tsx";
import Textarea from "./Textarea.tsx";
import Select from "./Select.tsx";

export { Input, Textarea, Select };

// Form component that wraps form elements
interface FormProps {
  children: preact.ComponentChildren;
  onSubmit?: (e: Event) => void;
  className?: string;
}

export default function Form({ children, onSubmit, className = "" }: FormProps) {
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
} 