import React, {useEffect} from "react";
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from "@/components/dialog";
import { Button } from "@/components/button";

type DeleteDialogProps = {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    itemCount: number;
};

const DeleteDialog: React.FC<DeleteDialogProps> = ({ isOpen, onConfirm, onCancel, itemCount }) => {

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

    return (
        <Dialog size="md" className="rounded-sm" open={isOpen} onClose={onCancel}>
            <DialogTitle>
                Confirm Delete Node{itemCount > 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription>
                Are you sure you want to delete the selected node{itemCount > 1 ? "s" : ""}?
            </DialogDescription>
            <DialogBody>
                {/* Add any extra content here if needed */}
            </DialogBody>
            <DialogActions>
                <Button outline onClick={onCancel}>
                    Cancel
                </Button>
                <Button color="red" onClick={onConfirm}>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteDialog;
