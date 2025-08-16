import React, { useState, useEffect, useRef } from 'react';
import { 
    PlusIcon, 
    MinusIcon, 
    ChevronDownIcon, 
    ChevronRightIcon,
    CubeIcon,
    ListBulletIcon
} from '@heroicons/react/24/outline';
import { Checkbox } from '@/components/checkbox';

interface VisualJsonEditorProps {
    value: any;
    onChange: (value: any) => void;
}

interface FocusCallbacks {
    onPropertyAdded?: (path: string[], key: string) => void;
}

type JsonValueType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

const VisualJsonEditor: React.FC<VisualJsonEditorProps> = ({ value, onChange }) => {
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['']));
    const [focusPath, setFocusPath] = useState<string | null>(null);
    const [activeAddPropertyPath, setActiveAddPropertyPath] = useState<string | null>(null);
    const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    // Focus management
    useEffect(() => {
        if (focusPath) {
            const input = inputRefs.current.get(focusPath);
            if (input) {
                setTimeout(() => {
                    input.focus();
                    input.select?.();
                }, 100); // Small delay to ensure DOM is updated
            }
            setFocusPath(null);
        }
    }, [focusPath]);

    const registerInputRef = (path: string, ref: HTMLInputElement | null) => {
        if (ref) {
            inputRefs.current.set(path, ref);
        } else {
            inputRefs.current.delete(path);
        }
    };

    const handleValueConfirmed = (valuePath: string[]) => {
        // Find the parent path for adding new properties
        const parentPath = valuePath.slice(0, -1);
        const parentPathString = parentPath.join('.');
        
        // Activate the add property button for this parent
        setActiveAddPropertyPath(parentPathString);
    };

    const toggleExpanded = (path: string) => {
        const newExpanded = new Set(expandedPaths);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedPaths(newExpanded);
    };

    const updateValue = (path: string[], newVal: any) => {
        const updateNestedValue = (obj: any, pathArray: string[], value: any): any => {
            if (pathArray.length === 0) return value;
            
            const [key, ...rest] = pathArray;
            const isArray = Array.isArray(obj);
            
            if (isArray) {
                const newArray = [...obj];
                const index = parseInt(key);
                newArray[index] = updateNestedValue(newArray[index], rest, value);
                return newArray;
            } else {
                return {
                    ...obj,
                    [key]: updateNestedValue(obj[key], rest, value)
                };
            }
        };

        const updatedValue = updateNestedValue(value || {}, path, newVal);
        onChange(updatedValue);
    };

    const deleteValue = (path: string[]) => {
        if (path.length === 0) {
            onChange(null);
            return;
        }

        const deletePath = (obj: any, pathArray: string[]): any => {
            if (pathArray.length === 1) {
                const [key] = pathArray;
                if (Array.isArray(obj)) {
                    const newArray = [...obj];
                    newArray.splice(parseInt(key), 1);
                    return newArray;
                } else {
                    const { [key]: deleted, ...rest } = obj;
                    return rest;
                }
            }
            
            const [key, ...rest] = pathArray;
            const isArray = Array.isArray(obj);
            
            if (isArray) {
                const newArray = [...obj];
                const index = parseInt(key);
                newArray[index] = deletePath(newArray[index], rest);
                return newArray;
            } else {
                return {
                    ...obj,
                    [key]: deletePath(obj[key], rest)
                };
            }
        };

        const newValue = deletePath(value, path);
        onChange(newValue);
    };

    const addProperty = (path: string[], key: string, valueType: JsonValueType, shouldFocus = false) => {
        const getDefaultValue = (type: JsonValueType) => {
            switch (type) {
                case 'string': return '';
                case 'number': return 0;
                case 'boolean': return false;
                case 'object': return {};
                case 'array': return [];
                case 'null': return null;
                default: return '';
            }
        };

        const addToPath = (obj: any, pathArray: string[], key: string, value: any): any => {
            if (pathArray.length === 0) {
                if (Array.isArray(obj)) {
                    return [...obj, value];
                } else {
                    return { ...obj, [key]: value };
                }
            }
            
            const [currentKey, ...rest] = pathArray;
            const isArray = Array.isArray(obj);
            
            if (isArray) {
                const newArray = [...obj];
                const index = parseInt(currentKey);
                newArray[index] = addToPath(newArray[index], rest, key, value);
                return newArray;
            } else {
                return {
                    ...obj,
                    [currentKey]: addToPath(obj[currentKey], rest, key, value)
                };
            }
        };

        const newValue = addToPath(value || {}, path, key, getDefaultValue(valueType));
        onChange(newValue);

        // Focus the newly created field if it's a primitive value
        if (shouldFocus && ['string', 'number'].includes(valueType)) {
            const newPath = Array.isArray(value || {}) 
                ? [...path, ((value || []).length).toString()]
                : [...path, key];
            setFocusPath(newPath.join('.'));
        }
    };

    const renderValue = (val: any, path: string[] = [], parentKey?: string): React.ReactNode => {
        const pathString = path.join('.');
        const isExpanded = expandedPaths.has(pathString);

        if (val === null) {
            return (
                <div className="flex items-center gap-2 p-2 border border-zinc-200 dark:border-zinc-700 rounded">
                    <span className="text-zinc-500 dark:text-zinc-400 italic">null</span>
                    <button
                        type="button"
                        onClick={() => deleteValue(path)}
                        className="text-red-500 hover:text-red-700 ml-auto"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            if (typeof val === 'boolean') {
                return (
                    <div className="px-3 py-2 flex items-center gap-2">
                        <Checkbox
                            checked={val}
                            onChange={(checked) => {
                                updateValue(path, checked);
                                handleValueConfirmed(path); // Activate add property mode after change
                            }}
                        />
                        <span className="text-xs text-zinc-500">
                            {val ? 'true' : 'false'}
                        </span>
                    </div>
                );
            } else {
                return (
                    <input
                        ref={(ref) => registerInputRef(pathString, ref)}
                        type={typeof val === 'number' ? 'number' : 'text'}
                        value={val}
                        onChange={(e) => {
                            let newValue: any;
                            if (typeof val === 'number') {
                                newValue = parseFloat(e.target.value) || 0;
                            } else {
                                newValue = e.target.value;
                            }
                            updateValue(path, newValue);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                e.currentTarget.blur(); // Unfocus input
                                handleValueConfirmed(path); // Activate add property mode
                            }
                        }}
                        className="w-full h-full px-3 py-2 text-xs bg-transparent border-0 focus:outline-none text-zinc-900 dark:text-zinc-100"
                        placeholder={typeof val === 'number' ? '0' : 'value'}
                    />
                );
            }
        }

        if (Array.isArray(val)) {
            return (
                <div className="">
                    <div 
                        className={`grid grid-cols-[1fr_32px] ${isExpanded ? 'border-b border-zinc-200 dark:border-zinc-700' : ''} hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer group`}
                        onClick={() => toggleExpanded(pathString)}
                    >
                        <div className="px-3 py-2 flex items-center gap-2">
                            {isExpanded ? 
                                <ChevronDownIcon className="w-3 h-3" /> : 
                                <ChevronRightIcon className="w-3 h-3" />
                            }
                            <ListBulletIcon className="w-3 h-3 text-zinc-400" />
                            <span className="text-xs text-zinc-500">Array ({val.length})</span>
                        </div>
                        <div className="px-2 py-2 flex items-center justify-center">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteValue(path);
                                }}
                                className="text-zinc-300 hover:text-zinc-500 opacity-0 group-hover:opacity-100"
                            >
                                <MinusIcon className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    
                    {isExpanded && (
                        <div className="">
                            {val.map((item, index) => (
                                <div key={index} className="grid grid-cols-[60px_1fr_32px] border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 group">
                                    <div className="border-r border-zinc-200 dark:border-zinc-700">
                                        <div className="px-3 py-2 text-xs text-zinc-500 font-mono text-center">
                                            [{index}]
                                        </div>
                                    </div>
                                    <div className="border-r border-zinc-200 dark:border-zinc-700">
                                        {renderValue(item, [...path, index.toString()])}
                                    </div>
                                    <div className="">
                                        <button
                                            type="button"
                                            onClick={() => deleteValue([...path, index.toString()])}
                                            className="text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 w-full h-full py-2 flex items-center justify-center"
                                        >
                                            <MinusIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="hover:bg-sky-50 dark:hover:bg-sky-900/20">
                                <AddItemButton onAdd={(type, shouldFocus) => addProperty(path, '', type, shouldFocus)} />
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (typeof val === 'object') {
            const entries = Object.entries(val);
            
            return (
                <div className="">
                    <div 
                        className={`grid grid-cols-[1fr_32px] ${isExpanded ? 'border-b border-zinc-200 dark:border-zinc-700' : ''} hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer group`}
                        onClick={() => toggleExpanded(pathString)}
                    >
                        <div className="px-3 py-2 flex items-center gap-2">
                            {isExpanded ? 
                                <ChevronDownIcon className="w-3 h-3" /> : 
                                <ChevronRightIcon className="w-3 h-3" />
                            }
                            <CubeIcon className="w-3 h-3 text-zinc-400" />
                            <span className="text-xs text-zinc-500">Object ({entries.length})</span>
                        </div>
                        <div className="px-2 py-2 flex items-center justify-center">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteValue(path);
                                }}
                                className="text-zinc-300 hover:text-zinc-500 opacity-0 group-hover:opacity-100"
                            >
                                <MinusIcon className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    
                    {isExpanded && (
                        <div className="">
                            {entries.map(([key, value], index) => (
                                <PropertyRow 
                                    key={key} 
                                    originalKey={key}
                                    value={value}
                                    path={[...path, key]}
                                    onKeyChange={(oldKey, newKey) => {
                                        if (newKey !== oldKey) {
                                            const newObj = { ...val };
                                            newObj[newKey] = newObj[oldKey];
                                            delete newObj[oldKey];
                                            updateValue(path, newObj);
                                        }
                                    }}
                                    onValueChange={(newValue) => {
                                        updateValue([...path, key], newValue);
                                    }}
                                    onDelete={() => deleteValue([...path, key])}
                                    onValueConfirmed={handleValueConfirmed}
                                    renderValue={renderValue}
                                    registerInputRef={registerInputRef}
                                />
                            ))}
                            <div className="hover:bg-sky-50 dark:hover:bg-sky-900/20">
                                <AddPropertyButton 
                                    isActive={activeAddPropertyPath === pathString}
                                    onAdd={(key, type, shouldFocus) => {
                                        addProperty(path, key, type, shouldFocus);
                                        setActiveAddPropertyPath(null); // Reset after adding
                                    }}
                                    onCancel={() => setActiveAddPropertyPath(null)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return <div>Unknown type</div>;
    };

    // Initialize with empty object if no value, but allow root type selection
    const displayValue = value ?? {};
    const isEmpty = value === null || value === undefined;

    const createRootValue = (type: JsonValueType) => {
        const getDefaultValue = (type: JsonValueType) => {
            switch (type) {
                case 'string': return '';
                case 'number': return 0;
                case 'boolean': return false;
                case 'object': return {};
                case 'array': return [];
                case 'null': return null;
                default: return {};
            }
        };
        
        onChange(getDefaultValue(type));
    };

    if (isEmpty) {
        return (
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                <div className="p-6 text-center">
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">
                        Choose root JSON type:
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => createRootValue('object')}
                            className="flex items-center gap-2 p-3 text-left border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                            <CubeIcon className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm">Object</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => createRootValue('array')}
                            className="flex items-center gap-2 p-3 text-left border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                            <ListBulletIcon className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm">Array</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => createRootValue('string')}
                            className="flex items-center gap-2 p-3 text-left border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                            <span className="w-4 h-4 flex items-center justify-center text-zinc-400 font-mono text-xs">"</span>
                            <span className="text-sm">String</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => createRootValue('number')}
                            className="flex items-center gap-2 p-3 text-left border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                            <span className="w-4 h-4 flex items-center justify-center text-zinc-400 font-mono text-xs">#</span>
                            <span className="text-sm">Number</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => createRootValue('boolean')}
                            className="flex items-center gap-2 p-3 text-left border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                            <span className="w-4 h-4 flex items-center justify-center text-zinc-400 font-mono text-xs">✓</span>
                            <span className="text-sm">Boolean</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => createRootValue('null')}
                            className="flex items-center gap-2 p-3 text-left border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                            <span className="w-4 h-4 flex items-center justify-center text-zinc-400 font-mono text-xs">∅</span>
                            <span className="text-sm">Null</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
            {renderValue(displayValue, [])}
        </div>
    );
};

const AddPropertyButton: React.FC<{ 
    onAdd: (key: string, type: JsonValueType, shouldFocus?: boolean) => void;
    isActive?: boolean;
    onCancel?: () => void;
}> = ({ onAdd, isActive = false, onCancel }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newType, setNewType] = useState<JsonValueType>('string');

    // Sync with external active state - only activate, never deactivate
    useEffect(() => {
        if (isActive && !isAdding) {
            setIsAdding(true);
        }
    }, [isActive]); // Remove isAdding dependency to prevent loops

    const handleAdd = () => {
        if (newKey.trim()) {
            onAdd(newKey.trim(), newType, true); // Pass true for shouldFocus
            setNewKey('');
            setIsAdding(false);
        }
    };

    const handleCancel = () => {
        setNewKey('');
        setIsAdding(false);
        onCancel?.();
    };

    if (isAdding) {
        return (
            <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800">
                <input
                    type="text"
                    placeholder="Property name"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAdd();
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            handleCancel();
                        }
                    }}
                    className="flex-1 px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                    autoFocus
                />
                <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as JsonValueType)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAdd();
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            handleCancel();
                        }
                    }}
                    className="px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="object">Object</option>
                    <option value="array">Array</option>
                    <option value="null">Null</option>
                </select>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="p-2 bg-sky-500 text-white rounded hover:bg-sky-600"
                    title="Add"
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="px-2 py-1 bg-zinc-500 text-white rounded text-sm hover:bg-zinc-600"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Plus button clicked!'); // Debug
                setIsAdding(true);
                onCancel?.(); // Clear external active state if needed
            }}
            className="w-full flex items-center justify-center px-3 py-2 text-zinc-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20"
        >
            <PlusIcon className="w-4 h-4" />
        </button>
    );
};

const AddItemButton: React.FC<{ onAdd: (type: JsonValueType, shouldFocus?: boolean) => void }> = ({ onAdd }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newType, setNewType] = useState<JsonValueType>('string');

    const handleAdd = () => {
        onAdd(newType, true); // Pass true for shouldFocus
        setIsAdding(false);
    };

    const handleCancel = () => {
        setIsAdding(false);
    };

    if (isAdding) {
        return (
            <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800">
                <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as JsonValueType)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAdd();
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            handleCancel();
                        }
                    }}
                    className="flex-1 px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                    autoFocus
                >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="object">Object</option>
                    <option value="array">Array</option>
                    <option value="null">Null</option>
                </select>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="p-2 bg-sky-500 text-white rounded hover:bg-sky-600"
                    title="Add"
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="px-2 py-1 bg-zinc-500 text-white rounded text-sm hover:bg-zinc-600"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center px-3 py-2 text-zinc-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20"
        >
            <PlusIcon className="w-4 h-4" />
        </button>
    );
};

const PropertyRow: React.FC<{
    originalKey: string;
    value: any;
    path: string[];
    onKeyChange: (oldKey: string, newKey: string) => void;
    onValueChange: (newValue: any) => void;
    onDelete: () => void;
    onValueConfirmed: (path: string[]) => void;
    renderValue: (val: any, path: string[]) => React.ReactNode;
    registerInputRef: (path: string, ref: HTMLInputElement | null) => void;
}> = ({ originalKey, value, path, onKeyChange, onValueChange, onDelete, onValueConfirmed, renderValue, registerInputRef }) => {
    const [editingKey, setEditingKey] = useState(originalKey);
    const valueInputRef = useRef<HTMLInputElement>(null);

    const handleKeyBlur = () => {
        if (editingKey !== originalKey) {
            onKeyChange(originalKey, editingKey);
        }
    };

    const handleKeyKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
            
            // Direct focus to value input if it's a primitive type
            if (typeof value === 'string' || typeof value === 'number') {
                setTimeout(() => {
                    if (valueInputRef.current) {
                        valueInputRef.current.focus();
                        valueInputRef.current.select();
                    }
                }, 10);
            }
        }
    };

    // Custom render that can attach ref to primitive inputs
    const renderValueWithRef = (val: any, currentPath: string[]) => {
        if (typeof val === 'string' || typeof val === 'number') {
            return (
                <input
                    ref={(ref) => {
                        valueInputRef.current = ref;
                        // Also register with parent focus system
                        registerInputRef(currentPath.join('.'), ref);
                    }}
                    type={typeof val === 'number' ? 'number' : 'text'}
                    value={val}
                    onChange={(e) => {
                        let newValue: any;
                        if (typeof val === 'number') {
                            newValue = parseFloat(e.target.value) || 0;
                        } else {
                            newValue = e.target.value;
                        }
                        onValueChange(newValue);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.currentTarget.blur();
                            // Trigger the add property workflow like the original
                            onValueConfirmed(currentPath);
                        }
                    }}
                    className="w-full h-full px-3 py-2 text-xs bg-transparent border-0 focus:outline-none text-zinc-900 dark:text-zinc-100"
                    placeholder={typeof val === 'number' ? '0' : 'value'}
                />
            );
        }
        // For complex types, use the original renderValue
        return renderValue(val, currentPath);
    };

    return (
        <div className="grid grid-cols-[120px_1fr_32px] border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 group">
            <div className="border-r border-zinc-200 dark:border-zinc-700">
                <input
                    type="text"
                    value={editingKey}
                    onChange={(e) => setEditingKey(e.target.value)}
                    onBlur={handleKeyBlur}
                    onKeyDown={handleKeyKeyDown}
                    className="w-full h-full px-3 py-2 text-xs bg-transparent border-0 focus:outline-none text-zinc-700 dark:text-zinc-300 font-medium"
                />
            </div>
            <div className="border-r border-zinc-200 dark:border-zinc-700">
                {renderValueWithRef(value, path)}
            </div>
            <div className="">
                <button
                    type="button"
                    onClick={onDelete}
                    className="text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 w-full h-full py-2 flex items-center justify-center"
                >
                    <MinusIcon className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};

export default VisualJsonEditor;