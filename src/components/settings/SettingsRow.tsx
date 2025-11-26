import { LucideIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  badge?: string;
  iconColor?: string;
}

export const SettingsRow = ({
  icon: Icon,
  title,
  description,
  onClick,
  badge,
  iconColor = "text-secondary",
}: SettingsRowProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-4 flex items-center gap-4 hover:bg-secondary/5 transition-colors text-left"
    >
      {/* Icon Container */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
        <Icon className={cn("w-5 h-5", iconColor)} strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-base font-medium text-secondary truncate">{title}</p>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-medium text-primary bg-primary/10 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" strokeWidth={1.5} />
    </button>
  );
};
