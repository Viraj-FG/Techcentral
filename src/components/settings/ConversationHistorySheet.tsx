import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ConversationHistory from "@/components/ConversationHistory";

interface ConversationHistorySheetProps {
  open: boolean;
  onClose: () => void;
}

export const ConversationHistorySheet = ({
  open,
  onClose,
}: ConversationHistorySheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-secondary/10 pb-4">
          <SheetTitle className="text-xl font-semibold text-secondary">Conversation History</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        <div className="mt-6 overflow-y-auto h-[calc(80vh-100px)]">
          <ConversationHistory />
        </div>
      </SheetContent>
    </Sheet>
  );
};
