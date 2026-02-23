import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Fallback component shown while lazy-loaded code is loading
 */
function LazyFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Wraps a lazy-loaded component with Suspense boundary
 * Usage: const Page = lazyLoad(() => import('./pages/SomePage'))
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.ComponentType<React.ComponentProps<T>> {
  const Component = lazy(componentImport);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={<LazyFallback />}>
      <Component {...props} />
    </Suspense>
  );
}

export { Suspense, lazy, LazyFallback };
