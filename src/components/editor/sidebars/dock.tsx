import React, { ReactElement } from "react";
import clsx from 'clsx'
import Heading from "@/components/editor/sidebars/elements/heading";
import useNodesStore from "@/stores/nodesStore";
import { useEditorStore } from "@/stores/editorStore";

export default function Dock({
    className,
    toggleClose,
    ...props
}: React.ComponentPropsWithoutRef<'div'> & { toggleClose: () => void }): ReactElement {

    const { selectedNodes } = useEditorStore();
    const getNode = useNodesStore((state) => state.getNode);

    if (selectedNodes.length === 1) {
        const node = getNode(selectedNodes[0]);
        return (
            <div {...props} className={clsx(className, 'absolute left-0 top-0 right-0 bottom-0')}>
                <Heading arrowToLeft={true} toggleClose={toggleClose}>Dock: {node?.name}</Heading>
            </div>
        )
    }

    return (
        <div {...props} className={clsx(className, 'absolute left-0 top-0 right-0 bottom-0')}>
            <Heading arrowToLeft={true} toggleClose={toggleClose}>Dock: select node</Heading>
        </div>
    )
}
