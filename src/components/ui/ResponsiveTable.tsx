import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  // Visibility per breakpoint
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  // For mobile card view
  mobileLabel?: string;
  mobileRender?: (item: T, index: number) => React.ReactNode;
  isPrimary?: boolean; // Show in card header
  isSecondary?: boolean; // Show in card subtitle
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T, index: number) => string;
  className?: string;
  stickyHeader?: boolean;
  // Mobile card customization
  mobileCardClassName?: string;
  renderMobileCard?: (item: T, index: number, columns: Column<T>[]) => React.ReactNode;
  // Mobile card expandable details
  expandable?: boolean;
  renderExpandedContent?: (item: T, index: number) => React.ReactNode;
  // Actions column for mobile
  mobileActions?: (item: T) => React.ReactNode;
}

// Loading skeleton for table
function TableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <>
      {Array(rows)
        .fill(0)
        .map((_, i) => (
          <tr key={i} className="animate-pulse">
            {Array(columns)
              .fill(0)
              .map((__, j) => (
                <td key={j} className="p-4">
                  <div className="skeleton h-4 w-full max-w-[120px]" />
                </td>
              ))}
          </tr>
        ))}
    </>
  );
}

// Mobile card skeleton
function CardSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array(rows)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div className="flex-1">
                <div className="skeleton h-4 w-24 mb-2" />
                <div className="skeleton h-3 w-16" />
              </div>
              <div className="skeleton h-5 w-16" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-full" />
            </div>
          </div>
        ))}
    </div>
  );
}

// Mobile card component
function MobileCard<T>({
  item,
  index,
  columns,
  onRowClick,
  cardClassName,
  expandable,
  expandedContent,
  mobileActions,
}: {
  item: T;
  index: number;
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  cardClassName?: string;
  expandable?: boolean;
  expandedContent?: React.ReactNode;
  mobileActions?: React.ReactNode;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const primaryColumn = columns.find((c) => c.isPrimary);
  const secondaryColumn = columns.find((c) => c.isSecondary);
  const otherColumns = columns.filter(
    (c) => !c.isPrimary && !c.isSecondary && !c.hideOnMobile
  );

  const handleClick = () => {
    if (expandable) {
      setExpanded(!expanded);
    } else if (onRowClick) {
      onRowClick(item);
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 transition-all duration-200",
        "hover:border-primary/30 hover:shadow-sm",
        (onRowClick || expandable) && "cursor-pointer active:scale-[0.99]",
        expanded && "ring-1 ring-primary/20",
        cardClassName
      )}
      onClick={handleClick}
      role={onRowClick || expandable ? "button" : undefined}
      tabIndex={onRowClick || expandable ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (onRowClick || expandable)) {
          handleClick();
        }
      }}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {primaryColumn && (
            <div className="font-medium text-foreground">
              {primaryColumn.mobileRender
                ? primaryColumn.mobileRender(item, index)
                : primaryColumn.render(item, index)}
            </div>
          )}
          {secondaryColumn && (
            <div className="text-sm text-muted-foreground mt-0.5">
              {secondaryColumn.mobileRender
                ? secondaryColumn.mobileRender(item, index)
                : secondaryColumn.render(item, index)}
            </div>
          )}
        </div>
        {mobileActions && (
          <div onClick={(e) => e.stopPropagation()}>{mobileActions}</div>
        )}
        {expandable && (
          <div className="text-muted-foreground">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        )}
      </div>

      {/* Card Body - Key metrics */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {otherColumns.slice(0, 4).map((column) => (
          <div key={column.key} className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {column.mobileLabel || column.header}
            </span>
            <span className="text-sm font-medium">
              {column.mobileRender
                ? column.mobileRender(item, index)
                : column.render(item, index)}
            </span>
          </div>
        ))}
      </div>

      {/* Expanded Content */}
      {expandable && expanded && expandedContent && (
        <div className="mt-4 pt-4 border-t border-border animate-fade-in">
          {expandedContent}
        </div>
      )}
    </div>
  );
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  loadingRows = 5,
  emptyState,
  onRowClick,
  rowClassName,
  className,
  stickyHeader = false,
  mobileCardClassName,
  renderMobileCard,
  expandable = false,
  renderExpandedContent,
  mobileActions,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  // Filter columns based on breakpoint
  const visibleColumns = React.useMemo(() => {
    return columns.filter((col) => {
      if (isMobile && col.hideOnMobile) return false;
      return true;
    });
  }, [columns, isMobile]);

  // Mobile view - Card list
  if (isMobile) {
    if (loading) {
      return <CardSkeleton rows={loadingRows} />;
    }

    if (data.length === 0) {
      return (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          {emptyState || (
            <p className="text-muted-foreground">No data available</p>
          )}
        </div>
      );
    }

    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item, index) => {
          if (renderMobileCard) {
            return (
              <div key={keyExtractor(item, index)}>
                {renderMobileCard(item, index, columns)}
              </div>
            );
          }

          return (
            <MobileCard
              key={keyExtractor(item, index)}
              item={item}
              index={index}
              columns={columns}
              onRowClick={onRowClick}
              cardClassName={mobileCardClassName}
              expandable={expandable}
              expandedContent={
                renderExpandedContent
                  ? renderExpandedContent(item, index)
                  : undefined
              }
              mobileActions={mobileActions ? mobileActions(item) : undefined}
            />
          );
        })}
      </div>
    );
  }

  // Desktop view - Table
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card overflow-x-auto",
        className
      )}
    >
      <table className="data-table w-full">
        <thead className={cn(stickyHeader && "sticky top-0 z-10 bg-card")}>
          <tr className="bg-muted/30">
            {visibleColumns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                  column.hideOnTablet && "hidden lg:table-cell",
                  column.headerClassName
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton columns={visibleColumns.length} rows={loadingRows} />
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={visibleColumns.length}
                className="p-8 text-center text-muted-foreground"
              >
                {emptyState || "No data available"}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                className={cn(
                  "border-b border-border transition-colors hover:bg-muted/50",
                  onRowClick && "cursor-pointer",
                  rowClassName?.(item, index)
                )}
                onClick={() => onRowClick?.(item)}
                role={onRowClick ? "button" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && onRowClick) {
                    onRowClick(item);
                  }
                }}
              >
                {visibleColumns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3",
                      column.hideOnTablet && "hidden lg:table-cell",
                      column.className
                    )}
                  >
                    {column.render(item, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ResponsiveTable;
