import React from 'react';
import DynamicRouteForm from "@/components/editor/forms/dynamic-route-form";
import ScheduleForm from "@/components/editor/forms/schedule-form";
import ServiceForm from "@/components/editor/forms/service-form";
import useEditorStore from "@/stores/editorStore";
import {FormType} from "@/types/types";
import DictVariableForm from "@/components/editor/forms/dict-variable-form";
import CodeEditorForm from "@/components/editor/forms/code-editor-form";
import BlueprintForm from "@/components/editor/forms/blueprint-form";
import NodeEditorForm from "@/components/editor/forms/node-editor-form";
import JsonEditorForm from "@/components/editor/forms/json-editor-form";
import PlaceServiceForm from "@/components/editor/forms/place-service-form";

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
                formType === FormType.AddNode ||
                formType === FormType.EditNode
            ) && (
                <NodeEditorForm />
            )}
            {(formType === FormType.EditJson) && (
                <JsonEditorForm />
            )}
            {(formType === FormType.PlaceService) && (
                <PlaceServiceForm />
            )}
        </div>
    );
};

export default Form;
