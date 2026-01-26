import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeConfig {
  minDistance?: number; // Minimum swipe distance in pixels
  maxTime?: number; // Maximum time for swipe in ms
  verticalTolerance?: number; // Max vertical deviation for horizontal swipes
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
}

export function useSwipeGestures(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) {
  const {
    minDistance = 50,
    maxTime = 300,
    verticalTolerance = 30,
  } = config;

  const touchData = useRef<TouchData | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchData.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchData.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchData.current.startX;
    const deltaY = touch.clientY - touchData.current.startY;
    const deltaTime = Date.now() - touchData.current.startTime;

    touchData.current = null;

    // Check if within time limit
    if (deltaTime > maxTime) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Horizontal swipe detection
    if (absX > absY && absX >= minDistance && absY <= verticalTolerance) {
      if (deltaX > 0 && handlers.onSwipeRight) {
        handlers.onSwipeRight();
      } else if (deltaX < 0 && handlers.onSwipeLeft) {
        handlers.onSwipeLeft();
      }
      return;
    }

    // Vertical swipe detection
    if (absY > absX && absY >= minDistance && absX <= verticalTolerance) {
      if (deltaY > 0 && handlers.onSwipeDown) {
        handlers.onSwipeDown();
      } else if (deltaY < 0 && handlers.onSwipeUp) {
        handlers.onSwipeUp();
      }
    }
  }, [handlers, minDistance, maxTime, verticalTolerance]);

  const onTouchCancel = useCallback(() => {
    touchData.current = null;
  }, []);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchCancel,
  };
}

// Edge swipe detection for back navigation
export function useEdgeSwipe(onSwipeBack: () => void, edgeWidth: number = 20) {
  const touchData = useRef<{ startX: number; isEdge: boolean } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const isEdge = touch.clientX <= edgeWidth;
    touchData.current = {
      startX: touch.clientX,
      isEdge,
    };
  }, [edgeWidth]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchData.current || !touchData.current.isEdge) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchData.current.startX;

    touchData.current = null;

    // Swipe right from edge = back
    if (deltaX > 100) {
      onSwipeBack();
    }
  }, [onSwipeBack]);

  return {
    onTouchStart,
    onTouchEnd,
  };
}
