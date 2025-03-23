/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {Dock} from "@/types/types";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {Subheading} from "@/components/heading";
import {Button} from "@/components/button";
import {PlusIcon, TrashIcon} from "@heroicons/react/24/outline";
import {Input} from "@/components/input";

type Props = {
    title: string;
    items: any[];
    onChange: (updatedVariables: any[], handle?: string) => void;
    handle?: string;
    dock?: Dock;
};

const EditListVariable: React.FC<Props> = ({
    title,
    items,
    onChange,
    handle
}) => {

    const handleEditItem = (index: number, value: any) => {
        const updatedItems = items.map((f, i) =>
            i === index ? value : f
        );
        onChange(updatedItems, handle);
    }

    const addItem = () => {
        onChange([...items, ""], handle);
    };

    const removeItem = (index: number) => {
        onChange(items.filter((_, i) => i !== index), handle);
    };

    return (
        <section className={"grid gap-x-8 gap-y-6 sm:grid-cols-1"}>
            <div className="space-y-1">
                <Subheading>{title}</Subheading>
            </div>
            <div>
                <Table dense bleed grid>
                    <TableHead>
                        <TableRow>
                            <TableHeader>Item</TableHeader>
                            <TableHeader>Actions</TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item: any, index: number) => (
                        <TableRow key={`row-${index}`}>
                            <TableCell>
                                <Input value={item as string} onChange={(e) => handleEditItem(index, e.target.value)} />
                            </TableCell>
                            <TableCell>
                                <Button plain onClick={() => removeItem(index)}>
                                    <TrashIcon className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                        <TableRow key="new-file">
                            <TableCell colSpan={6} className="text-center">
                                <Button plain onClick={addItem}>
                                    <PlusIcon className="w-4 h-4" /> Add Row
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </section>
    )
}

export default EditListVariable;