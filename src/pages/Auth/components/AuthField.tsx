import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFieldProps = {
  id: string;
  label: string;
  error?: string;
  icon?: ReactNode;
  wrapperClassName?: string;
} & Omit<React.ComponentProps<typeof Input>, "id">;

export function AuthField({
  id,
  label,
  error,
  icon,
  wrapperClassName,
  className: inputClassName,
  ...props
}: AuthFieldProps) {
  return (
    <div className={wrapperClassName ?? ""}>
      <Label
        htmlFor={id}
        className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
      </Label>
      <div className="mt-2">
        <div className="relative">
          {icon ? (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          ) : null}
          <Input
            id={id}
            className={
              "h-11 rounded-xl border-slate-200 bg-slate-50 text-sm transition-all focus:bg-white " +
              (icon ? "pl-10 " : "") +
              (error ? "border-red-300 focus-visible:ring-red-200 " : "") +
              (props.disabled ? "opacity-80 " : "") +
              (inputClassName ?? "")
            }
            aria-invalid={!!error}
            {...props}
          />
        </div>
      </div>
      {error ? (
        <p className="mt-1 text-[10px] font-bold text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
