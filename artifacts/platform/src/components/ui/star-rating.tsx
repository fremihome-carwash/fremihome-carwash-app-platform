import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

export function StarRating({ rating, size = "sm", className }: StarRatingProps) {
  if (rating == null) return null;

  const starSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i;
        const half = !filled && rating >= i - 0.5;
        return (
          <Star
            key={i}
            className={cn(starSize, "shrink-0", {
              "fill-amber-400 text-amber-400": filled,
              "fill-amber-200 text-amber-300": half,
              "fill-transparent text-muted-foreground/30": !filled && !half,
            })}
          />
        );
      })}
      <span className={cn("ml-1 font-semibold text-muted-foreground", textSize)}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}
