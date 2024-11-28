export enum FormType {
    AddRoute = 'addRoute',
    EditRoute = 'editRoute',
}

export enum InOut {
    In = 'in',
    Out = 'out',
}

export type ListItemWithId = {
    id: string;
};

export type Position = {
    x: number;
    y: number;
};

export enum NodeVariableType {
    String = 'string',
    Number = 'number',
    Boolean = 'boolean',
    Array = 'array'
}

export enum NodeType {
    Rows = 'rows',
    Comparison = 'comparison',
    Math = 'math',
    Group = 'group',
}

export enum NodeComparisonType {
    LargerThan = 'larger_than',
    SmallerThan = 'smaller_than',
    Equal = 'equal',
    NotEqual = 'not_equal',
}

export enum NodeMathType {
    Add = 'add',
    Subtract = 'subtract',
    Multiply = 'multiply',
    Divide = 'divide',
}

export type NodeVariable = {
    name: string;
    handle: string;
    value?: null | string | number | boolean | string[] | NodeVariable[];
    default_value?: null | string | number | boolean | string[] | NodeVariable[];
    type: NodeVariableType;
    has_dock?: boolean;
    has_in?: boolean;
    has_out?: boolean;
};

export type NodeView = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type Node = {
    id: string;
    name: string;
    type: string;
    node_type: string;
    view: NodeView;
    enabled?: boolean;
    driven?: boolean;
    isOpen?: boolean;
    variables: NodeVariable[];
};
