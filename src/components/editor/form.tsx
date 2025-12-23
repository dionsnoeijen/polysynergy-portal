import React from 'react';
import useEditorStore from "@/stores/editorStore";
import {FormType} from "@/types/types";
import {useSmartWebSocketListener} from "@/hooks/editor/nodes/useSmartWebSocketListener";
import DynamicRouteForm from "@/components/editor/forms/dynamic-route-form";
import ScheduleForm from "@/components/editor/forms/schedule-form";
import ChatWindowForm from "@/components/editor/forms/chat-window-form";
import ServiceForm from "@/components/editor/forms/service-form";
import DictVariableForm from "@/components/editor/forms/dict-variable-form";
import CodeEditorForm from "@/components/editor/forms/code-editor-form";
import BlueprintForm from "@/components/editor/forms/blueprint-form";
import NodeEditorForm from "@/components/editor/forms/node-editor-form";
import JsonEditorForm from "@/components/editor/forms/json-editor-form";
import ProjectSecretsForm from "@/components/editor/forms/project-secrets-form";
import ProjectPublishForm from "@/components/editor/forms/project-publish-form";
import FileEditorForm from "@/components/editor/forms/file-editor-form";
import ListVariableForm from "@/components/editor/forms/list-variable-form";
import PublishedVariableForm from "@/components/editor/forms/published-variable-form";
import TemplateEditorForm from "@/components/editor/forms/template-editor-form";
import ProjectEnvVarsForm from "@/components/editor/forms/project-env-vars-form";
import PublishedVariableSettingsForm from "@/components/editor/forms/published-variable-settings-form";
import ExportSharingForm from "@/components/editor/forms/export-sharing-form";
import ImportPackageForm from "@/components/editor/forms/import-package-form";
import PlayButtonsForm from "@/components/editor/forms/play-buttons-form";
import SectionForm from "@/components/editor/forms/section-form";
import SectionFieldForm from "@/components/editor/forms/section-field-form";
import LayoutEditorForm from "@/components/editor/forms/layout-editor-form";
import TableEditorForm from "@/components/editor/forms/table-editor-form";
import SPAEditorForm from "@/components/editor/forms/spa-editor-form";

const Form: React.FC = () => {
    const formType = useEditorStore((state) => state.formType);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);

    // Initialize WebSocket at form level to persist across form navigation
    const { connectionStatus, isConnected } = useSmartWebSocketListener(activeVersionId as string);

    // Log WebSocket status for debugging
    React.useEffect(() => {
        console.log('🔍 [Form] WebSocket status:', { isConnected, connectionStatus, activeVersionId });
    }, [isConnected, connectionStatus, activeVersionId]);

    return (
        <div>
            {(
                formType === FormType.AddRoute ||
                formType === FormType.EditRoute
            ) && (
                <DynamicRouteForm />
            )}
            {(
                formType === FormType.AddSchedule ||
                formType === FormType.EditSchedule
            ) && (
                <ScheduleForm />
            )}
            {(
                formType === FormType.AddChatWindow ||
                formType === FormType.EditChatWindow
            ) && (
                <ChatWindowForm />
            )}
            {(formType === FormType.EditDict) && (
                <DictVariableForm />
            )}
            {(formType === FormType.EditList) && (
                <ListVariableForm />
            )}
            {(formType === FormType.EditCode) && (
                <CodeEditorForm />
            )}
            {(
                formType === FormType.AddService ||
                formType === FormType.EditService
            ) && (
                <ServiceForm />
            )}
            {(
                formType === FormType.AddBlueprint ||
                formType === FormType.EditBlueprint
            ) && (
                <BlueprintForm />
            )}
            {(
                formType === FormType.AddNode ||
                formType === FormType.EditNode
            ) && (
                <NodeEditorForm />
            )}
            {(formType === FormType.EditJson) && (
                <JsonEditorForm />
            )}
            {(formType === FormType.EditFiles) && (
                <FileEditorForm />
            )}
            {(
                formType === FormType.AddProjectSecret ||
                formType === FormType.EditProjectSecret
            ) && (
                <ProjectSecretsForm />
            )}
            {(
                formType === FormType.AddProjectEnvVar ||
                formType === FormType.EditProjectEnvVar
            ) && (
                <ProjectEnvVarsForm />
            )}
            {(
                formType === FormType.ProjectPublish
            ) && (
                <ProjectPublishForm />
            )}
            {(
                formType === FormType.PublishedVariableForm
            ) && (
                <PublishedVariableForm />
            )}
            {(
                formType === FormType.EditTemplate
            ) && (
                <TemplateEditorForm />
            )}
            {(
                formType === FormType.PublishedVariableSettings
            ) && (
                <PublishedVariableSettingsForm />
            )}
            {(
                formType === FormType.ExportSharing
            ) && (
                <ExportSharingForm />
            )}
            {(
                formType === FormType.ImportPackage
            ) && (
                <ImportPackageForm />
            )}
            {(
                formType === FormType.PlayButtonsForm
            ) && (
                <PlayButtonsForm />
            )}
            {(
                formType === FormType.AddSection ||
                formType === FormType.EditSection
            ) && (
                <SectionForm />
            )}
            {(
                formType === FormType.AddSectionField ||
                formType === FormType.EditSectionField
            ) && (
                <SectionFieldForm />
            )}
            {(formType === FormType.EditLayout) && (
                <LayoutEditorForm />
            )}
            {(formType === FormType.EditTable) && (
                <TableEditorForm />
            )}
            {(formType === FormType.EditSPA) && (
                <SPAEditorForm />
            )}
        </div>
    );
};

export default Form;
