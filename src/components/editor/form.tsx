import React from 'react';
import DynamicRouteForm from "@/components/editor/forms/dynamic-route-form";
import ScheduleForm from "@/components/editor/forms/schedule-form";
import useEditorStore from "@/stores/editorStore";
import {FormType} from "@/types/types";
import DictVariableForm from "@/components/editor/forms/dict-variable-form";

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
            {(formType === FormType.EditDict) && (
                <DictVariableForm />
            )}
        </div>
    );
};

export default Form;
