import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Package, Plus, RefreshCw } from "lucide-react";

interface DuplicateItemModalProps {
  open: boolean;
  onClose: () => void;
  itemName: string;
  existingQuantity: number;
  newQuantity: number;
  onMerge: () => void;
  onReplace: () => void;
  onAddNew: () => void;
}

export const DuplicateItemModal = ({
  open,
  onClose,
  itemName,
  existingQuantity,
  newQuantity,
  onMerge,
  onReplace,
  onAddNew,
}: DuplicateItemModalProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-background border border-border/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Item Already Exists
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground pt-2">
            <span className="font-medium text-foreground">{itemName}</span> is already in your inventory with{" "}
            <span className="font-medium text-foreground">{existingQuantity}</span> units.
            How would you like to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 pt-4">
          <Button
            onClick={onMerge}
            className="w-full justify-start"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            <div className="flex-1 text-left">
              <div className="font-medium">Add to Existing</div>
              <div className="text-xs text-muted-foreground">
                New total: {existingQuantity + newQuantity} units
              </div>
            </div>
          </Button>

          <Button
            onClick={onReplace}
            className="w-full justify-start"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            <div className="flex-1 text-left">
              <div className="font-medium">Replace Quantity</div>
              <div className="text-xs text-muted-foreground">
                Set to {newQuantity} units
              </div>
            </div>
          </Button>

          <Button
            onClick={onAddNew}
            className="w-full justify-start"
            variant="outline"
          >
            <Package className="w-4 h-4 mr-2" />
            <div className="flex-1 text-left">
              <div className="font-medium">Add as Separate Item</div>
              <div className="text-xs text-muted-foreground">
                Keep both entries in inventory
              </div>
            </div>
          </Button>

          <Button
            onClick={onClose}
            className="w-full"
            variant="ghost"
          >
            Cancel
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
