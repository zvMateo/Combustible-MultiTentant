import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type AuthShellProps = {
  backgroundImageUrl?: string;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
};

export function AuthShell({
  backgroundImageUrl = "/images/LoginFondo.png",
  onBack,
  backLabel = "Volver",
  children,
}: AuthShellProps) {
  return (
    <div className="fixed inset-0 flex min-h-screen flex-col items-center justify-center overflow-y-auto bg-slate-900 p-4">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {onBack ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="absolute left-4 top-4 z-20 text-white hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Button>
      ) : null}

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
