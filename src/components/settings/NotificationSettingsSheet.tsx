import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface NotificationSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

interface NotificationPreferences {
  spoilage_alerts: boolean;
  low_stock_alerts: boolean;
  recipe_suggestions: boolean;
  household_activity: boolean;
  delivery_only: boolean;
}

export const NotificationSettingsSheet = ({
  open,
  onClose,
  userId,
}: NotificationSettingsSheetProps) => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    spoilage_alerts: true,
    low_stock_alerts: true,
    recipe_suggestions: true,
    household_activity: true,
    delivery_only: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      loadPreferences();
    }
  }, [open, userId]);

  const loadPreferences = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', userId)
      .single();

    if (!error && data?.notification_preferences) {
      setPreferences(data.notification_preferences as unknown as NotificationPreferences);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };

    setPreferences(newPreferences);
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: newPreferences })
      .eq('id', userId);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
      // Revert on error
      setPreferences(preferences);
    } else {
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border/10 pb-4">
          <SheetTitle className="text-xl font-semibold text-foreground">
            Notifications
          </SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between glass-card p-4">
              <div className="space-y-1">
                <Label className="text-foreground font-medium">Spoilage Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when items are about to expire
                </p>
              </div>
              <Switch
                checked={preferences.spoilage_alerts}
                onCheckedChange={() => handleToggle('spoilage_alerts')}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between glass-card p-4">
              <div className="space-y-1">
                <Label className="text-foreground font-medium">Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when inventory is running low
                </p>
              </div>
              <Switch
                checked={preferences.low_stock_alerts}
                onCheckedChange={() => handleToggle('low_stock_alerts')}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between glass-card p-4">
              <div className="space-y-1">
                <Label className="text-foreground font-medium">Recipe Suggestions</Label>
                <p className="text-sm text-muted-foreground">
                  Get suggestions for meals based on your inventory
                </p>
              </div>
              <Switch
                checked={preferences.recipe_suggestions}
                onCheckedChange={() => handleToggle('recipe_suggestions')}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between glass-card p-4">
              <div className="space-y-1">
                <Label className="text-foreground font-medium">Household Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when household members make changes
                </p>
              </div>
              <Switch
                checked={preferences.household_activity}
                onCheckedChange={() => handleToggle('household_activity')}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between glass-card p-4">
              <div className="space-y-1">
                <Label className="text-foreground font-medium">In-App Only</Label>
                <p className="text-sm text-muted-foreground">
                  Disable push notifications, show alerts only in-app
                </p>
              </div>
              <Switch
                checked={preferences.delivery_only}
                onCheckedChange={() => handleToggle('delivery_only')}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
