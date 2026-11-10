import * as React from "react";
import { cn } from "../../../shared/utils/cn";

export interface GlowProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "above" | "below" | "center";
}

export function Glow({ className, variant = "above", ...props }: GlowProps) {
  const variantStyles = {
    above: "top-[-20%] left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-[radial-gradient(ellipse_at_center,rgba(138,88,43,0.08),transparent_70%)]",
    below: "bottom-[-20%] left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-[radial-gradient(ellipse_at_center,rgba(138,88,43,0.06),transparent_70%)]",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[900px] bg-[radial-gradient(ellipse_at_center,rgba(138,88,43,0.07),transparent_70%)]",
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute blur-3xl opacity-80",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export default Glow;
