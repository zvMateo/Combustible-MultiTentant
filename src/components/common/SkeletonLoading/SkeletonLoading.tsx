import React from "react";
import { Skeleton, Box } from "@mui/material";

interface SkeletonLoadingProps {
  variant?: "text" | "rectangular" | "rounded" | "circular";
  height?: number;
  width?: string | number;
  count?: number;
}

const SkeletonLoading: React.FC<SkeletonLoadingProps> = ({
  variant = "rectangular",
  height = 120,
  width = "100%",
  count = 1,
}) => (
  <Box>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton
        key={i}
        variant={variant}
        height={height}
        width={width}
        animation="wave"
        sx={{ mb: 2, borderRadius: 2 }}
      />
    ))}
  </Box>
);

export default SkeletonLoading;
