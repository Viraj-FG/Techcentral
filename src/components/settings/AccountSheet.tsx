import { X, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AccountSheetProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
}

export const AccountSheet = ({
  open,
  onClose,
  userEmail,
}: AccountSheetProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully",
      });
      navigate('/auth');
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-secondary/10 pb-4">
          <SheetTitle className="text-xl font-semibold text-secondary">Account & Security</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <Label className="text-foreground">Email Address</Label>
            <div className="mt-2 glass-card p-4 rounded-xl">
              <p className="text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          <div className="pt-4 space-y-3 border-t border-secondary/10">
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Account deletion will be available in a future update",
                });
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
