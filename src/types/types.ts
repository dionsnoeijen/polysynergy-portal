declare global {
    interface Window {
        debugMode: boolean;
        toggleDebug: () => void;
    }
}

export type Connection = {
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    sourceNodeId: string;
    sourceHandle: string;
    targetNodeId?: string;
    targetHandle?: string;
    collapsed?: boolean;
    hidden?: boolean;
    disabled?: boolean;
    targetGroupId?: string;
    sourceGroupId?: string;
    isInGroup?: string;
};

export enum NodeEnabledConnector {
    Node = 'node'
}

export enum NodeCollapsedConnector {
    Collapsed = 'collapsed',
}

export enum FormType {
    AddRoute = 'addRoute',
    EditRoute = 'editRoute',
    AddSchedule = 'addSchedule',
    EditSchedule = 'editSchedule',
    AddService = 'addService',
    EditService = 'editService',
    AddBlueprint = 'addBlueprint',
    EditBlueprint = 'editBlueprint',
    EditDict = 'editDict',
    EditList = 'editList',
    EditCode = 'editCode',
}

export enum InOut {
    In = 'in',
    Out = 'out',
}

export type ListItemWithId = {
    id?: string;
};

export type Position = {
    x: number;
    y: number;
};

export enum NodeVariableType {
    String = 'string',
    Bytes = 'bytes',
    Number = 'number',
    Dict = 'dict',
    Boolean = 'boolean',
    List = 'list',
    DateTime = 'datetime',
    TruePath = 'true_path',
    FalsePath = 'false_path',
    Unknown = 'unknown',
    SecretString = 'secretstring',
    TextArea = 'textarea',
    RichTextArea = 'richtextarea',
    Code = 'code',
}

export enum NodeType {
    Rows = 'rows',
    Comparison = 'comparison',
    Math = 'math',
    Group = 'group',
    Mock = 'mock',
    Note = 'note'
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

export type Dock = {
    field_enabled?: boolean;
    field_secret?: boolean;
    field_text_area?: boolean;
    field_rich_text_area?: boolean;
    field_code_editor?: boolean;
    select_values?: Record<string, string>;
}

export type NodeVariable = {
    name?: string;
    handle: string;
    value: null | string | number | boolean | string[] | NodeVariable[];
    type: string | NodeVariableType;
    has_dock?: boolean;
    has_in?: boolean;
    has_out?: boolean;
    dock?: Dock;
};

export type NodeView = {
    x: number;
    y: number;
    width: number;
    height: number;
    collapsed: boolean;
    disabled?: boolean;
    adding?: boolean;
    isOpenMap?: { [key: string]: boolean };
};

export type Package = {
    nodes: Node[];
    connections?: Connection[];
};

export type NodeService = {
    id: string;
    name: string;
    description: string;
    category: string;
    package?: Package;
};

export type Group = {
    isOpen?: boolean;
    isHidden?: boolean;
    nodes?: string[];
};

export type Node = {
    id: string;
    service?: NodeService;
    icon?: string;
    name: string;
    category: string;
    type: NodeType|NodeMathType|NodeComparisonType;
    view: NodeView;
    variables: NodeVariable[];
    enabled?: boolean;
    driven?: boolean;
    group?: Group;
    has_play_button?: boolean;
    has_enabled_switch?: boolean;
};

export interface NodeProps {
    node: Node;
    preview?: boolean;
};

export interface GroupProps extends NodeProps {
    isMirror?: boolean;
}

export type Schedule = {
    id?: string;
    name: string;
    cron_expression: string;
    start_time: Date;
    end_time?: Date | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    project_id?: string;
};

export type Metadata = {
    category: string;
    description?: string;
};

export type Blueprint = {
    id?: string;
    name: string;
    metadata: Metadata;
    category: string;
    nodes: Node[]
};

export type Service = {
    id?: string;
    name: string;
    metadata: Metadata;
    node_setup: NodeSetup;
};

export enum HttpMethod {
    Get = 'GET',
    Post = 'POST',
    Put = 'PUT',
    Patch = 'PATCH',
    Delete = 'DELETE'
}

export interface NodeSetup {
    id: string;
    name?: string | null;
    deleted_at?: string | null;
    published_version?: NodeSetupVersion | null;
    versions: NodeSetupVersion[];
}

export interface NodeSetupVersion {
    id: string;
    version_number: number;
    created_at: string;
    content: {
        nodes: Node[],
        connections: Connection[],
        groups: Group[],
    };
    published: boolean;
    created_by?: string | null;
}

export enum RouteSegmentType {
    Static = 'static',
    Variable = 'variable',
}

export type RouteSegment = {
    id: string;
    segment_order: number;
    type: RouteSegmentType;
    name: string;
    default_value: null | string;
    variable_type: null | string;
};

export type Route = ListItemWithId & {
    id?: string | null;
    description: string;
    created_at?: string;
    updated_at?: string;
    segments: RouteSegment[];
    method: HttpMethod;
    node_setup?: NodeSetup;
};

export enum Roles {
    Admin = 'admin',
    Editor = 'editor',
    Viewer = 'viewer',
}

export type Tenant = {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
};

export type Role = {
    id: string;
    name: string;
}

export type Membership = {
    id: string;
    role: Role;
}

export type Account = {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_admin: boolean;
    single_user: boolean;
    created_at: string;
    updated_at: string;
    active: boolean;
    memberships: Membership[];
    tenants: Tenant[];
}

export type LoggedInAccount = Account;

export type Project = {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
};

export interface State {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
export type StoreName = 'nodes' | 'connections';
