import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("py-16 text-center animate-fade-in", className)}>
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
        {icon ? (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
            {icon}
          </div>
        ) : null}
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="pt-4">{action}</div> : null}
      </div>
    </div>
  );
}
