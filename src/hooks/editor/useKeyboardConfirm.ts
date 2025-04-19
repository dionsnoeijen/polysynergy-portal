import { useEffect } from "react";

type UseKeyboardConfirmOptions = {
  enabled: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmKey?: string;
  cancelKey?: string;
};

export function useKeyboardConfirm({
  enabled,
  onConfirm,
  onCancel,
  confirmKey = "Enter",
  cancelKey = "Escape",
}: UseKeyboardConfirmOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === confirmKey && onConfirm) {
        onConfirm();
      }
      if (event.key === cancelKey && onCancel) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onConfirm, onCancel, confirmKey, cancelKey]);
}