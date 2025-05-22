import React, { useState } from "react";
import { Heading } from "@/components/heading";
import { Button } from "@/components/button";
import { Divider } from "@/components/divider";
import { XMarkIcon } from "@heroicons/react/24/outline";
import StageEditor from "@/components/editor/forms/environments/stage-editor";
import PublishMatrix from "@/components/editor/forms/environments/publish-matrix";
import useEditorStore from "@/stores/editorStore";

const ProjectPublishForm: React.FC = (): React.ReactElement => {
    const [activeTab, setActiveTab] = useState<'environments' | 'publish'>('environments');
    const closeForm = useEditorStore((state) => state.closeForm);

    return (
        <section className="p-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>Project Settings</Heading>
                <Button type="button" onClick={() => { closeForm() }} plain>
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>
            <Divider className="my-4" soft bleed />

            <div className="mb-4 flex gap-2 border-b border-white/10">
                <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium transition ${
                        activeTab === 'environments'
                            ? 'border-b-2 border-white text-white'
                            : 'text-white/60 hover:text-white'
                    }`}
                    onClick={() => setActiveTab('environments')}
                >
                    Environments
                </button>
                <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium transition ${
                        activeTab === 'publish'
                            ? 'border-b-2 border-white text-white'
                            : 'text-white/60 hover:text-white'
                    }`}
                    onClick={() => setActiveTab('publish')}
                >
                    Publish
                </button>
            </div>

            {activeTab === 'environments' && <StageEditor />}

            {activeTab === 'publish' && <PublishMatrix />}
        </section>
    );
};

export default ProjectPublishForm;
