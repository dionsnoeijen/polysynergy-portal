import React from 'react';
import DynamicRouteForm from "@/components/editor/forms/dynamic-route-form";
import ScheduleForm from "@/components/editor/forms/schedule-form";
import ServiceForm from "@/components/editor/forms/service-form";
import useEditorStore from "@/stores/editorStore";
import {FormType} from "@/types/types";
import DictVariableForm from "@/components/editor/forms/dict-variable-form";
import CodeEditorForm from "@/components/editor/forms/code-editor-form";
import BlueprintForm from "@/components/editor/forms/blueprint-form";

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
        </div>
    );
};

export default Form;
