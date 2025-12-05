// components/guards/subdomain.guard.tsx
import { useTenantDomain } from "@/hooks/use-tenant-domain";
import { type PropsWithChildren } from "react"; // ← type import

type SubdomainGuardProps = PropsWithChildren<{
  type: "app" | "subdomain";
}>;

export default function SubdomainGuard({ type, children }: SubdomainGuardProps) {
  const subdomain = useTenantDomain();

  console.log("🔒 SubdomainGuard:", { subdomain, type, url: window.location.href });

  return <>{children}</>;
}
