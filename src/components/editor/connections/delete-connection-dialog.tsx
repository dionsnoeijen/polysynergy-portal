import React, { useEffect } from "react";
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from "@/components/dialog";
import { Button } from "@/components/button";
import { connectionHistoryActions } from "@/stores/history";

type DeleteConnectionDialogProps = {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    connectionId: string | null;
};

const DeleteConnectionDialog: React.FC<DeleteConnectionDialogProps> = ({ 
    isOpen, 
    onConfirm, 
    onCancel, 
    connectionId 
}) => {

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                onConfirm();
            }
            if (event.key === "Escape") {
                onCancel();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onConfirm, onCancel]);

    const handleConfirm = () => {
        if (connectionId) {
            connectionHistoryActions.removeConnectionWithHistory(connectionId);
        }
        onConfirm();
    };

    return (
        <Dialog size="md" className="rounded-sm" open={isOpen} onClose={onCancel}>
            <DialogTitle>Confirm Delete Connection</DialogTitle>
            <DialogDescription>
                Are you sure you want to delete this connection?
            </DialogDescription>
            <DialogBody></DialogBody>
            <DialogActions>
                <Button outline onClick={onCancel}>Cancel</Button>
                <Button color="red" onClick={handleConfirm}>Delete</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteConnectionDialog;