import { AlertCircle, RefreshCw, WifiOff, ServerCrash, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type ErrorType = "network" | "server" | "notfound" | "generic";

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | null;
  type?: ErrorType;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

const errorConfig = {
  network: {
    icon: WifiOff,
    defaultTitle: "errors.networkTitle",
    defaultMessage: "errors.networkMessage",
  },
  server: {
    icon: ServerCrash,
    defaultTitle: "errors.serverTitle",
    defaultMessage: "errors.serverMessage",
  },
  notfound: {
    icon: FileQuestion,
    defaultTitle: "errors.notFoundTitle",
    defaultMessage: "errors.notFoundMessage",
  },
  generic: {
    icon: AlertCircle,
    defaultTitle: "errors.genericTitle",
    defaultMessage: "errors.genericMessage",
  },
};

export function ErrorState({
  title,
  message,
  error,
  type = "generic",
  onRetry,
  className,
  compact = false,
}: ErrorStateProps) {
  const { t } = useTranslation();
  const config = errorConfig[type];
  const Icon = config.icon;

  // Auto-detect error type from error message
  const detectedType = error?.message?.toLowerCase().includes("network") 
    ? "network" 
    : error?.message?.toLowerCase().includes("500") || error?.message?.toLowerCase().includes("server")
    ? "server"
    : type;
  
  const finalConfig = errorConfig[detectedType];
  const FinalIcon = finalConfig.icon;

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3",
          className
        )}
      >
        <FinalIcon className="h-5 w-5 text-destructive flex-shrink-0" />
        <p className="text-sm text-muted-foreground flex-1">
          {message || t(finalConfig.defaultMessage)}
        </p>
        {onRetry && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRetry}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            {t("common.retry")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center",
        className
      )}
    >
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <FinalIcon className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title || t(finalConfig.defaultTitle)}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        {message || error?.message || t(finalConfig.defaultMessage)}
      </p>
      {onRetry && (
        <Button 
          variant="outline" 
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {t("common.tryAgain")}
        </Button>
      )}
    </div>
  );
}

// Empty state for when there's no data (not an error)
interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  message,
  icon: Icon = FileQuestion,
  action,
  className,
}: EmptyStateProps) {
  const { t } = useTranslation();
  
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border bg-card/50 p-8 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title || t("common.noData")}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        {message || t("common.noDataMessage")}
      </p>
      {action && (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
