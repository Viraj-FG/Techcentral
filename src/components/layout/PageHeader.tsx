import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  showHomeButton?: boolean;
  rightAction?: React.ReactNode;
}

export const PageHeader = ({ 
  title, 
  onBack, 
  showHomeButton = false,
  rightAction 
}: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-secondary/10">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-secondary/10 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-secondary" strokeWidth={1.5} />
          </Button>
          <h1 className="text-lg font-medium text-secondary truncate">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {showHomeButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/app')}
              className="hover:bg-secondary/10"
            >
              <Home className="w-5 h-5 text-secondary" strokeWidth={1.5} />
            </Button>
          )}
          {rightAction}
        </div>
      </div>
    </div>
  );
};
