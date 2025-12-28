import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Delay index for staggered animations (0-9) */
  delay?: number;
}

function Skeleton({ className, delay, ...props }: SkeletonProps) {
  const delayClass = delay !== undefined ? `skeleton-delay-${Math.min(delay, 9)}` : "";
  return (
    <div 
      className={cn(
        "animate-skeleton-pulse rounded-md bg-muted/60 skeleton-shimmer",
        delayClass,
        className
      )} 
      {...props} 
    />
  );
}

interface SkeletonGroupProps {
  count: number;
  className?: string;
  itemClassName?: string;
  stagger?: boolean;
}

function SkeletonGroup({ count, className, itemClassName, stagger = true }: SkeletonGroupProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={itemClassName} delay={stagger ? i : undefined} />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonGroup };
