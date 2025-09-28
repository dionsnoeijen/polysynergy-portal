import React, { useState } from 'react';
import { Input } from '@/components/input';
import { Field, Fieldset, Label } from '@/components/fieldset';
import { NodeVariable } from '@/types/types';

interface GroupNameOverrideInputProps {
    nodeId: string;
    variable: NodeVariable;
    handle: string;
    type: 'in' | 'out';
    value: string;
}

const GroupNameOverrideInput: React.FC<GroupNameOverrideInputProps> = ({
    // nodeId,
    // variable,
    // handle,
    // type,
    // value
}) => {
    const [testValue, setTestValue] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('🔍 BASIC TEST - Can we type?', e.target.value);
        setTestValue(e.target.value);
    };

    return (
        <Fieldset>
            <Label>TEST INPUT - Type here:</Label>
            <Field>
                <Input
                    value={testValue}
                    placeholder="Test typing here"
                    onChange={handleChange}
                />
            </Field>
        </Fieldset>
    );
};

export default GroupNameOverrideInput;