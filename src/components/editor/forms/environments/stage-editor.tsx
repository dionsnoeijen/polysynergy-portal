import React, {useState} from "react";
import {Button} from "@/components/button";
import {Table, TableHead, TableRow, TableHeader, TableBody, TableCell} from "@/components/table";
import {Input} from "@/components/input";
import {Checkbox, CheckboxField} from "@/components/checkbox";
import {ArrowUpIcon, ArrowDownIcon, PencilIcon, TrashIcon, StarIcon, PlusIcon} from "@heroicons/react/24/outline";
import {Stage} from "@/types/types";
import useStagesStore from "@/stores/stagesStore";
import {ConfirmAlert} from "@/components/confirm-alert";

const StageEditor: React.FC = () => {
    const stages = useStagesStore((s) => s.stages);
    const createStage = useStagesStore((s) => s.createStage);
    const updateStage = useStagesStore((s) => s.updateStage);
    const deleteStage = useStagesStore((s) => s.deleteStage);
    const reorderStages = useStagesStore((s) => s.reorderStages);

    const [editingStageId, setEditingStageId] = useState<string | null>(null);
    const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editName, setEditName] = useState("");
    const [editProduction, setEditProduction] = useState(false);

    const [newStageName, setNewStageName] = useState("");
    const [isProduction, setIsProduction] = useState(false);

    const handleAddStage = async () => {
        const cleaned = newStageName.toLowerCase().replace(/[^a-z0-9-]/g, "");
        if (!cleaned || cleaned === "mock") return;
        if (stages.find((s) => s.name === cleaned)) return;

        const stage = await createStage(cleaned, isProduction);
        if (stage) {
            setNewStageName("");
        }
        setIsProduction(false);
    };

    const confirmDeleteStage = (stage: Stage) => {
        setStageToDelete(stage);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (stageToDelete?.id && stageToDelete.id !== "mock") {
            await deleteStage(stageToDelete.id);
        }
        setShowDeleteConfirm(false);
        setStageToDelete(null);
    };

    const handleStartEdit = (stage: Stage) => {
        setEditingStageId(stage.id);
        setEditName(stage.name);
        setEditProduction(stage.is_production);
    };

    const handleSaveEdit = async () => {
        if (!editingStageId) return;
        const cleaned = editName.toLowerCase().replace(/[^a-z0-9-]/g, "");
        if (!cleaned || cleaned === "mock") return;
        if (stages.find((s) => s.name === cleaned && s.id !== editingStageId)) return;

        await updateStage(editingStageId, cleaned, editProduction);
        setEditingStageId(null);
    };

    const handleReorder = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= stages.length) return;
        reorderStages(fromIndex, toIndex);
    };

    const sortableStages = stages.filter((s) => s.name !== "mock");
    const sortedStages = [
        ...stages.filter((s) => s.name === "mock"),
        ...sortableStages,
    ];

    return (
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-1">
            <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]" dense bleed grid>
                <TableHead>
                    <TableRow>
                        <TableHeader className="w-10"/>
                        <TableHeader className="w-10">#</TableHeader>
                        <TableHeader>Name</TableHeader>
                        <TableHeader className="w-20 text-center">Prod</TableHeader>
                        <TableHeader className="w-28 text-right">Actions</TableHeader>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedStages.map((stage, index) => {
                        const isEditing = stage.id === editingStageId;
                        const isReorderable = stage.name !== "mock";
                        const adjustedIndex = index - 1;

                        return (
                            <TableRow key={stage.id}>
                                <TableCell>
                                    {isReorderable && (
                                        <div className="flex flex-col gap-1 items-center">
                                            {adjustedIndex > 0 && (
                                                <button
                                                    onClick={() => handleReorder(adjustedIndex, adjustedIndex - 1)}>
                                                    <ArrowUpIcon className="w-4 h-4"/>
                                                </button>
                                            )}
                                            {adjustedIndex < sortableStages.length - 1 && (
                                                <button
                                                    onClick={() => handleReorder(adjustedIndex, adjustedIndex + 1)}>
                                                    <ArrowDownIcon className="w-4 h-4"/>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="text-sky-500 dark:text-white font-mono">
                                    {isEditing ? (
                                        <Input
                                            autoFocus
                                            value={editName}
                                            onChange={(e) =>
                                                setEditName(e.target.value.replace(/[^a-z0-9-]/g, ""))
                                            }
                                        />
                                    ) : (
                                        stage.name
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    {isEditing ? (
                                        <Checkbox
                                            checked={editProduction}
                                            onChange={() => setEditProduction(!editProduction)}
                                        />
                                    ) : (
                                        stage.is_production && (
                                            <StarIcon className="w-4 h-4 text-yellow-400"/>
                                        )
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {stage.id !== "mock" && (
                                        <div className="flex justify-end gap-2">
                                            {isEditing ? (
                                                <Button color={'sky'} onClick={handleSaveEdit}>
                                                    Save
                                                </Button>
                                            ) : (
                                                <Button color={'sky'} onClick={() => handleStartEdit(stage)}>
                                                    <PencilIcon className="w-4 h-4"/>
                                                </Button>
                                            )}
                                            <Button color={'sky'} onClick={() => confirmDeleteStage(stage)}>
                                                <TrashIcon className="w-4 h-4"/>
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 items-start sm:items-end">
                <div className="flex-1">
                    <Input
                        placeholder="e.g. staging or client-x"
                        value={newStageName}
                        onChange={(e) =>
                            setNewStageName(e.target.value.replace(/[^a-z0-9-]/g, ""))
                        }
                    />
                </div>
                <div className="flex items-center gap-2">
                    <CheckboxField>
                        <Checkbox
                            checked={isProduction}
                            onChange={() => setIsProduction(!isProduction)}
                            name="production"
                        />
                        <span className="text-sm text-sky-500 dark:text-white">Production stage</span>
                    </CheckboxField>
                </div>
                <Button color="sky" type="button" onClick={handleAddStage}>
                    <PlusIcon className={'w-4 h-4'}/> Add
                </Button>
            </div>

            <ConfirmAlert
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Delete stage?"
                description={`Are you sure you want to delete stage “${stageToDelete?.name}”? This cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </section>
    );
};

export default StageEditor;