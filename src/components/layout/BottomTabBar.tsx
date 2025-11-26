import { Home, Package, BookOpen, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PageIndicator } from "./PageIndicator";

const tabs = [
  { id: 'home', label: 'Home', icon: Home, path: '/app' },
  { id: 'inventory', label: 'Inventory', icon: Package, path: '/inventory' },
  { id: 'recipes', label: 'Recipes', icon: BookOpen, path: '/recipes' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-secondary/10 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-3xl mx-auto px-4">
        {/* Page Indicator */}
        <PageIndicator className="pt-3 pb-2" />
        
        <div className="grid grid-cols-4 gap-2 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px]",
                  "hover:bg-secondary/5 rounded-lg",
                  isActive && "text-primary",
                  !isActive && "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
