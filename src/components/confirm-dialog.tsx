import {useKeyboardConfirm} from "@/hooks/editor/useKeyboardConfirm";
import {Button} from "@/components/button";
import {Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle} from "@/components/dialog";

type ConfirmDialogProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    confirmText?: string;
};

export function ConfirmDialog({
    open,
    onClose,
    title,
    description,
    confirmText = "Confirm",
}: ConfirmDialogProps) {
    useKeyboardConfirm({
        enabled: open,
        onConfirm: onClose,
        onCancel: onClose,
    });
    return (
        <Dialog size="md" className="rounded-sm" open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
            <DialogBody></DialogBody>
            <DialogActions>
                <Button outline onClick={onClose}>{confirmText}</Button>
            </DialogActions>
        </Dialog>
    );
}

