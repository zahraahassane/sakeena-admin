import { AlertCircle } from "lucide-react";

/** Label + control + hint + inline error. `id` is also the scroll target for "go to problem". */
const Field = ({ id, label, required, hint, error, children, className = "" }) => (
  <div id={id ? `field-${id}` : undefined} className={`space-y-1.5 scroll-mt-28 ${className}`}>
    <label htmlFor={id} className="block text-sm font-semibold text-neutral-900">
      {label}
      {required && <span className="text-rose-500"> *</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    {error && (
      <p className="text-xs text-rose-600 flex items-start gap-1.5">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>{error}</span>
      </p>
    )}
  </div>
);

export const Section = ({ id, title, description, children }) => (
  <section id={id} className="bg-white rounded-2xl border border-black/10 shadow-sm scroll-mt-28">
    <div className="px-6 pt-6 pb-2">
      <h2 className="text-lg font-bold text-neutral-950">{title}</h2>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    </div>
    <div className="px-6 pb-6 pt-4 space-y-5">{children}</div>
  </section>
);

export default Field;
