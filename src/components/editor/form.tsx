import React from 'react';
import useEditorStore from "@/stores/editorStore";
import {FormType} from "@/types/types";
import DynamicRouteForm from "@/components/editor/forms/dynamic-route-form";
import ScheduleForm from "@/components/editor/forms/schedule-form";
import ServiceForm from "@/components/editor/forms/service-form";
import DictVariableForm from "@/components/editor/forms/dict-variable-form";
import CodeEditorForm from "@/components/editor/forms/code-editor-form";
import BlueprintForm from "@/components/editor/forms/blueprint-form";
import NodeEditorForm from "@/components/editor/forms/node-editor-form";
import JsonEditorForm from "@/components/editor/forms/json-editor-form";
import PlaceServiceForm from "@/components/editor/forms/place-service-form";
import PlaceBlueprintForm from "@/components/editor/forms/place-blueprint-form";
import ProjectVariablesForm from "@/components/editor/forms/project-variables-form";
import ProjectSecretsForm from "@/components/editor/forms/project-secrets-form";
import ProjectPublishForm from "@/components/editor/forms/project-publish-form";
import ConfigForm from "@/components/editor/forms/config-form";
import FileEditorForm from "@/components/editor/forms/file-editor-form";

const Form: React.FC = () => {
    const { formType } = useEditorStore();

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
            {(formType === FormType.EditDict) && (
                <DictVariableForm />
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
                formType === FormType.AddConfig ||
                formType === FormType.EditConfig
            ) && (
                <ConfigForm />
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
            {(formType === FormType.PlaceService) && (
                <PlaceServiceForm />
            )}
            {(formType === FormType.PlaceBlueprint) && (
                <PlaceBlueprintForm />
            )}
            {(
                formType === FormType.AddProjectVariable ||
                formType === FormType.EditProjectVariable
            ) && (
                <ProjectVariablesForm />
            )}
            {(
                formType === FormType.AddProjectSecret ||
                formType === FormType.EditProjectSecret
            ) && (
                <ProjectSecretsForm />
            )}
            {(
                formType === FormType.ProjectPublish
            ) && (
                <ProjectPublishForm />
            )}
        </div>
    );
};

export default Form;
