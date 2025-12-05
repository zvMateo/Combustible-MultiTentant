import { Card, CardContent, Box, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

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
    <Card
      elevation={2}
      sx={{
        height: "100%",
        borderRadius: 3,
        transition: "transform 0.2s",
        "&:hover": { transform: "translateY(-4px)" },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Box
            sx={{
              bgcolor: `${color}20`,
              p: 1,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
            }}
          >
            {icon}
          </Box>
        </Box>

        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          {value}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {trend !== undefined && trend !== null && (
            <>
              {trend > 0 ? (
                <TrendingUpIcon sx={{ color: "success.main", fontSize: 18 }} />
              ) : (
                <TrendingDownIcon sx={{ color: "error.main", fontSize: 18 }} />
              )}
              <Typography
                variant="caption"
                color={trend > 0 ? "success.main" : "error.main"}
                fontWeight={600}
              >
                {Math.abs(trend)}%
              </Typography>
            </>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

