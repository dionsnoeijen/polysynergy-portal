import React, {useState, useEffect} from "react";
import {ArrowRightCircleIcon, ChevronRightIcon, InformationCircleIcon} from "@heroicons/react/24/outline";
import {Button} from "@/components/button";
import {Dialog, DialogActions, DialogTitle, DialogBody} from "@/components/dialog";
import {Node, NodeService} from "@/types/types";
import {ConfirmAlert} from "@/components/confirm-alert";
import NodeIcon from "@/components/editor/nodes/node-icon";
import useNodesStore from "@/stores/nodesStore";

type Props = {
    nodeName: string;
    node: Node;
    preview?: boolean;
    icon?: string;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
    categoryBorderColor?: string;
};

const ServiceHeading: React.FC<Props> = ({
    nodeName = "Node Name",
    node,
    preview = false,
    icon,
    categoryMainTextColor = 'text-sky-600 dark:text-white',
    categorySubTextColor = 'text-sky-600 dark:text-white',
    categoryBorderColor = 'border-sky-600 dark:border-white',
}) => {
    const detachService = useNodesStore((state) => state.detachService);

    const [showDetachAlert, setShowDetachAlert] = useState(false);
    const [showInfoDialog, setShowInfoDialog] = useState(false);

    const service: NodeService | undefined = node.service;

    useEffect(() => {
        if (!showInfoDialog) return;
        const handleKeyDown =
            (event: KeyboardEvent) => {
                if (event.key === "Escape") {
                    setShowInfoDialog(false);
                }
            };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showInfoDialog]);

    const handleDetach = () => {
        detachService(node.id);
        setShowDetachAlert(false);
    };

    return (
        <div className={`flex items-center justify-between w-full pl-4 pr-4 pt-1 pb-1 mb-1 relative border-b ${categoryBorderColor}`}>

            <div className="flex items-center truncate">
                <h3 className={`font-semibold truncate ${categoryMainTextColor}`}>{nodeName}</h3>
            </div>

            <div className="flex items-center space-x-0">
                <button
                    className="p-0"
                    disabled={preview}
                    style={{padding: "2px"}}
                    onClick={() => setShowDetachAlert(true)}
                >
                    <ArrowRightCircleIcon
                        className={`m-0 w-5 h-5 ${categorySubTextColor}`}
                        style={{
                            marginTop: "2px",
                            marginLeft: "0px",
                            marginBottom: "2px",
                            marginRight: "0px",
                        }}
                    />
                </button>
                <button
                    className="p-0"
                    disabled={preview}
                    style={{padding: "2px"}}
                    onClick={() => setShowInfoDialog(true)}
                >
                    <InformationCircleIcon
                        className={`m-0 w-5 h-5 ${categorySubTextColor}`}
                        style={{
                            marginTop: "2px",
                            marginLeft: "0px",
                            marginBottom: "2px",
                            marginRight: "0px",
                        }}
                    />
                </button>
            </div>

            {showDetachAlert && (
                <ConfirmAlert
                    open={showDetachAlert}
                    onClose={() => setShowDetachAlert(false)}
                    onConfirm={handleDetach}
                    title={`Are you sure you want to detach this service?`}
                    description={`This action will make this service node into a normal, fully editable node, losing the relationship to the original service.`}
                />
            )}

            {showInfoDialog && (
                <Dialog
                    size="md"
                    className="text-center"
                    open={showInfoDialog}
                    onClose={() => setShowInfoDialog(false)}
                >
                    <DialogTitle className={'text-left flex items-center'}>
                        {icon && (
                            <NodeIcon
                                icon={icon}
                                className={`inline border w-10 h-10 ${categoryMainTextColor} dark:bg-white border-sky-500 dark:border-white/50 mr-3`}
                                preserveColor={true}
                            />
                        )}
                        Service <ChevronRightIcon className={'w-4 h-4 inline'}/> {service?.category} <ChevronRightIcon
                        className={'w-4 h-4 inline'}/> {service?.name}</DialogTitle>
                    <DialogBody className={'text-left'} dangerouslySetInnerHTML={{__html: service?.description ?? ''}}/>
                    <DialogActions>
                        <Button color="sky" onClick={() => setShowInfoDialog(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            )}
        </div>
    );
};

export default ServiceHeading;