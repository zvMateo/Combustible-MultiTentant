import type { ReactNode } from "react";

type AuthShellProps = {
  backgroundImageUrl?: string;
  children: ReactNode;
};

export function AuthShell({
  backgroundImageUrl = "/images/LoginFondo.png",
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

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
