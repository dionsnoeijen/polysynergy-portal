import {useKeyboardConfirm} from "@/hooks/editor/useKeyboardConfirm";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import {Button, ButtonColor} from "@/components/button";

type ConfirmAlertProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: ButtonColor;
};

export function ConfirmAlert({
                                 open,
                                 onClose,
                                 onConfirm,
                                 title,
                                 description,
                                 confirmText = "Confirm",
                                 cancelText = "Cancel",
                                 confirmColor = "red",
                             }: ConfirmAlertProps) {
    useKeyboardConfirm({
        enabled: open,
        onConfirm,
        onCancel: onClose,
    });

    return (
        <Alert size="md" className="text-center" open={open} onClose={onClose}>
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{description}</AlertDescription>
            <AlertActions>
                <Button onClick={onClose} plain>{cancelText}</Button>
                <Button color={confirmColor} onClick={onConfirm}>{confirmText}</Button>
            </AlertActions>
        </Alert>
    );
}