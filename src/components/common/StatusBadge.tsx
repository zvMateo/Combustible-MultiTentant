/**
 * StatusBadge - Indicador de estado activo/inactivo reutilizable
 * Usado en Cards de entidades (Drivers, Vehicles, Resources, etc.)
 */
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  active,
  activeLabel = "Activo",
  inactiveLabel = "Inactivo",
  size = "sm",
  className,
}: StatusBadgeProps) {
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        active ? "text-green-600" : "text-red-500",
        className
      )}
    >
      {active ? <CheckCircle2 size={iconSize} /> : <XCircle size={iconSize} />}
      <span
        className={cn(
          "font-bold uppercase",
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        {active ? activeLabel : inactiveLabel}
      </span>
    </div>
  );
}
