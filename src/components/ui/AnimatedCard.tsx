import * as React from "react";
import { cn } from "@/lib/utils";
import { useAnimateOnScroll } from "@/hooks/useIntersectionObserver";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  animation?: "fade" | "slide" | "scale" | "spring";
}

export function AnimatedCard({
  children,
  className,
  delay = 0,
  animation = "fade",
  ...props
}: AnimatedCardProps) {
  const ref = useAnimateOnScroll<HTMLDivElement>();

  const animationClasses = {
    fade: "animate-on-scroll",
    slide: "animate-on-scroll",
    scale: "animate-on-scroll",
    spring: "animate-on-scroll",
  };

  return (
    <div
      ref={ref}
      className={cn(animationClasses[animation], className)}
      style={{ transitionDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}

// Staggered list container
interface StaggeredListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  staggerDelay?: number;
}

export function StaggeredList({
  children,
  className,
  staggerDelay = 50,
  ...props
}: StaggeredListProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(container);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.unobserve(container);
  }, []);

  return (
    <div ref={containerRef} className={className} {...props}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        return React.cloneElement(child as React.ReactElement<any>, {
          className: cn(
            (child as React.ReactElement<any>).props.className,
            isVisible && "stagger-spring"
          ),
          style: {
            ...(child as React.ReactElement<any>).props.style,
            animationDelay: isVisible ? `${index * staggerDelay}ms` : undefined,
          },
        });
      })}
    </div>
  );
}

// Count-up animation for numbers
interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function CountUp({
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: CountUpProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          
          const startTime = Date.now();
          const startValue = 0;
          
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = startValue + (value - startValue) * eased;
            
            setDisplayValue(current);
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          
          requestAnimationFrame(animate);
          observer.unobserve(element);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [value, duration, hasAnimated]);

  return (
    <span ref={ref} className={cn("count-up", className)}>
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export default AnimatedCard;