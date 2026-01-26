import { useEffect, useRef, useState, RefObject } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver<T extends Element = Element>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T>, boolean] {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = "0px",
    freezeOnceVisible = true,
  } = options;

  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // If already visible and frozen, don't observe
    if (freezeOnceVisible && isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        // Unobserve if freezeOnceVisible is true and element became visible
        if (freezeOnceVisible && visible) {
          observer.unobserve(element);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, isVisible]);

  return [elementRef, isVisible];
}

// Hook for animating elements on scroll
export function useAnimateOnScroll<T extends HTMLElement = HTMLElement>(
  animationClass: string = "visible",
  options: UseIntersectionObserverOptions = {}
): RefObject<T> {
  const [ref, isVisible] = useIntersectionObserver<T>({
    threshold: 0.1,
    freezeOnceVisible: true,
    ...options,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (isVisible) {
      element.classList.add(animationClass);
    }
  }, [isVisible, animationClass, ref]);

  return ref;
}

// Hook for staggered animations on multiple elements
export function useStaggeredAnimation(
  containerRef: RefObject<HTMLElement>,
  itemSelector: string = ".stagger-item",
  options: UseIntersectionObserverOptions = {}
) {
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const items = container.querySelectorAll(itemSelector);
          items.forEach((item, index) => {
            const element = item as HTMLElement;
            element.style.animationDelay = `${index * 50}ms`;
            element.classList.add("stagger-spring");
          });
          setHasAnimated(true);
          observer.unobserve(container);
        }
      },
      { threshold: options.threshold ?? 0.1, ...options }
    );

    observer.observe(container);

    return () => {
      observer.unobserve(container);
    };
  }, [containerRef, itemSelector, hasAnimated, options]);

  return hasAnimated;
}

export default useIntersectionObserver;