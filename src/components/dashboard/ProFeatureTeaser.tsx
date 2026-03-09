import { Crown, Lock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProFeatureTeaserProps {
  title: string;
  description: string;
  requiredTier?: "pro" | "pro_plus";
  features?: string[];
  icon?: React.ReactNode;
}

export function ProFeatureTeaser({
  title,
  description,
  requiredTier = "pro",
  features = [],
  icon,
}: ProFeatureTeaserProps) {
  const navigate = useNavigate();
  const tierLabel = requiredTier === "pro_plus" ? "PRO+" : "PRO";

  return (
    <div className="relative rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          {icon || <Lock className="h-5 w-5 text-primary/70" />}
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <Badge className="bg-primary/20 text-primary text-[10px] ml-auto">
            <Crown className="h-3 w-3 mr-1" />
            {tierLabel}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        {features.length > 0 && (
          <ul className="space-y-1.5 mb-4">
            {features.map((f) => (
              <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary/60" />
                {f}
              </li>
            ))}
          </ul>
        )}
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => navigate("/billing")}
        >
          Unlock {tierLabel} <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
