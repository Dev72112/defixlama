import React, { Suspense, lazy, ComponentType } from "react";
import { Loader2 } from "lucide-react";

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function lazyLoad(factory: () => Promise<{ default: ComponentType<any> }>) {
  const LazyComponent = lazy(factory);
  return (props: any) => (
    <Suspense fallback={<PageLoader />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}
