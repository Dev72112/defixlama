import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface ResponsiveColumn<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
  /** 'always' = show on mobile card, 'desktop' = hide on mobile, 'expanded' = show when card expanded */
  priority?: "always" | "desktop" | "expanded";
  align?: "left" | "right" | "center";
  className?: string;
}

interface ResponsiveDataTableProps<T> {
  columns: ResponsiveColumn<T>[];
  data: T[];
  keyField: keyof T | ((item: T, index: number) => string);
  onRowClick?: (item: T) => void;
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  /** Render extra content at bottom of mobile card */
  mobileCardFooter?: (item: T) => React.ReactNode;
  /** Primary field key for mobile card title */
  mobilePrimaryKey?: string;
  /** Secondary field key for mobile card subtitle */
  mobileSecondaryKey?: string;
}

function getKey<T>(item: T, index: number, keyField: keyof T | ((item: T, index: number) => string)): string {
  if (typeof keyField === "function") return keyField(item, index);
  return String(item[keyField]);
}

export function ResponsiveDataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  onRowClick,
  loading = false,
  loadingRows = 5,
  emptyMessage = "No data available",
  emptyIcon,
  className,
  mobileCardFooter,
}: ResponsiveDataTableProps<T>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileCardList
        columns={columns}
        data={data}
        keyField={keyField}
        onRowClick={onRowClick}
        loading={loading}
        loadingRows={loadingRows}
        emptyMessage={emptyMessage}
        emptyIcon={emptyIcon}
        className={className}
        mobileCardFooter={mobileCardFooter}
      />
    );
  }

  // Desktop: standard table
  const visibleCols = columns.filter((c) => c.priority !== "expanded");

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr className="bg-muted/30">
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.priority === "desktop" && "hidden sm:table-cell",
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(loadingRows)
                .fill(0)
                .map((_, i) => (
                  <tr key={i}>
                    {visibleCols.map((col) => (
                      <td key={col.key} className={cn(col.priority === "desktop" && "hidden sm:table-cell")}>
                        <div className="skeleton h-6 w-full max-w-[120px]" style={{ marginLeft: col.align === "right" ? "auto" : undefined }} />
                      </td>
                    ))}
                  </tr>
                ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length} className="py-8 text-center text-muted-foreground">
                  {emptyIcon && <div className="flex justify-center mb-2">{emptyIcon}</div>}
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={getKey(item, index, keyField)}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {visibleCols.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.priority === "desktop" && "hidden sm:table-cell",
                        col.className
                      )}
                    >
                      {col.render ? col.render(item, index) : String(item[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Mobile card list */
function MobileCardList<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  onRowClick,
  loading,
  loadingRows = 5,
  emptyMessage,
  emptyIcon,
  className,
  mobileCardFooter,
}: ResponsiveDataTableProps<T>) {
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);

  const alwaysCols = columns.filter((c) => c.priority === "always" || !c.priority);
  const expandedCols = columns.filter((c) => c.priority === "expanded" || c.priority === "desktop");

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array(loadingRows).fill(0).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-4 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-8 text-center text-muted-foreground", className)}>
        {emptyIcon && <div className="flex justify-center mb-2">{emptyIcon}</div>}
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {data.map((item, index) => {
        const key = getKey(item, index, keyField);
        const isExpanded = expandedKey === key;

        return (
          <div
            key={key}
            className={cn(
              "rounded-lg border border-border bg-card p-3 transition-colors",
              onRowClick && "cursor-pointer active:bg-muted/50"
            )}
            onClick={() => onRowClick?.(item)}
          >
            {/* Always-visible fields */}
            <div className="space-y-1.5">
              {alwaysCols.map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">{col.label}</span>
                  <span className={cn(
                    "text-sm font-medium text-foreground text-right truncate",
                    col.className
                  )}>
                    {col.render ? col.render(item, index) : String(item[col.key] ?? "")}
                  </span>
                </div>
              ))}
            </div>

            {/* Expanded fields */}
            {isExpanded && expandedCols.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5">
                {expandedCols.map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground shrink-0">{col.label}</span>
                    <span className={cn("text-sm text-foreground text-right truncate", col.className)}>
                      {col.render ? col.render(item, index) : String(item[col.key] ?? "")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {mobileCardFooter && isExpanded && (
              <div className="mt-2 pt-2 border-t border-border/50">
                {mobileCardFooter(item)}
              </div>
            )}

            {/* Expand toggle */}
            {expandedCols.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedKey(isExpanded ? null : key);
                }}
                className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
              >
                {isExpanded ? (
                  <>Less <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>More <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}