import { Twitter, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shareToTwitter, generateShareText, exportToCSV } from "@/lib/export";

interface ShareButtonProps {
  type: "protocol" | "token" | "donation" | "dashboard";
  data: Record<string, any>;
  url?: string;
}

export function ShareButton({ type, data, url }: ShareButtonProps) {
  const handleShare = () => {
    const text = generateShareText(type, data);
    shareToTwitter(text, url || window.location.href);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
      <Twitter className="h-4 w-4" />
      Share
    </Button>
  );
}

interface ExportShareButtonProps {
  type: string;
  data: Record<string, any>;
  exportData?: Record<string, any>[];
  exportFilename?: string;
  url?: string;
}

export function ExportShareButton({ 
  type, 
  data, 
  exportData, 
  exportFilename,
  url 
}: ExportShareButtonProps) {
  const handleShare = () => {
    const text = generateShareText(type, data);
    shareToTwitter(text, url || window.location.href);
  };

  const handleExport = () => {
    if (exportData && exportFilename) {
      exportToCSV(exportData, exportFilename);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleShare} className="gap-2">
          <Twitter className="h-4 w-4" />
          Share on Twitter
        </DropdownMenuItem>
        {exportData && exportFilename && (
          <DropdownMenuItem onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
