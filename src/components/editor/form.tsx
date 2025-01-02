import React from 'react';
import DynamicRouteForm from "@/components/editor/forms/dynamic-route-form";
import ScheduleForm from "@/components/editor/forms/schedule-form";
import {useEditorStore} from "@/stores/editorStore";
import {FormType} from "@/types/types";

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
        </div>
    );
};

export default Form;
