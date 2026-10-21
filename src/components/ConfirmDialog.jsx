import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Confirmation for destructive actions. Stays open until answered (unlike a
 * toast), traps focus, closes on Escape, and starts focus on Cancel so Enter
 * never deletes by accident.
 *
 * onConfirm may be async. The dialog stays open with both buttons disabled
 * until it settles, then closes. Handle errors (e.g. toast.error) inside it.
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}) {
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async (e) => {
    // Radix closes the dialog on Action click; hold it open while we work.
    e.preventDefault();
    setIsPending(true);
    try {
      await onConfirm();
    } finally {
      setIsPending(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <AlertDialogContent className="max-w-md rounded-2xl">
        <AlertDialogHeader className="items-center gap-3 text-center sm:items-start sm:text-left">
          <div className="flex size-11 items-center justify-center rounded-full bg-red-50 text-destructive">
            <Trash2 className="size-5" />
          </div>
          <AlertDialogTitle className="break-words">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
