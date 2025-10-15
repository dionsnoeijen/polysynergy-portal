import React, { useEffect } from "react";
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from "@/components/dialog";
import { Button } from "@/components/button";
import useNodesStore from "@/stores/nodesStore";

type DeleteDialogProps = {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    selectedNodes: string[];
};

const DeleteDialog: React.FC<DeleteDialogProps> = ({ isOpen, onConfirm, onCancel, selectedNodes }) => {
    const isNodeInService = useNodesStore((state) => state.isNodeInService(selectedNodes));
    const isNodeDeletable = useNodesStore((state) => state.isNodeDeletable(selectedNodes));

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

    if (isNodeInService) {
        return (
            <Dialog size="md" className="rounded-sm" open={isOpen} onClose={onCancel}>
                <DialogTitle>Cannot Delete Node</DialogTitle>
                <DialogDescription>The selected node is part of a service and cannot be deleted.</DialogDescription>
                <DialogBody></DialogBody>
                <DialogActions>
                    <Button outline onClick={onCancel}>Close</Button>
                </DialogActions>
            </Dialog>
        );
    }

    if (!isNodeDeletable) {
        return (
            <Dialog size="md" className="rounded-sm" open={isOpen} onClose={onCancel}>
                <DialogTitle>Node(s) Cannot Be Deleted</DialogTitle>
                <DialogDescription>One or more of the selected nodes cannot be deleted.</DialogDescription>
                <DialogBody></DialogBody>
                <DialogActions>
                    <Button outline onClick={onCancel}>Close</Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Dialog size="md" className="rounded-sm" open={isOpen} onClose={onCancel}>
            <DialogTitle>Confirm Delete Node{selectedNodes.length > 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
                Are you sure you want to delete the selected node{selectedNodes.length > 1 ? "s" : ""}?
            </DialogDescription>
            <DialogBody></DialogBody>
            <DialogActions>
                <Button outline onClick={onCancel}>Cancel</Button>
                <Button color="red" onClick={onConfirm}>Delete</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteDialog;