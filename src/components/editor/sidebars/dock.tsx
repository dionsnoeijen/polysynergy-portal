import React, { ReactElement } from "react";
import clsx from 'clsx'
import Heading from "@/components/editor/sidebars/elements/heading";

export default function Dock({
    className,
    toggleClose,
    ...props
}: React.ComponentPropsWithoutRef<'div'> & { toggleClose: () => void }): ReactElement {
    return (
        <div {...props} className={clsx(className, 'absolute left-0 top-0 right-0 bottom-0')}>
            <Heading arrowToLeft={true} toggleClose={toggleClose}>Dock: select node</Heading>
        </div>
    )
}
