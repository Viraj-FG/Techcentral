import { Camera, MessageCircle, ChefHat } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PostCookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeName: string;
  onTakePhoto: () => void;
  onAskQuestion: () => void;
  relatedRecipes?: { id: string; name: string }[];
}

export const PostCookingSheet = ({
  open,
  onOpenChange,
  recipeName,
  onTakePhoto,
  onAskQuestion,
  relatedRecipes = []
}: PostCookingSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            Great job cooking {recipeName}!
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Photo Prompt */}
          <Card className="p-6 bg-card/50">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">How did it turn out?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Share a photo of your creation
                </p>
                <Button onClick={onTakePhoto} className="gap-2">
                  <Camera className="w-4 h-4" />
                  Take Photo
                </Button>
              </div>
            </div>
          </Card>

          {/* Ask AI */}
          <Card className="p-4 bg-card/50">
            <button
              onClick={onAskQuestion}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">Ask Kaeva anything</p>
                <p className="text-xs text-muted-foreground">
                  Get tips, substitutions, or cooking advice
                </p>
              </div>
            </button>
          </Card>

          {/* Related Recipes */}
          {relatedRecipes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                Similar Recipes
              </h4>
              <div className="space-y-2">
                {relatedRecipes.slice(0, 3).map(recipe => (
                  <Card 
                    key={recipe.id}
                    className="p-3 bg-card/50 hover:bg-card/70 cursor-pointer transition-colors"
                  >
                    <p className="text-sm font-medium">{recipe.name}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};