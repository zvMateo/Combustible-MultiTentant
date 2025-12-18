/**
 * EntityCardFooter - Footer de Card con estado + switch de activación
 * Patrón reutilizado en DriversPage, VehiclesPage, ResourcesPage, etc.
 */
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

interface EntityCardFooterProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  onToggle?: () => void;
  showSwitch?: boolean;
  isToggling?: boolean;
  className?: string;
}

export function EntityCardFooter({
  active,
  activeLabel = "Activo",
  inactiveLabel = "Inactivo",
  onToggle,
  showSwitch = true,
  isToggling = false,
  className,
}: EntityCardFooterProps) {
  return (
    <div
      className={cn(
        "px-5 py-3 bg-muted/30 border-t flex items-center justify-between",
        className
      )}
    >
      <StatusBadge
        active={active}
        activeLabel={activeLabel}
        inactiveLabel={inactiveLabel}
      />
      {showSwitch && onToggle && (
        <Switch
          checked={active}
          onCheckedChange={onToggle}
          disabled={isToggling}
          aria-label={active ? "Desactivar" : "Activar"}
        />
      )}
    </div>
  );
}
