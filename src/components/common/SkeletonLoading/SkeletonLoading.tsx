import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
  <div>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton
        key={i}
        className="mb-4"
        style={{
          height,
          width,
          borderRadius:
            variant === "circular" ? "9999px" : variant === "rounded" ? 8 : 0,
        }}
      />
    ))}
  </div>
);

export default SkeletonLoading;
