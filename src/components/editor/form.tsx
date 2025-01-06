import React from 'react';
import DynamicRouteForm from "@/components/editor/forms/dynamic-route-form";
import ScheduleForm from "@/components/editor/forms/schedule-form";
import {useEditorStore} from "@/stores/editorStore";
import {FormType} from "@/types/types";
import ArrayVariableForm from "@/components/editor/forms/array-variable-form";

const Form: React.FC = () => {
    const { formType } = useEditorStore();

    return (
        <div>
            {(formType === FormType.AddRoute || formType === FormType.EditRoute)  && (
                <DynamicRouteForm />
            )}
            {(formType === FormType.AddSchedule || formType === FormType.EditSchedule) && (
                <ScheduleForm />
            )}
            {(formType === FormType.EditArray) && (
                <ArrayVariableForm />
            )}
        </div>
    );
};

export default Form;
