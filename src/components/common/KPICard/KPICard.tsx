import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number;
  color?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "#667eea",
}: KPICardProps) {
  return (
    <Card className="h-full rounded-xl shadow-md transition-transform duration-200 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          <div
            className="flex items-center rounded-md p-2"
            style={{ backgroundColor: `${color}20` }}
          >
            {icon}
          </div>
        </div>

        <div className="mb-2 text-3xl font-bold">{value}</div>

        <div className="flex items-center gap-2">
          {trend !== undefined && trend !== null && (
            <>
              {trend > 0 ? (
                <TrendingUp className="h-[18px] w-[18px] text-emerald-600" />
              ) : (
                <TrendingDown className="h-[18px] w-[18px] text-red-600" />
              )}
              <span
                className={
                  "text-xs font-semibold " +
                  (trend > 0 ? "text-emerald-600" : "text-red-600")
                }
              >
                {Math.abs(trend)}%
              </span>
            </>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
